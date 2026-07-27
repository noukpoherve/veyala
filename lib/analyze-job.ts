import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { fetchJobText } from "@/lib/tailor";
import { getOrCreateJobAnalysis } from "@/lib/job-analysis";
import {
  listMatchGaps,
  projectScoreWithClaims,
  scoreCvAgainstJob,
  type JobRequirements,
  type MatchClaim,
  type MatchItem,
  type MatchResult,
} from "@/lib/match-score";

export class AnalyzeError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

export interface AnalyzeJobInput {
  userId: string;
  jobUrl?: string;
  jobText?: string;
  /** Optional claims for projected score (defaults to none). */
  claims?: MatchClaim[];
}

export interface AnalyzeJobResult {
  jobText: string;
  jobTextHash: string;
  requirements: JobRequirements;
  cachedAnalysis: boolean;
  before: MatchResult;
  /** Score if the provided claims (or all gaps when claimAll) are applied. */
  projected: MatchResult;
  gaps: MatchItem[];
}

const getBaseCv = cache(async (userId: string): Promise<CVData> => {
  const profile = await db.baseProfile.findUnique({ where: { userId } });
  const parsed = profile ? cvSchema.safeParse(profile.data) : null;
  if (!parsed?.success) {
    throw new AnalyzeError("Importez d'abord votre CV de base dans « Mon CV de base ».", 412);
  }
  return { ...parsed.data, softSkills: parsed.data.softSkills ?? [] };
});

async function resolveJobText(input: AnalyzeJobInput): Promise<string> {
  const pasted = input.jobText?.trim();
  if (pasted) return pasted.slice(0, 12000);
  if (!input.jobUrl) {
    throw new AnalyzeError("Fournissez l'URL de l'offre ou collez son texte.", 400);
  }
  try {
    return await fetchJobText(input.jobUrl);
  } catch (e) {
    throw new AnalyzeError(e instanceof Error ? e.message : "Offre illisible.", 422);
  }
}

/**
 * Free matching analysis (no credit debit). LLM extract only on cache miss.
 */
export async function analyzeJobMatch(input: AnalyzeJobInput): Promise<AnalyzeJobResult> {
  const baseCV = await getBaseCv(input.userId);
  const jobText = await resolveJobText(input);
  if (jobText.length < 100) {
    throw new AnalyzeError("L'offre est trop courte pour une analyse fiable.", 422);
  }

  const analysis = await getOrCreateJobAnalysis(jobText);
  const before = scoreCvAgainstJob(baseCV, analysis.requirements);
  const gaps = listMatchGaps(before);
  const claims = input.claims?.length ? input.claims : [];
  const projected = projectScoreWithClaims(baseCV, analysis.requirements, claims);

  return {
    jobText,
    jobTextHash: analysis.hash,
    requirements: analysis.requirements,
    cachedAnalysis: analysis.cached,
    before,
    projected,
    gaps,
  };
}

/** Projected score when claiming every current gap (upper bound the user can reach). */
export function projectScoreIfAllGapsClaimed(
  cv: CVData,
  requirements: JobRequirements,
  gaps: MatchItem[]
): MatchResult {
  return projectScoreWithClaims(
    cv,
    requirements,
    gaps.map((g) => ({ term: g.term, kind: g.kind }))
  );
}
