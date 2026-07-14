"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateSwatch } from "@/components/templates/template-swatch";

export interface TemplateOption {
  id: string;
  name: string;
  layout: "sidebar-left" | "single-column";
  colors: string[];
  band: string;
  isOwn: boolean;
}

export function GenerateForm({
  templates,
  balance,
  disabled,
}: {
  templates: TemplateOption[];
  balance: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "url">("text");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const noCredits = balance <= 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const payload = {
      jobUrl: mode === "url" ? String(data.get("jobUrl") ?? "").trim() || undefined : undefined,
      jobText: mode === "text" ? String(data.get("jobText") ?? "").trim() || undefined : undefined,
      templateId: templateId || undefined,
      targetTitle: String(data.get("targetTitle") ?? "").trim() || undefined,
      instructions: String(data.get("instructions") ?? "").trim() || undefined,
      language: String(data.get("language") ?? "").trim() || undefined,
    };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // A serverless timeout/crash returns an HTML error page, not JSON —
      // parse defensively so it surfaces as a readable message, not a
      // "Unexpected token" JSON error.
      const body = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.id) {
        throw new Error(
          body?.error ??
            (res.status === 502 || res.status === 504
              ? "La génération a pris trop de temps (fournisseur IA surchargé ou indisponible). Réessayez ou changez de fournisseur."
              : "La génération a échoué.")
        );
      }
      router.push(`/cv/${body.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={submitting}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. L&apos;offre d&apos;emploi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="tablist"
            aria-label="Source de l'offre"
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
              Texte collé (recommandé)
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
              URL de l&apos;offre
            </button>
          </div>

          {mode === "text" ? (
            <div className="space-y-1.5">
              <Label htmlFor="jobText">Texte de l&apos;offre</Label>
              <Textarea
                id="jobText"
                name="jobText"
                rows={8}
                required
                placeholder="Collez ici l'intégralité de l'offre d'emploi…"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="jobUrl">URL de l&apos;offre</Label>
              <Input id="jobUrl" name="jobUrl" type="url" required placeholder="https://…" />
              <p className="text-xs text-muted-foreground">
                Certains sites (Indeed, LinkedIn…) bloquent la lecture automatique : dans ce cas,
                collez le texte.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Le template</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Choix du template</legend>
            {templates.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-colors",
                  templateId === t.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={templateId === t.id}
                  onChange={() => setTemplateId(t.id)}
                  className="sr-only"
                />
                <TemplateSwatch layout={t.layout} colors={t.colors} band={t.band} />
                <span className="mt-2 block text-sm font-medium">{t.name}</span>
                {t.isOwn ? (
                  <span className="text-xs text-muted-foreground">Mon template</span>
                ) : null}
              </label>
            ))}
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Options</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="targetTitle">Intitulé de poste visé (optionnel)</Label>
            <Input id="targetTitle" name="targetTitle" placeholder="Développeur DevOps" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Langue du CV (optionnel)</Label>
            <Input id="language" name="language" placeholder="français (défaut)" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="instructions">Consignes libres (optionnel)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={2}
              placeholder="Ex. : insister sur le DevOps, mettre en avant l'expérience chez Acme…"
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {noCredits ? (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Solde de crédits épuisé —{" "}
          <Link href="/billing" className="font-medium underline">
            rechargez pour continuer
          </Link>
          .
        </p>
      ) : null}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        disabled={disabled || noCredits || submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin" />
            Génération en cours (30 s environ)…
          </>
        ) : (
          <>
            <Sparkles />
            Générer mon CV (1 crédit)
          </>
        )}
      </Button>
    </form>
  );
}
