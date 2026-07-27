"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", error);
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
