import { requireAdmin } from "@/lib/admin";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AppShell>{children}</AppShell>;
}
