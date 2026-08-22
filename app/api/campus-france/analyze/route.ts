import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeCampusFrance, CampusFranceAnalyzeError } from "@/lib/campus-france/analyze";
import { campusFranceAnalyzeSchema } from "@/lib/campus-france/schema";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Free Campus France analysis (no credit).
 * Without projects: proposes study + professional drafts from CV + formation.
 * With projects: rescores the user's edited drafts.
 */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const { limit, windowMs } = RATE_LIMITS.analyze;
  if (!(await rateLimit(`cf-analyze:${session.user.id}:${clientIp()}`, limit, windowMs))) {
    return NextResponse.json({ error: m.api.analyze.rateLimited }, { status: 429 });
  }

  const parsed = campusFranceAnalyzeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? m.api.invalidRequest },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeCampusFrance({
      userId: session.user.id,
      ...parsed.data,
    });

    await logActivity({
      action: "campus_france.analyze",
      actorId: session.user.id,
      subjectUserId: session.user.id,
      meta: {
        cached: result.cachedAnalysis,
        score: result.before.score,
        projectsProposed: result.projectsProposed,
      },
    });

    return NextResponse.json({
      ok: true,
      programTextHash: result.programTextHash,
      programText: result.programText,
      cachedAnalysis: result.cachedAnalysis,
      projectsProposed: result.projectsProposed,
      studyProject: result.studyProject,
      professionalProject: result.professionalProject,
      requirements: result.requirements,
      before: {
        score: result.before.score,
        covered: result.before.covered,
        total: result.before.total,
        items: result.before.items,
      },
      gaps: result.gaps,
    });
  } catch (e) {
    // `instanceof` can fail across Next.js bundles — also check name/status.
    const cfErr =
      e instanceof CampusFranceAnalyzeError
        ? e
        : e &&
            typeof e === "object" &&
            "name" in e &&
            (e as { name?: string }).name === "CampusFranceAnalyzeError" &&
            "status" in e &&
            "message" in e
          ? (e as CampusFranceAnalyzeError)
          : null;
    if (cfErr) {
      return NextResponse.json(
        {
          error: localizeServerError(
            cfErr.message,
            cfErr.status,
            locale,
            m.api.campusFrance.analyzeFailed
          ),
        },
        { status: cfErr.status }
      );
    }
    reportError(e, "campus-france/analyze");
    return NextResponse.json({ error: m.api.campusFrance.analyzeFailed }, { status: 500 });
  }
}
