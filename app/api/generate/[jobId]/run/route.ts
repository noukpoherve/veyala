import { auth } from "@/lib/auth";
import { runGenerationJob } from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";
// Same budget as before — the job row keeps progress if the client disconnects.
export const maxDuration = 60;

/**
 * Worker: runs the generation pipeline and writes step progress to the job row.
 * The UI polls GET /api/generate/[jobId] and keeps the stepper in sync.
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
    reportError(e, "generate/run");
    return Response.json({ error: m.api.generate.failed }, { status: 502 });
  }
}
