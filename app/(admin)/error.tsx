"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";
import { reportError } from "@/lib/sentry";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "admin/error");
  }, [error]);

  return (
    <ErrorScreen
      kind="server"
      detail={error.digest}
      onRetry={reset}
      primaryHref="/admin"
      primaryLabel="Retour admin"
      supportHref="/support"
    />
  );
}
