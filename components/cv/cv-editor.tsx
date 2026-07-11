"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, FileText, Loader2, Mail, Save } from "lucide-react";
import type { CVData } from "@/lib/cv-schema";
import type { TemplateDefinition } from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { saveCvEdits } from "@/app/(app)/cv/[id]/edit/actions";
import { cn } from "@/lib/utils";
import { CvFields } from "@/components/cv/cv-fields";
import { TemplateSwatch } from "@/components/templates/template-swatch";
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
  templates,
}: {
  cvId: string;
  jobTitle: string;
  initialData: CVData;
  initialLetter: string;
  initialTemplateId: string;
  templates: EditorTemplate[];
}) {
  const form = useForm<CVData>({ defaultValues: initialData });
  const [letter, setLetter] = useState(initialLetter);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [tab, setTab] = useState<PreviewTab>("cv");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Live preview: every keystroke updates the form values; the deferred value
  // keeps typing smooth while the iframe re-renders in the background.
  const values = form.watch();
  const deferred = useDeferredValue(JSON.stringify(values));
  const deferredLetter = useDeferredValue(letter);

  const definition = useMemo(
    () => templates.find((t) => t.id === templateId)?.definition ?? templates[0]!.definition,
    [templates, templateId]
  );

  const previewHtml = useMemo(() => {
    const data = JSON.parse(deferred) as CVData;
    return tab === "cv"
      ? renderCVHtml(data, definition)
      : renderCoverLetterHtml(data, { body: deferredLetter, jobTitle }, definition);
  }, [deferred, deferredLetter, definition, tab, jobTitle]);

  async function onSave() {
    setStatus("saving");
    setErrorMessage("");
    const result = await saveCvEdits({
      cvId,
      templateId,
      data: form.getValues(),
      coverLetter: letter,
    });
    if (result.ok) {
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

              <fieldset className="flex items-center gap-2">
                <legend className="sr-only">Template</legend>
                {templates.map((t) => (
                  <label
                    key={t.id}
                    title={t.name}
                    className={cn(
                      "w-14 cursor-pointer rounded-md border p-1 transition-colors",
                      templateId === t.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "hover:border-muted-foreground/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="editor-template"
                      value={t.id}
                      checked={templateId === t.id}
                      onChange={() => setTemplateId(t.id)}
                      className="sr-only"
                    />
                    <TemplateSwatch
                      layout={t.definition.layout}
                      colors={t.definition.colors.sidebar}
                      band={t.definition.colors.band}
                    />
                    <span className="sr-only">{t.name}</span>
                  </label>
                ))}
              </fieldset>
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
    </div>
  );
}
