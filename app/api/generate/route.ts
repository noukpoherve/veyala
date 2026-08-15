import { auth } from "@/lib/auth";
import {
  enqueueGenerationJob,
  parseGenerationJobParams,
  type GenerationJobParams,
} from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/sentry";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Enqueues an async generation job and returns `{ jobId }` immediately.
 * The client starts `/run` and polls `/api/generate/[jobId]` for stepper progress.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.generate;
  if (!(await rateLimit(`generate:${userId}`, limit, windowMs))) {
    return Response.json(
      { error: "Trop de générations rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  let params: GenerationJobParams;
  try {
    params = parseGenerationJobParams(await req.json().catch(() => ({})));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const job = await enqueueGenerationJob(userId, params);
    await logActivity({
      action: "generate.enqueue",
      actorId: userId,
      subjectUserId: userId,
      meta: { jobId: job.id, hasUrl: !!params.jobUrl },
    });
    return Response.json({ jobId: job.id, status: job.status });
  } catch (e) {
    if (e instanceof GenerationError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    reportError(e, "generate/enqueue");
    return Response.json({ error: "Impossible de démarrer la génération." }, { status: 500 });
  }
}
