import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  payment: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  credits: {
    upsert: vi.fn(),
  },
  creditTransaction: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  promoCode: {
    update: vi.fn(),
  },
};

const db = {
  $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  payment: {
    updateMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  promoCode: {
    findUnique: vi.fn(),
  },
  pack: {
    findUnique: vi.fn(),
  },
};

const retrieve = vi.fn();
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ checkout: { sessions: { retrieve } } }),
}));
vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn(async () => undefined),
}));

describe("payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx)
    );
  });

  it("fulfillCheckout credits once when a PENDING session becomes PAID", async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      status: "PENDING",
      creditsPurchased: 20,
      amountCents: 1999,
      discountCents: 0,
      promoCodeId: null,
      packId: "pack_1",
    });
    tx.payment.findFirst.mockResolvedValue(null);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.creditTransaction.findFirst.mockResolvedValue(null);
    tx.creditTransaction.create.mockResolvedValue({});
    tx.credits.upsert.mockResolvedValue({});
    db.pack.findUnique.mockResolvedValue({ label: "20 CV" });

    const { fulfillCheckout } = await import("@/lib/payments");
    const credited = await fulfillCheckout("cs_test_1", "pi_1");

    expect(credited).toBe(true);
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { not: "PAID" } },
      data: { status: "PAID", stripePaymentIntent: "pi_1" },
    });
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: { userId: "u1", delta: 20, reason: "PURCHASE", refId: "pay_1" },
    });
    expect(tx.credits.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 20 },
      update: { balance: { increment: 20 } },
    });
  });

  it("fulfillCheckout is a no-op when the session was already PAID", async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      status: "PAID",
      creditsPurchased: 20,
    });

    const { fulfillCheckout } = await import("@/lib/payments");
    const credited = await fulfillCheckout("cs_test_1", "pi_1");

    expect(credited).toBe(false);
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
    expect(tx.credits.upsert).not.toHaveBeenCalled();
  });

  it("fulfillCheckout does not double-credit when a PURCHASE ledger row already exists", async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      status: "PENDING",
      creditsPurchased: 20,
      amountCents: 1999,
      discountCents: 0,
      promoCodeId: null,
      packId: null,
    });
    tx.payment.findFirst.mockResolvedValue(null);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.creditTransaction.findFirst.mockResolvedValue({ id: "ctx_existing" });

    const { fulfillCheckout } = await import("@/lib/payments");
    const credited = await fulfillCheckout("cs_test_1", "pi_1");

    expect(credited).toBe(false);
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
    expect(tx.credits.upsert).not.toHaveBeenCalled();
  });

  it("fulfillCheckout rejects a second payment row for the same PaymentIntent", async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_2",
      userId: "u1",
      status: "PENDING",
      creditsPurchased: 20,
    });
    tx.payment.findFirst.mockResolvedValue({ id: "pay_1" });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });

    const { fulfillCheckout } = await import("@/lib/payments");
    const credited = await fulfillCheckout("cs_test_2", "pi_1");

    expect(credited).toBe(false);
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_2", status: { not: "PAID" } },
      data: { status: "FAILED" },
    });
    expect(tx.credits.upsert).not.toHaveBeenCalled();
  });

  it("failCheckout marks PENDING checkouts as FAILED", async () => {
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    db.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      amountCents: 999,
      creditsPurchased: 5,
    });
    const { failCheckout } = await import("@/lib/payments");
    await failCheckout("cs_test_1");
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: "cs_test_1", status: "PENDING" },
      data: { status: "FAILED" },
    });
  });

  it("syncPendingCheckouts fulfills sessions Stripe reports as paid", async () => {
    db.payment.findMany.mockResolvedValue([
      { id: "pay_1", userId: "u1", stripeSessionId: "cs_paid", creditsPurchased: 5 },
      { id: "pay_2", userId: "u1", stripeSessionId: "cs_open", creditsPurchased: 5 },
    ]);
    retrieve
      .mockResolvedValueOnce({ payment_status: "paid", payment_intent: "pi_1", status: "complete" })
      .mockResolvedValueOnce({ payment_status: "unpaid", payment_intent: null, status: "open" });
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      status: "PENDING",
      creditsPurchased: 5,
      amountCents: 999,
      discountCents: 0,
      promoCodeId: null,
      packId: null,
    });
    tx.payment.findFirst.mockResolvedValue(null);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.creditTransaction.findFirst.mockResolvedValue(null);
    tx.creditTransaction.create.mockResolvedValue({});
    tx.credits.upsert.mockResolvedValue({});

    const { syncPendingCheckouts } = await import("@/lib/payments");
    const result = await syncPendingCheckouts("u1");
    expect(result.credited).toBe(1);
    expect(retrieve).toHaveBeenCalledTimes(2);
  });

  it("syncPendingCheckouts does not count already-fulfilled paid sessions", async () => {
    db.payment.findMany.mockResolvedValue([
      { id: "pay_1", userId: "u1", stripeSessionId: "cs_paid", creditsPurchased: 5 },
    ]);
    retrieve.mockResolvedValueOnce({
      payment_status: "paid",
      payment_intent: "pi_1",
      status: "complete",
    });
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      status: "PAID",
      creditsPurchased: 5,
    });

    const { syncPendingCheckouts } = await import("@/lib/payments");
    const result = await syncPendingCheckouts("u1");
    expect(result.credited).toBe(0);
  });

  it("syncPendingCheckouts marks expired unpaid sessions as FAILED", async () => {
    db.payment.findMany.mockResolvedValue([
      { id: "pay_1", userId: "u1", stripeSessionId: "cs_expired", creditsPurchased: 5 },
    ]);
    retrieve.mockResolvedValueOnce({
      payment_status: "unpaid",
      payment_intent: null,
      status: "expired",
    });
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    db.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      amountCents: 999,
      creditsPurchased: 5,
    });

    const { syncPendingCheckouts } = await import("@/lib/payments");
    const result = await syncPendingCheckouts("u1");
    expect(result.credited).toBe(0);
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: "cs_expired", status: "PENDING" },
      data: { status: "FAILED" },
    });
  });
});
