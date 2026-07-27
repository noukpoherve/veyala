/**
 * Predefined soft-skills catalog (profile multi-select + matching).
 * Keep labels stable: they are stored on the CV and compared by the scorer.
 */
export const SOFT_SKILLS_CATALOG = [
  { id: "communication", label: "Communication" },
  { id: "teamwork", label: "Esprit d'équipe" },
  { id: "autonomy", label: "Autonomie" },
  { id: "leadership", label: "Leadership" },
  { id: "problem-solving", label: "Résolution de problèmes" },
  { id: "adaptability", label: "Adaptabilité" },
  { id: "rigor", label: "Rigueur" },
  { id: "organization", label: "Organisation" },
  { id: "creativity", label: "Créativité" },
  { id: "stress", label: "Gestion du stress" },
  { id: "pedagogy", label: "Pédagogie" },
  { id: "customer", label: "Relation client" },
  { id: "initiative", label: "Prise d'initiative" },
  { id: "analytical", label: "Esprit d'analyse" },
  { id: "empathy", label: "Empathie" },
  { id: "time", label: "Gestion du temps" },
  { id: "negotiation", label: "Négociation" },
  { id: "curiosity", label: "Curiosité" },
] as const;

export type SoftSkillId = (typeof SOFT_SKILLS_CATALOG)[number]["id"];

export const SOFT_SKILL_LABELS: readonly string[] = SOFT_SKILLS_CATALOG.map((s) => s.label);

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const LABEL_BY_NORMALIZED = new Map(
  SOFT_SKILLS_CATALOG.map((s) => [stripDiacritics(s.label), s.label] as const)
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
