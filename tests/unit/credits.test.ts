import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const tx = {
  credits: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  creditTransaction: {
    create: vi.fn(),
  },
};

const db = {
  $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
};

vi.mock("@/lib/db", () => ({ db }));

describe("credits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx)
    );
    tx.credits.upsert.mockResolvedValue({ userId: "u1", balance: 5 });
    tx.credits.update.mockResolvedValue({ userId: "u1", balance: 4 });
    tx.creditTransaction.create.mockResolvedValue({});
  });

  it("debitCredits decrements balance and logs a GENERATION txn", async () => {
    const { debitCredits } = await import("@/lib/credits");
    const balance = await debitCredits("u1", 1, "GENERATION", "gen_abc");
    expect(balance).toBe(4);
    expect(tx.credits.update).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { balance: { increment: -1 } },
    });
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: { userId: "u1", delta: -1, reason: "GENERATION", refId: "gen_abc" },
    });
  });

  it("debitCredits throws when balance would go negative", async () => {
    tx.credits.upsert.mockResolvedValue({ userId: "u1", balance: 0 });
    const { debitCredits, InsufficientCreditsError } = await import("@/lib/credits");
    await expect(debitCredits("u1", 1, "GENERATION")).rejects.toBeInstanceOf(
      InsufficientCreditsError
    );
    expect(tx.credits.update).not.toHaveBeenCalled();
  });

  it("creditCredits increments balance for REFUND", async () => {
    tx.credits.upsert.mockResolvedValue({ userId: "u1", balance: 4 });
    tx.credits.update.mockResolvedValue({ userId: "u1", balance: 5 });
    const { creditCredits } = await import("@/lib/credits");
    const balance = await creditCredits("u1", 1, "REFUND", "gen_abc");
    expect(balance).toBe(5);
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: { userId: "u1", delta: 1, reason: "REFUND", refId: "gen_abc" },
    });
  });

  it("creditCreditsWithRetry succeeds after a transient failure", async () => {
    vi.useFakeTimers();
    tx.credits.upsert
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue({ userId: "u1", balance: 4 });
    tx.credits.update.mockResolvedValue({ userId: "u1", balance: 5 });

    const { creditCreditsWithRetry } = await import("@/lib/credits");
    const promise = creditCreditsWithRetry("u1", 1, "REFUND", "gen_abc", { retries: 3 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(true);
    expect(tx.creditTransaction.create).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("creditCreditsWithRetry returns false after exhausting retries", async () => {
    vi.useFakeTimers();
    tx.credits.upsert.mockRejectedValue(new Error("down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { creditCreditsWithRetry } = await import("@/lib/credits");
    const promise = creditCreditsWithRetry("u1", 1, "REFUND", "gen_abc", {
      retries: 2,
      label: "test-refund",
    });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    vi.useRealTimers();
  });
});
