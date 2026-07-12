import "server-only";
import { headers } from "next/headers";

/**
 * In-memory sliding-window rate limiting. Fine for a single instance;
 * swap for Redis/Upstash when running multiple instances.
 */

const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export const RATE_LIMITS = {
  importCv: { limit: 5, windowMs: 10 * 60 * 1000 },
  generate: { limit: 10, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  otp: { limit: 15, windowMs: 15 * 60 * 1000 },
} as const;

/**
 * Best-effort client IP for rate-limit keys. Server actions and route
 * handlers both see the proxy headers set by Vercel / any reverse proxy.
 */
export function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
