"use server";

import { type OAuthProvider, oauthProviderFlags } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocale } from "@/i18n/get-locale";
import { redirectLocalized } from "@/i18n/redirect";
import { authCallbackRedirect } from "@/i18n/auth-urls";
import { sanitizeCallbackUrl } from "@/i18n/safe-path";

/**
 * Starts the Supabase OAuth flow (PKCE): the provider redirects back to
 * `/auth/callback` (FR) or `/en/auth/callback` (EN, rewritten by middleware).
 */
export async function signInWithProvider(provider: OAuthProvider, callbackUrl: string) {
  const locale = getLocale();
  if (!oauthProviderFlags[provider]) redirectLocalized("/login?error=oauth", locale);
  const next = sanitizeCallbackUrl(callbackUrl, locale);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: authCallbackRedirect(locale, next) },
  });
  if (error || !data.url) {
    console.error(`[oauth] ${provider} sign-in failed:`, error);
    redirectLocalized("/login?error=oauth", locale);
  }
  redirectLocalized(data.url, locale);
}
