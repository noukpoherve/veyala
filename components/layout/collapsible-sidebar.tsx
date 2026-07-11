"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "veyala:sidebar";

/**
 * Desktop sidebar that stays fixed (only the page content scrolls) and can be
 * collapsed. A floating round button rides along the sidebar edge to toggle it.
 */
export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "closed") setOpen(false);
  }, []);

  const toggle = () =>
    setOpen((current) => {
      localStorage.setItem(STORAGE_KEY, current ? "closed" : "open");
      return !current;
    });

  return (
    <>
      <aside
        className={cn(
          "hidden h-full flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-300 ease-in-out md:flex",
          open ? "w-64" : "w-0 border-r-0"
        )}
        aria-hidden={!open}
      >
        {/* Fixed inner width so the content doesn't squish during the animation */}
        <div className="flex h-full w-64 shrink-0 flex-col">{children}</div>
      </aside>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Masquer la navigation" : "Afficher la navigation"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 z-40 hidden size-11 items-center justify-center rounded-full bg-card text-blue-600 shadow-lg shadow-blue-900/10 ring-1 ring-border transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-accent hover:shadow-xl md:flex",
          open ? "left-[17.25rem]" : "left-4"
        )}
      >
        {open ? (
          <PanelLeftClose className="size-5" aria-hidden />
        ) : (
          <PanelLeftOpen className="size-5" aria-hidden />
        )}
      </button>
    </>
  );
}
