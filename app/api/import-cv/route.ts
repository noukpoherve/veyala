import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractText, resolveCvMime, MAX_UPLOAD_BYTES } from "@/lib/extract-text";
import { structureCV } from "@/lib/import-cv";
import { saveFile } from "@/lib/storage";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { LLMError } from "@/lib/llm";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Imports a resume (PDF/DOCX), structures it via the LLM and stores it as BaseProfile. */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }
  const userId = session.user.id;

  const { limit, windowMs } = RATE_LIMITS.importCv;
  if (!(await rateLimit(`import-cv:${userId}`, limit, windowMs))) {
    return NextResponse.json({ error: m.api.importCv.rateLimited }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: m.api.importCv.noFile }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: m.api.importCv.fileTooLarge }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resolved = resolveCvMime(buffer, file.type, file.name);
  if (!resolved) {
    return NextResponse.json({ error: m.api.importCv.unsupportedFormat }, { status: 415 });
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
      // Provider messages are written in French: only pass them to French readers.
      return NextResponse.json(
        {
          error:
            locale === "fr" && e.message && e.message.length < 280
              ? e.message
              : m.api.importCv.structureFailed,
        },
        { status: 502 }
      );
    }
    if (e instanceof Error && /extraire assez de texte|scan ou document vide/i.test(e.message)) {
      return NextResponse.json({ error: m.api.importCv.noTextExtracted }, { status: 422 });
    }
    if (e instanceof Error && /Format non supporté/i.test(e.message)) {
      return NextResponse.json({ error: m.api.importCv.unsupportedFormat }, { status: 415 });
    }
    reportError(e, "import-cv");
    return NextResponse.json({ error: m.api.importCv.failed }, { status: 422 });
  }
}
