"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";
import { localizeHref, stripLocalePrefix } from "@/i18n/path";
import { cn } from "@/lib/utils";

type Variant = "header" | "footer" | "compact";

const COPY: Record<Locale, { group: string; switchTo: Record<Locale, string> }> = {
  fr: { group: "Choisir la langue", switchTo: { fr: "Français", en: "Passer en anglais" } },
  en: { group: "Choose language", switchTo: { fr: "Switch to French", en: "English" } },
};

function persistLocaleCookie(locale: Locale) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: locale preference must mirror middleware cookie
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function LanguageSwitcherInner({
  variant = "header",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const active = useLocale();
  const publicPath = stripLocalePrefix(usePathname() || "/");
  const searchParams = useSearchParams();
  const search = searchParams?.toString();
  const [hash, setHash] = useState("");
  const copy = COPY[active];

  useEffect(() => {
    setHash(window.location.hash);
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const extra = `${search ? `?${search}` : ""}${hash}`;

  return (
    <nav
      aria-label={copy.group}
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-sm font-semibold",
        className
      )}
    >
      {LOCALES.map((locale) => {
        const { flag, code, name } = LOCALE_LABELS[locale];
        const isActive = locale === active;
        const href = localizeHref(`${publicPath}${extra}`, locale);

        return (
          <a
            key={locale}
            href={href}
            hrefLang={locale === "fr" ? "fr-FR" : "en"}
            lang={locale === "fr" ? "fr" : "en"}
            aria-current={isActive ? "true" : undefined}
            aria-label={copy.switchTo[locale]}
            onClick={(event) => {
              if (isActive) {
                event.preventDefault();
                return;
              }
              persistLocaleCookie(locale);
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              window.location.assign(href);
            }}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span aria-hidden>{flag}</span>
            <span>{code}</span>
            {variant === "footer" ? <span className="hidden sm:inline">{name}</span> : null}
          </a>
        );
      })}
    </nav>
  );
}

/** Suspense boundary required by `useSearchParams`. */
export function LanguageSwitcher(props: { variant?: Variant; className?: string }) {
  return (
    <Suspense fallback={<LanguageSwitcherFallback {...props} />}>
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}

function LanguageSwitcherFallback({
  variant = "header",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const active = useLocale();
  const publicPath = stripLocalePrefix(usePathname() || "/");
  const copy = COPY[active];

  return (
    <nav
      aria-label={copy.group}
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-sm font-semibold",
        className
      )}
    >
      {LOCALES.map((locale) => {
        const { flag, code, name } = LOCALE_LABELS[locale];
        const isActive = locale === active;
        const href = localizeHref(publicPath, locale);
        return (
          <a
            key={locale}
            href={href}
            hrefLang={locale === "fr" ? "fr-FR" : "en"}
            aria-current={isActive ? "true" : undefined}
            aria-label={copy.switchTo[locale]}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span aria-hidden>{flag}</span>
            <span>{code}</span>
            {variant === "footer" ? <span className="hidden sm:inline">{name}</span> : null}
          </a>
        );
      })}
    </nav>
  );
}
