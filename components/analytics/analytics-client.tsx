"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useMessages } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  COOKIE_BANNER_KEY,
  analyticsPagePath,
  googleAnalyticsInitSnippet,
  isCookieBannerDismissed,
} from "@/lib/analytics";

/**
 * Official gtag stub: `dataLayer.push(arguments)`, not a rest array.
 * Pushing `['config', id]` as one Array is ignored by gtag.js (no collect hit, no _ga cookie).
 */
function ensureGtag(): void {
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag === "function") return;
  window.gtag = function gtag() {
    // biome-ignore lint/complexity/noArguments: gtag.js replays the Arguments object
    window.dataLayer?.push(arguments);
  };
}

function GaPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPath = useRef(true);

  useEffect(() => {
    // First page_view is sent by gtag('config') in the init script.
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    ensureGtag();
    const path = analyticsPagePath(pathname || "/", searchParams.toString());
    window.gtag?.("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: measurementId,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {googleAnalyticsInitSnippet(measurementId)}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <GaPageViews measurementId={measurementId} />
      </Suspense>
    </>
  );
}

/** Cookiebot-style bar. Dismiss only: analytics is not gated on the choice. */
export function CookieBanner() {
  const t = useMessages().common.cookies;
  const titleId = useId();
  const descId = useId();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!isCookieBannerDismissed(localStorage.getItem(COOKIE_BANNER_KEY)));
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(COOKIE_BANNER_KEY, "seen");
    } catch {
      /* private mode */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-card/95 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p id={titleId} className="font-display text-sm font-semibold text-foreground">
            {t.title}
          </p>
          <p id={descId} className="text-sm leading-relaxed text-muted-foreground">
            {t.body}{" "}
            <Link
              href="/confidentialite"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.privacy}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={dismiss}>
            {t.refuse}
          </Button>
          <Button type="button" className="flex-1 sm:flex-none" onClick={dismiss}>
            {t.accept}
          </Button>
        </div>
      </div>
    </aside>
  );
}
