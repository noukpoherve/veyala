import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Defense-in-depth admin gate (the middleware already filters /admin). */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");
  return session;
}
