"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateCv } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending} aria-busy={pending}>
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      {pending ? "Régénération…" : "Régénérer (1 crédit)"}
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
