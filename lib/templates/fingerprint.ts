import { createHash } from "crypto";
import type { TemplateDefinition } from "./definition";

/**
 * Stable fingerprint of a template's structure and style, used for duplicate
 * detection. Captures the normalized definition, not raw bytes: two imports
 * of the same design produce the same hash. Colors are quantized so the small
 * variations of AI extraction from an image converge to the same hash.
 */
export function templateFingerprint(definition: TemplateDefinition): string {
  return createHash("sha256").update(canonicalize(definition)).digest("hex");
}

/** Deterministic JSON: sorted keys, quantized colors, no volatile fields. */
function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

/** Rounds each RGB channel to 16-step buckets: #5491c7 and #5590c8 → #5090c0. */
function quantizeColor(hex: string): string {
  const chan = (i: number) =>
    (Math.min(parseInt(hex.slice(i, i + 2), 16), 255) & 0xf0).toString(16).padStart(2, "0");
  return `#${chan(1)}${chan(3)}${chan(5)}`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortValue(v)])
    );
  }
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return quantizeColor(value.toLowerCase());
  }
  return value;
}
