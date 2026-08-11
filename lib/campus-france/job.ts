import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { GenerationError, type GenerateProgress, type GenerateStep } from "@/lib/generate-cv";
import { campusFranceOptionsSchema, type CampusFranceOptions } from "@/lib/campus-france/schema";
import { generateCampusFranceDossier } from "@/lib/campus-france/generate";
import type { GenerationJobPublic } from "@/lib/generation-job";

export type CampusFranceJobParams = CampusFranceOptions;

export function parseCampusFranceJobParams(raw: unknown): CampusFranceJobParams {
  return campusFranceOptionsSchema.parse(raw);
}

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

/** Creates a QUEUED Campus France job (or returns in-flight / completed for same key). */
export async function enqueueCampusFranceJob(
  userId: string,
  params: CampusFranceJobParams
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
      const reset = await db.generationJob.update({
        where: { id: existing.id },
        data: {
          status: "QUEUED",
          universe: "CAMPUS_FRANCE",
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
    : `gen_cf_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job = await db.generationJob.create({
    data: {
      userId,
      universe: "CAMPUS_FRANCE",
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
 * Runs a Campus France generation job. Called from the shared runner when
 * universe === CAMPUS_FRANCE.
 */
export async function runCampusFranceJob(
  jobId: string,
  userId: string
): Promise<GenerationJobPublic> {
  const job = await db.generationJob.findFirst({
    where: { id: jobId, userId, universe: "CAMPUS_FRANCE" },
  });
  if (!job) throw new GenerationError("Job Campus France introuvable.", 404);

  if (job.status === "SUCCEEDED") return toPublic(job);
  if (job.status === "RUNNING") return toPublic(job);

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

  let params: CampusFranceJobParams;
  try {
    params = parseCampusFranceJobParams(job.params);
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

  try {
    const cv = await generateCampusFranceDossier(
      {
        userId,
        ...params,
        idempotencyKey: params.idempotencyKey ?? undefined,
      },
      {
        onProgress: (event) => {
          void writeProgress(jobId, event).catch((err) =>
            console.error("[campus-france-job] progress write failed", err)
          );
        },
        attemptIdOverride: job.attemptId,
      }
    );

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
