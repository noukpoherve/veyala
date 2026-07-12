"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
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
  await requireAdmin();
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
  revalidatePath("/admin/users");
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

/** Switches a user's role. */
export async function setUserRole(formData: FormData) {
  const session = await requireAdmin();
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  // An admin cannot demote themselves (avoids locking everyone out).
  if (!parsed.success || parsed.data.userId === session.user.id) return;

  await db.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath("/admin/users");
}

/**
 * Invites a new administrator: Supabase emails a magic invitation link; the
 * invitee lands on /reset-password to choose their password. The ADMIN role is
 * pinned in app_metadata (service-role only) and picked up at profile creation.
 */
export async function inviteAdmin(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/admin/users");
  redirect("/admin/users?invite=sent");
}
