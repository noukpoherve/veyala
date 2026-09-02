import { localeFromPathname, localizePath, stripLocalePrefix } from "@/i18n/path";

/** GA4 measurement IDs (Universal Analytics UA- is retired). */
const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

/** Same key as before so returning visitors do not see the banner again. */
export const COOKIE_BANNER_KEY = "veyala:analytics-consent";

/** CNIL max lifetime for audience-measurement cookies (13 months). */
export const ANALYTICS_COOKIE_MAX_AGE_SECONDS = 395 * 24 * 60 * 60;

export function parseGaMeasurementId(raw: string | undefined | null): string | null {
  const value = raw?.trim() ?? "";
  return GA_MEASUREMENT_ID.test(value) ? value : null;
}

/** True once the visitor has dismissed the cookie bar (accept or refuse). */
export function isCookieBannerDismissed(raw: string | null | undefined): boolean {
  return raw === "granted" || raw === "denied" || raw === "seen";
}

/**
 * True only for the production deployment. Preview (Vercel) and `next dev`
 * stay off even if a measurement ID is present in the env file.
 */
export function isProductionDeploy(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "production";
  return process.env.NODE_ENV === "production";
}

/** Measurement ID to load, or null when analytics must stay off. */
export function googleAnalyticsMeasurementId(): string | null {
  if (!isProductionDeploy()) return null;
  return parseGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

/** Public URL path (French unprefixed, English `/en/...`) for page_view. */
export function analyticsPagePath(pathname: string, search = ""): string {
  const path = pathname || "/";
  const locale = localeFromPathname(path);
  const publicPath = localizePath(stripLocalePrefix(path), locale);
  return search ? `${publicPath}?${search}` : publicPath;
}

/**
 * Inline gtag bootstrap. Must use `dataLayer.push(arguments)` — a rest array
 * is not replayed by gtag.js, so no collect hits and no `_ga` cookie.
 */
export function googleAnalyticsInitSnippet(measurementId: string): string {
  const id = parseGaMeasurementId(measurementId);
  if (!id) return "";
  return `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());
gtag('config','${id}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:${ANALYTICS_COOKIE_MAX_AGE_SECONDS}});`;
}
