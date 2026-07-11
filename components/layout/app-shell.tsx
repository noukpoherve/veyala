import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { SidebarNav } from "./sidebar-nav";
import { VeyalaLogo } from "@/components/landing/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Shared connected-area shell: left sidebar (nav + credits) and main content. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const balance = await getBalance(session.user.id);

  return (
    <div className="flex min-h-screen bg-slate-50/60">
      <aside className="hidden w-64 flex-col border-r border-slate-100 bg-white md:flex">
        <Link href="/" className="border-b border-slate-100 p-4" aria-label="Veyala — accueil">
          <VeyalaLogo />
        </Link>
        <SidebarNav isAdmin={session.user.role === "ADMIN"} />
        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl bg-blue-50/70 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-blue-900">
              <Coins className="size-4 text-blue-600" aria-hidden />
              Crédits
            </span>
            <Badge variant={balance > 0 ? "default" : "destructive"}>{balance}</Badge>
          </div>
          <p className="truncate px-1 text-xs text-muted-foreground" title={session.user.email ?? ""}>
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
        <header className="flex items-center justify-between border-b border-slate-100 bg-white p-4 md:hidden">
          <Link href="/dashboard" aria-label="Veyala — tableau de bord">
            <VeyalaLogo />
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
