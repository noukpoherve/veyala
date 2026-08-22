import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/path";
import { sanitizeCallbackUrl } from "@/i18n/safe-path";
import { siteUrl } from "@/lib/utils";

/**
 * Public Auth callback URL with a locale-aware `next` target.
 *
 * English uses `/en/auth/callback` publicly; middleware rewrites it onto
 * `app/auth/callback/route.ts` while preserving locale via cookie + header.
 * French stays at `/auth/callback`.
 */
export function authCallbackRedirect(locale: Locale, nextPath: string): string {
  const next = sanitizeCallbackUrl(nextPath, locale);
  return `${siteUrl()}${localizePath("/auth/callback", locale)}?next=${encodeURIComponent(next)}`;
}
