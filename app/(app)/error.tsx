"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";

/** App-shell errors: prefer dashboard + support CTAs. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-shell/error]", error);
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
