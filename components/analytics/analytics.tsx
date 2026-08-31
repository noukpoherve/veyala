import { googleAnalyticsMeasurementId } from "@/lib/analytics";
import { AnalyticsRuntime, CookiePreferences } from "./analytics-client";

/** Loads GA4 in production after consent. No-op when unset or not prod. */
export function Analytics() {
  const measurementId = googleAnalyticsMeasurementId();
  if (!measurementId) return null;
  return <AnalyticsRuntime measurementId={measurementId} />;
}

/** Consent controls on the privacy page. Hidden when analytics is off. */
export function AnalyticsPreferences() {
  if (!googleAnalyticsMeasurementId()) return null;
  return <CookiePreferences />;
}
