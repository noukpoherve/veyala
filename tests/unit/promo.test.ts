import { describe, expect, it } from "vitest";
import { quotePromo, normalizePromoCode } from "@/lib/promo";
import type { Pack, PromoCode } from "@prisma/client";

const pack: Pack = {
  id: "pack_1",
  label: "20 CV",
  priceCents: 1999,
  credits: 20,
  active: true,
  sortOrder: 1,
};

function promo(partial: Partial<PromoCode> & Pick<PromoCode, "kind">): PromoCode {
  return {
    id: "promo_1",
    code: "TEST",
    percentOff: null,
    amountOffCents: null,
    bonusCredits: null,
    packId: null,
    maxRedemptions: null,
    redemptionCount: 0,
    perUserLimit: 1,
    expiresAt: null,
    active: true,
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("promo", () => {
  it("normalizes codes", () => {
    expect(normalizePromoCode("  bienvenue 20 ")).toBe("BIENVENUE20");
  });

  it("applies percent off with a 50cts floor", () => {
    const q = quotePromo(pack, promo({ kind: "PERCENT", percentOff: 20 }));
    expect(q.discountCents).toBe(400);
    expect(q.amountCents).toBe(1599);
    expect(q.credits).toBe(20);
  });

  it("applies fixed amount off", () => {
    const q = quotePromo(pack, promo({ kind: "FIXED_CENTS", amountOffCents: 500 }));
    expect(q.discountCents).toBe(500);
    expect(q.amountCents).toBe(1499);
  });

  it("adds bonus credits without changing price", () => {
    const q = quotePromo(pack, promo({ kind: "BONUS_CREDITS", bonusCredits: 3 }));
    expect(q.amountCents).toBe(1999);
    expect(q.discountCents).toBe(0);
    expect(q.credits).toBe(23);
  });
});
