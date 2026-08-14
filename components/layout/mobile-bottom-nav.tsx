"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarUi } from "./collapsible-sidebar";

const TABS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/generate", label: "Générer", icon: Sparkles },
  { href: "/profile", label: "Mon CV", icon: UserRound },
] as const;

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Persistent phone tab bar — always on screen, thumb-reachable (WCAG 2.2 AA 44px). */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, navId } = useSidebarUi();

  return (
    <nav
      aria-label="Navigation téléphone"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-14 grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = !mobileOpen && tabActive(pathname, tab.href);
          return (
            <li key={tab.href} className="min-w-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-11 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                  active ? "text-blue-600" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls={navId}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className={cn(
              "flex h-full min-h-11 w-full touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
              mobileOpen ? "text-blue-600" : "text-muted-foreground"
            )}
          >
            <Menu className="size-5" aria-hidden />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
