import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({ packId: z.string().min(1) });

/** Creates a Stripe Checkout session for a credit pack. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pack invalide." }, { status: 400 });
  }

  const pack = await db.pack.findUnique({ where: { id: parsed.data.packId } });
  if (!pack?.active) {
    return NextResponse.json({ error: "Ce pack n'est plus disponible." }, { status: 404 });
  }

  const origin = siteUrl();

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: pack.priceCents,
            product_data: {
              name: `Veyala — Pack ${pack.label}`,
              description: `${pack.credits} générations de CV`,
            },
          },
        },
      ],
      metadata: { userId: session.user.id, packId: pack.id },
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
    });

    await db.payment.create({
      data: {
        userId: session.user.id,
        stripeSessionId: checkout.id,
        amountCents: pack.priceCents,
        currency: "eur",
        creditsPurchased: pack.credits,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Paiement indisponible.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
