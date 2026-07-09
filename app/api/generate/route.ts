import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateCV, GenerationError } from "@/lib/generate-cv";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z
  .object({
    jobUrl: z.string().url("URL d'offre invalide.").optional(),
    jobText: z.string().max(20000).optional(),
    templateId: z.string().optional(),
    targetTitle: z.string().max(120).optional(),
    instructions: z.string().max(1000).optional(),
    language: z.string().max(40).optional(),
  })
  .refine((b) => b.jobUrl || b.jobText?.trim(), {
    message: "Fournissez l'URL de l'offre ou collez son texte.",
  });

/** Generates a tailored CV (debits 1 credit, refunded on failure). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.generate;
  if (!rateLimit(`generate:${userId}`, limit, windowMs)) {
    return NextResponse.json(
      { error: "Trop de générations rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Requête invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const cv = await generateCV({ userId, ...parsed.data });
    return NextResponse.json({ ok: true, id: cv.id });
  } catch (e) {
    if (e instanceof GenerationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "La génération a échoué." }, { status: 500 });
  }
}
