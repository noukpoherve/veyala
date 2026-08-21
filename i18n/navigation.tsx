"use client";

import NextLink from "next/link";
import { useRouter as useNextRouter, usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { localizeHref, localizePath, stripLocalePrefix } from "@/i18n/path";
import type { Locale } from "@/i18n/config";

type NextLinkProps = ComponentProps<typeof NextLink>;

/** Locale-aware Link: `/login` becomes `/en/login` on English pages. */
export function Link({ href, ...props }: NextLinkProps) {
  const locale = useLocale();
  const localized = typeof href === "string" ? localizeHref(href, locale) : href;
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
      router.push(localizeHref(href, locale), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
      router.replace(localizeHref(href, locale), options),
  };
}

/** Server-safe helper when the locale is already known. */
export function localizedHref(href: string, locale: Locale): string {
  return localizeHref(href, locale);
}

export function localizedPath(path: string, locale: Locale): string {
  return localizePath(path, locale);
}
