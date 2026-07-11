"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Feedback = { kind: "success" | "duplicate" | "error"; message: string } | null;

export function TemplateImportForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/templates", { method: "POST", body: new FormData(form) });
      const body = (await res.json()) as { message?: string; duplicate?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? "La soumission a échoué.");
      setFeedback({
        kind: body.duplicate ? "duplicate" : "success",
        message: body.message ?? "Template soumis.",
      });
      form.reset();
      router.refresh();
    } catch (e) {
      setFeedback({ kind: "error", message: e instanceof Error ? e.message : "Erreur inconnue." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={submitting}>
      <div className="space-y-1.5">
        <Label htmlFor="template-name">Nom du template</Label>
        <Input
          id="template-name"
          name="name"
          required
          minLength={3}
          maxLength={60}
          placeholder="Élégance corail"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="template-image">Image de référence (PNG, JPEG ou WebP, 5 Mo max)</Label>
        <Input
          id="template-image"
          name="image"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp"
        />
        <p className="text-xs text-muted-foreground">
          Une capture ou photo du design de CV à reproduire : l&apos;IA en extrait les couleurs, la
          mise en page et les sections.
        </p>
      </div>
      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={
            feedback.kind === "error"
              ? "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              : feedback.kind === "duplicate"
                ? "rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                : "rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
          }
        >
          {feedback.message}
        </p>
      ) : null}
      <Button type="submit" variant="gradient" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" />
            Analyse en cours…
          </>
        ) : (
          <>
            <Upload />
            Soumettre le template
          </>
        )}
      </Button>
    </form>
  );
}
