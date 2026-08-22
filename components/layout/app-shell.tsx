import { Coins, HelpCircle, Zap } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { SidebarNav } from "./sidebar-nav";
import { CollapsibleSidebar, SidebarProvider } from "./collapsible-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";
import { VeyalaLogo } from "@/components/landing/logo";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { redirectLocalized } from "@/i18n/redirect";
import { localizePath } from "@/i18n/path";

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
  const locale = getLocale();
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);

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
    await signOut({ redirectTo: localizePath("/", getLocale()) });
  }

  return (
    <SidebarProvider>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-muted/40">
        <CollapsibleSidebar>
          <Link
            href="/"
            className="border-b border-border p-4 pr-12 md:pr-4"
            aria-label={m.common.homeAria}
          >
            <VeyalaLogo />
          </Link>
          <div className="border-b border-border px-3 py-2">
            <LanguageSwitcher variant="compact" className="w-full justify-center" />
          </div>
          <SidebarNav isAdmin={session.user.role === "ADMIN"} />
          <div className="space-y-3 border-t border-border p-3 max-md:pb-4">
            <section
              aria-label={m.app.creditsUsageAria}
              className="rounded-panel border border-border bg-card p-4 shadow-elevation-rest"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-muted-foreground">{m.app.creditsUsage}</h2>
                <Link
                  href="/billing"
                  aria-label={m.app.creditsDetailAria}
                  className="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:size-auto"
                >
                  <HelpCircle className="size-4" aria-hidden />
                </Link>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm text-foreground">
                  {m.app.creditsUsed(usedCredits, totalCredits)}
                </p>
                <UsageBar used={usedCredits} total={totalCredits} />
                <p className="text-xs text-muted-foreground">{m.app.creditsRemaining(balance)}</p>
              </div>
              <Link
                href="/billing"
                className="transition-bounce mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Zap className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                {m.app.topUp}
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 md:hidden"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              height: "var(--app-header)",
            }}
          >
            <Link href="/dashboard" className="min-w-0" aria-label={m.app.dashboardAria}>
              <VeyalaLogo />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="compact" />
              <Badge variant="secondary">
                <Coins className="mr-1 size-3" aria-hidden />
                {balance}
              </Badge>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 pb-[calc(var(--app-tabbar)+1.5rem)] md:p-8">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  );
}
