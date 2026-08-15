import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeCampusFrance, CampusFranceAnalyzeError } from "@/lib/campus-france/analyze";
import { campusFranceAnalyzeSchema } from "@/lib/campus-france/schema";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/sentry";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Free Campus France analysis (no credit).
 * Without projects: proposes study + professional drafts from CV + formation.
 * With projects: rescores the user's edited drafts.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { limit, windowMs } = RATE_LIMITS.analyze;
  if (!(await rateLimit(`cf-analyze:${session.user.id}:${clientIp()}`, limit, windowMs))) {
    return NextResponse.json(
      { error: "Trop d'analyses rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const parsed = campusFranceAnalyzeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
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
      return NextResponse.json({ error: cfErr.message }, { status: cfErr.status });
    }
    reportError(e, "campus-france/analyze");
    const message = e instanceof Error ? e.message : "L'analyse a échoué.";
    // Surface safe French messages; hide infra dumps.
    const safe =
      message.length <= 280 &&
      /[àâäéèêëïîôùûüç]/i.test(message) &&
      !/prisma|ECONN|api_key|sk_/i.test(message)
        ? message
        : "L'analyse a échoué. Réessayez, ou collez le texte de la fiche si l'URL est bloquée.";
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
