import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { analyzeJobMatch, AnalyzeError, projectScoreIfAllGapsClaimed } from "@/lib/analyze-job";
import { matchClaimSchema } from "@/lib/match-score";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { cvSchema } from "@/lib/cv-schema";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z
  .object({
    jobUrl: z.string().url().optional(),
    jobText: z.string().max(20000).optional(),
    claims: z.array(matchClaimSchema).max(40).optional(),
  })
  .refine((b) => b.jobUrl || b.jobText?.trim(), {
    message: "Fournissez l'URL de l'offre ou collez son texte.",
  });

/**
 * Free match analysis (no credit). Returns before score, gaps, and projected
 * scores (with optional claims + all-gaps upper bound).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { limit, windowMs } = RATE_LIMITS.analyze;
  if (!(await rateLimit(`analyze:${session.user.id}:${clientIp()}`, limit, windowMs))) {
    return NextResponse.json(
      { error: "Trop d'analyses rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeJobMatch({
      userId: session.user.id,
      ...parsed.data,
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
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "L'analyse a échoué." }, { status: 500 });
  }
}
