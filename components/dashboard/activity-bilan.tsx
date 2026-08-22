import { FileText, Sparkles, TrendingUp, Coins, Trophy } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { intlLocale } from "@/i18n/format";
import { Link } from "@/i18n/navigation";

export function ActivityBilan({ stats }: { stats: DashboardStats }) {
  const locale = getLocale();
  const m = getMessages(locale).pages.activity;
  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.count));
  // `stats.weeks[].label` is pre-formatted in French upstream: reformat here so
  // the axis follows the reader's locale.
  const weekLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
  });
  const weeks = stats.weeks.map((week) => ({ ...week, label: weekLabel.format(week.start) }));
  const noValue = getMessages(locale).pages.noValue;

  const kpis = [
    {
      label: m.cvsLabel,
      value: String(stats.cvsLast30Days),
      hint: m.cvsHint(stats.cvsTotal),
      icon: FileText,
    },
    {
      label: m.gainLabel,
      value: stats.avgMatchGain == null ? noValue : m.gainValue(stats.avgMatchGain),
      hint: m.gainHint,
      icon: TrendingUp,
    },
    {
      label: m.bestLabel,
      value: stats.bestMatchAfter == null ? noValue : `${stats.bestMatchAfter}%`,
      hint: m.bestHint,
      icon: Trophy,
    },
    {
      label: m.creditsLabel,
      value: String(stats.balance),
      hint: m.creditsHint(stats.creditsSpent30Days),
      icon: Coins,
    },
  ] as const;

  return (
    <section aria-labelledby="bilan-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="bilan-title" className="font-display text-lg font-semibold">
            {m.title}
          </h2>
          <p className="text-sm text-muted-foreground">{m.subtitle}</p>
        </div>
        {stats.balance <= 0 ? (
          <Link
            href="/billing"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {m.topUp}
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
          <h3 className="text-sm font-semibold">{m.chartTitle}</h3>
        </div>
        <div
          className="flex h-36 items-end gap-2 sm:gap-3"
          role="img"
          aria-label={m.chartAria(weeks.map((w) => `${w.label} ${w.count}`).join(", "))}
        >
          {weeks.map((week) => {
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
