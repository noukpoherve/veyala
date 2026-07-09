import "server-only";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { debitCredits, creditCredits, InsufficientCreditsError } from "@/lib/credits";
import { fetchJobText, tailorCV } from "@/lib/tailor";
import { writeCoverLetter } from "@/lib/cover-letter";
import { parseTemplateDefinition, type TemplateDefinition } from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { htmlToPdf } from "@/lib/pdf";
import { renderCVDocx } from "@/lib/docx";
import { renderCoverLetterDocx } from "@/lib/docx/letter";
import { saveFile } from "@/lib/storage";

export interface GenerateParams {
  userId: string;
  jobUrl?: string;
  jobText?: string;
  templateId?: string;
  targetTitle?: string;
  instructions?: string;
  language?: string;
}

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "offre"
  );
}

/** Resolves the template to use: requested one (if allowed) or the default official. */
async function resolveTemplate(userId: string, templateId?: string) {
  if (templateId) {
    const template = await db.template.findUnique({ where: { id: templateId } });
    const allowed =
      template &&
      (template.ownerId === userId || (template.isPublic && template.status === "APPROVED"));
    if (!allowed) throw new GenerationError("Template introuvable ou non autorisé.", 404);
    return template;
  }
  const fallback = await db.template.findFirst({
    where: { isPublic: true, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) throw new GenerationError("Aucun template disponible.", 500);
  return fallback;
}

export interface ExportUrls {
  docxUrl: string;
  pdfUrl: string;
  coverLetterDocxUrl: string;
  coverLetterPdfUrl: string;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Renders and stores the four exports (CV + cover letter, DOCX + PDF). */
export async function renderAndStoreExports(params: {
  userId: string;
  cv: CVData;
  letterBody: string;
  jobTitle: string;
  definition: TemplateDefinition;
}): Promise<ExportUrls> {
  const { userId, cv, letterBody, jobTitle, definition } = params;
  const letter = { body: letterBody, jobTitle };

  const [cvPdf, cvDocx, letterPdf, letterDocx] = await Promise.all([
    htmlToPdf(renderCVHtml(cv, definition)),
    renderCVDocx(cv, definition),
    htmlToPdf(renderCoverLetterHtml(cv, letter, definition)),
    renderCoverLetterDocx(cv, letter, definition),
  ]);

  const base = `${slugify(cv.identity.fullName)}_${slugify(jobTitle)}`;
  const dir = `exports/${userId}`;
  const [pdfFile, docxFile, letterPdfFile, letterDocxFile] = await Promise.all([
    saveFile(cvPdf, { dir, filename: `CV_${base}.pdf`, contentType: "application/pdf" }),
    saveFile(cvDocx, { dir, filename: `CV_${base}.docx`, contentType: DOCX_MIME }),
    saveFile(letterPdf, { dir, filename: `LM_${base}.pdf`, contentType: "application/pdf" }),
    saveFile(letterDocx, { dir, filename: `LM_${base}.docx`, contentType: DOCX_MIME }),
  ]);

  return {
    pdfUrl: pdfFile.url,
    docxUrl: docxFile.url,
    coverLetterPdfUrl: letterPdfFile.url,
    coverLetterDocxUrl: letterDocxFile.url,
  };
}

/**
 * Full generation pipeline: job text → credit debit → LLM tailoring (CV +
 * cover letter) → DOCX + PDF rendering → storage → GeneratedCV record.
 * The credit is debited before the LLM call and refunded on any failure.
 */
export async function generateCV(params: GenerateParams) {
  const { userId } = params;

  const profile = await db.baseProfile.findUnique({ where: { userId } });
  const baseCV = profile ? cvSchema.safeParse(profile.data) : null;
  if (!baseCV?.success) {
    throw new GenerationError("Importez d'abord votre CV de base dans « Mon CV de base ».", 412);
  }

  const jobText = params.jobText?.trim()
    ? params.jobText.trim().slice(0, 12000)
    : await fetchJobText(params.jobUrl ?? "").catch((e) => {
        throw new GenerationError(e instanceof Error ? e.message : "Offre illisible.", 422);
      });
  if (!jobText || jobText.length < 100) {
    throw new GenerationError("L'offre est trop courte pour une adaptation fiable.", 422);
  }

  const template = await resolveTemplate(userId, params.templateId);
  const definition = parseTemplateDefinition(template.definition);

  try {
    await debitCredits(userId, 1, "GENERATION");
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      throw new GenerationError("Solde de crédits insuffisant : rechargez dans « Crédits ».", 402);
    }
    throw e;
  }

  try {
    const { cv, detectedTitle } = await tailorCV({
      baseCV: baseCV.data,
      jobText,
      targetTitle: params.targetTitle,
      instructions: params.instructions,
      language: params.language,
    });

    const letterBody = await writeCoverLetter({
      cv,
      jobText,
      jobTitle: detectedTitle,
      instructions: params.instructions,
      language: params.language,
    });

    const urls = await renderAndStoreExports({
      userId,
      cv,
      letterBody,
      jobTitle: detectedTitle,
      definition,
    });

    return await db.generatedCV.create({
      data: {
        userId,
        templateId: template.id,
        jobTitle: detectedTitle,
        jobSource: params.jobUrl ?? "texte collé",
        jobText,
        jobTextHash: createHash("sha256").update(jobText).digest("hex"),
        tailoredData: cv,
        coverLetter: letterBody,
        ...urls,
      },
    });
  } catch (e) {
    // Generation failed after debit: give the credit back.
    await creditCredits(userId, 1, "REFUND").catch(() => {});
    if (e instanceof GenerationError) throw e;
    throw new GenerationError(e instanceof Error ? e.message : "La génération a échoué.", 502);
  }
}
