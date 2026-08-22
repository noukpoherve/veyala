import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Standard Webhooks verification (Supabase Auth Hooks).
 * Secret formats: `whsec_…` or `v1,whsec_…`.
 */
export function verifyStandardWebhook(
  payload: string,
  headerList: Headers,
  secret: string
): boolean {
  const id = headerList.get("webhook-id");
  const timestamp = headerList.get("webhook-timestamp");
  const signatureHeader = headerList.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const keyB64 = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let key: Buffer;
  try {
    key = Buffer.from(keyB64, "base64");
  } catch {
    return false;
  }

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");

  return signatureHeader.split(" ").some((part) => {
    const sig = part.startsWith("v1,") ? part.slice(3) : part;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
