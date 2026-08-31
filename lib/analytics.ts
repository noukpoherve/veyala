import { localeFromPathname, localizePath, stripLocalePrefix } from "@/i18n/path";

/** GA4 measurement IDs (Universal Analytics UA- is retired). */
const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

export const ANALYTICS_CONSENT_KEY = "veyala:analytics-consent";

export type AnalyticsConsent = "granted" | "denied";

/** CNIL max lifetime for audience-measurement cookies (13 months). */
export const ANALYTICS_COOKIE_MAX_AGE_SECONDS = 395 * 24 * 60 * 60;

export function parseGaMeasurementId(raw: string | undefined | null): string | null {
  const value = raw?.trim() ?? "";
  return GA_MEASUREMENT_ID.test(value) ? value : null;
}

export function parseAnalyticsConsent(raw: string | null | undefined): AnalyticsConsent | null {
  return raw === "granted" || raw === "denied" ? raw : null;
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
