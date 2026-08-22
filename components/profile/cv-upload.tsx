"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { resolveApiError, toUserMessage } from "@/lib/user-facing-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";

type Status = { state: "idle" } | { state: "loading" } | { state: "error"; message: string };

export function CvUpload({ hasProfile }: { hasProfile: boolean }) {
  const locale = useLocale();
  const errors = useMessages().errors;
  const m = useMessages().pages.cvUpload;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function handleFile(file: File) {
    setStatus({ state: "loading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/import-cv", { method: "POST", body: formData });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(resolveApiError(res.status, body, errors.import, locale));
      }
      setStatus({ state: "idle" });
      router.refresh();
    } catch (e) {
      setStatus({ state: "error", message: toUserMessage(e, errors.import, locale) });
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={hasProfile ? "outline" : "gradient"}
        disabled={status.state === "loading"}
        onClick={() => inputRef.current?.click()}
      >
        {status.state === "loading" ? (
          <>
            <Loader2 className="animate-spin" />
            {m.analyzing}
          </>
        ) : (
          <>
            <UploadCloud />
            {hasProfile ? m.reimport : m.import}
          </>
        )}
      </Button>
      {status.state === "error" ? (
        <Alert variant="error" title={m.errorTitle}>
          {status.message}
        </Alert>
      ) : null}
    </div>
  );
}
