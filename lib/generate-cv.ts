import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { debitCredits, creditCreditsWithRetry, InsufficientCreditsError } from "@/lib/credits";
import { fetchJobText, tailorCV } from "@/lib/tailor";
import { writeCoverLetter } from "@/lib/cover-letter";
import {
  parseTemplateDefinition,
  resolveDefinition,
  type TemplateDefinition,
} from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { htmlToPdf } from "@/lib/pdf";
import { renderCVDocx } from "@/lib/docx";
import { renderCoverLetterDocx } from "@/lib/docx/letter";
import { saveFile } from "@/lib/storage";
import { exportFilename } from "@/lib/export-filename";
import type { Locale } from "@/i18n/config";
import { isEnglishGeneration } from "@/lib/generation-locale";
import { getOrCreateJobAnalysis } from "@/lib/job-analysis";
import {
  scoreCvAgainstJob,
  applyClaimsToCv,
  finalizeTailoredCv,
  type MatchClaim,
  type MatchResult,
} from "@/lib/match-score";

export interface GenerateParams {
  userId: string;
  jobUrl?: string;
  jobText?: string;
  templateId?: string;
  targetTitle?: string;
  instructions?: string;
  language?: string;
  /** Gaps the user explicitly chose to add for this generation. */
  claims?: MatchClaim[];
  /**
   * Client-stable key (UUID) so retries / double-submit return the same CV
   * instead of debiting twice after a successful run.
   */
  idempotencyKey?: string;
}

/** Pipeline steps surfaced to the client progress UI. */
export type GenerateStep =
  | "reading_offer"
  | "analyzing_requirements"
  | "scoring_before"
  | "adapting_cv"
  | "writing_letter"
  | "rendering_exports"
  | "scoring_after"
  | "done";

export type GenerateProgress =
  | { step: GenerateStep; message: string }
  | {
      step: "score";
      phase: "before" | "after";
      score: number;
      covered: number;
      total: number;
    };

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GenerationError";
  }
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
  locale?: Locale;
}): Promise<ExportUrls> {
  const { userId, cv, letterBody, jobTitle, definition, locale = "fr" } = params;
  const letter = { body: letterBody, jobTitle };

  // The two PDFs share one single-process Chromium; rendering them concurrently
  // doubles peak memory and OOM-crashes the serverless function ("Target page
  // has been closed"). Serialize the PDF renders (cap browser concurrency at 1)
  // while keeping the browser-less DOCX renders in flight alongside them.
  const cvDocxPromise = renderCVDocx(cv, definition, locale);
  const letterDocxPromise = renderCoverLetterDocx(cv, letter, definition, locale);
  const cvPdf = await htmlToPdf(renderCVHtml(cv, definition, locale));
  const letterPdf = await htmlToPdf(renderCoverLetterHtml(cv, letter, definition, locale));
  const [cvDocx, letterDocx] = await Promise.all([cvDocxPromise, letterDocxPromise]);

  const dir = `exports/${userId}`;
  const [pdfFile, docxFile, letterPdfFile, letterDocxFile] = await Promise.all([
    saveFile(cvPdf, {
      dir,
      filename: exportFilename("cv", cv.identity.fullName, "pdf"),
      contentType: "application/pdf",
    }),
    saveFile(cvDocx, {
      dir,
      filename: exportFilename("cv", cv.identity.fullName, "docx"),
      contentType: DOCX_MIME,
    }),
    saveFile(letterPdf, {
      dir,
      filename: exportFilename("letter", cv.identity.fullName, "pdf"),
      contentType: "application/pdf",
    }),
    saveFile(letterDocx, {
      dir,
      filename: exportFilename("letter", cv.identity.fullName, "docx"),
      contentType: DOCX_MIME,
    }),
  ]);

  return {
    pdfUrl: pdfFile.url,
    docxUrl: docxFile.url,
    coverLetterPdfUrl: letterPdfFile.url,
    coverLetterDocxUrl: letterDocxFile.url,
  };
}

async function refundGenerationCredit(userId: string, attemptId: string): Promise<void> {
  await creditCreditsWithRetry(userId, 1, "REFUND", attemptId, {
    retries: 3,
    label: "generate-refund",
  });
}

function breakdownPayload(before: MatchResult, after: MatchResult) {
  return {
    before: {
      score: before.score,
      covered: before.covered,
      total: before.total,
      items: before.items,
    },
    after: {
      score: after.score,
      covered: after.covered,
      total: after.total,
      items: after.items,
    },
  };
}

/**
 * Full generation pipeline: job text → credit debit → checklist (cached) →
 * score before → LLM tailor + letter → exports → score after → GeneratedCV.
 * The credit is debited before the LLM work and refunded on any failure.
 */
