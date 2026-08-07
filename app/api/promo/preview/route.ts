import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PromoValidationError, resolvePromoForCheckout } from "@/lib/promo";

export const runtime = "nodejs";

const bodySchema = z.object({
  packId: z.string().min(1),
  code: z.string().min(1).max(64),
});

/** Preview a promo against a pack without starting Checkout. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const pack = await db.pack.findUnique({ where: { id: parsed.data.packId } });
  if (!pack?.active) {
    return NextResponse.json({ error: "Ce pack n'est plus disponible." }, { status: 404 });
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
    const message = e instanceof PromoValidationError ? e.message : "Code promo invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
