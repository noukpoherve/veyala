import { auth } from "@/lib/auth";
import { getGenerationJobForUser } from "@/lib/generation-job";

export const runtime = "nodejs";

/** Poll endpoint for Campus France async generation jobs. */
export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const job = await getGenerationJobForUser(params.jobId, session.user.id);
  if (!job) {
    return Response.json({ error: "Job introuvable." }, { status: 404 });
  }

  return Response.json(job, { headers: { "Cache-Control": "no-store" } });
}
