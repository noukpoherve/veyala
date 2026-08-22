import type { Locale } from "@/i18n/config";

/**
 * Predefined soft-skills catalog (profile multi-select + matching).
 * Canonical `label` (FR) is stored on the CV and compared by the scorer.
 * `labelEn` is display-only for English UI.
 */
export const SOFT_SKILLS_CATALOG = [
  { id: "communication", label: "Communication", labelEn: "Communication" },
  { id: "teamwork", label: "Esprit d'équipe", labelEn: "Teamwork" },
  { id: "autonomy", label: "Autonomie", labelEn: "Autonomy" },
  { id: "leadership", label: "Leadership", labelEn: "Leadership" },
  { id: "problem-solving", label: "Résolution de problèmes", labelEn: "Problem solving" },
  { id: "adaptability", label: "Adaptabilité", labelEn: "Adaptability" },
  { id: "rigor", label: "Rigueur", labelEn: "Rigor" },
  { id: "organization", label: "Organisation", labelEn: "Organization" },
  { id: "creativity", label: "Créativité", labelEn: "Creativity" },
  { id: "stress", label: "Gestion du stress", labelEn: "Stress management" },
  { id: "pedagogy", label: "Pédagogie", labelEn: "Teaching ability" },
  { id: "customer", label: "Relation client", labelEn: "Customer relations" },
  { id: "initiative", label: "Prise d'initiative", labelEn: "Initiative" },
  { id: "analytical", label: "Esprit d'analyse", labelEn: "Analytical thinking" },
  { id: "empathy", label: "Empathie", labelEn: "Empathy" },
  { id: "time", label: "Gestion du temps", labelEn: "Time management" },
  { id: "negotiation", label: "Négociation", labelEn: "Negotiation" },
  { id: "curiosity", label: "Curiosité", labelEn: "Curiosity" },
] as const;

export type SoftSkillId = (typeof SOFT_SKILLS_CATALOG)[number]["id"];

export const SOFT_SKILL_LABELS: readonly string[] = SOFT_SKILLS_CATALOG.map((s) => s.label);

/** Localized display label; storage always uses the French `label`. */
export function softSkillDisplayLabel(
  skill: (typeof SOFT_SKILLS_CATALOG)[number],
  locale: Locale
): string {
  return locale === "en" ? skill.labelEn : skill.label;
}

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const LABEL_BY_NORMALIZED = new Map(
  SOFT_SKILLS_CATALOG.flatMap((s) => [
    [stripDiacritics(s.label), s.label] as const,
    [stripDiacritics(s.labelEn), s.label] as const,
  ])
);

/** Map free-text soft skill from an offer to a catalog label when possible. */
export function matchSoftSkillLabel(raw: string): string | null {
  const n = stripDiacritics(raw);
  if (!n) return null;
  const exact = LABEL_BY_NORMALIZED.get(n);
  if (exact) return exact;
  for (const entry of Array.from(LABEL_BY_NORMALIZED.entries())) {
    const [key, label] = entry;
    if (n.includes(key) || key.includes(n)) return label;
  }
  return null;
}
