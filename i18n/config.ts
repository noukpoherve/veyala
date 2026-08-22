export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie set by middleware from the URL prefix. Readable by API routes. */
export const LOCALE_COOKIE = "veyala-locale";

/** Request header set by middleware for Server Components / Route Handlers. */
export const LOCALE_HEADER = "x-veyala-locale";

export const LOCALE_LABELS: Record<Locale, { flag: string; code: string; name: string }> = {
  fr: { flag: "🇫🇷", code: "FR", name: "Français" },
  en: { flag: "🇬🇧", code: "EN", name: "English" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "fr" || value === "en";
}

export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
