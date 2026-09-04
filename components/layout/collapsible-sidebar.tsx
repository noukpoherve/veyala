"use client";

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/i18n/locale-provider";

const STORAGE_KEY = "veyala:sidebar";

type SidebarUi = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  navId: string;
  desktopOpen: boolean;
  setDesktopOpen: (open: boolean | ((current: boolean) => boolean)) => void;
};

const SidebarUiContext = createContext<SidebarUi | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const navId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const pathname = usePathname();

  // Close the mobile drawer after in-app navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation trigger
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarUiContext.Provider
      value={{ mobileOpen, setMobileOpen, navId, desktopOpen, setDesktopOpen }}
    >
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
 * Phones: drawer built on the Drawer primitive (Radix Dialog under the hood) —
 * focus trap, Escape and body scroll lock come for free instead of the
 * hand-rolled version this replaced (which had Escape wired manually but no
 * focus trap, a gap flagged in the UX audit). The persistent tab bar opens it.
 */
export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const { mobileOpen, setMobileOpen, navId, desktopOpen, setDesktopOpen } = useSidebarUi();
  const m = useMessages();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "closed") setDesktopOpen(false);
  }, [setDesktopOpen]);

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

  const toggleDesktop = () =>
    setDesktopOpen((current) => {
      localStorage.setItem(STORAGE_KEY, current ? "closed" : "open");
      return !current;
    });

  return (
    <>
      <aside
        aria-label={m.pages.sidebar.navAria}
        aria-hidden={!desktopOpen || undefined}
        {...(!desktopOpen ? { inert: true } : {})}
        className={cn(
          "relative hidden h-full min-h-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out md:flex",
          desktopOpen ? "z-20 w-64 overflow-visible" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <div className="flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden">{children}</div>
        {/*
         * Anchored to the sidebar's own edge (absolute within this `aside`,
         * not `fixed` to the viewport) so it can never drift over scrolled
         * page content the way a viewport-fixed button did before — that was
         * a confirmed bug (this toggle clipped page headings at ~820px).
         * Only rendered while open: collapsing this aside to w-0 hides it,
         * the reopen affordance below takes over.
         */}
        <button
          type="button"
          onClick={toggleDesktop}
          aria-label={m.pages.sidebar.hide}
          aria-expanded="true"
          className="absolute -right-3.5 top-4 z-30 flex size-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500"
        >
          <PanelLeftClose className="size-4" aria-hidden />
        </button>
      </aside>

      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent
          id={navId}
          aria-label={m.pages.sidebar.menuAria}
          side="left"
          className={cn(
            "inset-y-auto top-[var(--app-header)] h-auto max-w-none border-r-0 p-0 md:hidden",
            "bottom-[var(--app-tabbar)] w-[min(20rem,88vw)]"
          )}
        >
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
        </DrawerContent>
      </Drawer>

      {!desktopOpen ? (
        <button
          type="button"
          onClick={toggleDesktop}
          aria-label={m.pages.sidebar.show}
          aria-expanded="false"
          className="fixed left-4 top-4 z-40 hidden size-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500 md:flex"
        >
          <PanelLeftOpen className="size-4" aria-hidden />
        </button>
      ) : null}
    </>
  );
}
