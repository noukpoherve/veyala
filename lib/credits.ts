import { cache as reactCache } from "react";
import { type CreditReason, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** react.cache is unavailable in some Vitest/node contexts — identity fallback. */
const cache =
  typeof reactCache === "function"
    ? reactCache
    : <T extends (...args: never[]) => unknown>(fn: T) => fn;

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Solde de crédits insuffisant.");
    this.name = "InsufficientCreditsError";
  }
}

type Tx = Prisma.TransactionClient;

async function applyDelta(
  tx: Tx,
  userId: string,
  delta: number,
  reason: CreditReason,
  refId?: string
) {
  const credits = await tx.credits.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  });

  if (credits.balance + delta < 0) throw new InsufficientCreditsError();

  const updated = await tx.credits.update({
    where: { userId },
    data: { balance: { increment: delta } },
  });
  await tx.creditTransaction.create({
    data: { userId, delta, reason, refId },
  });
  return updated.balance;
}

/**
 * Atomically debits `amount` credits (Serializable isolation).
 * Throws InsufficientCreditsError when the balance is too low — never negative.
 */
export async function debitCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  refId?: string
) {
  return db.$transaction((tx) => applyDelta(tx, userId, -Math.abs(amount), reason, refId), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

/** Atomically credits `amount` credits. */
export async function creditCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  refId?: string
) {
  return db.$transaction((tx) => applyDelta(tx, userId, Math.abs(amount), reason, refId), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

/**
 * Credits with retries + logging (used for generation refunds).
 * Never swallows failures silently.
 */
export async function creditCreditsWithRetry(
  userId: string,
  amount: number,
  reason: CreditReason,
  refId: string,
  opts?: { retries?: number; label?: string }
): Promise<boolean> {
  const retries = opts?.retries ?? 3;
  const label = opts?.label ?? "credit";
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      await creditCredits(userId, amount, reason, refId);
      return true;
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 150 * 2 ** i));
    }
  }
  console.error(`[credits] ${label} failed after retries`, {
    userId,
    amount,
    reason,
    refId,
    lastError,
  });
  return false;
}

/** Balance lookup memoized per request: shell + page can both call it, one query runs. */
export const getBalance = cache(async (userId: string) => {
  const credits = await db.credits.findUnique({ where: { userId } });
  return credits?.balance ?? 0;
});
