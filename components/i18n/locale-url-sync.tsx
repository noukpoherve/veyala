"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hasFrenchPrefix, stripLocalePrefix } from "@/i18n/path";

/**
 * French public URLs stay unprefixed. In-app Links navigate to `/fr/...` so
 * Next.js hits a real `[locale]` page; this then strips `/fr` from the
 * address bar without a round-trip — including when only search/hash change.
 */
export function LocaleUrlSync() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";

  useEffect(() => {
    const query = searchKey ? `?${searchKey}` : "";

    const sync = () => {
      if (!hasFrenchPrefix(window.location.pathname) && !hasFrenchPrefix(pathname)) return;
      const publicPath = stripLocalePrefix(
        hasFrenchPrefix(window.location.pathname) ? window.location.pathname : pathname
      );
      const dest = `${publicPath}${query}${window.location.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (current === dest) return;
      window.history.replaceState(window.history.state, "", dest);
    };

    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname, searchKey]);

  return null;
}
