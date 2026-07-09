"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

/** Saves the base CV edited on /profile (full zod validation). */
export async function saveProfile(data: unknown): Promise<SaveProfileResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Authentification requise." };

  const parsed = cvSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides : vérifiez les champs obligatoires." };
  }

  await db.baseProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: parsed.data },
    update: { data: parsed.data },
  });

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * GDPR account deletion: removes the user and, by cascade, sessions, credits,
 * transactions, payments, base profile and generated CVs. Community templates
 * are kept but unlinked (ownerId set to null).
 */
export async function deleteAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (formData.get("confirm") !== "SUPPRIMER") return;

  await db.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
}
