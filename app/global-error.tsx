"use client";

import { useEffect } from "react";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { ErrorScreen } from "@/components/errors/error-screen";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { catalogs } from "@/i18n/messages";
import { localeFromPathname } from "@/i18n/path";
import { reportError } from "@/lib/sentry";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

/**
 * This boundary replaces the root layout, so no locale provider or request
 * header is available: read the language straight from the public URL.
 */
function currentLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return localeFromPathname(window.location.pathname);
}

/**
 * Root layout failures — must define its own <html>/<body>.
 * Same calm branded page as segment errors (no red dump).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = currentLocale();
  const m = catalogs[locale];

  useEffect(() => {
    reportError(error, "global-error");
  }, [error]);

  return (
    <html lang={locale} className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <LocaleProvider locale={locale}>
          <ErrorScreen
            messages={m}
            kind="server"
            detail={error.digest}
            onRetry={reset}
            primaryHref="/"
            primaryLabel={m.common.backHome}
            supportHref="/contact"
          />
        </LocaleProvider>
      </body>
    </html>
  );
}
