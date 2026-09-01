import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyticsPagePath,
  googleAnalyticsInitSnippet,
  googleAnalyticsMeasurementId,
  isCookieBannerDismissed,
  isProductionDeploy,
  parseGaMeasurementId,
} from "@/lib/analytics";

describe("parseGaMeasurementId", () => {
  it("accepts GA4 IDs", () => {
    expect(parseGaMeasurementId("G-ABC123XYZ")).toBe("G-ABC123XYZ");
    expect(parseGaMeasurementId("  G-ABC123XYZ  ")).toBe("G-ABC123XYZ");
    expect(parseGaMeasurementId("G-1")).toBe("G-1");
  });

  it("rejects empty, UA, and malformed values", () => {
    expect(parseGaMeasurementId(undefined)).toBeNull();
    expect(parseGaMeasurementId("")).toBeNull();
    expect(parseGaMeasurementId("UA-123456-1")).toBeNull();
    expect(parseGaMeasurementId("GTM-XXXX")).toBeNull();
    expect(parseGaMeasurementId("g-abc")).toBeNull();
  });
});

describe("isCookieBannerDismissed", () => {
  it("treats any prior choice as dismissed", () => {
    expect(isCookieBannerDismissed("seen")).toBe(true);
    expect(isCookieBannerDismissed("granted")).toBe(true);
    expect(isCookieBannerDismissed("denied")).toBe(true);
    expect(isCookieBannerDismissed(null)).toBe(false);
    expect(isCookieBannerDismissed("granted ")).toBe(false);
  });
});

describe("analyticsPagePath", () => {
  it("emits public French and English paths", () => {
    expect(analyticsPagePath("/fr/dashboard")).toBe("/dashboard");
    expect(analyticsPagePath("/en/dashboard")).toBe("/en/dashboard");
    expect(analyticsPagePath("/dashboard")).toBe("/dashboard");
    expect(analyticsPagePath("/en/login", "error=1")).toBe("/en/login?error=1");
  });
});

describe("googleAnalyticsInitSnippet", () => {
  it("queues commands via Arguments, not a rest array, and grants analytics consent", () => {
    const snippet = googleAnalyticsInitSnippet("G-TESTID01");
    expect(snippet).toContain("dataLayer.push(arguments)");
    expect(snippet).not.toContain("push(args)");
    expect(snippet).toContain("analytics_storage:'granted'");
    expect(snippet).toContain("gtag('config','G-TESTID01'");
    expect(googleAnalyticsInitSnippet("UA-123")).toBe("");
  });
});

describe("production gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is on for Vercel production and next start, off for preview and dev", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionDeploy()).toBe(true);

    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isProductionDeploy()).toBe(false);

    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionDeploy()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(isProductionDeploy()).toBe(false);
  });

  it("returns the ID only in production when it is a valid GA4 id", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTID01");
    expect(googleAnalyticsMeasurementId()).toBe("G-TESTID01");

    vi.stubEnv("VERCEL_ENV", "preview");
    expect(googleAnalyticsMeasurementId()).toBeNull();

    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "not-an-id");
    expect(googleAnalyticsMeasurementId()).toBeNull();
  });
});
