"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoherenceItem } from "@/lib/campus-france/coherence-score";
import { PROJECT_MAX, PROJECT_MIN } from "@/lib/campus-france/schema";
import { resolveApiError, toUserMessage } from "@/lib/user-facing-error";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { Link, useLocalizedRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { TemplateOptionCard } from "@/components/templates/template-option";
import { CoherencePanel } from "@/components/campus-france/coherence-panel";
import { PipelineTimeline } from "@/components/generate/pipeline-timeline";
import { StatCard } from "@/components/ui/stat-card";
import {
  CV_LANGUAGE_OPTIONS,
  validateCvLanguage,
  validateInstructions,
  validateJobText,
} from "@/lib/job-field-validation";
import { CV_LANGUAGE_LABEL_KEYS, type TemplateOption } from "@/components/generate/generate-form";

const PIPELINE_STEP_IDS = [
  "reading_offer",
  "analyzing_requirements",
  "scoring_before",
  "writing_letter",
  "adapting_cv",
  "rendering_exports",
  "scoring_after",
] as const;

type StepId = (typeof PIPELINE_STEP_IDS)[number];

function isStepId(value: string): value is StepId {
  return (PIPELINE_STEP_IDS as readonly string[]).includes(value);
}

type AnalyzeResponse = {
  ok?: boolean;
  error?: string;
  programText?: string;
  projectsProposed?: boolean;
  studyProject?: string;
  professionalProject?: string;
  before?: { score: number; covered: number; total: number };
  gaps?: CoherenceItem[];
  requirements?: {
    title?: string;
    domain?: string;
    level?: string;
  };
};

export function CampusFranceForm({
  templates,
  balance,
  disabled,
}: {
  templates: TemplateOption[];
  balance: number;
  disabled: boolean;
}) {
  const m = useMessages();
  const locale = useLocale();
  const t = m.forms.campusFrance;
  const router = useLocalizedRouter();
  const [mode, setMode] = useState<"text" | "url">("text");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [phase, setPhase] = useState<"compose" | "review" | "generating">("compose");
  const [analyzing, startAnalyze] = useTransition();
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [programPayload, setProgramPayload] = useState<{
    programText?: string;
    programUrl?: string;
  }>({});
  const [projects, setProjects] = useState({
    studyProject: "",
    professionalProject: "",
  });
  const [options, setOptions] = useState({
    instructions: "",
    language: "",
  });
  const [beforeScore, setBeforeScore] = useState(0);
  const [covered, setCovered] = useState(0);
  const [total, setTotal] = useState(0);
  const [gaps, setGaps] = useState<CoherenceItem[]>([]);
  const [programMeta, setProgramMeta] = useState<{
    title?: string;
    domain?: string;
    level?: string;
  }>({});
  const [projectsProposed, setProjectsProposed] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepId | "done" | null>(null);
  const [scoreBeforeLive, setScoreBeforeLive] = useState<number | null>(null);
  const [scoreAfterLive, setScoreAfterLive] = useState<number | null>(null);

  const pipelineSteps = [
    { id: "reading_offer", label: t.steps.readingProgram },
    { id: "analyzing_requirements", label: t.steps.analyzingCriteria },
    { id: "scoring_before", label: t.steps.scoringBefore },
    { id: "writing_letter", label: m.app.coverLetter },
    { id: "adapting_cv", label: t.steps.academicCv },
    { id: "rendering_exports", label: m.forms.wizard.exportsStep },
    { id: "scoring_after", label: t.steps.scoringAfter },
  ];

  const noCredits = balance <= 0;

  useEffect(() => {
    if (!error || !errorRef.current) return;
    errorRef.current.focus();
    errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [error]);

  const showError = useCallback((title: string, message: string) => {
    setError({ title, message });
  }, []);

  function readComposeForm(form: HTMLFormElement) {
    const data = new FormData(form);
    return {
      programUrl:
        mode === "url" ? String(data.get("programUrl") ?? "").trim() || undefined : undefined,
      programText:
        mode === "text" ? String(data.get("programText") ?? "").trim() || undefined : undefined,
      instructions: String(data.get("instructions") ?? "").trim(),
      language: String(data.get("language") ?? "").trim(),
    };
  }

  function applyAnalyzeResult(body: AnalyzeResponse) {
    if (!body.before) return;
    setBeforeScore(body.before.score);
    setCovered(body.before.covered);
    setTotal(body.before.total);
    setGaps(body.gaps ?? []);
    setProgramMeta({
      title: body.requirements?.title,
      domain: body.requirements?.domain,
      level: body.requirements?.level,
    });
    if (body.studyProject && body.professionalProject) {
      setProjects({
        studyProject: body.studyProject,
        professionalProject: body.professionalProject,
      });
    }
    setProjectsProposed(Boolean(body.projectsProposed));
    if (body.programText) setProgramPayload({ programText: body.programText });
  }

  function onAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const fields = readComposeForm(form);
    const validationError =
      validateCvLanguage(fields.language) ||
      validateInstructions(fields.instructions) ||
      (fields.programText ? validateJobText(fields.programText) : null);
    if (validationError) {
      showError(m.forms.wizard.invalidFields, validationError);
      return;
    }
    setOptions({
      instructions: fields.instructions,
      language: fields.language,
    });
    setProgramPayload({ programText: fields.programText, programUrl: fields.programUrl });

    startAnalyze(async () => {
      try {
        const res = await fetch("/api/campus-france/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programText: fields.programText,
            programUrl: fields.programUrl,
            language: fields.language || undefined,
            instructions: fields.instructions || undefined,
          }),
        });
        const body = (await res.json().catch(() => null)) as AnalyzeResponse | null;
        if (!res.ok || !body?.before || !body.studyProject || !body.professionalProject) {
          throw new Error(resolveApiError(res.status, body, m.errors.analyze, locale));
        }
        applyAnalyzeResult(body);
        setPhase("review");
      } catch (e) {
        const message = toUserMessage(e, m.errors.analyze, locale);
        if (message === m.errors.network || /indisponible|unavailable|502|503|500/i.test(message)) {
          router.push("/erreur?reason=analyze&back=/campus-france");
          return;
        }
        showError(m.forms.wizard.analyzeFailed, message);
      }
    });
  }

  function reanalyze(mode: "propose" | "rescore") {
    setError(null);
    if (mode === "rescore") {
      if (projects.studyProject.trim().length < PROJECT_MIN) {
        showError(t.studyProject, t.projectTooShort(PROJECT_MIN));
        return;
      }
      if (projects.professionalProject.trim().length < PROJECT_MIN) {
        showError(t.professionalProject, t.projectTooShort(PROJECT_MIN));
        return;
      }
    }

    startAnalyze(async () => {
      try {
        const res = await fetch("/api/campus-france/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...programPayload,
            language: options.language || undefined,
            instructions: options.instructions || undefined,
            ...(mode === "rescore"
              ? {
                  studyProject: projects.studyProject,
                  professionalProject: projects.professionalProject,
                }
              : {}),
          }),
        });
        const body = (await res.json().catch(() => null)) as AnalyzeResponse | null;
        if (!res.ok || !body?.before || !body.studyProject || !body.professionalProject) {
          throw new Error(resolveApiError(res.status, body, m.errors.analyze, locale));
        }
        applyAnalyzeResult(body);
      } catch (e) {
        showError(
          mode === "propose" ? t.proposeAgainFailed : t.rescoreFailed,
          toUserMessage(e, m.errors.analyze, locale)
        );
      }
    });
  }

  async function onGenerate() {
    setError(null);
    if (projects.studyProject.trim().length < PROJECT_MIN) {
      showError(t.studyProject, t.projectTooShortToGenerate(PROJECT_MIN));
      return;
    }
    if (projects.professionalProject.trim().length < PROJECT_MIN) {
      showError(t.professionalProject, t.projectTooShortToGenerate(PROJECT_MIN));
      return;
    }

    setPhase("generating");
    setActiveStep("reading_offer");
    setScoreBeforeLive(beforeScore);
    setScoreAfterLive(null);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const enqueueRes = await fetch("/api/campus-france/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...programPayload,
          studyProject: projects.studyProject,
          professionalProject: projects.professionalProject,
          templateId: templateId || undefined,
          instructions: options.instructions || undefined,
          language: options.language || undefined,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const enqueueBody = (await enqueueRes.json().catch(() => null)) as {
        jobId?: string;
        error?: string;
      } | null;
      if (!enqueueRes.ok || !enqueueBody?.jobId) {
        throw new Error(resolveApiError(enqueueRes.status, enqueueBody, m.errors.generate, locale));
      }

      const jobId = enqueueBody.jobId;
      const runPromise = fetch(`/api/campus-france/generate/${jobId}/run`, {
        method: "POST",
      }).catch(() => null);

      type JobStatus = {
        status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
        step: string | null;
        scoreBefore: number | null;
        scoreAfter: number | null;
        error: string | null;
        generatedCvId: string | null;
      };

      const deadline = Date.now() + 90_000;
      let doneId: string | null = null;

      while (Date.now() < deadline) {
        const statusRes = await fetch(`/api/campus-france/generate/${jobId}`, {
          cache: "no-store",
        });
        const job = (await statusRes.json().catch(() => null)) as JobStatus | null;
        if (!statusRes.ok || !job) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }

        if (job.step && isStepId(job.step)) {
          setActiveStep(job.step);
        }
        if (typeof job.scoreBefore === "number") setScoreBeforeLive(job.scoreBefore);
        if (typeof job.scoreAfter === "number") setScoreAfterLive(job.scoreAfter);

        if (job.status === "SUCCEEDED" && job.generatedCvId) {
          doneId = job.generatedCvId;
          setActiveStep("done");
          break;
        }
        if (job.status === "FAILED") {
          throw new Error(job.error?.trim() || m.errors.generate);
        }

        await new Promise((r) => setTimeout(r, 450));
      }

      await runPromise;

      if (!doneId) throw new Error(m.errors.generate);
      router.push(`/cv/${doneId}`);
    } catch (e) {
      idempotencyKeyRef.current = null;
      const message = toUserMessage(e, m.errors.generate, locale);
      if (
        message === m.errors.network ||
        message === m.errors.generate ||
        /indisponible|remboursé|unavailable|refunded|502|503|500/i.test(message)
      ) {
        router.push("/erreur?reason=generate&back=/campus-france");
        return;
      }
      showError(m.forms.wizard.generateInterrupted, message);
      setPhase("review");
      setActiveStep(null);
    }
  }

  return (
    <div className="space-y-6">
      {phase === "compose" || phase === "review" ? (
        <form onSubmit={onAnalyze} className="space-y-6" aria-busy={analyzing}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.programStep}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="tablist"
                aria-label={t.programSource}
                className="inline-flex rounded-md border p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "text"}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium",
                    mode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setMode("text")}
                >
                  {m.forms.wizard.pastedText}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "url"}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium",
                    mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setMode("url")}
                >
                  {t.programUrl}
                </button>
              </div>

              {mode === "text" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="programText">{t.programTextLabel}</Label>
                  <Textarea
                    id="programText"
                    name="programText"
                    rows={8}
                    required={phase === "compose"}
                    defaultValue={programPayload.programText}
                    placeholder={t.programTextPlaceholder}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="programUrl">{t.programUrl}</Label>
                  <Input
                    id="programUrl"
                    name="programUrl"
                    type="url"
                    required={phase === "compose"}
                    defaultValue={programPayload.programUrl}
                    placeholder={m.forms.wizard.urlPlaceholder}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.templateStep}</CardTitle>
            </CardHeader>
            <CardContent>
              <fieldset className="grid gap-3 sm:grid-cols-3">
                <legend className="sr-only">{m.forms.wizard.templateLegend}</legend>
                {templates.map((tpl) => (
                  <TemplateOptionCard
                    key={tpl.id}
                    id={tpl.id}
                    name={tpl.name}
                    swatch={{ layout: tpl.layout, colors: tpl.colors, band: tpl.band }}
                    selected={templateId === tpl.id}
                    onSelect={() => setTemplateId(tpl.id)}
                    groupName="template"
                  />
                ))}
              </fieldset>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{m.forms.wizard.optionsStep}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="language">{t.languageLabel}</Label>
                <select
                  id="language"
                  name="language"
                  defaultValue={options.language}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CV_LANGUAGE_OPTIONS.map((opt) => {
                    const key = CV_LANGUAGE_LABEL_KEYS[opt.value];
                    return (
                      <option key={opt.value || "default"} value={opt.value}>
                        {key ? m.forms.cvLanguages[key] : opt.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="instructions">{m.forms.wizard.instructionsLabel}</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  rows={2}
                  defaultValue={options.instructions}
                  maxLength={1000}
                  placeholder={t.instructionsPlaceholder}
                />
              </div>
            </CardContent>
          </Card>

          {phase === "compose" ? (
            <div className="space-y-3">
              {error ? (
                <Alert ref={errorRef} variant="warning" title={error.title}>
                  {error.message}
                </Alert>
              ) : null}
              <Button type="submit" variant="gradient" size="lg" disabled={disabled || analyzing}>
                {analyzing ? <Loader2 className="animate-spin" /> : <Search />}
                {analyzing ? t.analyzing : t.analyzeCta}
              </Button>
              <p className="text-xs text-muted-foreground">{t.analyzeHint}</p>
            </div>
          ) : null}
        </form>
      ) : null}

      {phase === "review" ? (
        <div className="space-y-4">
          {error ? (
            <Alert ref={errorRef} variant="warning" title={error.title}>
              {error.message}
            </Alert>
          ) : null}

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{t.projectsTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {projectsProposed ? t.projectsDraftHint : t.projectsUpdatedHint}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="studyProject">{t.studyProject}</Label>
                <Textarea
                  id="studyProject"
                  rows={7}
                  value={projects.studyProject}
                  onChange={(e) =>
                    setProjects((p) => ({
                      ...p,
                      studyProject: e.target.value.slice(0, PROJECT_MAX),
                    }))
                  }
                  maxLength={PROJECT_MAX}
                />
                <p className="text-xs text-muted-foreground">
                  {t.projectCounter(projects.studyProject.trim().length, PROJECT_MAX, PROJECT_MIN)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="professionalProject">{t.professionalProject}</Label>
                <Textarea
                  id="professionalProject"
                  rows={7}
                  value={projects.professionalProject}
                  onChange={(e) =>
                    setProjects((p) => ({
                      ...p,
                      professionalProject: e.target.value.slice(0, PROJECT_MAX),
                    }))
                  }
                  maxLength={PROJECT_MAX}
                />
                <p className="text-xs text-muted-foreground">
                  {t.projectCounter(
                    projects.professionalProject.trim().length,
                    PROJECT_MAX,
                    PROJECT_MIN
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => reanalyze("propose")}
                >
                  {analyzing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  {t.proposeAgain}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => reanalyze("rescore")}
                >
                  {t.rescore}
                </Button>
              </div>
            </CardContent>
          </Card>

          <CoherencePanel
            beforeScore={beforeScore}
            covered={covered}
            total={total}
            gaps={gaps}
            programTitle={programMeta.title}
            domain={programMeta.domain}
            level={programMeta.level}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhase("compose")}
              disabled={analyzing}
            >
              {t.editProgram}
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="lg"
              disabled={disabled || noCredits || analyzing}
              onClick={onGenerate}
            >
              <Sparkles />
              {t.generateCta}
            </Button>
          </div>
          {noCredits ? (
            <Alert
              variant="warning"
              title={m.forms.wizard.noCreditsTitle}
              action={
                <Link href="/billing" className="font-medium">
                  {m.forms.wizard.topUpCredits}
                </Link>
              }
            >
              {t.noCreditsBody}
            </Alert>
          ) : null}
        </div>
      ) : null}

      {phase === "generating" ? (
        <Card aria-live="polite">
          <CardHeader>
            <CardTitle className="text-base">{m.forms.wizard.generating}</CardTitle>
            <p className="text-sm text-muted-foreground">{t.generatingHint}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <PipelineTimeline steps={pipelineSteps} activeStep={activeStep} />
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                size="compact"
                label={t.coherenceBefore}
                value={`${scoreBeforeLive ?? beforeScore}%`}
              />
              <StatCard
                size="compact"
                emphasis
                label={t.coherenceAfter}
                value={scoreAfterLive !== null ? `${scoreAfterLive}%` : "…"}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
