import type { JobRequirements } from "@/lib/match-score";
import { matchSoftSkillLabel, SOFT_SKILL_LABELS } from "@/lib/soft-skills";

const SECTION_HINT =
  /(exigences?|requis|required|must[- ]?have|compétences?|skills?|profil|qualifications?|outils?|tools?|stack|soft\s*skills?|savoir[- ]être|qualités?)/i;

const SOFT_SECTION =
  /(soft\s*skills?|savoir[- ]être|qualités?\s+(humaines|personnelles)|comportement)/i;

/**
 * Cheap heuristic extraction: bullet / comma lists near requirement headings.
 * Pure function — no LLM, no DB.
 */
export function extractRequirementsHeuristic(jobText: string): JobRequirements {
  const lines = jobText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const collected: string[] = [];
  const softCollected: string[] = [];
  let inSection = false;
  let inSoft = false;

  for (const line of lines) {
    if (SOFT_SECTION.test(line) && line.length < 80) {
      inSoft = true;
      inSection = false;
      continue;
    }
    if (SECTION_HINT.test(line) && line.length < 80) {
      inSection = true;
      inSoft = false;
      continue;
    }
    if (
      (inSection || inSoft) &&
      /^(missions?|responsabilit|à propos|about|description)/i.test(line)
    ) {
      inSection = false;
      inSoft = false;
    }
    const cleaned = line.replace(/^[-•*●▪]\s*/, "").trim();
    if (cleaned.length < 2 || cleaned.length > 80) continue;
    for (const part of cleaned.split(/[,;/|]/)) {
      const t = part.trim();
      if (t.length < 2 || t.length > 60) continue;
      if (inSoft) {
        softCollected.push(matchSoftSkillLabel(t) ?? t);
      } else if (inSection) {
        collected.push(t);
      }
    }
  }

  // Catalog soft skills mentioned anywhere in the offer.
  for (const label of SOFT_SKILL_LABELS) {
    const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(jobText)) softCollected.push(label);
  }

  const techish =
    jobText.match(
      /\b(?:React(?:\.js)?|Next\.js|Node\.js|TypeScript|JavaScript|Python|Java|Kotlin|Go|Rust|Docker|Kubernetes|AWS|GCP|Azure|PostgreSQL|MongoDB|GraphQL|REST|CI\/CD|Terraform|Ansible|Linux|Git)\b/gi
    ) ?? [];

  const titleMatch = jobText.match(
    /(?:intitulé|poste|titre|job title|position)\s*[:\-–]\s*([^\n]{3,80})/i
  );
  const title =
    titleMatch?.[1]?.trim() ??
    lines.find((l) => l.length > 5 && l.length < 70 && !SECTION_HINT.test(l)) ??
    "";

  const unique = Array.from(
    new Set([...collected, ...techish].map((t) => t.trim()).filter(Boolean))
  );
  const mustHave = unique.slice(0, 12);
  const tools = techish
    .map((t) => t.trim())
    .filter((t, i, a) => a.indexOf(t) === i)
    .slice(0, 10);
  const niceHave = unique.slice(12, 20);
  const softSkills = Array.from(new Set(softCollected)).slice(0, 10);

  return { title, mustHave, niceHave, tools, softSkills };
}
