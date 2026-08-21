import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const EN_PREFIX = "/en";

/** True for `/en` and `/en/...`, never for `/energy`. */
export function hasEnglishPrefix(pathname: string): boolean {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`);
}

export function localeFromPathname(pathname: string): Locale {
  return hasEnglishPrefix(pathname) ? "en" : "fr";
}

/** `/en/login` → `/login`, `/en` → `/`. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === EN_PREFIX) return "/";
  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    const rest = pathname.slice(EN_PREFIX.length);
    return rest.length > 0 ? rest : "/";
  }
  return pathname;
}

/** FR keeps the current pathname. EN adds `/en`. Never emits `/fr`. */
export function localizePath(pathname: string, locale: Locale): string {
  const clean = stripLocalePrefix(pathname) || "/";
  if (locale === "en") return clean === "/" ? EN_PREFIX : `${EN_PREFIX}${clean}`;
  return clean;
}

/**
 * Localize an internal href (path + search + hash). External URLs and
 * protocol-relative URLs are returned unchanged.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const hashIndex = href.indexOf("#");
  const searchIndex = href.indexOf("?");
  let pathEnd = href.length;
  if (hashIndex >= 0) pathEnd = Math.min(pathEnd, hashIndex);
  if (searchIndex >= 0) pathEnd = Math.min(pathEnd, searchIndex);
  const path = href.slice(0, pathEnd) || "/";
  const rest = href.slice(pathEnd);
  return `${localizePath(path, locale)}${rest}`;
}

/** Switch the current URL (path + search + hash) to the other locale. */
export function switchLocaleHref(href: string, target: Locale): string {
  return localizeHref(href, target);
}

export function withLocale(pathname: string, locale: Locale = DEFAULT_LOCALE): string {
  return localizePath(pathname, locale);
}
