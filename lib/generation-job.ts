import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  generateCV,
  GenerationError,
  type GenerateParams,
  type GenerateProgress,
  type GenerateStep,
} from "@/lib/generate-cv";
import { matchClaimSchema } from "@/lib/match-score";
import { z } from "zod";

const jobParamsSchema = z
  .object({
    jobUrl: z.string().url().optional(),
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

export type GenerationJobParams = z.infer<typeof jobParamsSchema>;

export function parseGenerationJobParams(raw: unknown): GenerationJobParams {
  return jobParamsSchema.parse(raw);
}

export type GenerationJobPublic = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  step: string | null;
  message: string | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
  error: string | null;
  errorStatus: number | null;
  generatedCvId: string | null;
};

function toPublic(job: {
  id: string;
  status: GenerationJobPublic["status"];
  step: string | null;
  message: string | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
  error: string | null;
  errorStatus: number | null;
  generatedCvId: string | null;
}): GenerationJobPublic {
  return {
    id: job.id,
    status: job.status,
    step: job.step,
    message: job.message,
    scoreBefore: job.scoreBefore,
    scoreAfter: job.scoreAfter,
    error: job.error,
    errorStatus: job.errorStatus,
    generatedCvId: job.generatedCvId,
  };
}

/** Creates a QUEUED job (or returns an in-flight / completed one for the same key). */
export async function enqueueGenerationJob(
  userId: string,
  params: GenerationJobParams
): Promise<GenerationJobPublic> {
  const idempotencyKey = params.idempotencyKey?.trim().slice(0, 64) || undefined;

  if (idempotencyKey) {
    const existing = await db.generationJob.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
    if (existing) {
      if (
        existing.status === "SUCCEEDED" ||
        existing.status === "RUNNING" ||
        existing.status === "QUEUED"
      ) {
        return toPublic(existing);
      }
      // FAILED → re-queue for a clean retry (credit was refunded by generateCV).
      const reset = await db.generationJob.update({
        where: { id: existing.id },
        data: {
          status: "QUEUED",
          step: "reading_offer",
          message: "En file d'attente…",
          scoreBefore: null,
          scoreAfter: null,
          error: null,
          errorStatus: null,
          generatedCvId: null,
          startedAt: null,
          finishedAt: null,
          params: params as unknown as Prisma.InputJsonValue,
        },
      });
      return toPublic(reset);
    }
  }

  const attemptId = idempotencyKey
    ? `gen_${idempotencyKey}`
    : `gen_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job = await db.generationJob.create({
    data: {
      userId,
      status: "QUEUED",
      step: "reading_offer",
      message: "En file d'attente…",
      params: params as unknown as Prisma.InputJsonValue,
      idempotencyKey,
      attemptId,
    },
  });
  return toPublic(job);
}

export async function getGenerationJobForUser(
  jobId: string,
  userId: string
): Promise<GenerationJobPublic | null> {
  const job = await db.generationJob.findFirst({ where: { id: jobId, userId } });
  return job ? toPublic(job) : null;
}

async function writeProgress(jobId: string, event: GenerateProgress): Promise<void> {
  if (event.step === "score") {
    await db.generationJob.update({
      where: { id: jobId },
      data: event.phase === "before" ? { scoreBefore: event.score } : { scoreAfter: event.score },
    });
    return;
  }
  const step = event.step as GenerateStep;
  await db.generationJob.update({
    where: { id: jobId },
    data: {
      step,
      message: event.message,
      ...(step === "done" ? {} : { status: "RUNNING" }),
    },
  });
}

/**
 * Claims the job and runs the CV pipeline. Idempotent for SUCCEEDED jobs.
 * Safe to call from a dedicated worker route while the client polls status.
 */
export async function runGenerationJob(
  jobId: string,
  userId: string
): Promise<GenerationJobPublic> {
  const job = await db.generationJob.findFirst({ where: { id: jobId, userId } });
  if (!job) throw new GenerationError("Job de génération introuvable.", 404);

  if (job.status === "SUCCEEDED") return toPublic(job);
  if (job.status === "RUNNING") {
    // Another worker is already on it — poller will observe the result.
    return toPublic(job);
  }

  const claimed = await db.generationJob.updateMany({
    where: { id: jobId, userId, status: { in: ["QUEUED", "FAILED"] } },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      step: "reading_offer",
      message: "Démarrage…",
      error: null,
      errorStatus: null,
    },
  });
  if (claimed.count === 0) {
    const latest = await db.generationJob.findFirstOrThrow({ where: { id: jobId, userId } });
    return toPublic(latest);
  }

  let params: GenerationJobParams;
  try {
    params = parseGenerationJobParams(job.params);
  } catch {
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: "Paramètres de génération invalides.",
        errorStatus: 400,
        finishedAt: new Date(),
      },
    });
    throw new GenerationError("Paramètres de génération invalides.", 400);
  }

  const generateParams: GenerateParams = {
    userId,
    ...params,
    idempotencyKey: params.idempotencyKey ?? undefined,
  };

  try {
    const cv = await generateCV(generateParams, {
      onProgress: (event) => {
        void writeProgress(jobId, event).catch((err) =>
          console.error("[generation-job] progress write failed", err)
        );
      },
      // Reuse the job's attemptId so refunds match the debit ledger.
      attemptIdOverride: job.attemptId,
    });

    const done = await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        step: "done",
        message: "Terminé.",
        generatedCvId: cv.id,
        scoreBefore: cv.matchScoreBefore,
        scoreAfter: cv.matchScoreAfter,
        finishedAt: new Date(),
      },
    });
    return toPublic(done);
  } catch (e) {
    const message =
      e instanceof GenerationError
        ? e.message
        : e instanceof Error
          ? e.message
          : "La génération a échoué.";
    const status = e instanceof GenerationError ? e.status : 502;
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: message,
        errorStatus: status,
        finishedAt: new Date(),
        message: "Échec.",
      },
    });
    if (e instanceof GenerationError) throw e;
    throw new GenerationError(message, status);
  }
}
