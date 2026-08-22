import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LLMError } from "@/lib/llm";
import { rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  createCommunityTemplate,
  extractDefinitionFromImage,
} from "@/lib/templates/import";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Submits a community template from a reference image. Detects duplicates by
 * fingerprint; new templates are created as PENDING (admin validation).
 */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await rateLimit(`templates:${userId}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: m.api.templates.rateLimited }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const name = String(formData?.get("name") ?? "").trim();
  const image = formData?.get("image");

  if (name.length < 3 || name.length > 60) {
    return NextResponse.json({ error: m.api.templates.nameRequired }, { status: 400 });
  }
  if (!(image instanceof File)) {
    return NextResponse.json({ error: m.api.templates.imageRequired }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: m.api.templates.unsupportedImage }, { status: 415 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: m.api.templates.imageTooLarge }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const definition = await extractDefinitionFromImage(buffer, image.type);
    const result = await createCommunityTemplate({
      userId,
      name,
      definition,
      previewImage: { buffer, mimeType: image.type, filename: image.name },
    });

    if (result.outcome === "duplicate") {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        templateId: result.template.id,
        templateName: result.template.name,
        message: m.api.templates.duplicate(result.template.name),
      });
    }
    return NextResponse.json({
      ok: true,
      duplicate: false,
      templateId: result.template.id,
      message: m.api.templates.submitted,
    });
  } catch (e) {
    // Import errors are written in French: only pass them to French readers.
    const message =
      locale === "fr" && e instanceof Error ? e.message : m.api.templates.analyzeFailed;
    const status = e instanceof LLMError ? 502 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
