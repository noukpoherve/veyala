import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  TemplateSwatch,
  type SwatchProps,
  type SwatchSize,
} from "@/components/templates/template-swatch";
import { cn } from "@/lib/utils";

/**
 * Selectable template tile (native radio + visible label). Used by generate,
 * Campus France, and the appearance studio.
 */
export function TemplateOptionCard({
  id,
  name,
  swatch,
  selected,
  onSelect,
  groupName,
  layoutLabel,
  badge,
  size = "lg",
  className,
}: {
  id: string;
  name: string;
  swatch: SwatchProps;
  selected: boolean;
  onSelect: () => void;
  /** `name` of the native radio group this option belongs to. */
  groupName: string;
  /** Visible layout caption (sidebar vs single column). */
  layoutLabel?: string;
  /** Extra marker rendered over the swatch when selected (e.g. a checkmark). */
  badge?: ReactNode;
  size?: SwatchSize;
  className?: string;
}) {
  return (
    <label
      data-template-id={id}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 bg-card p-2.5 text-left transition-colors",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        selected
          ? "border-primary ring-2 ring-primary/25"
          : "border-border hover:border-primary/50",
        className
      )}
    >
      <input
        type="radio"
        name={groupName}
        value={id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {selected
        ? (badge ?? (
            <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Check className="size-3" aria-hidden />
            </span>
          ))
        : null}
      <TemplateSwatch {...swatch} size={size} />
      <span
        className={cn(
          "mt-1.5 block truncate font-semibold text-foreground",
          size === "xs" || size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {name}
      </span>
      {layoutLabel ? (
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {layoutLabel}
        </span>
      ) : null}
    </label>
  );
}
