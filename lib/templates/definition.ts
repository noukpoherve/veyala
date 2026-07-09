import { z } from "zod";

/**
 * Template definition — the JSON contract stored in Template.definition.
 * Both rendering engines (HTML/PDF and DOCX) know how to interpret it,
 * and the fingerprint for duplicate detection is derived from it.
 */

export const SECTION_IDS = [
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "interests",
] as const;

export const sectionIdSchema = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof sectionIdSchema>;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex attendue (#rrggbb)");

export const templateDefinitionSchema = z.object({
  layout: z.enum(["sidebar-left", "single-column"]),
  colors: z.object({
    /** Gradient stops (top to bottom) for the sidebar; single entry = solid fill. */
    sidebar: z.array(hexColor).min(1).max(6).default(["#1f3550"]),
    sidebarText: hexColor.default("#ffffff"),
    /** Section title bands in the main column. */
    band: hexColor.default("#56a8dc"),
    bandText: hexColor.default("#ffffff"),
    heading: hexColor.default("#1f3550"),
    body: hexColor.default("#555555"),
    link: hexColor.default("#2563eb"),
  }),
  fonts: z.object({
    heading: z.string().default("Century Gothic"),
    body: z.string().default("Century Gothic"),
  }),
  /** Show the photo (when the CV provides one). */
  photo: z.boolean().default(false),
  /** Skill rendering: "bricks" (chips), "list" (bullets) or "inline" (dot-separated). */
  skillsStyle: z.enum(["bricks", "list", "inline"]).default("inline"),
  /** Sections shown in the sidebar (sidebar-left layout only), in order. */
  sidebarSections: z.array(sectionIdSchema).default([]),
  /** Sections of the main column, in order. */
  mainSections: z.array(sectionIdSchema).min(1),
  /** Optional decorative asset (repo-relative) used by the DOCX engine for gradients. */
  sidebarImageAsset: z.string().optional(),
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;

export function parseTemplateDefinition(data: unknown): TemplateDefinition {
  return templateDefinitionSchema.parse(data);
}
