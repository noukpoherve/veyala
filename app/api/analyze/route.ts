import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { analyzeJobMatch, AnalyzeError, projectScoreIfAllGapsClaimed } from "@/lib/analyze-job";
import { matchClaimSchema } from "@/lib/match-score";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { cvSchema } from "@/lib/cv-schema";
import { db } from "@/lib/db";
import { validateJobText } from "@/lib/job-field-validation";
import { logActivity } from "@/lib/activity";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages, type Messages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const maxDuration = 60;

const buildBodySchema = (m: Messages) =>
  z
    .object({
      jobUrl: z.string().url().optional(),
      jobText: z.string().max(20000).optional(),
      claims: z.array(matchClaimSchema).max(40).optional(),
      targetTitle: z.string().max(120).optional(),
      language: z.string().max(40).optional(),
    })
    .superRefine((b, ctx) => {
      if (!b.jobUrl && !b.jobText?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: m.api.analyze.jobSourceRequired,
          path: ["jobText"],
        });
      }
      if (b.jobText?.trim()) {
        const err = validateJobText(b.jobText);
        if (err) ctx.addIssue({ code: "custom", message: err, path: ["jobText"] });
      }
    });

/**
 * Free match analysis (no credit). Returns before score, gaps, and projected
 * scores (with optional claims + all-gaps upper bound).
 */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const { limit, windowMs } = RATE_LIMITS.analyze;
  if (!(await rateLimit(`analyze:${session.user.id}:${clientIp()}`, limit, windowMs))) {
    return NextResponse.json({ error: m.api.analyze.rateLimited }, { status: 429 });
  }

  const parsed = buildBodySchema(m).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? m.api.invalidRequest },
      { status: 400 }
    );
  }

  try {
    const { claims, jobUrl, jobText } = parsed.data;
    const result = await analyzeJobMatch({
      userId: session.user.id,
      jobUrl,
      jobText,
      claims,
    });

    const profile = await db.baseProfile.findUnique({ where: { userId: session.user.id } });
    const cv = profile ? cvSchema.safeParse(profile.data) : null;
    const maxProjected =
      cv?.success && result.gaps.length
        ? projectScoreIfAllGapsClaimed(
            { ...cv.data, softSkills: cv.data.softSkills ?? [] },
            result.requirements,
            result.gaps
          )
        : result.projected;

    await logActivity({
      action: "analyze.run",
      actorId: session.user.id,
      subjectUserId: session.user.id,
      meta: { cached: result.cachedAnalysis, score: result.before.score },
    });

    return NextResponse.json({
      ok: true,
      jobTextHash: result.jobTextHash,
      jobText: result.jobText,
      cachedAnalysis: result.cachedAnalysis,
      requirements: result.requirements,
      before: {
        score: result.before.score,
        covered: result.before.covered,
        total: result.before.total,
        items: result.before.items,
      },
      projected: {
        score: result.projected.score,
        covered: result.projected.covered,
        total: result.projected.total,
      },
      maxProjected: {
        score: maxProjected.score,
        covered: maxProjected.covered,
        total: maxProjected.total,
      },
      gaps: result.gaps,
    });
  } catch (e) {
    if (e instanceof AnalyzeError) {
      return NextResponse.json(
        {
          error: localizeServerError(e.message, e.status, locale, m.api.analyze.failed),
        },
        { status: e.status }
      );
    }
    return NextResponse.json({ error: m.api.analyze.failed }, { status: 500 });
  }
}
