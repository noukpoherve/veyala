import { z } from "zod";
import {
  validateCvLanguage,
  validateInstructions,
  validateJobText,
} from "@/lib/job-field-validation";

export const PROJECT_MIN = 80;
export const PROJECT_MAX = 4000;

export function validateProjectText(raw: string | undefined, label: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return `${label} est requis.`;
  if (value.length < PROJECT_MIN) {
    return `${label} est trop court (minimum ${PROJECT_MIN} caractères).`;
  }
  if (value.length > PROJECT_MAX) {
    return `${label} est trop long (maximum ${PROJECT_MAX} caractères).`;
  }
  return null;
}

const programFields = {
  programUrl: z.string().url("URL de formation invalide.").optional(),
  programText: z.string().max(20000).optional(),
  instructions: z.string().max(1000).optional(),
  language: z.string().max(40).optional(),
};

function refineProgramAndOptions(
  b: {
    programUrl?: string;
    programText?: string;
    instructions?: string;
    language?: string;
  },
  ctx: z.RefinementCtx
) {
  if (!b.programUrl && !b.programText?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Fournissez l'URL de la formation ou collez son texte.",
      path: ["programText"],
    });
  }
  const langErr = validateCvLanguage(b.language);
  if (langErr) {
    ctx.addIssue({ code: "custom", message: langErr, path: ["language"] });
  }
  const instructionsErr = validateInstructions(b.instructions);
  if (instructionsErr) {
    ctx.addIssue({ code: "custom", message: instructionsErr, path: ["instructions"] });
  }
  if (b.programText?.trim()) {
    const textErr = validateJobText(b.programText);
    if (textErr) {
      ctx.addIssue({
        code: "custom",
        message: textErr.replace("l'offre", "la formation").replace("offre", "formation"),
        path: ["programText"],
      });
    }
  }
}

/**
 * Analyze body: formation required; projects optional.
 * - Without projects → system proposes them from CV + formation.
 * - With projects → rescore the user's edited drafts.
 */
export const campusFranceAnalyzeSchema = z
  .object({
    ...programFields,
    studyProject: z.string().max(PROJECT_MAX).optional(),
    professionalProject: z.string().max(PROJECT_MAX).optional(),
  })
  .superRefine((b, ctx) => {
    refineProgramAndOptions(b, ctx);
    const hasStudy = Boolean(b.studyProject?.trim());
    const hasPro = Boolean(b.professionalProject?.trim());
    if (hasStudy !== hasPro) {
      ctx.addIssue({
        code: "custom",
        message: "Fournissez les deux projets (études et professionnel) ou aucun.",
        path: ["studyProject"],
      });
    }
    if (hasStudy && hasPro) {
      const studyErr = validateProjectText(b.studyProject, "Le projet d'études");
      if (studyErr) {
        ctx.addIssue({ code: "custom", message: studyErr, path: ["studyProject"] });
      }
      const proErr = validateProjectText(b.professionalProject, "Le projet professionnel");
      if (proErr) {
        ctx.addIssue({
          code: "custom",
          message: proErr,
          path: ["professionalProject"],
        });
      }
    }
  });

export type CampusFranceAnalyzeInput = z.infer<typeof campusFranceAnalyzeSchema>;

/** Generate body: formation + validated projects required. */
export const campusFranceOptionsSchema = z
  .object({
    ...programFields,
    studyProject: z.string().min(1).max(PROJECT_MAX),
    professionalProject: z.string().min(1).max(PROJECT_MAX),
    templateId: z.string().optional(),
    idempotencyKey: z.string().uuid().optional(),
  })
  .superRefine((b, ctx) => {
    refineProgramAndOptions(b, ctx);
    const studyErr = validateProjectText(b.studyProject, "Le projet d'études");
    if (studyErr) {
      ctx.addIssue({ code: "custom", message: studyErr, path: ["studyProject"] });
    }
    const proErr = validateProjectText(b.professionalProject, "Le projet professionnel");
    if (proErr) {
      ctx.addIssue({
        code: "custom",
        message: proErr,
        path: ["professionalProject"],
      });
    }
  });

export type CampusFranceOptions = z.infer<typeof campusFranceOptionsSchema>;
