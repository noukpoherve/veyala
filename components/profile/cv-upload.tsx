"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { resolveApiError, toUserMessage, USER_ERRORS } from "@/lib/user-facing-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Status = { state: "idle" } | { state: "loading" } | { state: "error"; message: string };

export function CvUpload({ hasProfile }: { hasProfile: boolean }) {
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
        throw new Error(resolveApiError(res.status, body, USER_ERRORS.import));
      }
      setStatus({ state: "idle" });
      router.refresh();
    } catch (e) {
      setStatus({ state: "error", message: toUserMessage(e, USER_ERRORS.import) });
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
            Analyse du CV en cours…
          </>
        ) : (
          <>
            <UploadCloud />
            {hasProfile
              ? "Réimporter un CV (remplace les données)"
              : "Importer mon CV (PDF ou DOCX)"}
          </>
        )}
      </Button>
      {status.state === "error" ? (
        <Alert variant="error" title="Import impossible">
          {status.message}
        </Alert>
      ) : null}
    </div>
  );
}
