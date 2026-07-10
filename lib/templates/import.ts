import "server-only";
import { createHash } from "crypto";
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
- "colors.sidebar" : couleurs dominantes de la colonne latérale, du haut vers le bas, format #rrggbb — 1 seule si unie, 6 MAXIMUM pour un dégradé.
- "colors.band" : couleur des bandes/titres de sections de la colonne principale.
- "colors.heading" / "colors.body" : couleurs des titres et du texte courant.
- "fonts.heading" / "fonts.body" : familles de police les plus proches parmi : "Century Gothic", "Georgia", "Helvetica", "Trebuchet MS", "Arial", "Times New Roman".
- "photo" : true si le modèle affiche une photo.
- "skillsStyle" : "bricks" si les compétences sont des pastilles/briques, "list" si liste à puces, "inline" sinon.
- "headerStyle" : "band" si les titres de sections sont sur un fond de couleur pleine, "underline" s'ils sont en texte souligné d'un trait de couleur.
- "namePlacement" : "sidebar" si le nom du candidat est affiché dans la colonne latérale, "main" sinon.
- "datesStyle" : "pill" si les dates sont dans des pastilles/badges alignés à droite des intitulés, "inline" sinon.
- "sidebarSections" / "mainSections" : sections détectées dans l'ordre. Utilise EXACTEMENT ces identifiants anglais (jamais les titres affichés sur l'image) : "contact", "summary", "experience", "education", "skills", "languages", "interests". "mainSections" contient au moins "experience".
- Réponds UNIQUEMENT avec l'objet JSON, sans backticks ni texte autour.`;

/** Maps free-form section labels (often French, from the image) to schema ids. */
const SECTION_ALIASES: [RegExp, string][] = [
  [/^(contact|information|coordonn)/, "contact"],
  [/^(summary|profil|resume|about|a.?propos|objectif)/, "summary"],
  [/^(experience|parcours|emploi|mission)/, "experience"],
  [/^(education|formation|diplome|etude)/, "education"],
  [/^(skill|competence|techno|expertise|outil)/, "skills"],
  [/^(language|langue)/, "languages"],
  [/^(interest|inter|hobb|loisir|centre|engagement|divers)/, "interests"],
];

function normalizeSections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    const label = String(raw)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    const match = SECTION_ALIASES.find(([re]) => re.test(label))?.[1];
    if (match && !out.includes(match)) out.push(match);
  }
  return out;
}

/** Tolerant coercion of the vision model's output into a valid definition. */
function coerceDefinition(raw: unknown): TemplateDefinition {
  const value = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const colors = (typeof value.colors === "object" && value.colors !== null ? value.colors : {}) as Record<string, unknown>;
  const fonts = (typeof value.fonts === "object" && value.fonts !== null ? value.fonts : {}) as Record<string, unknown>;

  const cleanHex = (c: unknown): string | undefined => {
    const hex = String(c ?? "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : undefined;
  };

  const sidebarColors = (Array.isArray(colors.sidebar) ? colors.sidebar : [])
    .map(cleanHex)
    .filter((c): c is string => !!c)
    .slice(0, 6);

  const cleanColors: Record<string, unknown> = {
    sidebar: sidebarColors.length ? sidebarColors : undefined,
  };
  for (const key of ["sidebarText", "band", "bandText", "heading", "body", "link"]) {
    cleanColors[key] = cleanHex(colors[key]);
  }

  const mainSections = normalizeSections(value.mainSections);
  if (!mainSections.includes("experience")) mainSections.push("experience");

  return templateDefinitionSchema.parse({
    layout: value.layout === "single-column" ? "single-column" : "sidebar-left",
    colors: cleanColors,
    fonts: {
      heading: typeof fonts.heading === "string" ? fonts.heading : undefined,
      body: typeof fonts.body === "string" ? fonts.body : undefined,
    },
    photo: Boolean(value.photo),
    skillsStyle: ["bricks", "list", "inline"].includes(String(value.skillsStyle))
      ? value.skillsStyle
      : undefined,
    headerStyle: ["band", "underline"].includes(String(value.headerStyle))
      ? value.headerStyle
      : undefined,
    namePlacement: ["main", "sidebar"].includes(String(value.namePlacement))
      ? value.namePlacement
      : undefined,
    datesStyle: ["inline", "pill"].includes(String(value.datesStyle)) ? value.datesStyle : undefined,
    sidebarSections: normalizeSections(value.sidebarSections),
    mainSections,
  });
}

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
  try {
    return coerceDefinition(raw);
  } catch {
    throw new Error(
      "Impossible d'extraire une mise en page exploitable de cette image. Essayez une capture plus nette du modèle."
    );
  }
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

/** sha256 of the reference image bytes. */
export function imageHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Registers a community template. Duplicates are detected two ways (§7):
 * identical reference image (byte hash, immune to LLM variance) or identical
 * extracted definition (fingerprint). Either match reuses the existing template.
 */
export async function createCommunityTemplate(params: {
  userId: string;
  name: string;
  definition: TemplateDefinition;
  previewImage?: { buffer: Buffer; mimeType: string; filename: string };
}): Promise<ImportResult> {
  const fingerprint = templateFingerprint(params.definition);
  const sourceImageHash = params.previewImage ? imageHash(params.previewImage.buffer) : undefined;

  const existing = await db.template.findFirst({
    where: sourceImageHash
      ? { OR: [{ fingerprint }, { sourceImageHash }] }
      : { fingerprint },
  });
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
      sourceImageHash,
      definition: params.definition,
      previewImageUrl,
      isPublic: false,
    },
  });
  return { outcome: "created", template };
}
