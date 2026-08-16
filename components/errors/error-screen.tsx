import Link from "next/link";
import { Home, LifeBuoy, RotateCcw, LayoutDashboard } from "lucide-react";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorScreenKind = "not-found" | "server" | "unavailable" | "generic";

const COPY: Record<ErrorScreenKind, { code: string; title: string; description: string }> = {
  "not-found": {
    code: "404",
    title: "Cette page est introuvable",
    description:
      "Le lien est peut-être incorrect, ou la page a été déplacée. Revenez à l'accueil ou contactez le support si vous avez besoin d'aide.",
  },
  server: {
    code: "500",
    title: "Un incident technique est survenu",
    description:
      "Notre équipe a été notifiée. Réessayez dans un instant, ou contactez le support si le problème continue. Nous vous aiderons rapidement.",
  },
  unavailable: {
    code: "503",
    title: "Service momentanément indisponible",
    description:
      "Nous effectuons une maintenance ou subissons une surcharge. Réessayez dans quelques minutes, ou écrivez au support si c'est urgent.",
  },
  generic: {
    code: "Erreur",
    title: "Impossible de poursuivre",
    description:
      "Une erreur inattendue a interrompu cette action. Réessayez, ou contactez le support avec le contexte de ce que vous faisiez.",
  },
};

export interface ErrorScreenProps {
  kind?: ErrorScreenKind;
  /** Override default title / description / code. */
  title?: string;
  description?: string;
  code?: string;
  /** Shown under the description (e.g. error digest) — keep non-technical. */
  detail?: string;
  primaryHref?: string;
  primaryLabel?: string;
  supportHref?: string;
  className?: string;
  /** Client-only retry control (error boundary `reset`). */
  onRetry?: () => void;
}

/**
 * Branded full-page error experience — calm, actionable, no red dump.
 * Safe for Server Components; pass `onRetry` only from client error boundaries.
 */
export function ErrorScreen({
  kind = "generic",
  title,
  description,
  code,
  detail,
  primaryHref = "/",
  primaryLabel = "Retour à l'accueil",
  supportHref = "/support",
  className,
  onRetry,
}: ErrorScreenProps) {
  const copy = COPY[kind];
  const displayCode = code ?? copy.code;
  const displayTitle = title ?? copy.title;
  const displayDescription = description ?? copy.description;

  return (
    <main
      className={cn(
        "relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(15,23,42,0.04),_transparent_50%)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <Link href="/" className="mb-10" aria-label="Accueil Veyala">
          <VeyalaLogo />
        </Link>

        <p className="font-display text-6xl font-extrabold tracking-tight text-blue-600/90 sm:text-7xl">
          {displayCode}
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {displayTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{displayDescription}</p>
        {detail ? (
          <p className="mt-2 font-mono text-xs text-slate-400" aria-hidden>
            Réf. {detail}
          </p>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <Button type="button" variant="gradient" size="lg" onClick={onRetry}>
              <RotateCcw />
              Réessayer
            </Button>
          ) : (
            <Button asChild variant="gradient" size="lg">
              <Link href={primaryHref}>
                {primaryHref === "/dashboard" ? <LayoutDashboard /> : <Home />}
                {primaryLabel}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href={supportHref}>
              <LifeBuoy />
              Contacter le support
            </Link>
          </Button>
        </div>

        {onRetry ? (
          <p className="mt-6 text-sm text-slate-500">
            Ou{" "}
            <Link
              href={primaryHref}
              className="font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              {primaryLabel.toLowerCase()}
            </Link>
            .
          </p>
        ) : null}
      </div>
    </main>
  );
}
