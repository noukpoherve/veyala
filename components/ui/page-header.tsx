import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standardizes the title + description + actions row every authenticated
 * page currently hand-rolls with its own copy of the same three classes
 * (`font-display text-2xl font-bold` / `text-sm text-muted-foreground` /
 * `flex flex-wrap items-center justify-between gap-4`). One place to change
 * the page-title scale for the whole app.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
