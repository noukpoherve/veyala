import { db } from "@/lib/db";

/**
 * Marks a checkout as paid and credits the buyer, exactly once.
 * Concurrency-safe: the guarded updateMany makes retried webhooks no-ops.
 */
export async function fulfillCheckout(
  stripeSessionId: string,
  stripePaymentIntent?: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { stripeSessionId, status: { not: "PAID" } },
      data: { status: "PAID", stripePaymentIntent },
    });
    if (updated.count === 0) return;

    const payment = await tx.payment.findUnique({ where: { stripeSessionId } });
    if (!payment) return;

    await tx.credits.upsert({
      where: { userId: payment.userId },
      create: { userId: payment.userId, balance: payment.creditsPurchased },
      update: { balance: { increment: payment.creditsPurchased } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: payment.userId,
        delta: payment.creditsPurchased,
        reason: "PURCHASE",
        refId: payment.id,
      },
    });
  });
}

/** Marks an expired/abandoned checkout as failed. */
export async function failCheckout(stripeSessionId: string): Promise<void> {
  await db.payment.updateMany({
    where: { stripeSessionId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
