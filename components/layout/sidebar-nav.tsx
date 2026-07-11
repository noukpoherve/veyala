"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/generate", label: "Générer un CV", icon: Sparkles },
  { href: "/profile", label: "Mon CV de base", icon: UserRound },
  { href: "/templates", label: "Templates", icon: Palette },
  { href: "/billing", label: "Crédits & factures", icon: Wallet },
];

const ADMIN_ITEMS = [
  { href: "/admin", label: "Statistiques", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/templates", label: "Validation templates", icon: Palette },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/settings", label: "Réglages", icon: Settings },
];

// Memoized: only the links whose `active` flag changes re-render on navigation.
const NavLink = memo(function NavLink({
  href,
  label,
  icon: Icon,
  active,
  nested = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        nested && "py-1.5 pl-9",
        active
          ? "bg-blue-50 font-semibold text-blue-700"
          : "text-muted-foreground hover:bg-blue-50/60 hover:text-blue-700"
      )}
    >
      <Icon className={cn("size-4", nested && "size-3.5")} aria-hidden />
      {label}
    </Link>
  );
});

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const onAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const [adminOpen, setAdminOpen] = useState(onAdminPage);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigation principale">
      {MAIN_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}

      {isAdmin ? (
        <div className="mt-2 border-t pt-2">
          <button
            type="button"
            aria-expanded={adminOpen}
            aria-controls="admin-submenu"
            onClick={() => setAdminOpen((open) => !open)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              onAdminPage
                ? "text-blue-700"
                : "text-muted-foreground hover:bg-blue-50/60 hover:text-blue-700"
            )}
          >
            <ShieldCheck className="size-4" aria-hidden />
            Administration
            <ChevronDown
              className={cn("ml-auto size-4 transition-transform", adminOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          {adminOpen ? (
            <ul id="admin-submenu" className="mt-1 space-y-0.5">
              {ADMIN_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} active={isActive(item.href)} nested />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
