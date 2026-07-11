"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "L'import a échoué.");
      setStatus({ state: "idle" });
      router.refresh();
    } catch (e) {
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Erreur inconnue." });
    }
  }

  return (
    <div className="space-y-2">
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
            {hasProfile ? "Réimporter un CV (remplace les données)" : "Importer mon CV (PDF ou DOCX)"}
          </>
        )}
      </Button>
      {status.state === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
