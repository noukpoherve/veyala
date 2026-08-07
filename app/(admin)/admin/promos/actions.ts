"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { normalizePromoCode } from "@/lib/promo";

const baseSchema = z.object({
  code: z.string().min(3).max(32),
  kind: z.enum(["PERCENT", "FIXED_CENTS", "BONUS_CREDITS"]),
  percentOff: z.coerce.number().int().min(1).max(90).optional(),
  amountOffCents: z.coerce.number().int().min(50).max(100000).optional(),
  bonusCredits: z.coerce.number().int().min(1).max(500).optional(),
  packId: z.string().optional(),
  maxRedemptions: z.coerce.number().int().min(1).max(100000).optional(),
  perUserLimit: z.coerce.number().int().min(0).max(100).default(1),
  expiresAt: z.string().optional(),
});

function parseExpiresAt(raw?: string): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Creates a promo code. */
export async function createPromoCode(formData: FormData) {
  const session = await requireAdmin();
  const parsed = baseSchema.safeParse({
    code: formData.get("code"),
    kind: formData.get("kind"),
    percentOff: formData.get("percentOff") || undefined,
    amountOffCents: formData.get("amountOffCents") || undefined,
    bonusCredits: formData.get("bonusCredits") || undefined,
    packId: String(formData.get("packId") ?? "").trim() || undefined,
    maxRedemptions: formData.get("maxRedemptions") || undefined,
    perUserLimit: formData.get("perUserLimit") || 1,
    expiresAt: String(formData.get("expiresAt") ?? "") || undefined,
  });
  if (!parsed.success) return;

  const { kind, code, percentOff, amountOffCents, bonusCredits, ...rest } = parsed.data;
  if (kind === "PERCENT" && !percentOff) return;
  if (kind === "FIXED_CENTS" && !amountOffCents) return;
  if (kind === "BONUS_CREDITS" && !bonusCredits) return;

  const created = await db.promoCode.create({
    data: {
      code: normalizePromoCode(code),
      kind,
      percentOff: kind === "PERCENT" ? percentOff : null,
      amountOffCents: kind === "FIXED_CENTS" ? amountOffCents : null,
      bonusCredits: kind === "BONUS_CREDITS" ? bonusCredits : null,
      packId: rest.packId,
      maxRedemptions: rest.maxRedemptions,
      perUserLimit: rest.perUserLimit,
      expiresAt: parseExpiresAt(rest.expiresAt),
      createdById: session.user.id,
      active: true,
    },
  });

  await logAdminAction({
    actorId: session.user.id,
    action: "promo.create",
    targetId: created.id,
    meta: { code: created.code, kind: created.kind },
  });
  revalidatePath("/admin/promos");
}

/** Toggles active flag. */
export async function togglePromoCode(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("promoId") ?? "");
  if (!id) return;
  const current = await db.promoCode.findUnique({ where: { id } });
  if (!current) return;
  await db.promoCode.update({
    where: { id },
    data: { active: !current.active },
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "promo.toggle",
    targetId: id,
    meta: { code: current.code, active: !current.active },
  });
  revalidatePath("/admin/promos");
}

/** Updates limits / expiry / pack restriction (not the discount math). */
export async function updatePromoCode(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("promoId") ?? "");
  if (!id) return;

  const packId = String(formData.get("packId") ?? "").trim() || null;
  const maxRaw = String(formData.get("maxRedemptions") ?? "").trim();
  const perUserLimit = Number(formData.get("perUserLimit") ?? 1);
  const expiresAt = parseExpiresAt(String(formData.get("expiresAt") ?? ""));

  await db.promoCode.update({
    where: { id },
    data: {
      packId,
      maxRedemptions: maxRaw ? Number(maxRaw) : null,
      perUserLimit: Number.isFinite(perUserLimit) ? perUserLimit : 1,
      expiresAt,
    },
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "promo.update",
    targetId: id,
  });
  revalidatePath("/admin/promos");
}
