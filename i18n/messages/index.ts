import type { Locale } from "@/i18n/config";
import { en } from "./en";
import { fr } from "./fr";

type DeepLoose<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => DeepLoose<R>
  : T extends readonly unknown[]
    ? { readonly [K in keyof T]: DeepLoose<T[K]> }
    : T extends object
      ? { readonly [K in keyof T]: DeepLoose<T[K]> }
      : string;

export type Messages = DeepLoose<typeof fr>;

export const catalogs: Record<Locale, Messages> = {
  fr: fr as Messages,
  en: en as Messages,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export { fr, en };
