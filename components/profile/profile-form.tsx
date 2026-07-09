"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { saveProfile } from "@/app/(app)/profile/actions";
import { CvFields } from "@/components/cv/cv-fields";
import { Button } from "@/components/ui/button";

export function ProfileForm({ initialData }: { initialData: CVData }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<CVData>({
    resolver: zodResolver(cvSchema) as Resolver<CVData>,
    defaultValues: initialData,
  });

  const onSubmit = form.handleSubmit(
    async (data) => {
      setStatus("saving");
      const result = await saveProfile(data);
      if (result.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setErrorMessage(result.error);
        setStatus("error");
      }
    },
    () => {
      setErrorMessage("Certains champs sont invalides (le nom complet est obligatoire).");
      setStatus("error");
    }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <CvFields form={form} />

      <div className="sticky bottom-4 flex items-center gap-3">
        <Button type="submit" variant="gradient" disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="animate-spin" /> : null}
          Enregistrer mon CV de base
        </Button>
        {status === "saved" ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            Enregistré
          </span>
        ) : null}
        {status === "error" ? (
          <span role="alert" className="text-sm text-destructive">
            {errorMessage}
          </span>
        ) : null}
      </div>
    </form>
  );
}