export async function generateCV(
  params: GenerateParams,
  opts?: {
    onProgress?: (event: GenerateProgress) => void;
    /** When set (async jobs), reuse this credit ledger ref instead of minting a new one. */
    attemptIdOverride?: string;
  }
) {
  const { userId } = params;
  const emit = opts?.onProgress ?? (() => {});
  const idempotencyKey = params.idempotencyKey?.trim().slice(0, 64) || undefined;
  const attemptId =
    opts?.attemptIdOverride ||
    (idempotencyKey ? `gen_${idempotencyKey}` : `gen_${userId}_${Date.now()}`);

  if (idempotencyKey) {
    const existing = await db.generatedCV.findFirst({
      where: { userId, idempotencyKey },
    });
    if (existing) {
      emit({ step: "done", message: "Terminé (requête déjà traitée)." });
      return existing;
    }
  }

  const profile = await db.baseProfile.findUnique({ where: { userId } });
  const baseCV = profile ? cvSchema.safeParse(profile.data) : null;
  if (!baseCV?.success) {
    throw new GenerationError("Importez d'abord votre CV de base dans « Mon CV de base ».", 412);
  }

  emit({ step: "reading_offer", message: "Lecture de l'offre…" });
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
    await debitCredits(userId, 1, "GENERATION", attemptId);
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      throw new GenerationError("Solde de crédits insuffisant : rechargez dans « Crédits ».", 402);
    }
    throw e;
  }

  try {
    emit({
      step: "analyzing_requirements",
      message: "Analyse des exigences de l'offre…",
    });
    const analysis = await getOrCreateJobAnalysis(jobText);
    if (analysis.cached) {
      emit({
        step: "analyzing_requirements",
        message: "Exigences déjà connues (cache), 0 token.",
      });
    }

    emit({ step: "scoring_before", message: "Calcul du matching initial…" });
    const profileCv = {
      ...baseCV.data,
      softSkills: baseCV.data.softSkills ?? [],
    };
    const before = scoreCvAgainstJob(profileCv, analysis.requirements);
    emit({
      step: "score",
      phase: "before",
      score: before.score,
      covered: before.covered,
      total: before.total,
    });

    // User-claimed gaps for this generation only (explicit consent, 0 tokens).
    const enrichedBase = applyClaimsToCv(profileCv, params.claims ?? []);

    emit({ step: "adapting_cv", message: "Adaptation ATS du CV…" });
    const tailored = await tailorCV({
      baseCV: enrichedBase,
      jobText,
      targetTitle: params.targetTitle || analysis.requirements.title || undefined,
      instructions: params.instructions,
      language: params.language,
      mustHave: analysis.requirements.mustHave,
      niceHave: analysis.requirements.niceHave,
      tools: analysis.requirements.tools,
    });
    // Union profile + claimed soft skills with the LLM output so a non-empty
    // model list cannot drop what the candidate already selected.
    const cv = finalizeTailoredCv(tailored.cv, enrichedBase, analysis.requirements);
    const { detectedTitle } = tailored;

    emit({ step: "writing_letter", message: "Rédaction de la lettre de motivation…" });
    const letterBody = await writeCoverLetter({
      cv,
      jobText,
      jobTitle: detectedTitle,
      instructions: params.instructions,
      language: params.language,
    });

    emit({ step: "rendering_exports", message: "Génération PDF et Word…" });
    const urls = await renderAndStoreExports({
      userId,
      cv,
      letterBody,
      jobTitle: detectedTitle,
      definition: resolveDefinition(definition, { photoUrl: cv.identity.photoUrl }),
      locale: isEnglishGeneration(params.language) ? "en" : "fr",
    });

    emit({ step: "scoring_after", message: "Recalcul du matching optimisé…" });
    const after = scoreCvAgainstJob(cv, analysis.requirements);
    emit({
      step: "score",
      phase: "after",
      score: after.score,
      covered: after.covered,
      total: after.total,
    });

    const record = await db.generatedCV.create({
      data: {
        userId,
        templateId: template.id,
        jobTitle: detectedTitle,
        jobSource: params.jobUrl ?? "texte collé",
        jobText,
        jobTextHash: analysis.hash,
        tailoredData: cv,
        coverLetter: letterBody,
        matchScoreBefore: before.score,
        matchScoreAfter: after.score,
        matchBreakdown: breakdownPayload(before, after) as unknown as Prisma.InputJsonValue,
        idempotencyKey,
        ...urls,
      },
    });

    emit({ step: "done", message: "Terminé." });
    return record;
  } catch (e) {
    await refundGenerationCredit(userId, attemptId);
    if (e instanceof GenerationError) throw e;
    throw new GenerationError(e instanceof Error ? e.message : "La génération a échoué.", 502);
  }
}
