/** Pure first-run tour rules. Data fetching lives in `lib/onboarding-state.ts`. */

export const TOUR_STEPS = ["profile", "generate", "credits"] as const;
export type TourStepId = (typeof TOUR_STEPS)[number];

export function shouldShowWelcomeTour(input: {
  tourDismissedAt: Date | null;
  generatedCvCount: number;
}): boolean {
  if (input.tourDismissedAt) return false;
  return input.generatedCvCount === 0;
}

export type Box = { top: number; left: number; width: number; height: number };
export type TourTooltipPlacement = "right" | "left" | "top" | "bottom";

/** Places the step tooltip next to a highlighted target without leaving the viewport. */
export function placeTourTooltip(
  target: Box,
  viewport: { width: number; height: number },
  tooltip: { width: number; height: number },
  gap = 12
): { top: number; left: number; placement: TourTooltipPlacement } {
  const clamp = (left: number, top: number, placement: TourTooltipPlacement) => ({
    top: Math.max(gap, Math.min(top, viewport.height - tooltip.height - gap)),
    left: Math.max(gap, Math.min(left, viewport.width - tooltip.width - gap)),
    placement,
  });

  const isBottomChrome = target.top > viewport.height * 0.65;
  if (isBottomChrome) {
    return clamp(
      target.left + target.width / 2 - tooltip.width / 2,
      target.top - tooltip.height - gap,
      "top"
    );
  }

  const right = target.left + target.width + gap;
  if (right + tooltip.width <= viewport.width - gap) {
    return clamp(right, target.top, "right");
  }

  const left = target.left - gap - tooltip.width;
  if (left >= gap) {
    return clamp(left, target.top, "left");
  }

  return clamp(target.left, target.top + target.height + gap, "bottom");
}
