"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { cvSchema, type CVData } from "@/lib/cv-schema";
import { USER_ERRORS } from "@/lib/user-facing-error";
import { saveProfile } from "@/app/(app)/profile/actions";
import { CvFields } from "@/components/cv/cv-fields";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
      setErrorMessage("");
      const result = await saveProfile(data);
      if (result.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setErrorMessage(result.error || USER_ERRORS.profile);
        setStatus("error");
      }
    },
    () => {
      setErrorMessage("Certains champs sont invalides. Le nom complet est obligatoire.");
      setStatus("error");
    }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <CvFields form={form} />

      {status === "error" ? (
        <Alert variant="error" title="Enregistrement impossible">
          {errorMessage}
        </Alert>
      ) : null}

      {/*
       * Opaque, bordered action bar — not a transparent floating button.
       * Confirmed bug: the previous `sticky bottom-4` (no background) could
       * render pinned over the Email field on short-content pages (nothing
       * stops position:sticky from settling mid-form when the scroll
       * container isn't actually scrollable), and on mobile it sat behind
       * the tab bar. Sitting right above --app-tabbar with a solid
       * background fixes both.
       */}
      <div className="sticky bottom-[calc(var(--app-tabbar)+0.75rem)] z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bottom-4 md:mx-0 md:rounded-xl md:border md:shadow-elevation-hover">
        <Button type="submit" variant="gradient" loading={status === "saving"}>
          Enregistrer mon CV de base
        </Button>
        {status === "saved" ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" />
            Enregistré
          </span>
        ) : null}
      </div>
    </form>
  );
}
