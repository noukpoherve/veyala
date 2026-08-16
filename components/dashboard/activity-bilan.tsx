import Link from "next/link";
import { FileText, Sparkles, TrendingUp, Coins, Trophy } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export function ActivityBilan({ stats }: { stats: DashboardStats }) {
  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.count));

  const kpis = [
    {
      label: "CVs (30 j)",
      value: String(stats.cvsLast30Days),
      hint: `${stats.cvsTotal} au total`,
      icon: FileText,
    },
    {
      label: "Gain matching moyen",
      value:
        stats.avgMatchGain == null
          ? "—"
          : `${stats.avgMatchGain >= 0 ? "+" : ""}${stats.avgMatchGain} pts`,
      hint: "avant → après",
      icon: TrendingUp,
    },
    {
      label: "Meilleur score",
      value: stats.bestMatchAfter == null ? "—" : `${stats.bestMatchAfter}%`,
      hint: "matching après génération",
      icon: Trophy,
    },
    {
      label: "Crédits restants",
      value: String(stats.balance),
      hint: `${stats.creditsSpent30Days} utilisés (30 j)`,
      icon: Coins,
    },
  ] as const;

  return (
    <section aria-labelledby="bilan-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="bilan-title" className="font-display text-lg font-semibold">
            Bilan d&apos;activité
          </h2>
          <p className="text-sm text-muted-foreground">
            Vue des 30 derniers jours et tendance hebdo.
          </p>
        </div>
        {stats.balance <= 0 ? (
          <Link
            href="/billing"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Recharger des crédits
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
          />
        ))}
      </div>

      <div className="rounded-panel border bg-card p-4 shadow-elevation-rest sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">CVs générés par semaine</h3>
        </div>
        <div
          className="flex h-36 items-end gap-2 sm:gap-3"
          role="img"
          aria-label={`Activité sur 8 semaines : ${stats.weeks.map((w) => `${w.label} ${w.count}`).join(", ")}`}
        >
          {stats.weeks.map((week) => {
            const height = Math.max(4, Math.round((week.count / maxWeek) * 100));
            return (
              <div
                key={week.start.toISOString()}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {week.count || ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400",
                      week.count === 0 &&
                        "from-slate-200 to-slate-200 dark:from-slate-700 dark:to-slate-700"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="truncate text-[10px] text-muted-foreground">{week.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
