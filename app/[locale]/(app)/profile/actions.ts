"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { archiveUser } from "@/lib/account-lifecycle";
import { logActivity } from "@/lib/activity";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizeHref } from "@/i18n/path";
import { redirectLocalized } from "@/i18n/redirect";

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

/** Saves the base CV edited on /profile (full zod validation). */
export async function saveProfile(data: unknown): Promise<SaveProfileResult> {
  const m = getMessages(getLocale());
  const session = await auth();
  if (!session?.user) return { ok: false, error: m.errors.authRequired };

  const parsed = cvSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: m.api.profile.invalidData };
  }

  await db.baseProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: parsed.data },
    update: { data: parsed.data },
  });

  await logActivity({
    action: "profile.update",
    actorId: session.user.id,
    subjectUserId: session.user.id,
  });

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Soft-deactivates the account (archive). Data is kept; only an admin can restore.
 * Requires typing DESACTIVER in the confirm field (dialog + form).
 */
export async function archiveOwnAccount(formData: FormData) {
  const locale = getLocale();
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);
  if (formData.get("confirm") !== "DESACTIVER") return;

  await archiveUser({
    userId: session.user.id,
    by: "SELF",
    actorId: session.user.id,
    reason: "self_request",
  });
  await signOut({ redirectTo: localizeHref("/login?error=archived", locale) });
}
