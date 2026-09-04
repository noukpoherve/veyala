import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { shouldShowResultTour, shouldShowWelcomeTour } from "@/lib/onboarding";

export type OnboardingState = {
  showWelcome: boolean;
  showResult: boolean;
};

/** Deduped per request so AppShell does not query twice in one render. */
export const getOnboardingState = cache(async (userId: string): Promise<OnboardingState> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tourDismissedAt: true,
      editorTourDismissedAt: true,
      _count: { select: { generatedCVs: true } },
    },
  });

  const generatedCvCount = user?._count.generatedCVs ?? 0;
  return {
    showWelcome: shouldShowWelcomeTour({
      tourDismissedAt: user?.tourDismissedAt ?? null,
      generatedCvCount,
    }),
    showResult: shouldShowResultTour({
      editorTourDismissedAt: user?.editorTourDismissedAt ?? null,
      generatedCvCount,
    }),
  };
});
