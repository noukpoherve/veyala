import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Public site origin for auth email/OAuth redirects (confirmation, reset,
 * invite). Resolved per environment — must NEVER return localhost on Vercel:
 *  - Preview/branch deploys → this deployment's own URL (VERCEL_URL), even if
 *    NEXT_PUBLIC_SITE_URL is mis-scoped to all environments.
 *  - Production → the custom domain (NEXT_PUBLIC_SITE_URL, e.g. https://veyala.fr)
 *    or Vercel's stable production URL as a fallback.
 *  - Local dev → http://localhost:3000.
 * Only ever called server-side, so the non-public VERCEL_* vars are available.
 */
export function siteUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Instant motion when the user asked the OS to reduce animation. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** Canonical email form used everywhere an address is stored or compared. */
export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
