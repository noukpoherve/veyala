import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncPendingCheckouts } from "@/lib/payments";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/sentry";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";

/**
 * Client-triggered fallback after Checkout success: verifies PENDING sessions
 * against Stripe and credits the buyer if payment_status is paid. Covers the
 * case where the webhook never arrived (missing endpoint / bad signing secret).
 */
export async function POST(req: Request) {
  const m = getMessages(getLocaleFromRequest(req));
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: m.errors.authRequired }, { status: 401 });
  }

  const userId = session.user.id;
  const { limit, windowMs } = RATE_LIMITS.stripeSync;
  if (!(await rateLimit(`stripe-sync:${userId}`, limit, windowMs))) {
    return NextResponse.json({ error: m.api.stripe.syncRateLimited }, { status: 429 });
  }

  try {
    const result = await syncPendingCheckouts(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    reportError(e, "stripe/sync");
    return NextResponse.json({ error: m.api.stripe.syncFailed }, { status: 503 });
  }
}
