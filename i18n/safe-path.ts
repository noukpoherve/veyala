import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/path";

/**
 * True for same-origin relative paths only. Rejects protocol-relative (`//`),
 * scheme-relative tricks (`/\`), absolute URLs, and backslash escapes.
 */
export function isSafeInternalPath(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return false;
  if (trimmed.includes("\\")) return false;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) return false;
  // Block encoded tricks that decode to // or protocol-relative
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\")) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

/**
 * Sanitize a `callbackUrl` / `next` query value, then localize it.
 * Unsafe or empty values fall back to `/dashboard`.
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  locale: Locale,
  fallback = "/dashboard"
): string {
  const candidate = (raw ?? "").trim() || fallback;
  const safe = isSafeInternalPath(candidate) ? candidate : fallback;
  return localizeHref(safe, locale);
}
