import "server-only";
import type { Template } from "@prisma/client";
import { db } from "@/lib/db";
import { chatJSON } from "@/lib/llm";
import { saveFile } from "@/lib/storage";
import { templateDefinitionSchema, type TemplateDefinition } from "./definition";
import { templateFingerprint } from "./fingerprint";

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SYSTEM_PROMPT = `Tu es un expert en design de CV.
On te donne l'image d'un modèle (template) de CV. Ta mission : en extraire une définition JSON structurée.

Règles :
- "layout" : "sidebar-left" si le CV a une colonne latérale distincte, sinon "single-column".
- "colors.sidebar" : couleurs dominantes de la colonne latérale, du haut vers le bas (1 seule si unie, plusieurs si dégradé), format #rrggbb.
- "colors.band" : couleur des bandes/titres de sections de la colonne principale.
- "colors.heading" / "colors.body" : couleurs des titres et du texte courant.
- "fonts.heading" / "fonts.body" : familles de police les plus proches parmi : "Century Gothic", "Georgia", "Helvetica", "Trebuchet MS", "Arial", "Times New Roman".
- "photo" : true si le modèle affiche une photo.
- "skillsStyle" : "bricks" si les compétences sont des pastilles/briques, "list" si liste à puces, "inline" sinon.
- "sidebarSections" / "mainSections" : sections détectées dans l'ordre, parmi : contact, summary, experience, education, skills, languages, interests. "mainSections" contient au moins "experience".
- Réponds UNIQUEMENT avec l'objet JSON, sans backticks ni texte autour.`;

/** Extracts a template definition from a reference image via the vision LLM. */
export async function extractDefinitionFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<TemplateDefinition> {
  const raw = await chatJSON({
    system: SYSTEM_PROMPT,
    user: "Analyse ce modèle de CV et renvoie sa définition JSON.",
    images: [{ mimeType, base64: buffer.toString("base64") }],
    maxTokens: 2000,
    temperature: 0.1,
  });
  return templateDefinitionSchema.parse(raw);
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export type ImportResult =
  | { outcome: "duplicate"; template: Template }
  | { outcome: "created"; template: Template };

/**
 * Registers a community template. If an identical fingerprint already exists,
 * the existing template is returned instead of creating a duplicate (§7).
 */
export async function createCommunityTemplate(params: {
  userId: string;
  name: string;
  definition: TemplateDefinition;
  previewImage?: { buffer: Buffer; mimeType: string; filename: string };
}): Promise<ImportResult> {
  const fingerprint = templateFingerprint(params.definition);

  const existing = await db.template.findUnique({ where: { fingerprint } });
  if (existing) return { outcome: "duplicate", template: existing };

  let previewImageUrl: string | undefined;
  if (params.previewImage) {
    const stored = await saveFile(params.previewImage.buffer, {
      dir: `templates/${params.userId}`,
      filename: params.previewImage.filename,
      contentType: params.previewImage.mimeType,
    });
    previewImageUrl = stored.url;
  }

  const base = slugify(params.name) || "template";
  const slug = `${base}-${fingerprint.slice(0, 6)}`;

  const template = await db.template.create({
    data: {
      name: params.name,
      slug,
      ownerId: params.userId,
      status: "PENDING",
      engine: "HTML",
      fingerprint,
      definition: params.definition,
      previewImageUrl,
      isPublic: false,
    },
  });
  return { outcome: "created", template };
}
