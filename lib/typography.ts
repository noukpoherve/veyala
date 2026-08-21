/** Injected into LLM system prompts that write user-visible French prose. */
export const GENERATED_COPY_TYPOGRAPHY =
  "Typographie : n'utilise jamais le tiret cadratin (—) ni le demi-cadratin (–). Sépare ou nuance avec une virgule, un deux-points, des parenthèses ou un point. Le trait d'union (-) reste autorisé dans les mots composés et les dates (ex. 2023-2025).";

/** Same rule for English generated copy. */
export const GENERATED_COPY_TYPOGRAPHY_EN =
  "Typography: never use em dashes (—) or en dashes (–). Separate or qualify with a comma, a colon, parentheses, or a period. Hyphens (-) are fine in compounds and dates (e.g. 2023-2025).";

/** Removes em/en dashes from generated copy so they never reach the user. */
export function stripEmDashes(text: string): string {
  return text
    .replace(/(\d)\s*[—–]\s*(\d)/g, "$1-$2")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[—–]/g, "");
}

export function stripEmDashesDeep<T>(value: T): T {
  if (typeof value === "string") return stripEmDashes(value) as T;
  if (Array.isArray(value)) return value.map((item) => stripEmDashesDeep(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripEmDashesDeep(nested);
    }
    return out as T;
  }
  return value;
}
