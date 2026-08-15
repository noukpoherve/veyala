"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";
import { reportError } from "@/lib/sentry";

/**
 * Segment error boundary (runtime / render failures → friendly 500-style page).
 * Never dumps a red stack or raw exception to the user.
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this export name
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "app/error");
  }, [error]);

  return (
    <ErrorScreen
      kind="server"
      detail={error.digest}
      onRetry={reset}
      primaryHref="/dashboard"
      primaryLabel="Tableau de bord"
      supportHref="/support"
    />
  );
}
