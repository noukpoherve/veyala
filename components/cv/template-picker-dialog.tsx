"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, LayoutTemplate, Search, X } from "lucide-react";
import type { EditorTemplate } from "@/components/cv/cv-editor";
import { TemplateSwatch } from "@/components/templates/template-swatch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Scalable template chooser: a modal that groups templates by skeleton type
 * (layout) so the picker stays usable with dozens or hundreds of entries,
 * with instant text search. Replaces the flat inline swatch row that didn't
 * scale past a handful of templates.
 */

/** Human-readable skeleton categories, keyed by the template layout. */
const CATEGORY_LABELS: Record<EditorTemplate["definition"]["layout"], string> = {
  "sidebar-left": "Avec barre latérale",
  "single-column": "Colonne unique",
};

/** Short style descriptors surfaced as tags on each card. */
function styleTags(def: EditorTemplate["definition"]): string[] {
  const tags: string[] = [];
  tags.push(def.headerStyle === "band" ? "Titres pleins" : "Titres soulignés");
  if (def.photo) tags.push("Photo");
  tags.push(
    def.skillsStyle === "bricks"
      ? "Compétences en chips"
      : def.skillsStyle === "list"
        ? "Compétences en liste"
        : "Compétences en ligne"
  );
  return tags;
}

export function TemplatePickerDialog({
  templates,
  selectedId,
  onSelect,
}: {
  templates: EditorTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]!;

  // Group by skeleton (layout), filtered by the search query on name/category.
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

  // Open/close housekeeping: lock body scroll, focus the search field on open,
  // restore focus to the trigger on close, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  function choose(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-primary/50 hover:bg-accent"
        aria-haspopup="dialog"
      >
        <span className="w-9 shrink-0">
          <TemplateSwatch
            layout={selected.definition.layout}
            colors={selected.definition.colors.sidebar}
            band={selected.definition.colors.band}
          />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] font-normal text-muted-foreground">Modèle</span>
          <span className="max-w-[9rem] truncate">{selected.name}</span>
        </span>
        <LayoutTemplate
          className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden
        />
      </button>

      {open ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss duplicates the Escape key and the explicit close button
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-4 sm:rounded-2xl sm:zoom-in-95"
          >
            <header className="flex items-center gap-3 border-b px-5 py-4">
              <div className="flex-1">
                <h2 id={titleId} className="font-display text-lg font-bold">
                  Choisir un modèle
                </h2>
                <p className="text-xs text-muted-foreground">
                  {matchCount} modèle{matchCount > 1 ? "s" : ""} disponible
                  {matchCount > 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </header>

            <div className="border-b px-5 py-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un modèle ou un type…"
                  aria-label="Rechercher un modèle"
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {matchCount === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Aucun modèle ne correspond à « {query} ».
                </p>
              ) : (
                <div className="space-y-6">
                  {groups.map(([label, list]) => (
                    <section key={label} aria-label={label}>
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {list.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {list.map((t) => {
                          const isSelected = t.id === selectedId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => choose(t.id)}
                              aria-pressed={isSelected}
                              className={cn(
                                "group relative flex flex-col gap-2 rounded-xl border bg-card p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                                isSelected
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "hover:border-primary/40"
                              )}
                            >
                              {isSelected ? (
                                <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                                  <Check className="size-3.5" aria-hidden />
                                </span>
                              ) : null}
                              <TemplateSwatch
                                layout={t.definition.layout}
                                colors={t.definition.colors.sidebar}
                                band={t.definition.colors.band}
                              />
                              <span className="truncate text-sm font-medium">{t.name}</span>
                              <span className="flex flex-wrap gap-1">
                                {styleTags(t.definition).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
