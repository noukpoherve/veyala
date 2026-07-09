import Link from "next/link";
import { ArrowLeft, CreditCard, LayoutDashboard, Palette, Settings, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";

const NAV_ITEMS = [
  { href: "/admin", label: "Statistiques", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/templates", label: "Templates", icon: Palette },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/settings", label: "Réglages", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <p className="font-display font-bold">
            CVGen <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">ADMIN</span>
          </p>
          <nav aria-label="Navigation admin">
            <ul className="flex flex-wrap gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à l&apos;app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
