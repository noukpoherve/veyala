"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { resolveApiError, toUserMessage } from "@/lib/user-facing-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";

type Feedback = { kind: "success" | "duplicate" | "error"; message: string } | null;

export function TemplateImportForm() {
  const locale = useLocale();
  const errors = useMessages().errors;
  const m = useMessages().pages.templateImport;
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/templates", { method: "POST", body: new FormData(form) });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        duplicate?: boolean;
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(resolveApiError(res.status, body, errors.template, locale));
      }
      setFeedback({
        kind: body?.duplicate ? "duplicate" : "success",
        message: body?.message ?? m.submitted,
      });
      form.reset();
      setImageName(null);
      router.refresh();
    } catch (e) {
      setFeedback({ kind: "error", message: toUserMessage(e, errors.template, locale) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={submitting}>
      <div className="space-y-1.5">
        <Label htmlFor="template-name">{m.nameLabel}</Label>
        <Input
          id="template-name"
          name="name"
          required
          minLength={3}
          maxLength={60}
          placeholder={m.namePlaceholder}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="template-image">{m.imageLabel}</Label>
        {/*
         * Native <input type="file"> hidden (sr-only), triggered by a styled
         * Button — matches the upload pattern used everywhere else in the app
         * (cv-upload.tsx, cv-fields.tsx, design-controls.tsx). This was the
         * one flow still showing the browser's raw "Choose File" control,
         * flagged in the UX audit as a visible inconsistency.
         */}
        <Input
          ref={imageInputRef}
          id="template-image"
          name="image"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
        />
        <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
          <ImagePlus />
          {imageName ?? m.chooseImage}
        </Button>
        <p className="text-xs text-muted-foreground">{m.imageHint}</p>
      </div>
      {feedback ? (
        <Alert
          variant={
            feedback.kind === "error"
              ? "error"
              : feedback.kind === "duplicate"
                ? "warning"
                : "success"
          }
          title={
            feedback.kind === "error"
              ? m.errorTitle
              : feedback.kind === "duplicate"
                ? m.duplicateTitle
                : m.successTitle
          }
        >
          {feedback.message}
        </Alert>
      ) : null}
      <Button type="submit" variant="gradient" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" />
            {m.analyzing}
          </>
        ) : (
          <>
            <Upload />
            {m.submit}
          </>
        )}
      </Button>
    </form>
  );
}
