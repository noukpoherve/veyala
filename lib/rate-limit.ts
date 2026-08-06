import "server-only";
import { headers } from "next/headers";

/**
 * Sliding-window rate limiting.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + TOKEN are set (multi-instance);
 * falls back to an in-memory Map for local/single-instance.
 */

const hits = new Map<string, number[]>();

/** In-memory limiter — also used by unit tests and as Upstash fallback. */
export function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
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

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

type UpstashLimiter = { limit: (key: string) => Promise<{ success: boolean }> };
const upstashLimiters = new Map<string, UpstashLimiter>();

async function upstashRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "cvgen:rl",
      analytics: false,
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  const result = await limiter.limit(key);
  return result.success;
}

/** Returns true when the call is allowed, false when the limit is exceeded. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (upstashConfigured()) {
    try {
      return await upstashRateLimit(key, limit, windowMs);
    } catch (error) {
      console.error("[rate-limit] Upstash failed, falling back to memory:", error);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

export const RATE_LIMITS = {
  importCv: { limit: 5, windowMs: 10 * 60 * 1000 },
  generate: { limit: 10, windowMs: 10 * 60 * 1000 },
  analyze: { limit: 20, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  otp: { limit: 15, windowMs: 15 * 60 * 1000 },
  stripeSync: { limit: 10, windowMs: 10 * 60 * 1000 },
} as const;

/**
 * Best-effort client IP for rate-limit keys. Server actions and route
 * handlers both see the proxy headers set by Vercel / any reverse proxy.
 */
export function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
