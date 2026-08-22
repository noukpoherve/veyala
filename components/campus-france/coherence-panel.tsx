"use client";

import { memo } from "react";
import type { CoherenceItem } from "@/lib/campus-france/coherence-score";
import { useMessages } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

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
  const t = useMessages().forms.coherence;

  return (
    <section
      aria-labelledby="cf-coherence-title"
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <header className="space-y-1">
        <h2 id="cf-coherence-title" className="font-display text-lg font-semibold">
          {t.panelTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.panelIntro}</p>
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
        <StatCard size="compact" label={t.score} value={`${beforeScore}%`} />
        <StatCard size="compact" emphasis label={t.covered} value={`${covered}/${total}`} />
      </div>

      {gaps.length === 0 ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {t.noGaps}
        </p>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t.gapsTitle}</h3>
          <p className="text-xs text-muted-foreground">{t.gapsHint}</p>
          <ul className="divide-y rounded-md border">
            {gaps.map((gap) => (
              <li
                key={`${gap.kind}:${gap.term.toLowerCase()}`}
                className="flex items-center gap-3 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium">{gap.term}</span>
                <Badge variant="secondary">{t.kinds[gap.kind]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});
