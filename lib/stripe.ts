import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily initialized Stripe client; throws a clear error when unconfigured. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquante : configurez Stripe dans .env.local.");
  }
  client ??= new Stripe(key);
  return client;
}
