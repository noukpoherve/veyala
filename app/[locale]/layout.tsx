import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Analytics } from "@/components/analytics/analytics";
import { Toaster } from "@/components/ui/toaster";
import { HtmlLang } from "@/components/i18n/html-lang";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { LocaleUrlSync } from "@/components/i18n/locale-url-sync";
import { LOCALES, isLocale } from "@/i18n/config";

/**
 * The locale lives in the route tree so that French and English are distinct
 * entries in the Next.js client router cache. Public French URLs stay
 * unprefixed and the middleware rewrites them onto `/fr/...`.
 *
 * The locale context also lives here rather than in the root layout: layouts
 * above the changed segment are preserved across client navigations, so a
 * provider mounted at the root would keep serving the previous language after
 * the visitor switches.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();

  return (
    <LocaleProvider locale={params.locale}>
      <HtmlLang locale={params.locale} />
      <Suspense fallback={null}>
        <LocaleUrlSync />
      </Suspense>
      {children}
      <Toaster />
      <Analytics />
    </LocaleProvider>
  );
}
