import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export function intlLocale(locale: Locale = DEFAULT_LOCALE): string {
  return INTL_LOCALE[locale];
}

export function formatCurrency(cents: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatDate(value: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}
