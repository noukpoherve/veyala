"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TemplateOptionCard } from "@/components/templates/template-option";
import type { SwatchProps } from "@/components/templates/template-swatch";
import { IconButton } from "@/components/ui/icon-button";
import { useMessages } from "@/components/i18n/locale-provider";
import { scrollBehavior } from "@/lib/utils";

export type PickerTemplate = {
  id: string;
  name: string;
  swatch: SwatchProps;
};

/**
 * Compact horizontal template picker. Cards stay small (landing-carousel
 * scale); extra templates scroll with snap + prev/next, like the homepage
 * gallery, without autoplay (this is a form control).
 */
export function TemplatePicker({
  templates,
  selectedId,
  onSelect,
  groupName,
}: {
  templates: PickerTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  groupName: string;
}) {
  const m = useMessages();
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    const strip = stripRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    if (strip) ro.observe(strip);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  useLayoutEffect(() => {
    if (templates.length === 0) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    updateScrollState();
  }, [templates.length, updateScrollState]);

  useEffect(() => {
    if (!selectedId) return;
    const el = trackRef.current;
    const selected = el?.querySelector(`[data-template-id="${CSS.escape(selectedId)}"]`);
    if (!el || !(selected instanceof HTMLElement)) return;
    const left =
      selected.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    el.scrollTo({ left: Math.max(0, left - 8), behavior: scrollBehavior() });
  }, [selectedId]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    const strip = stripRef.current;
    if (!el) return;
    const card = el.querySelector("[data-template-id]");
    const width = card instanceof HTMLElement ? card.offsetWidth : 176;
    const gap = strip
      ? Number.parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap) || 12
      : 12;
    el.scrollBy({ left: direction * (width + gap), behavior: scrollBehavior() });
  };

  return (
    <div className="min-w-0">
      {templates.length > 3 ? (
        <div className="mb-2 flex justify-end gap-2">
          <IconButton
            type="button"
            size="sm"
            variant="outline"
            aria-label={m.forms.wizard.templatePrev}
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
          >
            <ChevronLeft aria-hidden />
          </IconButton>
          <IconButton
            type="button"
            size="sm"
            variant="outline"
            aria-label={m.forms.wizard.templateNext}
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRight aria-hidden />
          </IconButton>
        </div>
      ) : null}
      <fieldset className="min-w-0">
        <legend className="sr-only">{m.forms.wizard.templateLegend}</legend>
        <div
          ref={trackRef}
          onFocusCapture={(event) => {
            const el = trackRef.current;
            const card = (event.target as HTMLElement).closest("[data-template-id]");
            if (!el || !(card instanceof HTMLElement)) return;
            const left =
              card.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
            el.scrollTo({ left: Math.max(0, left - 8), behavior: scrollBehavior() });
          }}
          className="no-scrollbar w-full min-w-0 snap-x snap-mandatory overflow-x-auto pb-1"
        >
          <div ref={stripRef} className="flex w-max min-w-full flex-nowrap gap-3">
            {templates.map((tpl) => (
              <TemplateOptionCard
                key={tpl.id}
                id={tpl.id}
                name={tpl.name}
                swatch={tpl.swatch}
                selected={selectedId === tpl.id}
                onSelect={() => onSelect(tpl.id)}
                groupName={groupName}
                size="xs"
                className="w-44 shrink-0 snap-start p-1.5"
                layoutLabel={
                  tpl.swatch.layout === "sidebar-left"
                    ? m.pages.templates.layoutSidebar
                    : m.pages.templates.layoutSingle
                }
              />
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
