import { isLocale, type Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getLocaleFromUrl } from "@/i18n/get-locale";

/**
 * Auth email locale: explicit journey URL, then user_metadata.locale, then fr.
 * Never uses Accept-Language.
 */
export function resolveAuthEmailLocale(params: {
  redirectTo?: string | null;
  metadataLocale?: unknown;
}): Locale {
  if (params.redirectTo) {
    const fromPath = getLocaleFromUrl(params.redirectTo);
    if (fromPath) return fromPath;
  }
  if (isLocale(String(params.metadataLocale ?? ""))) {
    return params.metadataLocale as Locale;
  }
  return DEFAULT_LOCALE;
}

export function localeFromMetadata(meta: unknown): Locale | null {
  if (!meta || typeof meta !== "object") return null;
  const value = (meta as Record<string, unknown>).locale;
  return isLocale(String(value ?? "")) ? (value as Locale) : null;
}
