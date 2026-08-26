import type { CVData } from "@/lib/cv-schema";
import { z } from "zod";

/** Structured job checklist used by the deterministic matcher. */
export interface JobRequirements {
  title: string;
  mustHave: string[];
  niceHave: string[];
  tools: string[];
  softSkills: string[];
}

export type MatchStatus = "covered" | "partial" | "missing";

export type MatchKind = "must" | "nice" | "tool" | "soft";

export interface MatchItem {
  term: string;
  kind: MatchKind;
  status: MatchStatus;
}

export interface MatchResult {
  /** 0–100 */
  score: number;
  items: MatchItem[];
  covered: number;
  total: number;
}

export interface MatchSideSnapshot {
  score: number;
  covered: number;
  total: number;
  items: MatchItem[];
}

export interface MatchBreakdown {
  before: MatchSideSnapshot;
  after: MatchSideSnapshot;
}

export interface MatchComparisonRow {
  term: string;
  kind: MatchKind;
  before: MatchStatus;
  after: MatchStatus;
  improved: boolean;
  stillMissing: boolean;
}

/** User-claimed gap to inject before generation (explicit consent). */
export interface MatchClaim {
  term: string;
  kind: MatchKind;
}

const matchItemSchema = z.object({
  term: z.string(),
  kind: z.enum(["must", "nice", "tool", "soft"]),
  status: z.enum(["covered", "partial", "missing"]),
});

const matchSideSchema = z.object({
  score: z.number(),
  covered: z.number(),
  total: z.number(),
  items: z.array(matchItemSchema),
});

const matchBreakdownSchema = z.object({
  before: matchSideSchema,
  after: matchSideSchema,
});

export const matchClaimSchema = z.object({
  term: z.string().min(1).max(80),
  kind: z.enum(["must", "nice", "tool", "soft"]),
});

/** Parses persisted GeneratedCV.matchBreakdown JSON, or null if absent/invalid. */
export function parseMatchBreakdown(raw: unknown): MatchBreakdown | null {
  const parsed = matchBreakdownSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const STATUS_RANK: Record<MatchStatus, number> = {
  missing: 0,
  partial: 1,
  covered: 2,
};

/** Pair before/after checklist rows for the bilan UI. */
export function compareMatchBreakdown(breakdown: MatchBreakdown): MatchComparisonRow[] {
  const afterByKey = new Map(
    breakdown.after.items.map((item) => [`${item.kind}:${item.term.toLowerCase()}`, item])
  );
  const seen = new Set<string>();
  const rows: MatchComparisonRow[] = [];

  for (const before of breakdown.before.items) {
    const key = `${before.kind}:${before.term.toLowerCase()}`;
    seen.add(key);
    const after = afterByKey.get(key);
    const afterStatus = after?.status ?? before.status;
    rows.push({
      term: before.term,
      kind: before.kind,
      before: before.status,
      after: afterStatus,
      improved: STATUS_RANK[afterStatus] > STATUS_RANK[before.status],
      stillMissing: afterStatus === "missing",
    });
  }

  for (const after of breakdown.after.items) {
    const key = `${after.kind}:${after.term.toLowerCase()}`;
    if (seen.has(key)) continue;
    rows.push({
      term: after.term,
      kind: after.kind,
      before: "missing",
      after: after.status,
      improved: after.status !== "missing",
      stillMissing: after.status === "missing",
    });
  }

  const kindOrder: Record<MatchKind, number> = { must: 0, tool: 1, soft: 2, nice: 3 };
  return rows.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.term.localeCompare(b.term));
}

const MUST_WEIGHT = 2;
const TOOL_WEIGHT = 1.5;
const SOFT_WEIGHT = 1.25;
const NICE_WEIGHT = 1;

const ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6", "es2015"],
  typescript: ["ts"],
  "node.js": ["nodejs", "node"],
  react: ["reactjs", "react.js"],
  "next.js": ["nextjs", "next"],
  vue: ["vuejs", "vue.js"],
  angular: ["angularjs"],
  postgresql: ["postgres", "psql"],
  kubernetes: ["k8s"],
  "ci/cd": ["cicd", "ci cd", "continuous integration"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
  docker: ["conteneur", "containers"],
  english: ["anglais", "toeic", "fluent english"],
  french: ["français", "francais"],
  lead: ["tech lead", "team lead", "leadership"],
  agile: ["scrum", "kanban"],
  communication: ["communication orale", "communication ecrite"],
  "esprit d equipe": ["travail en equipe", "teamwork", "collaboratif"],
  autonomie: ["independent", "self starter"],
};

export function normalizeTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandAliases(term: string): string[] {
  const n = normalizeTerm(term);
  if (!n) return [];
  const out = new Set<string>([n]);
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (n === canonical || aliases.includes(n)) {
      out.add(canonical);
      for (const a of aliases) out.add(a);
    }
  }
  return Array.from(out);
}

