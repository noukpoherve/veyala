"use client";

import { Suspense } from "react";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { LOCALE_LABELS } from "@/i18n/config";
import { localizeHref, stripLocalePrefix } from "@/i18n/path";
import { cn } from "@/lib/utils";

type Variant = "header" | "footer" | "compact";

function Switcher({
  variant,
  className,
  search,
}: {
  variant: Variant;
  className?: string;
  search: string;
}) {
  const active = useLocale();
  const pathname = usePathname() || "/";
  const href = `${stripLocalePrefix(pathname)}${search}`;

  return (
    <nav
      aria-label={active === "fr" ? "Choisir la langue" : "Choose language"}
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-sm font-semibold",
        className
      )}
    >
      {(["fr", "en"] as const).map((locale) => {
        const { flag, code, name } = LOCALE_LABELS[locale];
        const isActive = locale === active;
        return (
          <NextLink
            key={locale}
            href={localizeHref(href, locale)}
            hrefLang={locale === "fr" ? "fr-FR" : "en"}
            lang={locale === "fr" ? "fr" : "en"}
            aria-current={isActive ? "true" : undefined}
            aria-label={locale === "fr" ? "Français" : "English"}
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
          </NextLink>
        );
      })}
    </nav>
  );
}

function SwitcherWithSearch({ variant, className }: { variant: Variant; className?: string }) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  return <Switcher variant={variant} className={className} search={search ? `?${search}` : ""} />;
}

export function LanguageSwitcher({
  variant = "header",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <Suspense fallback={<Switcher variant={variant} className={className} search="" />}>
      <SwitcherWithSearch variant={variant} className={className} />
    </Suspense>
  );
}
