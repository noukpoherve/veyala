import { z } from "zod";
import {
  validateCvLanguage,
  validateInstructions,
  validateJobText,
  validateJobTitle,
} from "@/lib/job-field-validation";
import { matchClaimSchema } from "@/lib/match-score";

/** Shared Zod refinements for analyze + generate job options. */
export const jobOfferOptionsSchema = z
  .object({
    jobUrl: z.string().url("URL d'offre invalide.").optional(),
    jobText: z.string().max(20000).optional(),
    templateId: z.string().optional(),
    targetTitle: z.string().max(120).optional(),
    instructions: z.string().max(1000).optional(),
    language: z.string().max(40).optional(),
    claims: z.array(matchClaimSchema).max(40).optional(),
    idempotencyKey: z.string().uuid().optional(),
  })
  .superRefine((b, ctx) => {
    if (!b.jobUrl && !b.jobText?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Fournissez l'URL de l'offre ou collez son texte.",
        path: ["jobText"],
      });
    }
    const titleErr = validateJobTitle(b.targetTitle);
    if (titleErr) {
      ctx.addIssue({ code: "custom", message: titleErr, path: ["targetTitle"] });
    }
    const langErr = validateCvLanguage(b.language);
    if (langErr) {
      ctx.addIssue({ code: "custom", message: langErr, path: ["language"] });
    }
    const instructionsErr = validateInstructions(b.instructions);
    if (instructionsErr) {
      ctx.addIssue({ code: "custom", message: instructionsErr, path: ["instructions"] });
    }
    if (b.jobText?.trim()) {
      const textErr = validateJobText(b.jobText);
      if (textErr) {
        ctx.addIssue({ code: "custom", message: textErr, path: ["jobText"] });
      }
    }
  });

export type JobOfferOptions = z.infer<typeof jobOfferOptionsSchema>;
