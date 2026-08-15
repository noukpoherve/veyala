import { auth } from "@/lib/auth";
import {
  enqueueCampusFranceJob,
  parseCampusFranceJobParams,
  type CampusFranceJobParams,
} from "@/lib/campus-france/job";
import { GenerationError } from "@/lib/generate-cv";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/sentry";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Enqueues an async Campus France generation job and returns `{ jobId }`.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.generate;
  if (!(await rateLimit(`cf-generate:${userId}`, limit, windowMs))) {
    return Response.json(
      { error: "Trop de générations rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  let params: CampusFranceJobParams;
  try {
    params = parseCampusFranceJobParams(await req.json().catch(() => ({})));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const job = await enqueueCampusFranceJob(userId, params);
    await logActivity({
      action: "campus_france.enqueue",
      actorId: userId,
      subjectUserId: userId,
      meta: { jobId: job.id, hasUrl: !!params.programUrl },
    });
    return Response.json({ jobId: job.id, status: job.status });
  } catch (e) {
    if (e instanceof GenerationError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    reportError(e, "campus-france/generate/enqueue");
    return Response.json({ error: "Impossible de démarrer la génération." }, { status: 500 });
  }
}
