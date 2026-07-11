"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { creditCredits, debitCredits } from "@/lib/credits";

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
