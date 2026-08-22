import { auth } from "@/lib/auth";
import { runGenerationJob } from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Worker: runs the Campus France pipeline (dispatched via universe on the job row).
 */
export async function POST(req: Request, { params }: { params: { jobId: string } }) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: m.errors.authRequired }, { status: 401 });
  }

  try {
    const job = await runGenerationJob(params.jobId, session.user.id);
    return Response.json(job);
  } catch (e) {
    if (e instanceof GenerationError) {
      return Response.json(
        {
          error: localizeServerError(e.message, e.status, locale, m.api.generate.failed),
          status: e.status,
          jobId: params.jobId,
        },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    reportError(e, "campus-france/generate/run");
    return Response.json({ error: m.api.generate.failed }, { status: 502 });
  }
}
