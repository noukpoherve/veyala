"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders a print-oriented HTML document (from lib/pdf/render-html.ts or
 * render-letter.ts — both fixed at `width: 210mm` / A4, correct for the PDF
 * export they're shared with) so it actually fits its on-screen container.
 *
 * Root cause this fixes: those documents have no responsive sizing of their
 * own — dropped into an iframe at any width narrower than ~794px (210mm),
 * the content overflowed/clipped inside the iframe itself. Confirmed in the
 * UX audit on the CV Editor preview (even at 1440px desktop) and the Letter
 * preview on mobile. Rather than touch the print HTML (that width is load-
 * bearing for PDF export), this measures the real content size once loaded
 * and scales the whole iframe down (`transform: scale`) to fit the
 * container — same approach browsers themselves use for print preview.
 */

const PRINT_WIDTH_PX = 794; // 210mm @ 96dpi — must match the `width: 210mm` in render-html.ts / render-letter.ts
const FALLBACK_RATIO = 297 / 210; // A4 portrait, used only until the real content height is measured

export function PrintPreview({
  srcDoc,
  title,
  className,
}: {
  srcDoc: string;
  title: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(PRINT_WIDTH_PX * FALLBACK_RATIO);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Catches real resize events (window resize, sidebar toggle, etc.) that
    // don't otherwise cause this component to re-render.
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / PRINT_WIDTH_PX);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Callers toggle this behind a CSS-only `hidden` class for mobile tabs
  // (e.g. the CV editor's Formulaire/Aperçu switch). When mounted while
  // hidden, ResizeObserver's first callback reports width 0 and isn't
  // guaranteed to re-fire once the ancestor's `display:none` lifts (varies
  // across browsers, and not something worth depending on) — scale stayed
  // stuck at the initial 1, overflowing the real, narrower container. Rather
  // than chase another observer API, re-measure directly and synchronously
  // after every commit: cheap (one layout read), and correct regardless of
  // *why* this render happened, including a parent's visibility toggle.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const width = wrapper.getBoundingClientRect().width;
    if (!width) return;
    const next = width / PRINT_WIDTH_PX;
    setScale((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
  });

  // srcDoc changed (regeneration/edit) — re-measure once the new document loads,
  // don't keep the previous document's height in the meantime.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on content change
  useEffect(() => {
    setContentHeight(PRINT_WIDTH_PX * FALLBACK_RATIO);
  }, [srcDoc]);

  return (
    <div
      ref={wrapperRef}
      className={cn("overflow-hidden", className)}
      style={{ height: contentHeight * scale }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title={title}
        // allow-same-origin (no allow-scripts) only to read scrollHeight for
        // the scale computation below — the document still can't execute
        // any script. CV/letter text is HTML-escaped server-side.
        sandbox="allow-same-origin"
        onLoad={() => {
          const doc = iframeRef.current?.contentDocument;
          const height = doc?.documentElement.scrollHeight;
          if (height) setContentHeight(height);
        }}
        style={{
          width: PRINT_WIDTH_PX,
          height: contentHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          border: 0,
        }}
        className="bg-white"
      />
    </div>
  );
}
