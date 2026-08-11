import type { CVData } from "@/lib/cv-schema";
import { cvCorpus, normalizeTerm } from "@/lib/match-score";
import type { FormationRequirements } from "@/lib/campus-france/program-analysis";

export type CoherenceStatus = "covered" | "partial" | "missing";

export type CoherenceKind = "prerequisite" | "objective" | "skill" | "outcome" | "selection";

export interface CoherenceItem {
  term: string;
  kind: CoherenceKind;
  status: CoherenceStatus;
}

export interface CoherenceResult {
  /** 0–100 */
  score: number;
  items: CoherenceItem[];
  covered: number;
  total: number;
}

const WEIGHTS: Record<CoherenceKind, number> = {
  prerequisite: 2,
  selection: 1.75,
  skill: 1.5,
  objective: 1.25,
  outcome: 1.25,
};

function matchStatus(term: string, corpus: string): CoherenceStatus {
  const n = normalizeTerm(term);
  if (!n) return "missing";
  if (corpus.includes(n)) return "covered";

  const tokens = n.split(" ").filter((t) => t.length >= 3);
  if (tokens.length >= 2 && tokens.every((t) => corpus.includes(t))) return "partial";
  if (tokens.length === 1 && tokens[0] && corpus.includes(tokens[0])) return "partial";
  return "missing";
}

function statusWeight(status: CoherenceStatus): number {
  if (status === "covered") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function dedupeTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const n = normalizeTerm(raw);
    if (!n || n.length < 2 || seen.has(n)) continue;
    seen.add(n);
    out.push(raw.trim());
  }
  return out;
}

/** Corpus = parcours CV + projet d'études + projet professionnel. */
export function campusFranceCorpus(
  cv: CVData,
  studyProject: string,
  professionalProject: string
): string {
  return normalizeTerm([cvCorpus(cv), studyProject, professionalProject].filter(Boolean).join(" "));
}

/**
 * Deterministic coherence score: formation criteria vs CV parcours + 2 projects.
 */
export function scoreCampusFranceCoherence(params: {
  cv: CVData;
  studyProject: string;
  professionalProject: string;
  requirements: FormationRequirements;
}): CoherenceResult {
  const corpus = campusFranceCorpus(params.cv, params.studyProject, params.professionalProject);
  const r = params.requirements;

  const items: CoherenceItem[] = [
    ...dedupeTerms(r.prerequisites).map((term) => ({
      term,
      kind: "prerequisite" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(r.selectionCriteria).map((term) => ({
      term,
      kind: "selection" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(r.targetSkills).map((term) => ({
      term,
      kind: "skill" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(r.objectives).map((term) => ({
      term,
      kind: "objective" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(r.outcomes).map((term) => ({
      term,
      kind: "outcome" as const,
      status: matchStatus(term, corpus),
    })),
  ];

  if (items.length === 0) {
    return { score: 0, items: [], covered: 0, total: 0 };
  }

  let earned = 0;
  let possible = 0;
  for (const item of items) {
    const w = WEIGHTS[item.kind];
    possible += w;
    earned += w * statusWeight(item.status);
  }

  const score = Math.round((earned / possible) * 100);
  const covered = items.filter((i) => i.status === "covered" || i.status === "partial").length;

  return { score, items, covered, total: items.length };
}

export function listCoherenceGaps(result: CoherenceResult): CoherenceItem[] {
  return result.items.filter((i) => i.status === "missing");
}
