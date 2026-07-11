import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractText, ALLOWED_CV_TYPES, MAX_UPLOAD_BYTES } from "@/lib/extract-text";
import { structureCV } from "@/lib/import-cv";
import { saveFile } from "@/lib/storage";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { LLMError } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Imports a resume (PDF/DOCX), structures it via the LLM and stores it as BaseProfile. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.importCv;
  if (!rateLimit(`import-cv:${userId}`, limit, windowMs)) {
    return NextResponse.json(
      { error: "Trop d'imports rapprochés. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!ALLOWED_CV_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Format non supporté : PDF ou DOCX uniquement." },
      { status: 415 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (8 Mo max)." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.type);
    const [data, stored] = await Promise.all([
      structureCV(text),
      saveFile(buffer, { dir: `cv-source/${userId}`, filename: file.name, contentType: file.type }),
    ]);

    await db.baseProfile.upsert({
      where: { userId },
      create: { userId, data, sourceFileUrl: stored.url },
      update: { data, sourceFileUrl: stored.url },
    });

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[import-cv]", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue.";
    const status = e instanceof LLMError ? 502 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
