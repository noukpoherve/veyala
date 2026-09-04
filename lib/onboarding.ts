/** Pure first-run tour rules. Data fetching lives in `lib/onboarding-state.ts`. */

export const WELCOME_TOUR_STEPS = [
  "profile",
  "jobUrl",
  "generate",
  "templates",
  "credits",
] as const;
export const RESULT_TOUR_STEPS = ["edit", "studioTemplates", "appearance", "download"] as const;

export type WelcomeTourStepId = (typeof WELCOME_TOUR_STEPS)[number];
export type ResultTourStepId = (typeof RESULT_TOUR_STEPS)[number];
export type TourStepId = WelcomeTourStepId | ResultTourStepId;
export type TourKind = "welcome" | "result";

export const TOUR_STEP_HREF: Partial<Record<TourStepId, string>> = {
  profile: "/profile",
  jobUrl: "/generate",
  generate: "/generate",
  templates: "/templates",
};

export function tourHrefFor(stepId: TourStepId, pathname: string): string | undefined {
  const staticHref = TOUR_STEP_HREF[stepId];
  if (staticHref) return staticHref;
  if (stepId === "studioTemplates" || stepId === "appearance") {
    const match = pathname.match(/^\/cv\/([^/]+)/);
    if (!match) return undefined;
    const editPath = `/cv/${match[1]}/edit`;
    if (pathname === editPath) return undefined;
    return editPath;
  }
  return undefined;
}

export function tourStepsFor(kind: TourKind): readonly TourStepId[] {
  return kind === "welcome" ? WELCOME_TOUR_STEPS : RESULT_TOUR_STEPS;
}

export function isCvWorkspacePath(pathname: string): boolean {
  return pathname === "/cv" || pathname.startsWith("/cv/");
}

export function shouldShowWelcomeTour(input: {
  tourDismissedAt: Date | null;
  generatedCvCount: number;
}): boolean {
  if (input.tourDismissedAt) return false;
  return input.generatedCvCount === 0;
}

export function shouldShowResultTour(input: {
  editorTourDismissedAt: Date | null;
  generatedCvCount: number;
}): boolean {
  if (input.editorTourDismissedAt) return false;
  return input.generatedCvCount > 0;
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
