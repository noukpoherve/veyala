import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncPendingCheckouts } from "@/lib/payments";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/sentry";

export const runtime = "nodejs";

/**
 * Client-triggered fallback after Checkout success: verifies PENDING sessions
 * against Stripe and credits the buyer if payment_status is paid. Covers the
 * case where the webhook never arrived (missing endpoint / bad signing secret).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const userId = session.user.id;
  const { limit, windowMs } = RATE_LIMITS.stripeSync;
  if (!(await rateLimit(`stripe-sync:${userId}`, limit, windowMs))) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans un instant." },
      { status: 429 }
    );
  }

  try {
    const result = await syncPendingCheckouts(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    reportError(e, "stripe/sync");
    return NextResponse.json(
      { error: "Impossible de synchroniser le paiement pour le moment." },
      { status: 503 }
    );
  }
}
