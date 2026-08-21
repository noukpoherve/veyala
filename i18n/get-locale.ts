import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  parseLocale,
  type Locale,
} from "@/i18n/config";
import { localeFromPathname } from "@/i18n/path";

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split(";").map((part) => part.trim());
  for (const part of match) {
    if (part.startsWith(`${name}=`)) return decodeURIComponent(part.slice(name.length + 1));
  }
  return undefined;
}

/** Locale of the current RSC / Server Action (middleware header, then cookie). */
export function getLocale(): Locale {
  const fromHeader = headers().get(LOCALE_HEADER);
  if (fromHeader) return parseLocale(fromHeader);
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  return parseLocale(fromCookie);
}

/** Locale for Route Handlers and the Send Email Hook (no rewrite header). */
export function getLocaleFromRequest(req: Request): Locale {
  const fromHeader = req.headers.get(LOCALE_HEADER);
  if (fromHeader) return parseLocale(fromHeader);
  const fromCookie = cookieValue(req.headers.get("cookie"), LOCALE_COOKIE);
  if (fromCookie) return parseLocale(fromCookie);
  try {
    return localeFromPathname(new URL(req.url).pathname);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Locale encoded in a public URL (email redirect_to, callback next, …). */
export function getLocaleFromUrl(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, "http://veyala.local");
    const fromPath = localeFromPathname(url.pathname);
    if (fromPath === "en") return "en";
    const next = url.searchParams.get("next");
    if (next && localeFromPathname(next) === "en") return "en";
    return "fr";
  } catch {
    return null;
  }
}
