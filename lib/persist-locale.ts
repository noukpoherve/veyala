import "server-only";
import type { Locale } from "@/i18n/config";

type AuthClient = {
  auth: {
    updateUser: (args: { data: { locale: Locale } }) => Promise<unknown>;
  };
};

/** Persists UI locale on the Auth user for later emails (no Prisma column). */
export async function persistUserLocale(supabase: AuthClient, locale: Locale): Promise<void> {
  await supabase.auth.updateUser({ data: { locale } });
}
