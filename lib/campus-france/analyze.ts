import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { fetchJobText } from "@/lib/tailor";
import { getOrCreateFormationAnalysis } from "@/lib/campus-france/program-analysis";
import type { FormationRequirements } from "@/lib/campus-france/program-analysis";
import { proposeCampusFranceProjects } from "@/lib/campus-france/propose-projects";
import {
  listCoherenceGaps,
  scoreCampusFranceCoherence,
  type CoherenceItem,
  type CoherenceResult,
} from "@/lib/campus-france/coherence-score";

export class CampusFranceAnalyzeError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "CampusFranceAnalyzeError";
  }
}

export interface AnalyzeCampusFranceInput {
  userId: string;
  programUrl?: string;
  programText?: string;
  /** When omitted, the system proposes drafts from CV + formation. */
  studyProject?: string;
  professionalProject?: string;
  language?: string;
}

export interface AnalyzeCampusFranceResult {
  programText: string;
  programTextHash: string;
  requirements: FormationRequirements;
  cachedAnalysis: boolean;
  /** True when the system generated the project drafts. */
  projectsProposed: boolean;
  studyProject: string;
  professionalProject: string;
  before: CoherenceResult;
  gaps: CoherenceItem[];
}

const getBaseCv = cache(async (userId: string): Promise<CVData> => {
  const profile = await db.baseProfile.findUnique({ where: { userId } });
  const parsed = profile ? cvSchema.safeParse(profile.data) : null;
  if (!parsed?.success) {
    throw new CampusFranceAnalyzeError(
      "Importez d'abord votre CV de base dans « Mon CV de base ».",
      412
    );
  }
  return { ...parsed.data, softSkills: parsed.data.softSkills ?? [] };
});

async function resolveProgramText(input: AnalyzeCampusFranceInput): Promise<string> {
  const pasted = input.programText?.trim();
  if (pasted) return pasted.slice(0, 12000);
  if (!input.programUrl) {
    throw new CampusFranceAnalyzeError(
      "Fournissez l'URL de la formation ou collez son texte.",
      400
    );
  }
  try {
    return await fetchJobText(input.programUrl);
  } catch (e) {
    throw new CampusFranceAnalyzeError(
      e instanceof Error ? e.message.replace(/offre/gi, "formation") : "Fiche illisible.",
      422
    );
  }
}

/**
 * Free Campus France analysis (no credit debit):
 * extract formation criteria → propose or reuse projects → coherence score.
 */
export async function analyzeCampusFrance(
  input: AnalyzeCampusFranceInput
): Promise<AnalyzeCampusFranceResult> {
  const baseCV = await getBaseCv(input.userId);
  const programText = await resolveProgramText(input);
  if (programText.length < 100) {
    throw new CampusFranceAnalyzeError(
      "La fiche de formation est trop courte pour une analyse fiable. Collez le texte de la page.",
      422
    );
  }

  let analysis: Awaited<ReturnType<typeof getOrCreateFormationAnalysis>>;
  try {
    analysis = await getOrCreateFormationAnalysis(programText);
  } catch (e) {
    console.error("[campus-france] formation analysis failed", e);
    const detail = e instanceof Error ? e.message : "";
    // Stale Prisma client after schema change (dev HMR) is the usual culprit.
    if (/formationAnalysis|undefined|is not a function/i.test(detail)) {
      throw new CampusFranceAnalyzeError(
        "Le serveur doit être redémarré après la mise à jour Campus France (client base de données obsolète). Relancez `npm run dev` puis réessayez.",
        503
      );
    }
    throw new CampusFranceAnalyzeError(
      "Impossible d'extraire les critères de la formation. Réessayez ou collez le texte.",
      502
    );
  }

  const providedStudy = input.studyProject?.trim();
  const providedPro = input.professionalProject?.trim();
  let studyProject: string;
  let professionalProject: string;
  let projectsProposed = false;

  if (providedStudy && providedPro) {
    studyProject = providedStudy;
    professionalProject = providedPro;
  } else {
    const proposed = await proposeCampusFranceProjects({
      cv: baseCV,
      programText,
      requirements: analysis.requirements,
      language: input.language,
    });
    studyProject = proposed.studyProject;
    professionalProject = proposed.professionalProject;
    projectsProposed = true;
  }

  const before = scoreCampusFranceCoherence({
    cv: baseCV,
    studyProject,
    professionalProject,
    requirements: analysis.requirements,
  });
  const gaps = listCoherenceGaps(before);

  return {
    programText,
    programTextHash: analysis.hash,
    requirements: analysis.requirements,
    cachedAnalysis: analysis.cached,
    projectsProposed,
    studyProject,
    professionalProject,
    before,
    gaps,
  };
}
