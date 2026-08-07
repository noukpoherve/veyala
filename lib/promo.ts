import type { Pack, PromoCode, PromoKind } from "@prisma/client";
import { db } from "@/lib/db";

export type PromoQuote = {
  promo: PromoCode;
  amountCents: number;
  discountCents: number;
  credits: number;
  label: string;
};

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function kindLabel(kind: PromoKind, promo: PromoCode): string {
  if (kind === "PERCENT") return `−${promo.percentOff}%`;
  if (kind === "FIXED_CENTS") {
    const euros = ((promo.amountOffCents ?? 0) / 100).toFixed(2).replace(".", ",");
    return `−${euros} €`;
  }
  return `+${promo.bonusCredits ?? 0} crédit${(promo.bonusCredits ?? 0) > 1 ? "s" : ""}`;
}

/** Applies a validated promo to a pack price/credits. */
export function quotePromo(pack: Pack, promo: PromoCode): Omit<PromoQuote, "promo"> {
  let amountCents = pack.priceCents;
  let discountCents = 0;
  let credits = pack.credits;

  if (promo.kind === "PERCENT") {
    const pct = Math.min(100, Math.max(0, promo.percentOff ?? 0));
    discountCents = Math.min(amountCents - 50, Math.round((amountCents * pct) / 100));
    amountCents = Math.max(50, amountCents - discountCents);
  } else if (promo.kind === "FIXED_CENTS") {
    discountCents = Math.min(amountCents - 50, Math.max(0, promo.amountOffCents ?? 0));
    amountCents = Math.max(50, amountCents - discountCents);
  } else if (promo.kind === "BONUS_CREDITS") {
    credits = pack.credits + Math.max(0, promo.bonusCredits ?? 0);
  }

  return {
    amountCents,
    discountCents,
    credits,
    label: kindLabel(promo.kind, promo),
  };
}

export class PromoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoValidationError";
  }
}

/**
 * Loads and validates a promo for a given user + pack.
 * Throws PromoValidationError with a French user-facing message.
 */
export async function resolvePromoForCheckout(input: {
  code: string;
  pack: Pack;
  userId: string;
}): Promise<PromoQuote> {
  const code = normalizePromoCode(input.code);
  if (!code) throw new PromoValidationError("Code promo invalide.");

  const promo = await db.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.active) {
    throw new PromoValidationError("Ce code promo n'existe pas ou n'est plus actif.");
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    throw new PromoValidationError("Ce code promo a expiré.");
  }
  if (promo.packId && promo.packId !== input.pack.id) {
    throw new PromoValidationError("Ce code promo ne s'applique pas à ce pack.");
  }
  if (promo.maxRedemptions != null && promo.redemptionCount >= promo.maxRedemptions) {
    throw new PromoValidationError("Ce code promo a atteint sa limite d'utilisation.");
  }

  if (promo.perUserLimit > 0) {
    const used = await db.payment.count({
      where: {
        userId: input.userId,
        promoCodeId: promo.id,
        status: { in: ["PENDING", "PAID"] },
      },
    });
    if (used >= promo.perUserLimit) {
      throw new PromoValidationError("Vous avez déjà utilisé ce code promo.");
    }
  }

  const quoted = quotePromo(input.pack, promo);
  return { promo, ...quoted };
}
