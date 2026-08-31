import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyticsPagePath,
  googleAnalyticsMeasurementId,
  isProductionDeploy,
  parseAnalyticsConsent,
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

describe("parseAnalyticsConsent", () => {
  it("only accepts granted or denied", () => {
    expect(parseAnalyticsConsent("granted")).toBe("granted");
    expect(parseAnalyticsConsent("denied")).toBe("denied");
    expect(parseAnalyticsConsent("granted ")).toBeNull();
    expect(parseAnalyticsConsent(null)).toBeNull();
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
