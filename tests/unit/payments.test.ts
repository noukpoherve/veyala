import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  payment: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  credits: {
    upsert: vi.fn(),
  },
  creditTransaction: {
    create: vi.fn(),
  },
};

const db = {
  $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  payment: {
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db }));

describe("payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx)
    );
  });

  it("fulfillCheckout credits once when a PENDING session becomes PAID", async () => {
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.findUnique.mockResolvedValue({
      id: "pay_1",
      userId: "u1",
      creditsPurchased: 20,
    });
    tx.credits.upsert.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    const { fulfillCheckout } = await import("@/lib/payments");
    await fulfillCheckout("cs_test_1", "pi_1");

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: "cs_test_1", status: { not: "PAID" } },
      data: { status: "PAID", stripePaymentIntent: "pi_1" },
    });
    expect(tx.credits.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 20 },
      update: { balance: { increment: 20 } },
    });
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: { userId: "u1", delta: 20, reason: "PURCHASE", refId: "pay_1" },
    });
  });

  it("fulfillCheckout is a no-op when the session was already PAID", async () => {
    tx.payment.updateMany.mockResolvedValue({ count: 0 });

    const { fulfillCheckout } = await import("@/lib/payments");
    await fulfillCheckout("cs_test_1");

    expect(tx.payment.findUnique).not.toHaveBeenCalled();
    expect(tx.credits.upsert).not.toHaveBeenCalled();
  });

  it("failCheckout marks PENDING checkouts as FAILED", async () => {
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    const { failCheckout } = await import("@/lib/payments");
    await failCheckout("cs_test_1");
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: "cs_test_1", status: "PENDING" },
      data: { status: "FAILED" },
    });
  });
});