export function cvCorpus(cv: CVData): string {
  const parts: string[] = [
    cv.identity.headline,
    cv.summary,
    ...cv.skills.flatMap((g) => [g.category, ...g.items]),
    ...(cv.softSkills ?? []),
    ...cv.experiences.flatMap((e) => [e.title, e.company, ...e.bullets, ...e.stack]),
    ...cv.education.flatMap((e) => [e.degree, e.school, e.details]),
    ...cv.languages.map((l) => `${l.name} ${l.level}`),
    ...cv.interests,
  ];
  return normalizeTerm(parts.filter(Boolean).join(" "));
}

function matchStatus(term: string, corpus: string): MatchStatus {
  const variants = expandAliases(term);
  if (variants.some((v) => v.length >= 2 && corpus.includes(v))) return "covered";

  const tokens = normalizeTerm(term)
    .split(" ")
    .filter((t) => t.length >= 3);
  if (tokens.length >= 2 && tokens.every((t) => corpus.includes(t))) return "partial";

  return "missing";
}

function statusWeight(status: MatchStatus): number {
  if (status === "covered") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function kindWeight(kind: MatchKind): number {
  if (kind === "must") return MUST_WEIGHT;
  if (kind === "tool") return TOOL_WEIGHT;
  if (kind === "soft") return SOFT_WEIGHT;
  return NICE_WEIGHT;
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

export function scoreCvAgainstJob(cv: CVData, requirements: JobRequirements): MatchResult {
  const corpus = cvCorpus(cv);
  const soft = requirements.softSkills ?? [];
  const items: MatchItem[] = [
    ...dedupeTerms(requirements.mustHave).map((term) => ({
      term,
      kind: "must" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(requirements.tools).map((term) => ({
      term,
      kind: "tool" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(soft).map((term) => ({
      term,
      kind: "soft" as const,
      status: matchStatus(term, corpus),
    })),
    ...dedupeTerms(requirements.niceHave).map((term) => ({
      term,
      kind: "nice" as const,
      status: matchStatus(term, corpus),
    })),
  ];

  if (items.length === 0) {
    return { score: 0, items: [], covered: 0, total: 0 };
  }

  let earned = 0;
  let possible = 0;
  for (const item of items) {
    const w = kindWeight(item.kind);
    possible += w;
    earned += w * statusWeight(item.status);
  }

  const score = Math.round((earned / possible) * 100);
  const covered = items.filter((i) => i.status === "covered" || i.status === "partial").length;

  return { score, items, covered, total: items.length };
}

/** Gaps the user can claim before generation. */
export function listMatchGaps(result: MatchResult): MatchItem[] {
  return result.items.filter((i) => i.status === "missing");
}

/**
 * Injects user-claimed requirements into the CV (this generation). Soft →
 * softSkills; others → skills group. Deterministic, 0 tokens.
 */
export function applyClaimsToCv(cv: CVData, claims: MatchClaim[]): CVData {
  if (claims.length === 0) return cv;

  const softSkills = [...(cv.softSkills ?? [])];
  const technical: string[] = [];

  for (const claim of claims) {
    const n = normalizeTerm(claim.term);
    if (!n) continue;
    if (claim.kind === "soft") {
      if (!softSkills.some((s) => normalizeTerm(s) === n)) softSkills.push(claim.term.trim());
    } else if (!technical.some((t) => normalizeTerm(t) === n)) {
      technical.push(claim.term.trim());
    }
  }

  let skills = cv.skills.map((g) => ({ ...g, items: [...g.items] }));
  if (technical.length) {
    const idx = skills.findIndex((g) => /tech|outil|skill|compétence|stack/i.test(g.category));
    if (idx >= 0) {
      const group = skills[idx]!;
      skills[idx] = {
        ...group,
        items: [
          ...technical,
          ...group.items.filter(
            (i) => !technical.some((t) => normalizeTerm(t) === normalizeTerm(i))
          ),
        ],
      };
    } else {
      skills = [{ category: "Compétences clés", items: technical }, ...skills];
    }
  }

  return { ...cv, softSkills, skills };
}

/** Projected score if the user claims the given gaps (no LLM). */
export function projectScoreWithClaims(
  cv: CVData,
  requirements: JobRequirements,
  claims: MatchClaim[]
): MatchResult {
  return scoreCvAgainstJob(applyClaimsToCv(cv, claims), requirements);
}

function skillsAlreadyList(cv: CVData): string {
  return normalizeTerm([...cv.skills.flatMap((g) => g.items), ...(cv.softSkills ?? [])].join(" "));
}

export function promoteRequirementsInCv(cv: CVData, requirements: JobRequirements): CVData {
  const corpus = cvCorpus(cv);
  const skillsText = skillsAlreadyList(cv);
  const promote: string[] = [];
  const softPromote: string[] = [];

  for (const term of dedupeTerms([
    ...requirements.mustHave,
    ...requirements.tools,
    ...requirements.niceHave,
  ])) {
    if (matchStatus(term, corpus) === "missing") continue;
    const n = normalizeTerm(term);
    if (!skillsText.includes(n) && !promote.some((p) => normalizeTerm(p) === n)) {
      promote.push(term);
    }
  }

  for (const term of dedupeTerms(requirements.softSkills ?? [])) {
    if (matchStatus(term, corpus) === "missing") continue;
    const n = normalizeTerm(term);
    if (
      !(cv.softSkills ?? []).some((s) => normalizeTerm(s) === n) &&
      !softPromote.some((p) => normalizeTerm(p) === n)
    ) {
      softPromote.push(term);
    }
  }

  const next: CVData = {
    ...cv,
    softSkills: [...(cv.softSkills ?? []), ...softPromote],
  };

  if (promote.length === 0) return next;

  const skills = next.skills.map((g) => ({ ...g, items: [...g.items] }));
  const targetIdx = skills.findIndex((g) => /tech|outil|skill|compétence|stack/i.test(g.category));
  if (targetIdx >= 0) {
    const group = skills[targetIdx]!;
    skills[targetIdx] = {
      ...group,
      items: [
        ...promote,
        ...group.items.filter((i) => !promote.some((p) => normalizeTerm(p) === normalizeTerm(i))),
      ],
    };
  } else {
    skills.unshift({ category: "Compétences clés", items: promote });
  }

  const headlineBits = promote.slice(0, 3);
  let headline = next.identity.headline.trim();
  for (const bit of headlineBits) {
    if (!normalizeTerm(headline).includes(normalizeTerm(bit))) {
      const candidate = headline ? `${headline} · ${bit}` : bit;
      if (candidate.length <= 70) headline = candidate;
    }
  }

  let summary = next.summary.trim();
  const missingInSummary = promote
    .filter((t) => !normalizeTerm(summary).includes(normalizeTerm(t)))
    .slice(0, 4);
  if (missingInSummary.length) {
    const clause = `Compétences alignées offre : ${missingInSummary.join(", ")}.`;
    summary = summary ? `${summary} ${clause}` : clause;
    if (summary.length > 480) summary = `${summary.slice(0, 477).trimEnd()}…`;
  }

  return {
    ...next,
    identity: { ...next.identity, headline },
    summary,
    skills,
  };
}

/** Dedupes soft-skill labels (accent-insensitive) while keeping first-seen wording. */
export function unionSoftSkills(...lists: Array<readonly string[] | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list ?? []) {
      const term = raw.trim();
      if (!term) continue;
      const key = normalizeTerm(term);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(term);
    }
  }
  return out;
}

export function sanitizeSkillsAgainstBase(cv: CVData, baseCV: CVData): CVData {
  const corpus = cvCorpus(baseCV);
  const allowedSoft = new Set(unionSoftSkills(baseCV.softSkills, cv.softSkills).map(normalizeTerm));
  // Soft skills from the profile or newly claimed for this generation are allowed.
  const softSkills = (cv.softSkills ?? []).filter((s) => allowedSoft.has(normalizeTerm(s)));

  const skills = cv.skills
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => matchStatus(item, corpus) !== "missing"),
    }))
    .filter((g) => g.items.length > 0);

  return {
    ...cv,
    softSkills,
    skills: skills.length > 0 ? skills : baseCV.skills,
  };
}

function isSoftSkillsCategory(category: string): boolean {
  const n = category.trim().toLowerCase();
  return (
    /^soft\s*skills?$/.test(n) ||
    /savoir[\s-]*[eê]tre/.test(n) ||
    /qualit[eé]s?\s*(humaines|personnelles|relationnelles)/.test(n) ||
    /comp[eé]tences?\s*(comportementales|transversales|douces)/.test(n)
  );
}

/** Ensures catalog / claimed soft skills appear as a visible skill group for PDF/DOCX. */
export function withSoftSkillsGroup(cv: CVData): CVData {
  const fromGroups = cv.skills
    .filter((g) => isSoftSkillsCategory(g.category))
    .flatMap((g) => g.items);
  const soft = unionSoftSkills(cv.softSkills, fromGroups);
  const others = cv.skills.filter((g) => !isSoftSkillsCategory(g.category));
  if (soft.length === 0) return { ...cv, softSkills: [], skills: others };
  return {
    ...cv,
    softSkills: soft,
    skills: [...others, { category: "Soft skills", items: soft }],
  };
}

/**
 * Post-tailor merge: keep profile + claimed soft skills even if the LLM
 * returned a different non-empty list, then sanitize / promote / surface them.
 */
export function finalizeTailoredCv(
  tailored: CVData,
  enrichedBase: CVData,
  requirements: JobRequirements
): CVData {
  const softSkills = unionSoftSkills(enrichedBase.softSkills, tailored.softSkills);
  return withSoftSkillsGroup(
    promoteRequirementsInCv(
      sanitizeSkillsAgainstBase({ ...tailored, softSkills }, enrichedBase),
      requirements
    )
  );
}
