"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchClaim, MatchItem } from "@/lib/match-score";
import { resolveApiError, toUserMessage } from "@/lib/user-facing-error";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import type { Messages } from "@/i18n/messages";
import { Link, useLocalizedRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { TemplateOptionCard } from "@/components/templates/template-option";
import { MatchAnalyzePanel } from "@/components/generate/match-analyze-panel";
import { PipelineTimeline } from "@/components/generate/pipeline-timeline";
import { StatCard } from "@/components/ui/stat-card";
import {
  CV_LANGUAGE_OPTIONS,
  validateCvLanguage,
  validateInstructions,
  validateJobText,
  validateJobTitle,
} from "@/lib/job-field-validation";

export interface TemplateOption {
  id: string;
  name: string;
  layout: "sidebar-left" | "single-column";
  colors: string[];
  band: string;
  isOwn: boolean;
}

/**
 * CV_LANGUAGE_OPTIONS carries the French values sent to the API; only the
 * visible label is translated. Unknown values fall back to the raw label.
 */
export const CV_LANGUAGE_LABEL_KEYS: Record<string, keyof Messages["forms"]["cvLanguages"]> = {
  "": "default",
  français: "french",
  anglais: "english",
  espagnol: "spanish",
  allemand: "german",
  italien: "italian",
  portugais: "portuguese",
  néerlandais: "dutch",
  arabe: "arabic",
};

const PIPELINE_STEP_IDS = [
  "reading_offer",
  "analyzing_requirements",
  "scoring_before",
  "adapting_cv",
  "writing_letter",
  "rendering_exports",
  "scoring_after",
] as const;

type StepId = (typeof PIPELINE_STEP_IDS)[number];

function isStepId(value: string): value is StepId {
  return (PIPELINE_STEP_IDS as readonly string[]).includes(value);
}

function claimKey(c: MatchClaim): string {
  return `${c.kind}:${c.term.toLowerCase()}`;
}

type AnalyzeResponse = {
  ok?: boolean;
  error?: string;
  jobText?: string;
  before?: { score: number; covered: number; total: number };
  projected?: { score: number };
  maxProjected?: { score: number };
  gaps?: MatchItem[];
};

export function GenerateForm({
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
  const t = m.forms.generate;
  const router = useLocalizedRouter();
  const [mode, setMode] = useState<"text" | "url">("text");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [phase, setPhase] = useState<"compose" | "review" | "generating">("compose");
  const [analyzing, startAnalyze] = useTransition();
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [jobPayload, setJobPayload] = useState<{ jobText?: string; jobUrl?: string }>({});
  const [options, setOptions] = useState({
    targetTitle: "",
    instructions: "",
    language: "",
  });
  const [beforeScore, setBeforeScore] = useState(0);
  const [projectedScore, setProjectedScore] = useState(0);
  const [maxProjected, setMaxProjected] = useState(0);
  const [gaps, setGaps] = useState<MatchItem[]>([]);
  const [claims, setClaims] = useState<MatchClaim[]>([]);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepId | "done" | null>(null);
  const [scoreBeforeLive, setScoreBeforeLive] = useState<number | null>(null);
  const [scoreAfterLive, setScoreAfterLive] = useState<number | null>(null);

  const pipelineSteps = [
    { id: "reading_offer", label: t.steps.readingOffer },
    { id: "analyzing_requirements", label: t.steps.analyzingRequirements },
    { id: "scoring_before", label: t.steps.scoringBefore },
    { id: "adapting_cv", label: t.steps.adaptingCv },
    { id: "writing_letter", label: m.app.coverLetter },
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
    setWarning(null);
    setError({ title, message });
  }, []);

  const failHard = useCallback(
    (reason: "generate" | "analyze") => {
      router.push(`/erreur?reason=${reason}&back=/generate`);
    },
    [router]
  );

  const reproject = useCallback(
    async (nextClaims: MatchClaim[]) => {
      setWarning(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...jobPayload, claims: nextClaims }),
        });
        const body = (await res.json().catch(() => null)) as AnalyzeResponse | null;
        if (!res.ok) {
          setWarning(resolveApiError(res.status, body, m.errors.reproject, locale));
          return;
        }
        if (body?.projected?.score != null) setProjectedScore(body.projected.score);
      } catch (e) {
        setWarning(toUserMessage(e, m.errors.reproject, locale));
      }
    },
    [jobPayload, locale, m.errors.reproject]
  );

  const onToggleClaim = useCallback(
    (claim: MatchClaim) => {
      setClaims((prev) => {
        const key = claimKey(claim);
        const next = prev.some((c) => claimKey(c) === key)
          ? prev.filter((c) => claimKey(c) !== key)
          : [...prev, claim];
        void reproject(next);
        return next;
      });
    },
    [reproject]
  );

  const onSelectAll = useCallback(() => {
    const next = gaps.map((g) => ({ term: g.term, kind: g.kind }));
    setClaims(next);
    void reproject(next);
  }, [gaps, reproject]);

  const onClear = useCallback(() => {
    setClaims([]);
    setProjectedScore(beforeScore);
  }, [beforeScore]);

  function readForm(form: HTMLFormElement) {
    const data = new FormData(form);
    return {
      jobUrl: mode === "url" ? String(data.get("jobUrl") ?? "").trim() || undefined : undefined,
      jobText: mode === "text" ? String(data.get("jobText") ?? "").trim() || undefined : undefined,
      targetTitle: String(data.get("targetTitle") ?? "").trim(),
      instructions: String(data.get("instructions") ?? "").trim(),
      language: String(data.get("language") ?? "").trim(),
    };
  }

  function validateOptions(fields: ReturnType<typeof readForm>): string | null {
    return (
      validateJobTitle(fields.targetTitle) ||
      validateCvLanguage(fields.language) ||
      validateInstructions(fields.instructions) ||
      (fields.jobText ? validateJobText(fields.jobText) : null)
    );
  }

  function onAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarning(null);
    const form = event.currentTarget;
    const fields = readForm(form);
    const validationError = validateOptions(fields);
    if (validationError) {
      showError(m.forms.wizard.invalidFields, validationError);
      return;
    }
    setOptions({
      targetTitle: fields.targetTitle,
      instructions: fields.instructions,
      language: fields.language,
    });
    setJobPayload({ jobText: fields.jobText, jobUrl: fields.jobUrl });

    startAnalyze(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobText: fields.jobText,
            jobUrl: fields.jobUrl,
            targetTitle: fields.targetTitle || undefined,
            language: fields.language || undefined,
          }),
        });
        const body = (await res.json().catch(() => null)) as AnalyzeResponse | null;
        if (!res.ok || !body?.before) {
          throw new Error(resolveApiError(res.status, body, m.errors.analyze, locale));
        }
        setBeforeScore(body.before.score);
        setProjectedScore(body.projected?.score ?? body.before.score);
        setMaxProjected(body.maxProjected?.score ?? body.projected?.score ?? body.before.score);
        setGaps(body.gaps ?? []);
        setClaims([]);
        if (body.jobText) setJobPayload({ jobText: body.jobText });
        setPhase("review");
      } catch (e) {
        const message = toUserMessage(e, m.errors.analyze, locale);
        if (message === m.errors.network || /indisponible|unavailable|502|503|500/i.test(message)) {
          failHard("analyze");
          return;
        }
        showError(m.forms.wizard.analyzeFailed, message);
      }
    });
  }

  async function onGenerate() {
    setError(null);
    setWarning(null);
    setPhase("generating");
    setActiveStep("reading_offer");
    setScoreBeforeLive(beforeScore);
    setScoreAfterLive(null);

    // Stable for this attempt so retries don't double-debit after success.
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const enqueueRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jobPayload,
          templateId: templateId || undefined,
          targetTitle: options.targetTitle || undefined,
          instructions: options.instructions || undefined,
          language: options.language || undefined,
          claims,
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

      // Fire the worker; progress is read from the job row via polling.
      const runPromise = fetch(`/api/generate/${jobId}/run`, { method: "POST" }).catch(() => null);

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
        const statusRes = await fetch(`/api/generate/${jobId}`, { cache: "no-store" });
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

      // Drain worker (best-effort) so the browser doesn't leave it hanging silently.
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
        router.push("/erreur?reason=generate&back=/generate");
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
              <CardTitle className="text-base">{t.jobStep}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="tablist"
                aria-label={t.jobSource}
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
                  {m.app.jobUrl}
                </button>
              </div>

              {mode === "text" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="jobText">{m.app.jobText}</Label>
                  <Textarea
                    id="jobText"
                    name="jobText"
                    rows={8}
                    required={phase === "compose"}
                    defaultValue={jobPayload.jobText}
                    placeholder={t.jobTextPlaceholder}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="jobUrl">{m.app.jobUrl}</Label>
                  <Input
                    id="jobUrl"
                    name="jobUrl"
                    type="url"
                    required={phase === "compose"}
                    defaultValue={jobPayload.jobUrl}
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
                <Label htmlFor="targetTitle">{t.targetTitleLabel}</Label>
                <Input
                  id="targetTitle"
                  name="targetTitle"
                  defaultValue={options.targetTitle}
                  placeholder={t.targetTitlePlaceholder}
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">{t.targetTitleHint}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">{m.app.languageLabel}</Label>
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
                <p className="text-xs text-muted-foreground">{t.instructionsHint}</p>
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
          {warning ? (
            <Alert variant="warning" title={t.projectedStaleTitle}>
              {warning}
            </Alert>
          ) : null}
          <MatchAnalyzePanel
            beforeScore={beforeScore}
            projectedScore={projectedScore}
            maxProjectedScore={maxProjected}
            gaps={gaps}
            selected={claims}
            onToggle={onToggleClaim}
            onSelectAll={onSelectAll}
            onClear={onClear}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhase("compose")}
              disabled={analyzing}
            >
              {t.editJob}
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="lg"
              disabled={disabled || noCredits}
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
                label={t.matchBefore}
                value={`${scoreBeforeLive ?? beforeScore}%`}
              />
              <StatCard
                size="compact"
                emphasis
                label={t.matchAfter}
                value={scoreAfterLive !== null ? `${scoreAfterLive}%` : "…"}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
