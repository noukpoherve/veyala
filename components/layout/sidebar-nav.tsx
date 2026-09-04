"use client";

import { usePathname } from "next/navigation";
import { memo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/i18n/locale-provider";
import { Link } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/i18n/path";

const NavLink = memo(function NavLink({
  href,
  label,
  icon: Icon,
  active,
  nested = false,
  tour,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  nested?: boolean;
  tour?: "profile" | "generate";
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-tour={tour}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:min-h-0 md:py-2",
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
  const pathname = stripLocalePrefix(usePathname() || "/");
  const m = useMessages();
  const onAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const [adminOpen, setAdminOpen] = useState(onAdminPage);
  const MAIN_ITEMS = [
    { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboard },
    { href: "/generate", label: m.nav.generate, icon: Sparkles, tour: "generate" as const },
    { href: "/campus-france", label: m.nav.campusFrance, icon: GraduationCap },
    { href: "/profile", label: m.nav.baseCv, icon: UserRound, tour: "profile" as const },
    { href: "/templates", label: m.nav.templates, icon: Palette },
    { href: "/billing", label: m.nav.billing, icon: Wallet },
    { href: "/support", label: m.nav.support, icon: LifeBuoy },
  ];
  const ADMIN_ITEMS = [
    { href: "/admin", label: m.admin.stats, icon: LayoutDashboard },
    { href: "/admin/inbox", label: m.admin.inbox, icon: Inbox },
    { href: "/admin/blog", label: m.admin.blog, icon: FileText },
    { href: "/admin/users", label: m.admin.users, icon: Users },
    { href: "/admin/activity", label: m.admin.activity, icon: ShieldCheck },
    { href: "/admin/templates", label: m.nav.adminTemplates, icon: Palette },
    { href: "/admin/payments", label: m.admin.payments, icon: CreditCard },
    { href: "/admin/promos", label: m.admin.promos, icon: Tag },
    { href: "/admin/settings", label: m.admin.settings, icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
      aria-label={m.nav.mainNav}
    >
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
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors max-md:min-h-11",
              onAdminPage
                ? "text-blue-700"
                : "text-muted-foreground hover:bg-blue-50/60 hover:text-blue-700"
            )}
          >
            <ShieldCheck className="size-4" aria-hidden />
            {m.nav.adminSection}
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
