"use client";

import { memo } from "react";
import type { CoherenceItem, CoherenceKind } from "@/lib/campus-france/coherence-score";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

const KIND_LABEL: Record<CoherenceKind, string> = {
  prerequisite: "Prérequis",
  selection: "Sélection",
  skill: "Compétence",
  objective: "Objectif",
  outcome: "Débouché",
};

export interface CoherencePanelProps {
  beforeScore: number;
  covered: number;
  total: number;
  gaps: CoherenceItem[];
  programTitle?: string;
  domain?: string;
  level?: string;
}

/**
 * Read-only coherence bilan for Campus France (no ATS claims).
 * Gaps are arguments to strengthen in the letter, not skills to invent on the CV.
 */
export const CoherencePanel = memo(function CoherencePanel({
  beforeScore,
  covered,
  total,
  gaps,
  programTitle,
  domain,
  level,
}: CoherencePanelProps) {
  return (
    <section
      aria-labelledby="cf-coherence-title"
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <header className="space-y-1">
        <h2 id="cf-coherence-title" className="font-display text-lg font-semibold">
          Analyse de cohérence
        </h2>
        <p className="text-sm text-muted-foreground">
          Aucun crédit débité. Les projets proposés sont des brouillons à valider — la lettre
          s&apos;appuiera dessus, le CV illustrera l&apos;alignement du parcours.
        </p>
        {programTitle ? (
          <p className="text-sm font-medium">
            {programTitle}
            {domain || level ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {[domain, level].filter(Boolean).join(" · ")}
              </span>
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard size="compact" label="Score de cohérence" value={`${beforeScore}%`} />
        <StatCard size="compact" emphasis label="Critères couverts" value={`${covered}/${total}`} />
      </div>

      {gaps.length === 0 ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Votre parcours et vos projets couvrent déjà les critères extraits. Vous pouvez générer la
          lettre et le CV.
        </p>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Arguments à renforcer dans la lettre</h3>
          <p className="text-xs text-muted-foreground">
            Ces points sont peu visibles dans votre profil ou vos projets. La génération s&apos;en
            servira pour structurer la lettre — sans inventer de faits.
          </p>
          <ul className="divide-y rounded-md border">
            {gaps.map((gap) => (
              <li
                key={`${gap.kind}:${gap.term.toLowerCase()}`}
                className="flex items-center gap-3 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium">{gap.term}</span>
                <Badge variant="secondary">{KIND_LABEL[gap.kind]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});
