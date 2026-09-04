"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { dismissTour } from "@/app/[locale]/(app)/actions";
import { Button } from "@/components/ui/button";
import { useSidebarUi } from "@/components/layout/collapsible-sidebar";
import { useMessages } from "@/components/i18n/locale-provider";
import { toast } from "@/hooks/use-toast";
import { useLocalizedPathname, useLocalizedRouter } from "@/i18n/navigation";
import { cn, scrollBehavior } from "@/lib/utils";
import {
  isCvWorkspacePath,
  placeTourTooltip,
  tourHrefFor,
  tourStepsFor,
  type Box,
  type TourKind,
  type TourStepId,
  type TourTooltipPlacement,
} from "@/lib/onboarding";

type TourUi = {
  openTour: (kind?: TourKind, from?: TourStepId) => void;
  active: boolean;
  stepId: TourStepId | null;
};

const TourUiContext = createContext<TourUi | null>(null);

export function useTourUi() {
  const ctx = useContext(TourUiContext);
  if (!ctx) throw new Error("TourProvider manquant.");
  return ctx;
}

export function TourProvider({
  initiallyOpen,
  showResult,
  children,
}: {
  initiallyOpen: boolean;
  showResult: boolean;
  children: ReactNode;
}) {
  const pathname = useLocalizedPathname();
  const [kind, setKind] = useState<TourKind>("welcome");
  const [active, setActive] = useState(initiallyOpen);
  const [step, setStep] = useState(0);
  const { setDesktopOpen } = useSidebarUi();

  const persistDismiss = useCallback((tourKind: TourKind) => {
    void dismissTour(tourKind).then((result) => {
      if (!result.ok) toast({ variant: "error", title: result.error });
    });
  }, []);

  const close = useCallback(() => {
    setActive(false);
    setStep(0);
    persistDismiss(kind);
  }, [kind, persistDismiss]);

  const openTour = useCallback(
    (nextKind: TourKind = "welcome", from?: TourStepId) => {
      const steps = tourStepsFor(nextKind);
      const index = from ? steps.indexOf(from) : 0;
      setDesktopOpen(true);
      setKind(nextKind);
      setStep(index >= 0 ? index : 0);
      setActive(true);
    },
    [setDesktopOpen]
  );

  const stepId = active
    ? ((tourStepsFor(kind)[step] ?? tourStepsFor(kind)[0]) as TourStepId)
    : null;

  useEffect(() => {
    if (active) setDesktopOpen(true);
  }, [active, setDesktopOpen]);

  useEffect(() => {
    if (active || initiallyOpen) return;
    if (!showResult || !isCvWorkspacePath(pathname)) return;
    setKind("result");
    setStep(0);
    setActive(true);
  }, [active, initiallyOpen, pathname, showResult]);

  return (
    <TourUiContext.Provider value={{ openTour, active, stepId }}>
      {children}
      {active ? <ProductTour kind={kind} step={step} setStep={setStep} onClose={close} /> : null}
    </TourUiContext.Provider>
  );
}

function visibleTourTarget(id: TourStepId): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  let fallback: HTMLElement | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 2 || rect.height <= 2) continue;
    if (node.closest("main")) return node;
    if (!fallback) fallback = node;
  }
  return fallback;
}

