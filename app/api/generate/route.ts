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
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Enqueues an async generation job and returns `{ jobId }` immediately.
 * The client starts `/run` and polls `/api/generate/[jobId]` for stepper progress.
 */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: m.errors.authRequired }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.generate;
  if (!(await rateLimit(`generate:${userId}`, limit, windowMs))) {
    return Response.json({ error: m.api.generate.rateLimited }, { status: 429 });
  }

  let params: GenerationJobParams;
  try {
    params = parseGenerationJobParams(await req.json().catch(() => ({})));
    if (!params.language && locale === "en") {
      params = { ...params, language: "english" };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json(
        { error: e.issues[0]?.message ?? m.api.invalidRequest },
        { status: 400 }
      );
    }
    return Response.json({ error: m.api.invalidRequest }, { status: 400 });
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
      return Response.json(
        { error: localizeServerError(e.message, e.status, locale, m.api.generate.enqueueFailed) },
        { status: e.status }
      );
    }
    if (e instanceof z.ZodError) {
      return Response.json(
        { error: e.issues[0]?.message ?? m.api.invalidRequest },
        { status: 400 }
      );
    }
    reportError(e, "generate/enqueue");
    return Response.json({ error: m.api.generate.enqueueFailed }, { status: 500 });
  }
}
