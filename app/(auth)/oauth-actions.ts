"use server";

import { redirect } from "next/navigation";
import { type OAuthProvider, oauthProviderFlags } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";

/**
 * Starts the Supabase OAuth flow (PKCE): the provider redirects back to
 * /auth/callback which exchanges the code and forwards to `callbackUrl`.
 */
export async function signInWithProvider(provider: OAuthProvider, callbackUrl: string) {
  if (!oauthProviderFlags[provider]) redirect("/login?error=oauth");
  const next =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    console.error(`[oauth] ${provider} sign-in failed:`, error);
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}