function ProductTour({
  kind,
  step,
  setStep,
  onClose,
}: {
  kind: TourKind;
  step: number;
  setStep: (n: number | ((current: number) => number)) => void;
  onClose: () => void;
}) {
  const m = useMessages();
  const copy = m.pages.tour;
  const router = useLocalizedRouter();
  const pathname = useLocalizedPathname();
  const steps = tourStepsFor(kind);
  const stepId = (steps[step] ?? steps[0]) as TourStepId;
  const item = copy.steps[stepId];
  const last = step >= steps.length - 1;
  const href = tourHrefFor(stepId, pathname);
  const [target, setTarget] = useState<Box | null>(null);
  const [tipPos, setTipPos] = useState<{
    top: number;
    left: number;
    placement: TourTooltipPlacement;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const advance = useCallback(() => {
    if (last) onClose();
    else setStep((current) => current + 1);
  }, [last, onClose, setStep]);

  // useLocalizedRouter returns a new object each render; pathname + href are the triggers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: router identity is not stable
  useEffect(() => {
    if (!href) return;
    if (pathname === href || pathname.startsWith(`${href}/`)) return;
    router.push(href);
  }, [href, pathname]);

  // Replay the step event after client navigation so late-mounted pages can react.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation signal
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("veyala:tour-step", { detail: stepId }));
  }, [pathname, stepId]);

  // Remeasure after client navigation even when the step id is unchanged.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation signal
  useLayoutEffect(() => {
    const measure = () => {
      const el = visibleTourTarget(stepId);
      if (!el) {
        setTarget(null);
        return;
      }
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: scrollBehavior() });
      const rect = el.getBoundingClientRect();
      setTarget({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    measure();
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [stepId, pathname]);

  useEffect(() => {
    if (kind !== "result" || target) return;
    const timer = window.setTimeout(() => {
      if (visibleTourTarget(stepId)) return;
      if (last) onClose();
      else setStep((current) => current + 1);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [kind, last, onClose, setStep, stepId, target]);

  useLayoutEffect(() => {
    if (!target || !tooltipRef.current) return;
    const tip = tooltipRef.current.getBoundingClientRect();
    setTipPos(
      placeTourTooltip(
        target,
        { width: window.innerWidth, height: window.innerHeight },
        {
          width: tip.width,
          height: tip.height,
        }
      )
    );
  }, [target]);

  useLayoutEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const root = tooltipRef.current;
      if (!root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab, true);
    return () => {
      document.removeEventListener("keydown", onTab, true);
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        advance();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStep((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onClose, setStep]);

  if (typeof document === "undefined") return null;

  const pad = 8;
  const hole = target
    ? {
        top: Math.max(0, target.top - pad),
        left: Math.max(0, target.left - pad),
        width: target.width + pad * 2,
        height: target.height + pad * 2,
      }
    : null;

  return createPortal(
    <>
      {hole ? (
        <TourScrim hole={hole} onDismiss={onClose} />
      ) : (
        <div className="fixed inset-0 z-[70] bg-foreground/55" aria-hidden onClick={onClose} />
      )}
      {hole ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[75] rounded-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-background transition-[top,left,width,height] duration-300 motion-reduce:transition-none motion-reduce:duration-0"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
        />
      ) : null}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-body"
        tabIndex={-1}
        className="fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-panel border border-border bg-card p-4 shadow-elevation-floating outline-none"
        style={tipPos ?? { top: 12, left: 12, visibility: "hidden" }}
      >
        {tipPos ? <TooltipArrow placement={tipPos.placement} /> : null}
        <div className="flex gap-3">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
          >
            {step + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {copy.stepOf(step + 1, steps.length)}
            </p>
            <h2 id="tour-step-title" className="mt-0.5 font-display text-base font-bold">
              {item.title}
            </h2>
            <p id="tour-step-body" className="mt-1 text-sm text-muted-foreground">
              {item.body}
            </p>
          </div>
        </div>
        <ol className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {steps.map((id, index) => (
            <li
              key={id}
              className={cn(
                "size-1.5 rounded-full",
                index === step ? "bg-blue-600" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {copy.skip}
          </Button>
          {step > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setStep(step - 1)}>
              {m.common.previous}
            </Button>
          ) : null}
          <Button
            key={stepId}
            type="button"
            variant="gradient"
            size="sm"
            autoFocus
            onClick={advance}
          >
            {last ? copy.done : m.common.next}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

function TourScrim({
  hole,
  onDismiss,
}: {
  hole: { top: number; left: number; width: number; height: number };
  onDismiss: () => void;
}) {
  const { top, left, width, height } = hole;
  const panes: CSSProperties[] = [
    { top: 0, left: 0, right: 0, height: top },
    { top, left: 0, width: left, height },
    { top, left: left + width, right: 0, height },
    { top: top + height, left: 0, right: 0, bottom: 0 },
  ];
  return (
    <>
      {panes.map((style, index) => (
        <div
          key={index}
          className="fixed z-[70] bg-[rgb(15_23_42/0.6)]"
          style={style}
          aria-hidden
          onClick={onDismiss}
        />
      ))}
    </>
  );
}

function TooltipArrow({ placement }: { placement: TourTooltipPlacement }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute size-2.5 rotate-45 border-border bg-card",
        placement === "right" && "left-[-5px] top-5 border-b-0 border-r-0 border-l border-t",
        placement === "left" && "right-[-5px] top-5 border-l-0 border-t-0 border-b border-r",
        placement === "top" &&
          "bottom-[-5px] left-1/2 -translate-x-1/2 border-l-0 border-t-0 border-b border-r",
        placement === "bottom" &&
          "left-1/2 top-[-5px] -translate-x-1/2 border-b-0 border-r-0 border-l border-t"
      )}
    />
  );
}
