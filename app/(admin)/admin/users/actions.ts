"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { archiveUser, hardDeleteUser, restoreUser } from "@/lib/account-lifecycle";
import { db } from "@/lib/db";
import { creditCredits, debitCredits } from "@/lib/credits";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizeEmail, siteUrl } from "@/lib/utils";

const adjustSchema = z.object({
  userId: z.string().min(1),
  delta: z.coerce.number().int().min(-1000).max(1000),
});

/** Manually adjusts a user's credit balance (positive or negative). */
export async function adjustCredits(formData: FormData) {
  const session = await requireAdmin();
  const parsed = adjustSchema.safeParse({
    userId: formData.get("userId"),
    delta: formData.get("delta"),
  });
  if (!parsed.success || parsed.data.delta === 0) return;

  const { userId, delta } = parsed.data;
  if (delta > 0) {
    await creditCredits(userId, delta, "ADMIN_ADJUST");
  } else {
    await debitCredits(userId, -delta, "ADMIN_ADJUST").catch(() => {
      // Balance would go negative: ignore the adjustment.
    });
  }
  await logAdminAction({
    actorId: session.user.id,
    action: "credits.adjust",
    targetId: userId,
    meta: { delta },
  });
  revalidatePath("/admin/users");
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

/** Switches a user's role and mirrors it to Supabase app_metadata. */
export async function setUserRole(formData: FormData) {
  const session = await requireAdmin();
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success || parsed.data.userId === session.user.id) return;

  const user = await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  if (user.authId) {
    try {
      await createSupabaseAdminClient().auth.admin.updateUserById(user.authId, {
        app_metadata: { role: parsed.data.role },
      });
    } catch (error) {
      console.error("[admin] failed to sync role to Supabase app_metadata:", error);
    }
  }
  await logAdminAction({
    actorId: session.user.id,
    action: "user.set_role",
    targetId: user.id,
    meta: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
}

/**
 * Invites a new administrator: Supabase emails a magic invitation link; the
 * invitee lands on /reset-password to choose their password. The ADMIN role is
 * pinned in app_metadata (service-role only) and picked up at profile creation.
 */
export async function inviteAdmin(formData: FormData) {
  const session = await requireAdmin();
  const email = normalizeEmail(formData.get("email"));
  if (!z.string().email().safeParse(email).success) {
    redirect("/admin/users?invite=invalid");
  }
  if (await db.user.findUnique({ where: { email } })) {
    redirect("/admin/users?invite=exists");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error || !data.user) {
    console.error("[admin] invitation failed:", error);
    redirect("/admin/users?invite=failed");
  }
  await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role: "ADMIN" } });
  await logAdminAction({
    actorId: session.user.id,
    action: "user.invite_admin",
    targetId: data.user.id,
    meta: { email },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?invite=sent");
}

const userIdSchema = z.object({ userId: z.string().min(1) });

export async function archiveUserAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success || parsed.data.userId === session.user.id) return;
  await archiveUser({
    userId: parsed.data.userId,
    by: "ADMIN",
    actorId: session.user.id,
    reason: String(formData.get("reason") ?? "").trim() || "admin_archive",
  });
  revalidatePath("/admin/users");
}

export async function restoreUserAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;
  await restoreUser({ userId: parsed.data.userId, actorId: session.user.id });
  revalidatePath("/admin/users");
}

/** Irreversible GDPR wipe — requires typing SUPPRIMER. */
export async function hardDeleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success || parsed.data.userId === session.user.id) return;
  if (formData.get("confirm") !== "SUPPRIMER") return;
  await hardDeleteUser({ userId: parsed.data.userId, actorId: session.user.id });
  revalidatePath("/admin/users");
  redirect("/admin/users?deleted=1");
}
