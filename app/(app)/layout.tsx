import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Coins,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/generate", label: "Générer un CV", icon: Sparkles },
  { href: "/profile", label: "Mon CV de base", icon: UserRound },
  { href: "/templates", label: "Templates", icon: Palette },
  { href: "/billing", label: "Crédits & factures", icon: Wallet },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const balance = await getBalance(session.user.id);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <Link href="/" className="flex items-center gap-2 border-b p-4 font-display font-bold">
          <span className="bg-signature inline-block h-6 w-1.5 rounded-full" aria-hidden />
          <FileText className="size-5 text-primary" aria-hidden />
          CVGen
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigation principale">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
          {session.user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-3 rounded-md border border-dashed px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Administration
            </Link>
          ) : null}
        </nav>
        <div className="space-y-3 border-t p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="size-4" aria-hidden />
              Crédits
            </span>
            <Badge variant={balance > 0 ? "secondary" : "destructive"}>{balance}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground" title={session.user.email ?? ""}>
            {session.user.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
              <LogOut />
              Se déconnecter
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b p-4 md:hidden">
          <Link href="/dashboard" className="font-display font-bold">
            CVGen
          </Link>
          <Badge variant="secondary">
            <Coins className="mr-1 size-3" aria-hidden />
            {balance}
          </Badge>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
