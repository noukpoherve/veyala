import type { Locale } from "@/i18n/config";

const ENGLISH_NAMES = new Set(["en", "english", "anglais", "american english", "british english"]);

function normalizeLang(value: string): string {
  return value.toLowerCase().trim();
}

/** True when generated resume/letter copy should be English. */
export function isEnglishGeneration(language?: string | null, uiLocale?: Locale): boolean {
  const explicit = normalizeLang(language ?? "");
  if (explicit) return ENGLISH_NAMES.has(explicit);
  return uiLocale === "en";
}
