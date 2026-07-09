import { createHash } from "crypto";
import type { TemplateDefinition } from "./definition";

/**
 * Stable fingerprint of a template's structure and style, used for duplicate
 * detection. Captures the normalized definition, not raw bytes: two imports
 * of the same design produce the same hash.
 */
export function templateFingerprint(definition: TemplateDefinition): string {
  return createHash("sha256").update(canonicalize(definition)).digest("hex");
}

/** Deterministic JSON: sorted keys, lowercased colors, no volatile fields. */
function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
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
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  return value;
}
