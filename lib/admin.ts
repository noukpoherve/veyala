import "server-only";
import { auth } from "@/lib/auth";
import { getLocale } from "@/i18n/get-locale";
import { redirectLocalized } from "@/i18n/redirect";

/** Defense-in-depth admin gate (the middleware already filters /admin). */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirectLocalized("/dashboard", getLocale());
  return session;
}
