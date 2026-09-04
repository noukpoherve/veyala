import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { shouldShowWelcomeTour } from "@/lib/onboarding";

export type OnboardingState = {
  showWelcome: boolean;
};

/** Deduped per request so AppShell does not query twice in one render. */
export const getOnboardingState = cache(async (userId: string): Promise<OnboardingState> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tourDismissedAt: true,
      _count: { select: { generatedCVs: true } },
    },
  });

  return {
    showWelcome: shouldShowWelcomeTour({
      tourDismissedAt: user?.tourDismissedAt ?? null,
      generatedCvCount: user?._count.generatedCVs ?? 0,
    }),
  };
});
