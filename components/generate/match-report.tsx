"use client";

import { useId, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  MinusCircle,
  Sparkles,
} from "lucide-react";
import { compareMatchBreakdown, type MatchBreakdown, type MatchStatus } from "@/lib/match-score";
import { useMessages } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<MatchStatus, "success-soft" | "warning-soft" | "neutral-soft"> =
  {
    covered: "success-soft",
    partial: "warning-soft",
    missing: "neutral-soft",
  };

function StatusCell({ status }: { status: MatchStatus }) {
  const statuses = useMessages().forms.match.statuses;
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className="gap-1 font-medium">
      {status === "covered" ? (
        <CheckCircle2 className="size-3" aria-hidden />
      ) : status === "partial" ? (
        <CircleDashed className="size-3" aria-hidden />
      ) : (
        <MinusCircle className="size-3" aria-hidden />
      )}
      {statuses[status]}
    </Badge>
  );
}

/**
 * Compact match bilan: score strip always visible, comparative table in an
 * accordion so the generated CV stays above the fold.
 */
export function MatchReport({ breakdown, title }: { breakdown: MatchBreakdown; title?: string }) {
  const t = useMessages().forms.match;
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rows = compareMatchBreakdown(breakdown);
  const delta = breakdown.after.score - breakdown.before.score;
  const improved = rows.filter((r) => r.improved).length;
  const stillMissing = rows.filter((r) => r.stillMissing).length;

  return (
    <section
      aria-labelledby="match-bilan-title"
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <button
        type="button"
        id="match-bilan-title"
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title ?? t.reportTitle}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span className="tabular-nums text-foreground/80">{breakdown.before.score}%</span>
            <ArrowRight className="size-3.5" aria-hidden />
            <span className="font-semibold tabular-nums text-primary">
              {breakdown.after.score}%
            </span>
            <Badge variant={delta >= 0 ? "success" : "secondary"} className="ml-1">
              {delta >= 0 ? `+${delta}` : delta} {t.points}
            </Badge>
            <span className="text-xs">
              · {t.improvedCount(improved)}
              {stillMissing > 0 ? ` · ${t.stillMissingCount(stillMissing)}` : ""}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <section id={panelId} aria-labelledby="match-bilan-title" hidden={!open} className="border-t">
        <div className="space-y-3 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t.reportIntro}</p>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columnCriterion}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columnKind}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columnBefore}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columnAfter}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columnImpact}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr
                    key={`${row.kind}-${row.term}`}
                    className={cn(
                      row.improved && "bg-emerald-50/70",
                      row.stillMissing && "bg-slate-50/80"
                    )}
                  >
                    <td className="px-3 py-2 font-medium">{row.term}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {t.kindsShort[row.kind]}
                    </td>
                    <td className="px-3 py-2">
                      <StatusCell status={row.before} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusCell status={row.after} />
                    </td>
                    <td className="px-3 py-2">
                      {row.improved ? (
                        <Badge variant="success">{t.impactGain}</Badge>
                      ) : row.stillMissing ? (
                        <Badge variant="secondary">{t.impactGap}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">·</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stillMissing > 0 ? (
            <p className="text-xs text-amber-800">{t.reportGapsNote(stillMissing)}</p>
          ) : (
            <p className="text-xs text-emerald-800">{t.reportCovered}</p>
          )}
        </div>
      </section>
    </section>
  );
}
