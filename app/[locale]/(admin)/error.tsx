"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/error-screen";
import { useMessages } from "@/components/i18n/locale-provider";
import { reportError } from "@/lib/sentry";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const m = useMessages();

  useEffect(() => {
    reportError(error, "admin/error");
  }, [error]);

  return (
    <ErrorScreen
      messages={m}
      kind="server"
      detail={error.digest}
      onRetry={reset}
      primaryHref="/admin"
      primaryLabel={m.errors.backToAdmin}
      supportHref="/support"
    />
  );
}
