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
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Enqueues an async Campus France generation job and returns `{ jobId }`.
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
  if (!(await rateLimit(`cf-generate:${userId}`, limit, windowMs))) {
    return Response.json({ error: m.api.generate.rateLimited }, { status: 429 });
  }

  let params: CampusFranceJobParams;
  try {
    params = parseCampusFranceJobParams(await req.json().catch(() => ({})));
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
    reportError(e, "campus-france/generate/enqueue");
    return Response.json({ error: m.api.generate.enqueueFailed }, { status: 500 });
  }
}
