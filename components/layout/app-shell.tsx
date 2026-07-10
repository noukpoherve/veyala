import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, FileText, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { SidebarNav } from "./sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Shared connected-area shell: left sidebar (nav + credits) and main content. */
export async function AppShell({ children }: { children: React.ReactNode }) {
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
        <SidebarNav isAdmin={session.user.role === "ADMIN"} />
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
