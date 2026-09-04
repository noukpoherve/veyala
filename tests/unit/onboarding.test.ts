import { describe, expect, it } from "vitest";
import { placeTourTooltip, shouldShowWelcomeTour } from "@/lib/onboarding";

describe("shouldShowWelcomeTour", () => {
  it("shows for a new account that has never generated", () => {
    expect(shouldShowWelcomeTour({ tourDismissedAt: null, generatedCvCount: 0 })).toBe(true);
  });

  it("hides after the dialog was skipped or completed", () => {
    expect(
      shouldShowWelcomeTour({ tourDismissedAt: new Date("2026-09-04"), generatedCvCount: 0 })
    ).toBe(false);
  });

  it("hides once the user has generated a CV, even without a dismiss timestamp", () => {
    expect(shouldShowWelcomeTour({ tourDismissedAt: null, generatedCvCount: 1 })).toBe(false);
  });
});

describe("placeTourTooltip", () => {
  const tooltip = { width: 320, height: 180 };
  const viewport = { width: 1280, height: 800 };

  it("puts the tooltip to the right of a sidebar control", () => {
    const pos = placeTourTooltip({ top: 200, left: 16, width: 240, height: 40 }, viewport, tooltip);
    expect(pos.left).toBe(16 + 240 + 12);
    expect(pos.top).toBe(200);
    expect(pos.placement).toBe("right");
  });

  it("puts the tooltip above a bottom tab bar control", () => {
    const pos = placeTourTooltip({ top: 740, left: 80, width: 80, height: 48 }, viewport, tooltip);
    expect(pos.top).toBe(740 - 180 - 12);
    expect(pos.placement).toBe("top");
  });
});
