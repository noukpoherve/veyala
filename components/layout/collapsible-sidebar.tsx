"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "veyala:sidebar";

type SidebarUi = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  navId: string;
};

const SidebarUiContext = createContext<SidebarUi | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const navId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer after in-app navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation trigger
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarUiContext.Provider value={{ mobileOpen, setMobileOpen, navId }}>
      {children}
    </SidebarUiContext.Provider>
  );
}

export function useSidebarUi() {
  const ctx = useContext(SidebarUiContext);
  if (!ctx) throw new Error("SidebarProvider manquant.");
  return ctx;
}

/**
 * Desktop: collapsible sidebar in the document flow.
 * Phones: drawer portaled to document.body so iOS cannot clip `position:fixed`
 * inside the overflow-hidden shell. The persistent tab bar opens it.
 */
export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const { mobileOpen, setMobileOpen, navId } = useSidebarUi();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEY) === "closed") setDesktopOpen(false);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const { overflow: prevHtmlOverflow } = html.style;
    const { overflow: prevBodyOverflow } = document.body.style;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mobileOpen, closeMobile]);

  const toggleDesktop = () =>
    setDesktopOpen((current) => {
      localStorage.setItem(STORAGE_KEY, current ? "closed" : "open");
      return !current;
    });

  const drawer = (
    <>
      {mobileOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={closeMobile}
        />
      ) : null}
      <aside
        id={navId}
        aria-label="Menu"
        {...(mobileOpen ? { role: "dialog" as const, "aria-modal": true as const } : {})}
        aria-hidden={!mobileOpen || undefined}
        {...(!mobileOpen ? { inert: true } : {})}
        className={cn(
          "fixed z-50 flex w-[min(20rem,88vw)] flex-col overflow-hidden border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          "top-[var(--app-header)] bottom-[var(--app-tabbar)] left-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Fermer le menu"
          className="absolute right-2 top-2 z-10 flex size-11 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
      </aside>
    </>
  );

  return (
    <>
      <aside
        aria-label="Navigation"
        aria-hidden={!desktopOpen || undefined}
        {...(!desktopOpen ? { inert: true } : {})}
        className={cn(
          "hidden h-full min-h-0 flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-300 ease-in-out md:flex",
          desktopOpen ? "w-64" : "w-0 border-r-0"
        )}
      >
        <div className="flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden">{children}</div>
      </aside>

      {mounted ? createPortal(drawer, document.body) : null}

      <button
        type="button"
        onClick={toggleDesktop}
        aria-label={desktopOpen ? "Masquer la navigation" : "Afficher la navigation"}
        aria-expanded={desktopOpen}
        className={cn(
          "fixed bottom-6 z-40 hidden size-11 items-center justify-center rounded-full bg-card text-blue-600 shadow-lg shadow-blue-900/10 ring-1 ring-border transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-accent hover:shadow-xl md:flex",
          desktopOpen ? "left-[17.25rem]" : "left-4"
        )}
      >
        {desktopOpen ? (
          <PanelLeftClose className="size-5" aria-hidden />
        ) : (
          <PanelLeftOpen className="size-5" aria-hidden />
        )}
      </button>
    </>
  );
}
