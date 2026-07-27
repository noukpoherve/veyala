import { auth } from "@/lib/auth";
import { runGenerationJob } from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";

export const runtime = "nodejs";
// Same budget as before — the job row keeps progress if the client disconnects.
export const maxDuration = 60;

/**
 * Worker: runs the generation pipeline and writes step progress to the job row.
 * The UI polls GET /api/generate/[jobId] and keeps the stepper in sync.
 */
export async function POST(_req: Request, { params }: { params: { jobId: string } }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  try {
    const job = await runGenerationJob(params.jobId, session.user.id);
    return Response.json(job);
  } catch (e) {
    if (e instanceof GenerationError) {
      return Response.json(
        { error: e.message, status: e.status, jobId: params.jobId },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    console.error("[generate/run]", e);
    return Response.json({ error: "La génération a échoué." }, { status: 502 });
  }
}
