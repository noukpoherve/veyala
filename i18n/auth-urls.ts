import type { Locale } from "@/i18n/config";
import { localizeHref, localizePath } from "@/i18n/path";
import { siteUrl } from "@/lib/utils";

/** Public Auth callback URL, with a locale-aware `next` target. */
export function authCallbackRedirect(locale: Locale, nextPath: string): string {
  const next = localizeHref(nextPath.startsWith("/") ? nextPath : "/dashboard", locale);
  return `${siteUrl()}${localizePath("/auth/callback", locale)}?next=${encodeURIComponent(next)}`;
}
