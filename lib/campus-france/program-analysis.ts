import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { chatJSON } from "@/lib/llm";
import { normalizeTerm } from "@/lib/match-score";

export interface FormationRequirements {
  title: string;
  domain: string;
  level: string;
  prerequisites: string[];
  objectives: string[];
  targetSkills: string[];
  outcomes: string[];
  selectionCriteria: string[];
}

const formationSchema = z.object({
  title: z.string().default(""),
  domain: z.string().default(""),
  level: z.string().default(""),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  targetSkills: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  selectionCriteria: z.array(z.string()).default([]),
});

export function hashProgramText(programText: string): string {
  return createHash("sha256").update(programText).digest("hex");
}

const EXTRACT_SYSTEM = `Tu extrais une checklist de critères d'une fiche de formation (Campus France / université) pour évaluer la cohérence d'un dossier.
Réponds UNIQUEMENT avec un JSON valide :
{"title":"intitulé","domain":"domaine","level":"niveau","prerequisites":["…"],"objectives":["…"],"targetSkills":["…"],"outcomes":["…"],"selectionCriteria":["…"]}
Règles :
- prerequisites : 3 à 10 prérequis académiques / linguistiques / techniques (termes courts).
- objectives : 3 à 10 objectifs pédagogiques de la formation.
- targetSkills : 3 à 12 compétences visées / acquis attendus.
- outcomes : 2 à 8 débouchés / métiers / secteurs.
- selectionCriteria : 2 à 8 critères de sélection du jury (motivation, cohérence, niveau…).
- Pas de phrases longues : 1 à 8 mots max par terme.
- N'invente rien qui n'est pas dans la fiche.`;

function cleanList(xs: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of xs) {
    const t = raw.trim();
    const n = normalizeTerm(t);
    if (!n || n.length < 2 || seen.has(n)) continue;
    seen.add(n);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function toRequirements(row: {
  title: string;
  domain: string;
  level: string;
  prerequisites: string[];
  objectives: string[];
  targetSkills: string[];
  outcomes: string[];
  selectionCriteria: string[];
}): FormationRequirements {
  return {
    title: row.title,
    domain: row.domain,
    level: row.level,
    prerequisites: row.prerequisites,
    objectives: row.objectives,
    targetSkills: row.targetSkills,
    outcomes: row.outcomes,
    selectionCriteria: row.selectionCriteria,
  };
}

async function extractWithLlm(programText: string): Promise<FormationRequirements> {
  const raw = await chatJSON<unknown>({
    system: EXTRACT_SYSTEM,
    user: `FICHE DE FORMATION :\n${programText.slice(0, 8000)}`,
    maxTokens: 1000,
    temperature: 0.1,
  });
  const parsed = formationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Extraction de formation invalide.");
  }
  return {
    title: parsed.data.title.trim().slice(0, 160),
    domain: parsed.data.domain.trim().slice(0, 120),
    level: parsed.data.level.trim().slice(0, 80),
    prerequisites: cleanList(parsed.data.prerequisites, 12),
    objectives: cleanList(parsed.data.objectives, 12),
    targetSkills: cleanList(parsed.data.targetSkills, 14),
    outcomes: cleanList(parsed.data.outcomes, 10),
    selectionCriteria: cleanList(parsed.data.selectionCriteria, 10),
  };
}

/** Heuristic fallback when LLM extract fails or returns almost nothing. */
export function extractFormationHeuristic(programText: string): FormationRequirements {
  const text = programText.slice(0, 6000);
  // Cheerio often collapses the page into one long line — split on punctuation
  // and also on spaces for keyword windows.
  const chunks = text
    .split(/[\n.;•●–—|]+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 8 && l.length <= 120);

  const keywords = [
    "prérequis",
    "admission",
    "objectif",
    "compétence",
    "débouché",
    "métier",
    "master",
    "mastère",
    "licence",
    "diplôme",
    "rncp",
    "alternance",
    "devops",
    "développement",
  ];
  const picked = chunks
    .filter((l) => keywords.some((k) => normalizeTerm(l).includes(normalizeTerm(k))))
    .slice(0, 10);

  const titleMatch =
    text.match(/\b(Mast[eè]re|Master|Licence|Bachelor|MBA|Titre)\b[^.]{0,80}/i)?.[0]?.trim() ??
    "Formation";

  const generic = picked.length
    ? picked.map((l) => l.split(/\s+/).slice(0, 8).join(" "))
    : chunks.slice(0, 6).map((l) => l.split(/\s+/).slice(0, 6).join(" "));

  return {
    title: titleMatch.slice(0, 160),
    domain: /ia|intelligence artificielle|devops|informatique|software/i.test(text)
      ? "Informatique / numérique"
      : "",
    level: /rncp\s*39765|niveau\s*7|bac\s*\+?\s*5|mast[eè]re/i.test(text) ? "Bac+5 / niveau 7" : "",
    prerequisites: generic.slice(0, 4),
    objectives: generic.slice(0, 4),
    targetSkills: generic.slice(0, 5),
    outcomes: generic.slice(0, 3),
    selectionCriteria: ["motivation", "cohérence du parcours", "projet professionnel"],
  };
}

function totalCriteria(r: FormationRequirements): number {
  return (
    r.prerequisites.length +
    r.objectives.length +
    r.targetSkills.length +
    r.outcomes.length +
    r.selectionCriteria.length
  );
}

export interface ResolvedFormationAnalysis {
  hash: string;
  requirements: FormationRequirements;
  source: "llm" | "heuristic" | "cache";
  cached: boolean;
}

/**
 * Returns cached formation checklist, or extracts once (LLM + heuristic fallback)
 * and persists it for all future Campus France matching.
 */
export async function getOrCreateFormationAnalysis(
  programText: string
): Promise<ResolvedFormationAnalysis> {
  const hash = hashProgramText(programText);
  const existing = await db.formationAnalysis.findUnique({
    where: { programTextHash: hash },
  });
  if (existing) {
    return {
      hash,
      requirements: toRequirements(existing),
      source: "cache",
      cached: true,
    };
  }

  let requirements: FormationRequirements;
  let source: "llm" | "heuristic" = "llm";
  try {
    requirements = await extractWithLlm(programText);
    if (totalCriteria(requirements) < 3) {
      requirements = extractFormationHeuristic(programText);
      source = "heuristic";
    }
  } catch {
    requirements = extractFormationHeuristic(programText);
    source = "heuristic";
  }

  const row = await db.formationAnalysis
    .create({
      data: {
        programTextHash: hash,
        title: requirements.title.slice(0, 160),
        domain: requirements.domain.slice(0, 120),
        level: requirements.level.slice(0, 80),
        prerequisites: cleanList(requirements.prerequisites, 12),
        objectives: cleanList(requirements.objectives, 12),
        targetSkills: cleanList(requirements.targetSkills, 14),
        outcomes: cleanList(requirements.outcomes, 10),
        selectionCriteria: cleanList(requirements.selectionCriteria, 10),
        source,
      },
    })
    .catch(async (err: unknown) => {
      // Concurrent first-time extract for the same hash.
      const existingAfter = await db.formationAnalysis.findUnique({
        where: { programTextHash: hash },
      });
      if (existingAfter) return existingAfter;
      throw err;
    });

  return {
    hash,
    requirements: toRequirements(row),
    source,
    cached: false,
  };
}
