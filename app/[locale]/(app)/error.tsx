"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";
import { useMessages } from "@/components/i18n/locale-provider";
import { reportError } from "@/lib/sentry";

/** App-shell errors: prefer dashboard + support CTAs. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const m = useMessages();

  useEffect(() => {
    reportError(error, "app-shell/error");
  }, [error]);

  return (
    <ErrorScreen
      messages={m}
      kind="server"
      detail={error.digest}
      onRetry={reset}
      primaryHref="/dashboard"
      primaryLabel={m.nav.dashboard}
      supportHref="/support"
    />
  );
}
