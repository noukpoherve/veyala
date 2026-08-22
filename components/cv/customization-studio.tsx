"use client";

import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Search, Wand2, X } from "lucide-react";
import type { EditorTemplate } from "@/components/cv/cv-editor";
import { DesignControls } from "@/components/cv/design-controls";
import { SectionLayoutControls } from "@/components/cv/section-layout-controls";
import { TemplateSwatch } from "@/components/templates/template-swatch";
import type {
  ChipStyle,
  ColorsOverride,
  SectionId,
  TemplateDefinition,
} from "@/lib/templates/definition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/i18n/locale-provider";

/**
 * Full-screen "appearance studio": an in-place overlay (no route change, same
 * URL, no reload) that puts the CV large in the centre with templates on the
 * left and colours on the right, all previewed live. Keeps the day-to-day
 * editor uncluttered — heavy visual customisation happens here, then "Terminé"
 * returns to the editor with the changes already applied.
 */

const CATEGORY_KEYS: Record<
  EditorTemplate["definition"]["layout"],
  "sidebarLeft" | "singleColumn"
> = {
  "sidebar-left": "sidebarLeft",
  "single-column": "singleColumn",
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
  logo,
  hasOverride,
  skillsStyle,
  chipStyle,
  chipBackground,
  chipText,
  chipBorder,
  sidebarDecor,
  hasSidebarDecorAsset,
  layout,
  templateSidebar,
  templateMain,
  sidebarSections,
  mainSections,
  onChangeColors,
  onChangePhoto,
  onChangePhotoShape,
  onChangeLogo,
  onChangeSkillsStyle,
  onChangeChipStyle,
  onChangeChipColors,
  onChangeSidebarDecor,
  onChangeSections,
  onResetSections,
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
  logo?: string;
  hasOverride: boolean;
  skillsStyle: TemplateDefinition["skillsStyle"];
  chipStyle: ChipStyle;
  chipBackground?: string;
  chipText?: string;
  chipBorder?: string;
  sidebarDecor: boolean;
  hasSidebarDecorAsset: boolean;
  layout: TemplateDefinition["layout"];
  templateSidebar: SectionId[];
  templateMain: SectionId[];
  sidebarSections: SectionId[];
  mainSections: SectionId[];
  onChangeColors: (patch: ColorsOverride) => void;
  onChangePhoto: (show: boolean) => void;
  onChangePhotoShape: (shape: "circle" | "square") => void;
  onChangeLogo: (dataUrl: string) => void;
  onChangeSkillsStyle: (style: TemplateDefinition["skillsStyle"]) => void;
  onChangeChipStyle: (style: ChipStyle) => void;
  onChangeChipColors: (patch: {
    chipBackground?: string;
    chipText?: string;
    chipBorder?: string;
  }) => void;
  onChangeSidebarDecor: (show: boolean) => void;
  onChangeSections: (next: { sidebarSections: SectionId[]; mainSections: SectionId[] }) => void;
  onResetSections: () => void;
  onReset: () => void;
  cvHtml: string;
}) {
  const [query, setQuery] = useState("");
  // Below lg, the 3-column layout (templates / preview / appearance) doesn't
  // fit — each column's natural height stacked in one scroll made "Terminé"
  // unreachable without scrolling past a near-full-height preview first.
  // Same pattern as the CV editor's own mobile Formulaire/Aperçu toggle.
  const [mobileSection, setMobileSection] = useState<"templates" | "preview" | "customize">(
    "customize"
  );
  const studio = useMessages().forms.studio;

  const groups = useMemo<[string, EditorTemplate[]][]>(() => {
    const q = query.trim().toLowerCase();
    const byLayout = new Map<string, EditorTemplate[]>();
    for (const t of templates) {
      const label = studio.layouts[CATEGORY_KEYS[t.definition.layout]] ?? studio.layouts.other;
      if (q && !t.name.toLowerCase().includes(q) && !label.toLowerCase().includes(q)) continue;
      const list = byLayout.get(label);
      if (list) list.push(t);
      else byLayout.set(label, [t]);
    }
    return Array.from(byLayout.entries());
  }, [templates, query, studio.layouts]);

  const matchCount = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        {/*
         * Radix Dialog.Content, not the styled <DialogContent> primitive —
         * this "studio" is a full-screen 3-column layout, not a centered
         * modal box, so it keeps its own markup. What it gains from Radix:
         * focus trap and Escape handling, which the hand-rolled version
         * (manual keydown listener, no focus trap) was missing — a gap
         * flagged in the UX audit.
         */}
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-background focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in">
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
            <DialogPrimitive.Title asChild>
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Wand2 className="size-4 text-primary" aria-hidden />
                {studio.title}
              </h2>
            </DialogPrimitive.Title>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {studio.liveNotice}
              </span>
              <Button variant="gradient" size="sm" onClick={onClose}>
                <Check className="size-4" aria-hidden />
                {studio.done}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label={studio.closeAria}>
                <X className="size-5" aria-hidden />
              </Button>
            </div>
          </header>

          <div
            role="tablist"
            aria-label={studio.sectionSwitcher}
            className="flex gap-1 border-b p-2 lg:hidden"
          >
            {(
              [
                { key: "templates", label: studio.templatesTab },
                { key: "preview", label: studio.previewTab },
                { key: "customize", label: studio.customizeTab },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                id={`studio-tab-${item.key}`}
                type="button"
                role="tab"
                aria-selected={mobileSection === item.key}
                aria-controls={`studio-panel-${item.key}`}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
                  mobileSection === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setMobileSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(200px,15rem)_1fr_minmax(15rem,19rem)] lg:overflow-hidden">
            {/* Left rail: templates */}
            <aside
              id="studio-panel-templates"
              role="tabpanel"
              aria-labelledby="studio-tab-templates"
              className={cn(
                "min-h-0 flex-col border-b bg-muted/20 lg:flex lg:border-b-0 lg:border-r",
                mobileSection === "templates" ? "flex flex-1" : "hidden"
              )}
            >
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
                    placeholder={studio.searchPlaceholder}
                    aria-label={studio.searchAria}
                    className="h-9 w-full rounded-lg border bg-background pl-8 pr-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
                {matchCount === 0 ? (
                  <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                    {studio.noMatch(query)}
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

            {/* Centre: the CV as a document viewer — a readable-width page that
            fills the height, scrolling internally to reveal multi-page CVs
            (a fixed A4 ratio would crop anything past the first page). */}
            <div
              id="studio-panel-preview"
              role="tabpanel"
              aria-labelledby="studio-tab-preview"
              className={cn(
                "min-h-0 justify-center overflow-hidden bg-muted/40 p-4 sm:p-6 lg:flex",
                mobileSection === "preview" ? "flex flex-1" : "hidden"
              )}
            >
              <div className="h-full w-full max-w-[54rem] overflow-hidden rounded-xl border bg-white shadow-lg">
                <iframe
                  srcDoc={cvHtml}
                  title={studio.cvPreview}
                  className="size-full bg-white"
                  sandbox=""
                />
              </div>
            </div>

            {/* Right rail: appearance first, sections at the bottom */}
            <aside
              id="studio-panel-customize"
              role="tabpanel"
              aria-labelledby="studio-tab-customize"
              className={cn(
                "min-h-0 space-y-3 overflow-y-auto border-t bg-muted/20 p-3 lg:block lg:border-l lg:border-t-0",
                mobileSection === "customize" ? "block flex-1" : "hidden"
              )}
            >
              <DesignControls
                colors={colors}
                photo={photo}
                photoShape={photoShape}
                hasPhoto={hasPhoto}
                logo={logo}
                hasOverride={hasOverride}
                skillsStyle={skillsStyle}
                chipStyle={chipStyle}
                chipBackground={chipBackground}
                chipText={chipText}
                chipBorder={chipBorder}
                sidebarDecor={sidebarDecor}
                hasSidebarDecorAsset={hasSidebarDecorAsset}
                onChangeColors={onChangeColors}
                onChangePhoto={onChangePhoto}
                onChangePhotoShape={onChangePhotoShape}
                onChangeLogo={onChangeLogo}
                onChangeSkillsStyle={onChangeSkillsStyle}
                onChangeChipStyle={onChangeChipStyle}
                onChangeChipColors={onChangeChipColors}
                onChangeSidebarDecor={onChangeSidebarDecor}
                onReset={onReset}
              />
              <div className="rounded-xl border bg-card p-3.5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {studio.sectionsTitle}
                </h3>
                <SectionLayoutControls
                  layout={layout}
                  templateSidebar={templateSidebar}
                  templateMain={templateMain}
                  sidebarSections={sidebarSections}
                  mainSections={mainSections}
                  onChange={onChangeSections}
                  onReset={onResetSections}
                />
              </div>
            </aside>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
