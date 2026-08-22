import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const EN_PREFIX = "/en";
const FR_PREFIX = "/fr";

/** Served outside `app/[locale]` — English-prefixed public URLs must rewrite here. */
export const UNLOCALIZED_PREFIXES = ["/auth", "/monitoring"] as const;

export function isUnlocalizedPath(path: string): boolean {
  return UNLOCALIZED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * True when middleware must rewrite a locale-prefixed unlocalized URL
 * (e.g. `/en/auth/callback` → `/auth/callback`) instead of `next()`.
 */
export function needsUnlocalizedLocaleRewrite(pathname: string): boolean {
  const { path, prefixed } = resolveRoute(pathname);
  return prefixed && isUnlocalizedPath(path);
}

function hasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True for `/en` and `/en/...`, never for `/energy`. */
export function hasEnglishPrefix(pathname: string): boolean {
  return hasPrefix(pathname, EN_PREFIX);
}

/** True for `/fr` and `/fr/...`, never for `/france`. Internal tree only. */
export function hasFrenchPrefix(pathname: string): boolean {
  return hasPrefix(pathname, FR_PREFIX);
}

export function localeFromPathname(pathname: string): Locale {
  return hasEnglishPrefix(pathname) ? "en" : "fr";
}

function stripPrefix(pathname: string, prefix: string): string | null {
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    return rest.length > 0 ? rest : "/";
  }
  return null;
}

/** `/en/login` → `/login`, `/fr/dashboard` → `/dashboard`. */
export function stripLocalePrefix(pathname: string): string {
  return stripPrefix(pathname, EN_PREFIX) ?? stripPrefix(pathname, FR_PREFIX) ?? pathname;
}

export type ResolvedRoute = {
  /** Locale the request should be rendered in. */
  locale: Locale;
  /** Path without any locale prefix, used for auth gating. */
  path: string;
  /** Path inside the `app/[locale]` tree, i.e. what Next.js must render. */
  internal: string;
  /** True when the public URL already carries its locale segment. */
  prefixed: boolean;
};

/**
 * Maps a public pathname onto the `app/[locale]` tree. French URLs stay
 * unprefixed publicly and are rewritten to `/fr/...`; English URLs are already
 * `/en/...` and need no rewrite. `/fr/...` is accepted as an internal alias so
 * that framework-generated URLs (Open Graph images) keep resolving.
 */
export function resolveRoute(pathname: string): ResolvedRoute {
  for (const locale of ["en", "fr"] as const) {
    const prefix = `/${locale}`;
    if (pathname === prefix) {
      return { locale, path: "/", internal: prefix, prefixed: true };
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return { locale, path: pathname.slice(prefix.length), internal: pathname, prefixed: true };
    }
  }

  return {
    locale: "fr",
    path: pathname,
    internal: `/fr${pathname === "/" ? "" : pathname}`,
    prefixed: false,
  };
}

/** FR keeps the current pathname. EN adds `/en`. Never emits `/fr`. */
export function localizePath(pathname: string, locale: Locale): string {
  const clean = stripLocalePrefix(pathname) || "/";
  if (locale === "en") return clean === "/" ? EN_PREFIX : `${EN_PREFIX}${clean}`;
  return clean;
}

/**
 * Path inside `app/[locale]`. Always prefixed (`/fr/login`, `/en/login`) so the
 * client router hits a real page instead of matching `[locale]=login`.
 */
export function toInternalPath(pathname: string, locale: Locale): string {
  const clean = stripLocalePrefix(pathname) || "/";
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Localize an internal href (path + search + hash). External URLs and
 * protocol-relative URLs are returned unchanged.
 */
function splitHref(href: string): { path: string; rest: string } | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const hashIndex = href.indexOf("#");
  const searchIndex = href.indexOf("?");
  let pathEnd = href.length;
  if (hashIndex >= 0) pathEnd = Math.min(pathEnd, hashIndex);
  if (searchIndex >= 0) pathEnd = Math.min(pathEnd, searchIndex);
  return { path: href.slice(0, pathEnd) || "/", rest: href.slice(pathEnd) };
}

export function localizeHref(href: string, locale: Locale): string {
  const parts = splitHref(href);
  if (!parts) return href;
  return `${localizePath(parts.path, locale)}${parts.rest}`;
}

/** Internal href for Next.js Link (`/fr/...` or `/en/...`). */
export function toInternalHref(href: string, locale: Locale): string {
  const parts = splitHref(href);
  if (!parts) return href;
  return `${toInternalPath(parts.path, locale)}${parts.rest}`;
}

/** Switch the current URL (path + search + hash) to the other locale. */
export function switchLocaleHref(href: string, target: Locale): string {
  return localizeHref(href, target);
}

export function withLocale(pathname: string, locale: Locale = DEFAULT_LOCALE): string {
  return localizePath(pathname, locale);
}
