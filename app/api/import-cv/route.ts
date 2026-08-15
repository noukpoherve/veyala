import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractText, resolveCvMime, MAX_UPLOAD_BYTES } from "@/lib/extract-text";
import { structureCV } from "@/lib/import-cv";
import { saveFile } from "@/lib/storage";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { LLMError } from "@/lib/llm";
import { reportError } from "@/lib/sentry";

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
  if (!(await rateLimit(`import-cv:${userId}`, limit, windowMs))) {
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
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (8 Mo max)." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resolved = resolveCvMime(buffer, file.type, file.name);
  if (!resolved) {
    return NextResponse.json(
      { error: "Format non supporté : PDF ou DOCX uniquement." },
      { status: 415 }
    );
  }

  try {
    const text = await extractText(buffer, resolved.mime);
    const [data, stored] = await Promise.all([
      structureCV(text),
      saveFile(buffer, {
        dir: `cv-source/${userId}`,
        filename: file.name,
        contentType: resolved.mime,
      }),
    ]);

    await db.baseProfile.upsert({
      where: { userId },
      create: { userId, data, sourceFileUrl: stored.url },
      update: { data, sourceFileUrl: stored.url },
    });

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    if (e instanceof LLMError) {
      reportError(e, "import-cv");
      return NextResponse.json(
        {
          error:
            e.message && e.message.length < 280
              ? e.message
              : "Le service IA n'a pas pu structurer votre CV. Réessayez dans un instant.",
        },
        { status: 502 }
      );
    }
    if (e instanceof Error && /extraire assez de texte|scan ou document vide/i.test(e.message)) {
      return NextResponse.json(
        {
          error:
            "Impossible d'extraire le texte de ce fichier. Utilisez un PDF ou DOCX texte (pas un scan image) de 8 Mo max.",
        },
        { status: 422 }
      );
    }
    if (e instanceof Error && /Format non supporté/i.test(e.message)) {
      return NextResponse.json({ error: e.message }, { status: 415 });
    }
    reportError(e, "import-cv");
    return NextResponse.json(
      {
        error:
          "L'import a échoué après lecture du fichier. Réessayez dans un instant ; si le problème continue, utilisez le DOCX exporté.",
      },
      { status: 422 }
    );
  }
}
