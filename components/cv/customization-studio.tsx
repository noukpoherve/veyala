"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Check, Search, Wand2, X } from "lucide-react";
import type { EditorTemplate } from "@/components/cv/cv-editor";
import { DesignControls } from "@/components/cv/design-controls";
import { TemplateSwatch } from "@/components/templates/template-swatch";
import type { ColorsOverride, TemplateDefinition } from "@/lib/templates/definition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Full-screen "appearance studio": an in-place overlay (no route change, same
 * URL, no reload) that puts the CV large in the centre with templates on the
 * left and colours on the right, all previewed live. Keeps the day-to-day
 * editor uncluttered — heavy visual customisation happens here, then "Terminé"
 * returns to the editor with the changes already applied.
 */

const CATEGORY_LABELS: Record<EditorTemplate["definition"]["layout"], string> = {
  "sidebar-left": "Avec barre latérale",
  "single-column": "Colonne unique",
};

export function CustomizationStudio({
  open,
  onClose,
  templates,
  selectedId,
  onSelect,
  colors,
  photo,
  photoShape,
  hasPhoto,
  hasOverride,
  onChangeColors,
  onChangePhoto,
  onChangePhotoShape,
  onReset,
  cvHtml,
}: {
  open: boolean;
  onClose: () => void;
  templates: EditorTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  colors: TemplateDefinition["colors"];
  photo: boolean;
  photoShape: "circle" | "square";
  hasPhoto: boolean;
  hasOverride: boolean;
  onChangeColors: (patch: ColorsOverride) => void;
  onChangePhoto: (show: boolean) => void;
  onChangePhotoShape: (shape: "circle" | "square") => void;
  onReset: () => void;
  cvHtml: string;
}) {
  const [query, setQuery] = useState("");
  const titleId = useId();

  const groups = useMemo<[string, EditorTemplate[]][]>(() => {
    const q = query.trim().toLowerCase();
    const byLayout = new Map<string, EditorTemplate[]>();
    for (const t of templates) {
      const label = CATEGORY_LABELS[t.definition.layout] ?? "Autres";
      if (q && !t.name.toLowerCase().includes(q) && !label.toLowerCase().includes(q)) continue;
      const list = byLayout.get(label);
      if (list) list.push(t);
      else byLayout.set(label, [t]);
    }
    return Array.from(byLayout.entries());
  }, [templates, query]);

  const matchCount = groups.reduce((n, [, list]) => n + list.length, 0);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in"
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <h2 id={titleId} className="flex items-center gap-2 font-display text-base font-bold">
          <Wand2 className="size-4 text-primary" aria-hidden />
          Personnalisation
        </h2>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Modifications appliquées en direct
          </span>
          <Button variant="gradient" size="sm" onClick={onClose}>
            <Check className="size-4" aria-hidden />
            Terminé
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer l'atelier">
            <X className="size-5" aria-hidden />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] overflow-y-auto lg:grid-cols-[minmax(200px,15rem)_1fr_minmax(15rem,19rem)] lg:grid-rows-1 lg:overflow-hidden">
        {/* Left rail: templates */}
        <aside className="flex min-h-0 flex-col border-b bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un modèle…"
                aria-label="Rechercher un modèle"
                className="h-9 w-full rounded-lg border bg-background pl-8 pr-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {matchCount === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Aucun modèle pour « {query} ».
              </p>
            ) : (
              groups.map(([label, list]) => (
                <section key={label}>
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                      {list.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {list.map((t) => {
                      const isSelected = t.id === selectedId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelect(t.id)}
                          aria-pressed={isSelected}
                          title={t.name}
                          className={cn(
                            "relative rounded-lg border bg-card p-1.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                            isSelected
                              ? "border-primary ring-2 ring-primary/30"
                              : "hover:border-primary/40"
                          )}
                        >
                          {isSelected ? (
                            <span className="absolute right-1 top-1 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" aria-hidden />
                            </span>
                          ) : null}
                          <TemplateSwatch
                            layout={t.definition.layout}
                            colors={t.definition.colors.sidebar}
                            band={t.definition.colors.band}
                          />
                          <span className="mt-1 block truncate text-[11px] font-medium">
                            {t.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </aside>

        {/* Centre: the CV, sized to fit the available height so it's fully
            visible without scrolling; the A4 ratio derives the width. */}
        <div className="flex min-h-[60vh] items-center justify-center bg-muted/40 p-4 sm:p-6 lg:min-h-0">
          <div className="aspect-[210/297] w-full max-w-full overflow-hidden rounded-xl border bg-white shadow-lg lg:h-full lg:w-auto lg:max-h-full">
            <iframe
              srcDoc={cvHtml}
              title="Aperçu du CV"
              className="size-full bg-white"
              sandbox=""
            />
          </div>
        </div>

        {/* Right rail: appearance controls */}
        <aside className="min-h-0 overflow-y-auto border-t bg-muted/20 p-3 lg:border-l lg:border-t-0">
          <DesignControls
            colors={colors}
            photo={photo}
            photoShape={photoShape}
            hasPhoto={hasPhoto}
            hasOverride={hasOverride}
            onChangeColors={onChangeColors}
            onChangePhoto={onChangePhoto}
            onChangePhotoShape={onChangePhotoShape}
            onReset={onReset}
          />
        </aside>
      </div>
    </div>
  );
}
