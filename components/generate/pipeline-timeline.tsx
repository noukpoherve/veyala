import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Numbered step list for the generation pipeline — rendering only, no
 * polling/business logic. generate-form.tsx and campus-france-form.tsx had
 * byte-identical copies of this JSX (only the step labels/order differ,
 * which stay data owned by each form — their backends genuinely emit steps
 * in a different order per domain, verified in lib/generate-cv.ts vs
 * lib/campus-france/generate.ts, so that's not something to unify).
 * The submit/polling logic that drives `activeStep` is intentionally left
 * where it was: it's tied to credit debiting and idempotency in both forms,
 * not something to refactor without the ability to test it live end-to-end.
 */
export function PipelineTimeline({
  steps,
  activeStep,
}: {
  steps: readonly { id: string; label: string }[];
  activeStep: string | "done" | null;
}) {
  const currentIdx =
    activeStep && activeStep !== "done" ? steps.findIndex((s) => s.id === activeStep) : -1;

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const done = activeStep === "done" || (currentIdx >= 0 && index < currentIdx);
        const current = activeStep === step.id;
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm",
              current && "bg-primary/5 font-medium",
              !done && !current && "text-muted-foreground/60"
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-full border text-xs">
              {current ? <Loader2 className="size-3.5 animate-spin" /> : index + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
