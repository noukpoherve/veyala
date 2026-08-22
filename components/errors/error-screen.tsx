import { Home, LifeBuoy, RotateCcw, LayoutDashboard } from "lucide-react";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export type ErrorScreenKind = "not-found" | "server" | "unavailable" | "generic";

function defaultCopy(kind: ErrorScreenKind, m: Messages) {
  switch (kind) {
    case "not-found":
      return {
        code: "404",
        title: m.errors.pageNotFoundTitle,
        description: m.errors.pageNotFoundBody,
      };
    case "server":
      return { code: "500", title: m.errors.serverTitle, description: m.errors.serverBody };
    case "unavailable":
      return {
        code: "503",
        title: m.errors.unavailableTitle,
        description: m.errors.unavailableBody,
      };
    default:
      return {
        code: m.errors.errorKind,
        title: m.errors.genericTitle,
        description: m.errors.genericBody,
      };
  }
}

export interface ErrorScreenProps {
  /**
   * Resolved catalog: `getMessages(getLocale())` on the server, `useMessages()`
   * in a client boundary, `catalogs[locale]` where no provider is mounted.
   */
  messages: Messages;
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
  messages: m,
  kind = "generic",
  title,
  description,
  code,
  detail,
  primaryHref = "/",
  primaryLabel,
  supportHref = "/support",
  className,
  onRetry,
}: ErrorScreenProps) {
  const copy = defaultCopy(kind, m);
  const displayCode = code ?? copy.code;
  const displayTitle = title ?? copy.title;
  const displayDescription = description ?? copy.description;
  const displayPrimaryLabel = primaryLabel ?? m.common.backHome;

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
        <Link href="/" className="mb-10" aria-label={m.common.homeAria}>
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
            {m.errors.ref} {detail}
          </p>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <Button type="button" variant="gradient" size="lg" onClick={onRetry}>
              <RotateCcw />
              {m.common.retry}
            </Button>
          ) : (
            <Button asChild variant="gradient" size="lg">
              <Link href={primaryHref}>
                {primaryHref === "/dashboard" ? <LayoutDashboard /> : <Home />}
                {displayPrimaryLabel}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href={supportHref}>
              <LifeBuoy />
              {m.common.contactSupport}
            </Link>
          </Button>
        </div>

        {onRetry ? (
          <p className="mt-6 text-sm text-slate-500">
            {m.errors.orPrefix}{" "}
            <Link
              href={primaryHref}
              className="font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              {displayPrimaryLabel.toLowerCase()}
            </Link>
            .
          </p>
        ) : null}
      </div>
    </main>
  );
}
