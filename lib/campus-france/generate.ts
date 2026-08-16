import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { cvSchema } from "@/lib/cv-schema";
import { debitCredits, creditCreditsWithRetry, InsufficientCreditsError } from "@/lib/credits";
import { fetchJobText } from "@/lib/tailor";
import {
  GenerationError,
  renderAndStoreExports,
  type GenerateProgress,
  type GenerateStep,
} from "@/lib/generate-cv";
import { parseTemplateDefinition, resolveDefinition } from "@/lib/templates/definition";
import { getOrCreateFormationAnalysis } from "@/lib/campus-france/program-analysis";
import { scoreCampusFranceCoherence } from "@/lib/campus-france/coherence-score";
import { writeCampusFranceMotivationLetter } from "@/lib/campus-france/motivation-letter";
import { tailorAcademicCv } from "@/lib/campus-france/tailor-academic-cv";

export interface CampusFranceGenerateParams {
  userId: string;
  programUrl?: string;
  programText?: string;
  studyProject: string;
  professionalProject: string;
  templateId?: string;
  instructions?: string;
  language?: string;
  idempotencyKey?: string;
}

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

async function refundGenerationCredit(userId: string, attemptId: string): Promise<void> {
  await creditCreditsWithRetry(userId, 1, "REFUND", attemptId, {
    retries: 3,
    label: "campus-france-refund",
  });
}

/** Map CF kinds onto employment MatchKind so /cv MatchReport can parse the breakdown. */
function toMatchKind(
  kind: "prerequisite" | "objective" | "skill" | "outcome" | "selection"
): "must" | "nice" | "tool" | "soft" {
  if (kind === "prerequisite" || kind === "selection") return "must";
  if (kind === "skill") return "tool";
  if (kind === "objective") return "nice";
  return "soft";
}

function breakdownPayload(
  before: ReturnType<typeof scoreCampusFranceCoherence>,
  after: ReturnType<typeof scoreCampusFranceCoherence>
) {
  const mapItems = (items: typeof before.items) =>
    items.map((i) => ({
      term: i.term,
      kind: toMatchKind(i.kind),
      status: i.status,
    }));
  return {
    before: {
      score: before.score,
      covered: before.covered,
      total: before.total,
      items: mapItems(before.items),
    },
    after: {
      score: after.score,
      covered: after.covered,
      total: after.total,
      items: mapItems(after.items),
    },
  };
}

/**
 * Campus France pipeline: formation text → debit → extract → coherence before →
 * motivation letter (primary) → academic CV → exports → coherence after.
 */
export async function generateCampusFranceDossier(
  params: CampusFranceGenerateParams,
  opts?: {
    onProgress?: (event: GenerateProgress) => void;
    attemptIdOverride?: string;
  }
) {
  const { userId } = params;
  const emit = opts?.onProgress ?? (() => {});
  const idempotencyKey = params.idempotencyKey?.trim().slice(0, 64) || undefined;
  const attemptId =
    opts?.attemptIdOverride ||
    (idempotencyKey ? `gen_${idempotencyKey}` : `gen_cf_${userId}_${Date.now()}`);

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

  emit({ step: "reading_offer", message: "Lecture de la fiche de formation…" });
  const programText = params.programText?.trim()
    ? params.programText.trim().slice(0, 12000)
    : await fetchJobText(params.programUrl ?? "").catch((e) => {
        throw new GenerationError(
          e instanceof Error ? e.message.replace(/offre/gi, "formation") : "Fiche illisible.",
          422
        );
      });
  if (!programText || programText.length < 100) {
    throw new GenerationError(
      "La fiche de formation est trop courte pour une adaptation fiable.",
      422
    );
  }

  const studyProject = params.studyProject.trim();
  const professionalProject = params.professionalProject.trim();
  if (studyProject.length < 80 || professionalProject.length < 80) {
    throw new GenerationError("Les projets d'études et professionnel sont requis.", 400);
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
      message: "Analyse des critères de la formation…",
    });
    const analysis = await getOrCreateFormationAnalysis(programText);
    if (analysis.cached) {
      emit({
        step: "analyzing_requirements",
        message: "Critères déjà connus (cache), 0 token.",
      });
    }

    const profileCv = {
      ...baseCV.data,
      softSkills: baseCV.data.softSkills ?? [],
    };

    emit({ step: "scoring_before", message: "Calcul de la cohérence initiale…" });
    const before = scoreCampusFranceCoherence({
      cv: profileCv,
      studyProject,
      professionalProject,
      requirements: analysis.requirements,
    });
    emit({
      step: "score",
      phase: "before",
      score: before.score,
      covered: before.covered,
      total: before.total,
    });

    // Letter first (primary Campus France deliverable), then academic CV.
    emit({ step: "writing_letter", message: "Rédaction de la lettre de motivation…" });
    const letterBody = await writeCampusFranceMotivationLetter({
      cv: profileCv,
      programText,
      programTitle: analysis.requirements.title || "Formation",
      studyProject,
      professionalProject,
      requirements: analysis.requirements,
      instructions: params.instructions,
      language: params.language,
    });

    emit({ step: "adapting_cv", message: "Adaptation du CV académique…" });
    const tailored = await tailorAcademicCv({
      baseCV: profileCv,
      programText,
      studyProject,
      professionalProject,
      requirements: analysis.requirements,
      instructions: params.instructions,
      language: params.language,
    });
    const { cv, detectedTitle } = tailored;

    emit({ step: "rendering_exports", message: "Génération PDF et Word…" });
    const urls = await renderAndStoreExports({
      userId,
      cv,
      letterBody,
      jobTitle: detectedTitle,
      definition: resolveDefinition(definition, { photoUrl: cv.identity.photoUrl }),
    });

    emit({ step: "scoring_after", message: "Recalcul de la cohérence…" });
    const after = scoreCampusFranceCoherence({
      cv,
      studyProject,
      professionalProject,
      requirements: analysis.requirements,
    });
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
        universe: "CAMPUS_FRANCE",
        jobTitle: detectedTitle,
        jobSource: params.programUrl ?? "texte collé",
        jobText: programText,
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

    emit({ step: "done" as GenerateStep, message: "Terminé." });
    return record;
  } catch (e) {
    await refundGenerationCredit(userId, attemptId);
    if (e instanceof GenerationError) throw e;
    throw new GenerationError(e instanceof Error ? e.message : "La génération a échoué.", 502);
  }
}
