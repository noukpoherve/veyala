import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

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

/**
 * Fallback when the Stripe webhook is delayed or misconfigured: ask Stripe for
 * each of the user's recent PENDING sessions and credit those already paid.
 * Idempotent — safe to call repeatedly from the billing success page.
 */
export async function syncPendingCheckouts(userId: string): Promise<{ credited: number }> {
  const pending = await db.payment.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (pending.length === 0) return { credited: 0 };

  const stripe = getStripe();
  let credited = 0;

  for (const payment of pending) {
    try {
      const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
      if (session.payment_status !== "paid") continue;
      const paymentIntent =
        typeof session.payment_intent === "string" ? session.payment_intent : undefined;
      await fulfillCheckout(payment.stripeSessionId, paymentIntent);
      credited += 1;
    } catch (e) {
      console.error("[stripe/sync]", payment.stripeSessionId, e);
    }
  }

  return { credited };
}
