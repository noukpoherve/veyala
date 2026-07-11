"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Template = {
  name: string;
  tag?: string;
  layout: "header" | "sidebar";
  gradient: string;
};

const TEMPLATES: Template[] = [
  {
    name: "Modern Blue",
    tag: "Populaire",
    layout: "header",
    gradient: "from-blue-600 to-blue-500",
  },
  { name: "Classic Noir", layout: "header", gradient: "from-slate-800 to-slate-600" },
  { name: "Sky Pro", tag: "Nouveau", layout: "sidebar", gradient: "from-sky-400 to-blue-600" },
  {
    name: "Académique",
    tag: "Campus France",
    layout: "header",
    gradient: "from-blue-900 to-slate-900",
  },
  {
    name: "International",
    tag: "Canada/Québec",
    layout: "header",
    gradient: "from-sky-400 to-sky-500",
  },
  { name: "Compact Executive", layout: "sidebar", gradient: "from-indigo-900 to-blue-800" },
];

// Memoized: cards are static, no need to re-render them with the carousel.
const TemplateCard = memo(function TemplateCard({ template }: { template: Template }) {
  return (
    <article className="w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      <div aria-hidden className="h-40">
        {template.layout === "header" ? (
          <div className="flex h-full flex-col">
            <div className={cn("bg-gradient-to-br p-3", template.gradient)}>
              <span className="block size-6 rounded-full bg-white/30" />
            </div>
            <div className="flex-1 space-y-1.5 p-3">
              <div className="h-2 w-20 rounded-full bg-slate-800" />
              <div className="h-1.5 w-14 rounded-full bg-slate-200" />
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <div
              className={cn(
                "flex w-12 flex-col items-center gap-1.5 bg-gradient-to-b p-2",
                template.gradient
              )}
            >
              <span className="mb-1 block size-6 rounded-full bg-white/30" />
              <span className="block h-1 w-7 rounded-full bg-white/50" />
              <span className="block h-1 w-7 rounded-full bg-white/35" />
              <span className="block h-1 w-7 rounded-full bg-white/35" />
            </div>
            <div className="flex-1 space-y-1.5 p-3">
              <div className="h-2 w-16 rounded-full bg-slate-800" />
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
            </div>
          </div>
        )}
      </div>
      <footer className="border-t border-slate-100 px-3 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
        {template.tag ? (
          <p className="mt-0.5 text-xs font-semibold text-blue-600">{template.tag}</p>
        ) : null}
      </footer>
    </article>
  );
});

export function TemplatesCarousel({ heading }: { heading: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const scrollByCards = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * 384, behavior: "smooth" });
  };

  // Gentle auto-advance, paused on hover and under prefers-reduced-motion.
  useEffect(() => {
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || paused.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 192, behavior: "smooth" });
      }
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">{heading}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Templates précédents"
            onClick={() => scrollByCards(-1)}
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-bounce hover:-translate-y-0.5 hover:shadow-md"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Templates suivants"
            onClick={() => scrollByCards(1)}
            className="flex size-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/25 transition-bounce hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover only pauses the auto-scroll, a non-essential enhancement */}
      <div
        ref={trackRef}
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {[...TEMPLATES, ...TEMPLATES].map((template, index) => (
          <TemplateCard key={`${template.name}-${index}`} template={template} />
        ))}
      </div>
    </div>
  );
}
