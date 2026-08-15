import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * The "label + big number (+ optional hint)" tile — found copy-pasted with 3
 * different border-radius values (rounded-lg/xl/2xl) across the dashboard,
 * the matching panels (generate + campus-france, near-identical), admin and
 * billing. One shape, two sizes (`compact` for a row of 3+ inline scores,
 * `standard` for a KPI dashboard grid) covers all of them.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  emphasis = false,
  size = "standard",
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Highlights this tile as the one that matters most in its group (e.g. a projected/best score). */
  emphasis?: boolean;
  size?: "compact" | "standard";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-panel border bg-card shadow-elevation-rest",
        size === "compact" ? "p-3" : "p-4",
        emphasis && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
        {label}
      </div>
      <p
        className={cn(
          "mt-2 font-display font-bold tabular-nums tracking-tight",
          size === "compact" ? "text-3xl" : "text-2xl",
          emphasis && "text-primary"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
