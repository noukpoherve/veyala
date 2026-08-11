import { auth } from "@/lib/auth";
import { runGenerationJob } from "@/lib/generation-job";
import { GenerationError } from "@/lib/generate-cv";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Worker: runs the Campus France pipeline (dispatched via universe on the job row).
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
    console.error("[campus-france/generate/run]", e);
    return Response.json({ error: "La génération a échoué." }, { status: 502 });
  }
}
