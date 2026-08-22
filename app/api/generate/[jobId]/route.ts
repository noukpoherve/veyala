import { auth } from "@/lib/auth";
import { getGenerationJobForUser } from "@/lib/generation-job";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeServerError } from "@/lib/user-facing-error";

export const runtime = "nodejs";

/** Poll endpoint: current step / scores / result for an async generation job. */
export async function GET(req: Request, { params }: { params: { jobId: string } }) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const job = await getGenerationJobForUser(params.jobId, session.user.id);
  if (!job) {
    return Response.json({ error: m.api.generate.jobNotFound }, { status: 404 });
  }

  const payload =
    job.error != null
      ? {
          ...job,
          error: localizeServerError(job.error, job.errorStatus, locale, m.api.generate.failed),
        }
      : job;

  return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
}
