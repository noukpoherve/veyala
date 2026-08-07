import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { logActivity } from "@/lib/activity";

type FulfillResult = {
  credited: boolean;
  userId?: string;
  paymentId?: string;
  amountCents?: number;
  creditsPurchased?: number;
  discountCents?: number;
  promoCodeId?: string | null;
  packId?: string | null;
};

/**
 * Marks a checkout as paid and credits the buyer, exactly once.
 * Guards:
 * 1) status transition PENDING/FAILED → PAID (updateMany count)
 * 2) unique PURCHASE ledger row per payment id
 * 3) same stripePaymentIntent never credits twice across payment rows
 */
export async function fulfillCheckout(
  stripeSessionId: string,
  stripePaymentIntent?: string
): Promise<boolean> {
  let result: FulfillResult = { credited: false };

  try {
    result = await db.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({ where: { stripeSessionId } });
        if (!payment || payment.status === "PAID") return { credited: false };

        if (stripePaymentIntent) {
          const alreadyPaid = await tx.payment.findFirst({
            where: {
              stripePaymentIntent,
              status: "PAID",
              id: { not: payment.id },
            },
            select: { id: true },
          });
          if (alreadyPaid) {
            await tx.payment.updateMany({
              where: { id: payment.id, status: { not: "PAID" } },
              data: { status: "FAILED" },
            });
            return { credited: false };
          }
        }

        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: { not: "PAID" } },
          data: {
            status: "PAID",
            ...(stripePaymentIntent ? { stripePaymentIntent } : {}),
          },
        });
        if (updated.count === 0) return { credited: false };

        const existing = await tx.creditTransaction.findFirst({
          where: { reason: "PURCHASE", refId: payment.id },
          select: { id: true },
        });
        if (existing) return { credited: false };

        await tx.creditTransaction.create({
          data: {
            userId: payment.userId,
            delta: payment.creditsPurchased,
            reason: "PURCHASE",
            refId: payment.id,
          },
        });
        await tx.credits.upsert({
          where: { userId: payment.userId },
          create: { userId: payment.userId, balance: payment.creditsPurchased },
          update: { balance: { increment: payment.creditsPurchased } },
        });

        if (payment.promoCodeId) {
          await tx.promoCode.update({
            where: { id: payment.promoCodeId },
            data: { redemptionCount: { increment: 1 } },
          });
        }

        return {
          credited: true,
          userId: payment.userId,
          paymentId: payment.id,
          amountCents: payment.amountCents,
          creditsPurchased: payment.creditsPurchased,
          discountCents: payment.discountCents,
          promoCodeId: payment.promoCodeId,
          packId: payment.packId,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (e.code === "P2002" || e.code === "P2034")
    ) {
      return false;
    }
    throw e;
  }

  if (result.credited && result.userId && result.paymentId) {
    let promoCode: string | undefined;
    if (result.promoCodeId) {
      const promo = await db.promoCode.findUnique({
        where: { id: result.promoCodeId },
        select: { code: true },
      });
      promoCode = promo?.code;
    }
    let packLabel: string | undefined;
    if (result.packId) {
      const pack = await db.pack.findUnique({
        where: { id: result.packId },
        select: { label: true },
      });
      packLabel = pack?.label;
    }

    await logActivity({
      action: "payment.paid",
      actorId: result.userId,
      subjectUserId: result.userId,
      meta: {
        paymentId: result.paymentId,
        amountCents: result.amountCents,
        discountCents: result.discountCents,
        creditsPurchased: result.creditsPurchased,
        ...(packLabel ? { packLabel } : {}),
        ...(promoCode ? { promoCode } : {}),
      },
    });
  }

  return result.credited;
}

/** Marks an expired/abandoned checkout as failed. */
export async function failCheckout(stripeSessionId: string): Promise<void> {
  const updated = await db.payment.updateMany({
    where: { stripeSessionId, status: "PENDING" },
    data: { status: "FAILED" },
  });
  if (updated.count === 0) return;

  const payment = await db.payment.findUnique({
    where: { stripeSessionId },
    select: { id: true, userId: true, amountCents: true, creditsPurchased: true },
  });
  if (!payment) return;

  await logActivity({
    action: "payment.failed",
    actorId: payment.userId,
    subjectUserId: payment.userId,
    meta: {
      paymentId: payment.id,
      amountCents: payment.amountCents,
      creditsPurchased: payment.creditsPurchased,
    },
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
      if (session.payment_status === "paid") {
        const paymentIntent =
          typeof session.payment_intent === "string" ? session.payment_intent : undefined;
        const didCredit = await fulfillCheckout(payment.stripeSessionId, paymentIntent);
        if (didCredit) credited += 1;
        continue;
      }

      if (session.status === "expired") {
        await failCheckout(payment.stripeSessionId);
      }
    } catch (e) {
      console.error("[stripe/sync]", payment.stripeSessionId, e);
    }
  }

  return { credited };
}
