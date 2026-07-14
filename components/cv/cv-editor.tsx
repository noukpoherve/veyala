"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mail,
  Palette,
  Save,
} from "lucide-react";
import type { CVData } from "@/lib/cv-schema";
import {
  applyStyleOverride,
  type ColorsOverride,
  isEmptyStyleOverride,
  type StyleOverride,
  type TemplateDefinition,
} from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { saveCvEdits } from "@/app/(app)/cv/[id]/edit/actions";
import { cn } from "@/lib/utils";
import { CvFields } from "@/components/cv/cv-fields";
import { CustomizationStudio } from "@/components/cv/customization-studio";
import { Button } from "@/components/ui/button";
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
  const definition = useMemo(() => {
    const base = templates.find((t) => t.id === templateId)?.definition ?? templates[0]!.definition;
    return applyStyleOverride(base, styleOverride);
  }, [templates, templateId, styleOverride]);

  const patchColors = (patch: ColorsOverride) =>
    setStyleOverride((prev) => ({ ...prev, colors: { ...prev?.colors, ...patch } }));
  const setPhoto = (show: boolean) => setStyleOverride((prev) => ({ ...prev, photo: show }));
  const setPhotoShape = (shape: "circle" | "square") =>
    setStyleOverride((prev) => ({ ...prev, photoShape: shape }));

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
      setErrorMessage(result.error);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/cv/${cvId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à l&apos;aperçu
          </Link>
          <h1 className="font-display text-lg font-bold">Éditeur — {jobTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" ? (
            <span role="status" className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" aria-hidden />
              Enregistré — fichiers Word et PDF régénérés
            </span>
          ) : null}
          {status === "error" ? (
            <span role="alert" className="text-sm text-destructive">
              {errorMessage}
            </span>
          ) : null}
          <Button variant="gradient" onClick={() => void onSave()} disabled={status === "saving"}>
            {status === "saving" ? <Loader2 className="animate-spin" /> : <Save />}
            Enregistrer
          </Button>
          {downloads.pdfUrl || downloads.docxUrl ? (
            <div
              className="flex items-center gap-2"
              title={dirty ? "Enregistrez pour télécharger votre dernière version." : undefined}
            >
              {downloads.pdfUrl ? (
                <Button asChild variant="outline" size="sm" aria-disabled={dirty}>
                  <a
                    href={dirty ? undefined : downloads.pdfUrl}
                    download
                    className={cn(dirty && "pointer-events-none opacity-50")}
                  >
                    <Download className="size-4" aria-hidden />
                    PDF
                  </a>
                </Button>
              ) : null}
              {downloads.docxUrl ? (
                <Button asChild variant="outline" size="sm" aria-disabled={dirty}>
                  <a
                    href={dirty ? undefined : downloads.docxUrl}
                    download
                    className={cn(dirty && "pointer-events-none opacity-50")}
                  >
                    <Download className="size-4" aria-hidden />
                    Word
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: form */}
        <section aria-label="Édition du contenu" className="space-y-6">
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

        {/* Right column: live preview */}
        <section aria-label="Aperçu en direct" className="lg:sticky lg:top-4 lg:self-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Document affiché"
                className="inline-flex rounded-md border p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "cv"}
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
                  type="button"
                  role="tab"
                  aria-selected={tab === "letter"}
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

            <div className="overflow-hidden rounded-xl border shadow-sm">
              <iframe
                srcDoc={previewHtml}
                title={tab === "cv" ? "Aperçu du CV" : "Aperçu de la lettre"}
                className="aspect-[210/297] w-full bg-white"
                sandbox=""
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
        hasOverride={!isEmptyStyleOverride(styleOverride)}
        onChangeColors={patchColors}
        onChangePhoto={setPhoto}
        onChangePhotoShape={setPhotoShape}
        onReset={() => setStyleOverride(undefined)}
        cvHtml={cvHtml}
      />
    </div>
  );
}
