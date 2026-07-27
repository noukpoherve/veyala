import { auth } from "@/lib/auth";
import { enqueueGenerationJob, parseGenerationJobParams } from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { matchClaimSchema } from "@/lib/match-score";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z
  .object({
    jobUrl: z.string().url("URL d'offre invalide.").optional(),
    jobText: z.string().max(20000).optional(),
    templateId: z.string().optional(),
    targetTitle: z.string().max(120).optional(),
    instructions: z.string().max(1000).optional(),
    language: z.string().max(40).optional(),
    claims: z.array(matchClaimSchema).max(40).optional(),
    idempotencyKey: z.string().uuid().optional(),
  })
  .refine((b) => b.jobUrl || b.jobText?.trim(), {
    message: "Fournissez l'URL de l'offre ou collez son texte.",
  });

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

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Requête invalide.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const params = parseGenerationJobParams(parsed.data);
    const job = await enqueueGenerationJob(userId, params);
    return Response.json({ jobId: job.id, status: job.status });
  } catch (e) {
    if (e instanceof GenerationError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    console.error("[generate] enqueue failed", e);
    return Response.json({ error: "Impossible de démarrer la génération." }, { status: 500 });
  }
}
