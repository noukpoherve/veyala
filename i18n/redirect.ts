import { redirect as nextRedirect } from "next/navigation";
import { getLocale } from "@/i18n/get-locale";
import { localizeHref } from "@/i18n/path";
import type { Locale } from "@/i18n/config";

/** `redirect()` that prefixes `/en` when the current journey is English. */
export function redirectLocalized(href: string, locale?: Locale): never {
  const resolved = locale ?? getLocale();
  nextRedirect(localizeHref(href, resolved));
}
