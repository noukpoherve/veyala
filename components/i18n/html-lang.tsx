"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

/**
 * `<html lang>` is rendered by the root layout, which sits above the `[locale]`
 * segment and is therefore not re-rendered when the visitor switches language
 * client-side. This keeps the attribute in sync with the active locale.
 */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
