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

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Submits a community template from a reference image. Detects duplicates by
 * fingerprint; new templates are created as PENDING (admin validation).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const userId = session.user.id;

  if (!rateLimit(`templates:${userId}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de soumissions rapprochées. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const name = String(formData?.get("name") ?? "").trim();
  const image = formData?.get("image");

  if (name.length < 3 || name.length > 60) {
    return NextResponse.json({ error: "Nom du template requis (3 à 60 caractères)." }, { status: 400 });
  }
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image de référence requise." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: "Format d'image non supporté : PNG, JPEG ou WebP." }, { status: 415 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (5 Mo max)." }, { status: 413 });
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
        message: `Ce template existe déjà sous le nom « ${result.template.name} » : vous pouvez l'utiliser directement.`,
      });
    }
    return NextResponse.json({
      ok: true,
      duplicate: false,
      templateId: result.template.id,
      message:
        "Template soumis ! Vous pouvez l'utiliser dès maintenant ; il sera proposé aux autres utilisateurs après validation.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "L'analyse du template a échoué.";
    const status = e instanceof LLMError ? 502 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
