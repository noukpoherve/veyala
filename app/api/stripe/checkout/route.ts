import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { PromoValidationError, resolvePromoForCheckout } from "@/lib/promo";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/utils";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";

export const runtime = "nodejs";

const bodySchema = z.object({
  packId: z.string().min(1),
  promoCode: z.string().max(64).optional(),
});

/** Creates a Stripe Checkout session for a credit pack (optional promo). */
export async function POST(req: Request) {
  const session = await auth();
  const locale = getLocaleFromRequest(req);
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

  let amountCents = pack.priceCents;
  let creditsPurchased = pack.credits;
  let discountCents = 0;
  let promoCodeId: string | undefined;
  let promoLabel: string | undefined;

  const rawPromo = parsed.data.promoCode?.trim();
  if (rawPromo) {
    try {
      const quote = await resolvePromoForCheckout({
        code: rawPromo,
        pack,
        userId: session.user.id,
      });
      amountCents = quote.amountCents;
      creditsPurchased = quote.credits;
      discountCents = quote.discountCents;
      promoCodeId = quote.promo.id;
      promoLabel = quote.promo.code;
    } catch (e) {
      const message = e instanceof PromoValidationError ? e.message : "Code promo invalide.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const origin = siteUrl();
  const description =
    locale === "en"
      ? `${creditsPurchased} resume generation${creditsPurchased === 1 ? "" : "s"}${promoLabel ? ` · code ${promoLabel}` : ""}`
      : discountCents > 0 || creditsPurchased !== pack.credits
        ? `${creditsPurchased} générations de CV${promoLabel ? ` · code ${promoLabel}` : ""}`
        : `${pack.credits} générations de CV`;
  const productName =
    locale === "en" ? `Veyala: ${pack.credits}-credit pack` : `Veyala : pack ${pack.label}`;

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
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description,
            },
          },
        },
      ],
      metadata: {
        userId: session.user.id,
        packId: pack.id,
        ...(promoCodeId ? { promoCodeId, promoCode: promoLabel ?? "" } : {}),
        discountCents: String(discountCents),
        creditsPurchased: String(creditsPurchased),
      },
      locale: locale === "en" ? "en" : "fr",
      success_url: `${origin}${locale === "en" ? "/en" : ""}/billing?status=success`,
      cancel_url: `${origin}${locale === "en" ? "/en" : ""}/billing?status=cancelled`,
    });

    await db.payment.create({
      data: {
        userId: session.user.id,
        stripeSessionId: checkout.id,
        packId: pack.id,
        promoCodeId,
        amountCents,
        discountCents,
        currency: "eur",
        creditsPurchased,
        status: "PENDING",
      },
    });

    void logActivity({
      action: "payment.checkout_started",
      actorId: session.user.id,
      subjectUserId: session.user.id,
      meta: {
        packLabel: pack.label,
        amountCents,
        discountCents,
        credits: creditsPurchased,
        ...(promoLabel ? { promoCode: promoLabel } : {}),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    reportError(e, "stripe/checkout");
    return NextResponse.json(
      {
        error:
          "Le paiement n'a pas pu démarrer. Vérifiez la configuration Stripe ou réessayez plus tard.",
      },
      { status: 503 }
    );
  }
}
