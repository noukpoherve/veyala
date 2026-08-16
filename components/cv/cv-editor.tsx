"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, FileText, Loader2, Mail, Palette, Save } from "lucide-react";
import type { CVData } from "@/lib/cv-schema";
import {
  isEmptyStyleOverride,
  resolveDefinition,
  type ColorsOverride,
  type SectionId,
  type StyleOverride,
  type TemplateDefinition,
} from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { saveCvEdits } from "@/app/(app)/cv/[id]/edit/actions";
import { exportFilename } from "@/lib/export-filename";
import { cn } from "@/lib/utils";
import { USER_ERRORS } from "@/lib/user-facing-error";
import { CvFields } from "@/components/cv/cv-fields";
import { CustomizationStudio } from "@/components/cv/customization-studio";
import { PrintPreview } from "@/components/cv/print-preview";
import { ExportButtons } from "@/components/cv/export-buttons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface EditorTemplate {
  id: string;
  name: string;
  definition: TemplateDefinition;
}

type PreviewTab = "cv" | "letter";

export function CvEditor({
  cvId,
  jobTitle,
  initialData,
  initialLetter,
  initialTemplateId,
  initialStyleOverride,
  initialPdfUrl,
  initialDocxUrl,
  templates,
}: {
  cvId: string;
  jobTitle: string;
  initialData: CVData;
  initialLetter: string;
  initialTemplateId: string;
  initialStyleOverride?: StyleOverride;
  initialPdfUrl?: string | null;
  initialDocxUrl?: string | null;
  templates: EditorTemplate[];
}) {
  const form = useForm<CVData>({ defaultValues: initialData });
  const [letter, setLetter] = useState(initialLetter);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [styleOverride, setStyleOverride] = useState<StyleOverride | undefined>(
    initialStyleOverride
  );
  const [tab, setTab] = useState<PreviewTab>("cv");
  const [studioOpen, setStudioOpen] = useState(false);
  // Mobile only (lg: ignores this — both columns show side by side there).
  // Below lg, the form and the preview/Personnaliser column used to just
  // stack, burying the preview + "Personnaliser l'apparence" at the bottom
  // of a long form — reachable in the DOM but not in practice (confirmed in
  // the UX audit). A 2-way toggle keeps both one tap away instead.
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // Downloads point at the last saved exports; refreshed after each save.
  const [downloads, setDownloads] = useState({
    pdfUrl: initialPdfUrl ?? "",
    docxUrl: initialDocxUrl ?? "",
  });
  // Edits since the last save make the current downloads stale.
  const [dirty, setDirty] = useState(false);

  // Live preview: every keystroke updates the form values; the deferred value
  // keeps typing smooth while the iframe re-renders in the background.
  const values = form.watch();
  const deferred = useDeferredValue(JSON.stringify(values));
  const deferredLetter = useDeferredValue(letter);

  // Effective definition: the chosen template's palette with the user's
  // per-CV colour overrides merged on top, so the preview reflects both.
  const baseTemplate = useMemo(
    () => templates.find((t) => t.id === templateId)?.definition ?? templates[0]!.definition,
    [templates, templateId]
  );
  const definition = useMemo(
    () =>
      resolveDefinition(baseTemplate, {
        override: styleOverride,
        photoUrl: values.identity?.photoUrl,
      }),
    [baseTemplate, styleOverride, values.identity?.photoUrl]
  );

  const patchColors = (patch: ColorsOverride) =>
    setStyleOverride((prev) => ({ ...prev, colors: { ...prev?.colors, ...patch } }));
  const setPhoto = (show: boolean) => setStyleOverride((prev) => ({ ...prev, photo: show }));
  const setPhotoShape = (shape: "circle" | "square") =>
    setStyleOverride((prev) => ({ ...prev, photoShape: shape }));
  const setLogo = (dataUrl: string) => setStyleOverride((prev) => ({ ...prev, logo: dataUrl }));
  const setSkillsStyle = (skillsStyle: TemplateDefinition["skillsStyle"]) =>
    setStyleOverride((prev) => ({ ...prev, skillsStyle }));
  const setChipStyle = (chipStyle: NonNullable<StyleOverride["chipStyle"]>) =>
    setStyleOverride((prev) => ({ ...prev, chipStyle }));
  const patchChipColors = (patch: {
    chipBackground?: string;
    chipText?: string;
    chipBorder?: string;
  }) => setStyleOverride((prev) => ({ ...prev, ...patch }));
  const setSidebarDecor = (sidebarDecor: boolean) =>
    setStyleOverride((prev) => ({ ...prev, sidebarDecor }));
  const setSections = (next: { sidebarSections: SectionId[]; mainSections: SectionId[] }) =>
    setStyleOverride((prev) => ({
      ...prev,
      sidebarSections: next.sidebarSections,
      mainSections: next.mainSections,
    }));
  const resetSections = () =>
    setStyleOverride((prev) => {
      if (!prev) return prev;
      const { sidebarSections: _s, mainSections: _m, ...rest } = prev;
      return Object.keys(rest).length ? rest : undefined;
    });

  // Any edit after mount makes the saved exports stale until the next save.
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-runs whenever an edited value changes to mark exports stale; the values aren't read inside
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setDirty(true);
  }, [deferred, deferredLetter, templateId, styleOverride]);

  const parsedData = useMemo(() => JSON.parse(deferred) as CVData, [deferred]);
  // The CV is rendered on its own (not just when its tab is active) so the
  // customisation studio can always show it large and live.
  const cvHtml = useMemo(() => renderCVHtml(parsedData, definition), [parsedData, definition]);
  const previewHtml = useMemo(
    () =>
      tab === "cv"
        ? cvHtml
        : renderCoverLetterHtml(parsedData, { body: deferredLetter, jobTitle }, definition),
    [tab, cvHtml, parsedData, deferredLetter, definition, jobTitle]
  );

  async function onSave() {
    setStatus("saving");
    setErrorMessage("");
    const result = await saveCvEdits({
      cvId,
      templateId,
      styleOverride,
      data: form.getValues(),
      coverLetter: letter,
    });
    if (result.ok) {
      setDownloads({ pdfUrl: result.pdfUrl, docxUrl: result.docxUrl });
      setDirty(false);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } else {
      setErrorMessage(result.error || USER_ERRORS.saveCv);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {status === "error" ? (
        <Alert variant="error" title="Enregistrement impossible">
          {errorMessage}
        </Alert>
      ) : null}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackLink href={`/cv/${cvId}`}>Retour à l&apos;aperçu</BackLink>
          <h1 className="font-display text-lg font-bold">Éditeur : {jobTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" ? (
            <span role="status" className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" aria-hidden />
              Enregistré. Fichiers Word et PDF régénérés
            </span>
          ) : null}
          <Button variant="gradient" onClick={() => void onSave()} disabled={status === "saving"}>
            {status === "saving" ? <Loader2 className="animate-spin" /> : <Save />}
            Enregistrer
          </Button>
          <ExportButtons
            docxUrl={downloads.docxUrl}
            pdfUrl={downloads.pdfUrl}
            docxName={exportFilename("cv", parsedData.identity.fullName, "docx")}
            pdfName={exportFilename("cv", parsedData.identity.fullName, "pdf")}
            dirty={dirty}
          />
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Vue de l'éditeur"
        className="inline-flex rounded-md border p-0.5 lg:hidden"
      >
        <button
          id="cv-editor-tab-form"
          type="button"
          role="tab"
          aria-selected={mobileView === "form"}
          aria-controls="cv-editor-panel-form"
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium",
            mobileView === "form" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => setMobileView("form")}
        >
          Formulaire
        </button>
        <button
          id="cv-editor-tab-preview"
          type="button"
          role="tab"
          aria-selected={mobileView === "preview"}
          aria-controls="cv-editor-panel-preview"
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium",
            mobileView === "preview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
          onClick={() => setMobileView("preview")}
        >
          Aperçu
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: form. Below lg, hidden while the mobile toggle above is on "preview". */}
        <section
          id="cv-editor-panel-form"
          role="tabpanel"
          aria-labelledby="cv-editor-tab-form"
          className={cn(mobileView === "preview" && "hidden lg:block", "min-w-0 space-y-6")}
        >
          <CvFields form={form} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-primary" aria-hidden />
                Lettre de motivation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={14}
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                placeholder="Madame, Monsieur,&#10;&#10;…"
                aria-label="Texte de la lettre de motivation"
              />
            </CardContent>
          </Card>
        </section>

        {/* Right column: live preview. Below lg, hidden while the mobile toggle above is on "form". */}
        <section
          id="cv-editor-panel-preview"
          role="tabpanel"
          aria-labelledby="cv-editor-tab-preview"
          className={cn(
            mobileView === "form" && "hidden lg:block",
            "min-w-0 lg:sticky lg:top-4 lg:self-start"
          )}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Document affiché"
                className="inline-flex rounded-md border p-0.5"
              >
                <button
                  id="cv-editor-tab-cv"
                  type="button"
                  role="tab"
                  aria-selected={tab === "cv"}
                  aria-controls="cv-editor-panel-document"
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium",
                    tab === "cv" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setTab("cv")}
                >
                  <FileText className="size-4" aria-hidden />
                  CV
                </button>
                <button
                  id="cv-editor-tab-letter"
                  type="button"
                  role="tab"
                  aria-selected={tab === "letter"}
                  aria-controls="cv-editor-panel-document"
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium",
                    tab === "letter"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setTab("letter")}
                >
                  <Mail className="size-4" aria-hidden />
                  Lettre
                </button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setStudioOpen(true)}>
                <Palette className="size-4" aria-hidden />
                Personnaliser l&apos;apparence
              </Button>
            </div>

            <div
              id="cv-editor-panel-document"
              role="tabpanel"
              aria-labelledby={tab === "cv" ? "cv-editor-tab-cv" : "cv-editor-tab-letter"}
            >
              <PrintPreview
                srcDoc={previewHtml}
                title={tab === "cv" ? "Aperçu du CV" : "Aperçu de la lettre"}
                className="rounded-xl border shadow-sm"
              />
            </div>
          </div>
        </section>
      </div>

      <CustomizationStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        templates={templates}
        selectedId={templateId}
        onSelect={setTemplateId}
        colors={definition.colors}
        photo={definition.photo}
        photoShape={definition.photoShape}
        hasPhoto={Boolean(parsedData.identity.photoUrl)}
        logo={definition.logo}
        hasOverride={!isEmptyStyleOverride(styleOverride)}
        skillsStyle={definition.skillsStyle}
        chipStyle={definition.chipStyle ?? "solid"}
        chipBackground={definition.chipBackground}
        chipText={definition.chipText}
        chipBorder={definition.chipBorder}
        sidebarDecor={definition.sidebarDecor !== false}
        hasSidebarDecorAsset={Boolean(baseTemplate.sidebarImageAsset)}
        layout={definition.layout}
        templateSidebar={baseTemplate.sidebarSections}
        templateMain={baseTemplate.mainSections}
        sidebarSections={definition.sidebarSections}
        mainSections={definition.mainSections}
        onChangeColors={patchColors}
        onChangePhoto={setPhoto}
        onChangePhotoShape={setPhotoShape}
        onChangeLogo={setLogo}
        onChangeSkillsStyle={setSkillsStyle}
        onChangeChipStyle={setChipStyle}
        onChangeChipColors={patchChipColors}
        onChangeSidebarDecor={setSidebarDecor}
        onChangeSections={setSections}
        onResetSections={resetSections}
        onReset={() => setStyleOverride(undefined)}
        cvHtml={cvHtml}
      />
    </div>
  );
}
