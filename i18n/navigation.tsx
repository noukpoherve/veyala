"use client";

import NextLink from "next/link";
import { useRouter as useNextRouter, usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { localizeHref, localizePath, stripLocalePrefix, toInternalHref } from "@/i18n/path";
import type { Locale } from "@/i18n/config";

type NextLinkProps = ComponentProps<typeof NextLink>;

/**
 * Locale-aware Link. The visible URL stays `/login` (FR) or `/en/login` (EN).
 * The href sent to Next.js is always `/fr/login` or `/en/login` so the client
 * router matches `app/[locale]` instead of treating `/login` as locale=login.
 */
export function Link({ href, ...props }: NextLinkProps) {
  const locale = useLocale();
  const localized = typeof href === "string" ? toInternalHref(href, locale) : href;
  return <NextLink href={localized} {...props} />;
}

export function useLocalizedPathname(): string {
  return stripLocalePrefix(usePathname() || "/");
}

export function useLocalizedRouter() {
  const locale = useLocale();
  const router = useNextRouter();
  return {
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) =>
      router.push(toInternalHref(href, locale), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
      router.replace(toInternalHref(href, locale), options),
  };
}

/** Public URL (never `/fr`). */
export function localizedHref(href: string, locale: Locale): string {
  return localizeHref(href, locale);
}

export function localizedPath(path: string, locale: Locale): string {
  return localizePath(path, locale);
}
