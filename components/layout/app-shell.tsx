import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, HelpCircle, Zap } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { SidebarNav } from "./sidebar-nav";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { UserMenu } from "./user-menu";
import { VeyalaLogo } from "@/components/landing/logo";
import { Badge } from "@/components/ui/badge";

function UsageBar({ used, total }: { used: number; total: number }) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-[width] duration-500"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

/** Shared connected-area shell: left sidebar (nav, usage, user menu) and main content. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const [balance, credited] = await Promise.all([
    getBalance(userId),
    db.creditTransaction.aggregate({
      where: { userId, delta: { gt: 0 } },
      _sum: { delta: true },
    }),
  ]);
  const totalCredits = credited._sum.delta ?? 0;
  const usedCredits = Math.max(totalCredits - balance, 0);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <CollapsibleSidebar>
        <Link href="/" className="border-b border-border p-4" aria-label="Veyala — accueil">
          <VeyalaLogo />
        </Link>
        <SidebarNav isAdmin={session.user.role === "ADMIN"} />
        <div className="space-y-3 border-t border-border p-3">
          {/* Usage card, Plan-Usage style */}
          <section
            aria-label="Utilisation des crédits"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-muted-foreground">Mes crédits</h2>
              <Link
                href="/billing"
                aria-label="Voir le détail des crédits"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <HelpCircle className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="text-sm text-foreground">
                {usedCredits} crédit{usedCredits > 1 ? "s" : ""} utilisé
                {usedCredits > 1 ? "s" : ""} sur {totalCredits}.
              </p>
              <UsageBar used={usedCredits} total={totalCredits} />
              <p className="text-xs text-muted-foreground">
                {balance} restant{balance > 1 ? "s" : ""} · 1 crédit = 1 CV + lettre
              </p>
            </div>
            <Link
              href="/billing"
              className="transition-bounce mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Zap className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              Recharger
            </Link>
          </section>

          <UserMenu
            name={session.user.name ?? null}
            email={session.user.email ?? ""}
            image={session.user.image ?? null}
            signOutAction={signOutAction}
          />
        </div>
      </CollapsibleSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4 md:hidden">
          <Link href="/dashboard" aria-label="Veyala — tableau de bord">
            <VeyalaLogo />
          </Link>
          <Badge variant="secondary">
            <Coins className="mr-1 size-3" aria-hidden />
            {balance}
          </Badge>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
