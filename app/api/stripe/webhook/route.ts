import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout, failCheckout } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Stripe webhook: credits the account on checkout.session.completed.
 * Signature is verified and fulfillment is idempotent.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object;
    await fulfillCheckout(
      checkout.id,
      typeof checkout.payment_intent === "string" ? checkout.payment_intent : undefined
    );
  } else if (event.type === "checkout.session.expired") {
    await failCheckout(event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
