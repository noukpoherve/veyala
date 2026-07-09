import { CreditReason, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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
 * Débite `amount` crédits de façon atomique (Serializable).
 * Lève InsufficientCreditsError si le solde est insuffisant — jamais de solde négatif.
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

/** Crédite `amount` crédits de façon atomique. */
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

export async function getBalance(userId: string) {
  const credits = await db.credits.findUnique({ where: { userId } });
  return credits?.balance ?? 0;
}
