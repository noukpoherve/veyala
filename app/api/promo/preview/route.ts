import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PromoValidationError, resolvePromoForCheckout } from "@/lib/promo";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";

const bodySchema = z.object({
  packId: z.string().min(1),
  code: z.string().min(1).max(64),
});

/** Preview a promo against a pack without starting Checkout. */
export async function POST(req: Request) {
  const locale = getLocaleFromRequest(req);
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: m.api.promo.invalidData }, { status: 400 });
  }

  const pack = await db.pack.findUnique({ where: { id: parsed.data.packId } });
  if (!pack?.active) {
    return NextResponse.json({ error: m.api.stripe.packUnavailable }, { status: 404 });
  }

  try {
    const quote = await resolvePromoForCheckout({
      code: parsed.data.code,
      pack,
      userId: session.user.id,
    });
    return NextResponse.json({
      ok: true,
      code: quote.promo.code,
      label: quote.label,
      amountCents: quote.amountCents,
      discountCents: quote.discountCents,
      credits: quote.credits,
      originalAmountCents: pack.priceCents,
      originalCredits: pack.credits,
    });
  } catch (e) {
    // Promo rejections are written in French: only pass them to French readers.
    const message =
      locale === "fr" && e instanceof PromoValidationError ? e.message : m.api.promo.invalidCode;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
