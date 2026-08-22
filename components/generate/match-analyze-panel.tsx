"use client";

import { memo } from "react";
import type { MatchClaim, MatchItem } from "@/lib/match-score";
import { useMessages } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export interface MatchAnalyzePanelProps {
  beforeScore: number;
  projectedScore: number;
  maxProjectedScore: number;
  gaps: MatchItem[];
  selected: MatchClaim[];
  onToggle: (claim: MatchClaim) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

function claimKey(c: MatchClaim): string {
  return `${c.kind}:${c.term.toLowerCase()}`;
}

/**
 * Gap picker + live projected score. Memoized: parent re-renders on stream
 * progress should not rebuild the whole list when props are stable.
 */
export const MatchAnalyzePanel = memo(function MatchAnalyzePanel({
  beforeScore,
  projectedScore,
  maxProjectedScore,
  gaps,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: MatchAnalyzePanelProps) {
  const t = useMessages().forms.match;
  const selectedKeys = new Set(selected.map(claimKey));

  return (
    <section
      aria-labelledby="analyze-panel-title"
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <header className="space-y-1">
        <h2 id="analyze-panel-title" className="font-display text-lg font-semibold">
          {t.panelTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.panelIntro}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3" role="status" aria-live="polite">
        <StatCard size="compact" label={t.currentScore} value={`${beforeScore}%`} />
        <StatCard size="compact" emphasis label={t.projectedScore} value={`${projectedScore}%`} />
        <StatCard size="compact" label={t.maxScore} value={`${maxProjectedScore}%`} />
      </div>

      {gaps.length === 0 ? (
        <p className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          {t.noGaps}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t.gapsTitle}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                onClick={onSelectAll}
              >
                {t.checkAll}
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={onClear}
              >
                {t.uncheckAll}
              </button>
            </div>
          </div>
          <p className="text-xs text-amber-800">{t.gapsWarning}</p>
          <ul className="divide-y rounded-md border">
            {gaps.map((gap) => {
              const claim: MatchClaim = { term: gap.term, kind: gap.kind };
              const checked = selectedKeys.has(claimKey(claim));
              return (
                <li key={claimKey(claim)}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm",
                      checked && "bg-primary/5"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={checked}
                      onChange={() => onToggle(claim)}
                    />
                    <span className="min-w-0 flex-1 font-medium">{gap.term}</span>
                    <Badge variant="secondary">{t.kinds[gap.kind]}</Badge>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
});
