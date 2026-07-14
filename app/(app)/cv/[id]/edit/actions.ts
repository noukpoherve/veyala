"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import {
  applyStyleOverride,
  parseTemplateDefinition,
  styleOverrideSchema,
} from "@/lib/templates/definition";
import { renderAndStoreExports } from "@/lib/generate-cv";

const editSchema = z.object({
  cvId: z.string().min(1),
  templateId: z.string().min(1),
  styleOverride: styleOverrideSchema.optional(),
  data: cvSchema,
  coverLetter: z.string().max(8000),
});

export type SaveCvEditsResult =
  | {
      ok: true;
      pdfUrl: string;
      docxUrl: string;
      coverLetterPdfUrl: string;
      coverLetterDocxUrl: string;
    }
  | { ok: false; error: string };

/**
 * Saves editor changes: validates the CV data, re-renders the four exports
 * (CV + cover letter, DOCX + PDF) and updates the record. Editing is free —
 * no credit is debited.
 */
export async function saveCvEdits(input: unknown): Promise<SaveCvEditsResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Authentification requise." };

  const parsed = editSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides : le nom complet est obligatoire." };
  }
  const { cvId, templateId, styleOverride, data, coverLetter } = parsed.data;

  const cv = await db.generatedCV.findUnique({ where: { id: cvId } });
  if (!cv || cv.userId !== session.user.id) {
    return { ok: false, error: "CV introuvable." };
  }

  const template = await db.template.findUnique({ where: { id: templateId } });
  const allowed =
    template &&
    (template.ownerId === session.user.id || (template.isPublic && template.status === "APPROVED"));
  if (!allowed) return { ok: false, error: "Template non autorisé." };

  try {
    const urls = await renderAndStoreExports({
      userId: session.user.id,
      cv: data,
      letterBody: coverLetter,
      jobTitle: cv.jobTitle,
      definition: applyStyleOverride(parseTemplateDefinition(template.definition), styleOverride),
    });

    await db.generatedCV.update({
      where: { id: cvId },
      data: {
        tailoredData: data,
        coverLetter,
        template: { connect: { id: templateId } },
        styleOverride: styleOverride ?? Prisma.DbNull,
        ...urls,
      },
    });

    revalidatePath(`/cv/${cvId}`);
    return { ok: true, ...urls };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "L'enregistrement a échoué.",
    };
  }
}
