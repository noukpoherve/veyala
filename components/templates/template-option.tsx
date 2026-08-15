import { TemplateSwatch, type SwatchProps } from "@/components/templates/template-swatch";
import { cn } from "@/lib/utils";

/**
 * A selectable template tile (native radio, sr-only input — keyboard/screen
 * reader accessible for free). TemplateSwatch itself was already shared, but
 * this wrapper around it was copied identically in generate-form.tsx and
 * campus-france-form.tsx, and diverged a third time in
 * customization-studio.tsx (own radius, own hover, a checkmark badge).
 */
export function TemplateOptionCard({
  id,
  name,
  swatch,
  selected,
  onSelect,
  groupName,
  badge,
  className,
}: {
  id: string;
  name: string;
  swatch: SwatchProps;
  selected: boolean;
  onSelect: () => void;
  /** `name` of the native radio group this option belongs to. */
  groupName: string;
  /** Extra marker rendered over the swatch when selected (e.g. a checkmark). */
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative cursor-pointer rounded-lg border p-3 text-left transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground/40",
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
      {selected ? badge : null}
      <TemplateSwatch {...swatch} />
      <span className="mt-2 block truncate text-sm font-medium">{name}</span>
    </label>
  );
}
