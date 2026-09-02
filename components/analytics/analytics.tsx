import { googleAnalyticsMeasurementId } from "@/lib/analytics";
import { CookieBanner, GoogleAnalytics } from "./analytics-client";

/** GA4 in production, plus a dismissible cookie bar. Tracking is not gated on the bar. */
export function Analytics() {
  const measurementId = googleAnalyticsMeasurementId();
  if (!measurementId) return null;
  return (
    <>
      <GoogleAnalytics measurementId={measurementId} />
      <CookieBanner />
    </>
  );
}
