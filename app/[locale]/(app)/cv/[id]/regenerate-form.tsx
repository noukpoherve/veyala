"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/locale-provider";
import { regenerateCv } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useMessages().pages.regenerate;
  return (
    <Button type="submit" variant="outline" disabled={pending} aria-busy={pending}>
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      {pending ? t.pending : t.cta}
    </Button>
  );
}

/** Form that regenerates the CV with visible pending state (generation can take ~30s). */
export function RegenerateForm({ cvId }: { cvId: string }) {
  return (
    <form action={regenerateCv.bind(null, cvId)}>
      <SubmitButton />
    </form>
  );
}
