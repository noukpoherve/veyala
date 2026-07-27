import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { chatJSON } from "@/lib/llm";
import type { JobRequirements } from "@/lib/match-score";
import { normalizeTerm } from "@/lib/match-score";
import { extractRequirementsHeuristic } from "@/lib/job-requirements";
import { matchSoftSkillLabel } from "@/lib/soft-skills";

const requirementsSchema = z.object({
  title: z.string().default(""),
  mustHave: z.array(z.string()).default([]),
  niceHave: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
});

export function hashJobText(jobText: string): string {
  return createHash("sha256").update(jobText).digest("hex");
}

const EXTRACT_SYSTEM = `Tu extrais une checklist d'exigences d'une offre d'emploi pour un matching ATS.
Réponds UNIQUEMENT avec un JSON valide :
{"title":"intitulé","mustHave":["…"],"niceHave":["…"],"tools":["…"],"softSkills":["…"]}
Règles :
- mustHave : 5 à 12 compétences / expériences techniques vraiment exigées (courtes, atomiques).
- niceHave : 0 à 8 atouts appréciés (hors soft skills).
- tools : outils / stacks techniques (sans doublon avec mustHave si possible).
- softSkills : savoir-être (Communication, Autonomie, Esprit d'équipe…). 0 à 8 max.
- Pas de phrases longues : termes de 1 à 5 mots max.
- N'invente rien qui n'est pas dans l'offre.`;

function normalizeSoftList(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const mapped = matchSoftSkillLabel(item) ?? item.trim();
    const n = normalizeTerm(mapped);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(mapped);
  }
  return out.slice(0, 10);
}

async function extractWithLlm(jobText: string): Promise<JobRequirements> {
  const raw = await chatJSON<unknown>({
    system: EXTRACT_SYSTEM,
    user: `OFFRE :\n${jobText.slice(0, 8000)}`,
    maxTokens: 900,
    temperature: 0.1,
  });
  const parsed = requirementsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Extraction d'exigences invalide.");
  }
  return {
    title: parsed.data.title.trim(),
    mustHave: parsed.data.mustHave
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 16),
    niceHave: parsed.data.niceHave
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12),
    tools: parsed.data.tools
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12),
    softSkills: normalizeSoftList(parsed.data.softSkills),
  };
}

function toRequirements(row: {
  title: string;
  mustHave: string[];
  niceHave: string[];
  tools: string[];
  softSkills?: string[];
}): JobRequirements {
  return {
    title: row.title,
    mustHave: row.mustHave,
    niceHave: row.niceHave,
    tools: row.tools,
    softSkills: row.softSkills ?? [],
  };
}

export interface ResolvedJobAnalysis {
  hash: string;
  requirements: JobRequirements;
  source: "llm" | "heuristic" | "cache";
  cached: boolean;
}

/**
 * Returns cached checklist for this job text, or extracts once (LLM with
 * heuristic fallback) and persists it for all future matching.
 */
export async function getOrCreateJobAnalysis(jobText: string): Promise<ResolvedJobAnalysis> {
  const hash = hashJobText(jobText);
  const existing = await db.jobAnalysis.findUnique({ where: { jobTextHash: hash } });
  if (existing) {
    return {
      hash,
      requirements: toRequirements(existing),
      source: "cache",
      cached: true,
    };
  }

  let requirements: JobRequirements;
  let source: "llm" | "heuristic" = "llm";
  try {
    requirements = await extractWithLlm(jobText);
    const total =
      requirements.mustHave.length +
      requirements.niceHave.length +
      requirements.tools.length +
      requirements.softSkills.length;
    if (total < 2) {
      requirements = extractRequirementsHeuristic(jobText);
      source = "heuristic";
    }
  } catch {
    requirements = extractRequirementsHeuristic(jobText);
    source = "heuristic";
  }

  const clean = (xs: string[]) =>
    Array.from(new Set(xs.map((t) => t.trim()).filter((t) => normalizeTerm(t).length >= 2)));

  const row = await db.jobAnalysis.create({
    data: {
      jobTextHash: hash,
      title: requirements.title.slice(0, 160),
      mustHave: clean(requirements.mustHave).slice(0, 16),
      niceHave: clean(requirements.niceHave).slice(0, 12),
      tools: clean(requirements.tools).slice(0, 12),
      softSkills: normalizeSoftList(requirements.softSkills),
      source,
    },
  });

  return {
    hash,
    requirements: toRequirements(row),
    source,
    cached: false,
  };
}
