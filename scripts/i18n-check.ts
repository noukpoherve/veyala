/**
 * Fails if English catalogs drift from the French key tree.
 * Usage: `npm run i18n:check`
 */
import { catalogs, type Messages } from "../i18n/messages";

type Leaf = string | number | boolean | ((...args: never[]) => unknown);

function walk(value: unknown, prefix = ""): string[] {
  if (typeof value === "function" || typeof value === "string") {
    return prefix ? [prefix] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => walk(item, `${prefix}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      walk(nested, prefix ? `${prefix}.${key}` : key)
    );
  }
  return prefix ? [prefix] : [];
}

function assertMessages(en: Messages): void {
  void en;
}

assertMessages(catalogs.en);

const frKeys = walk(catalogs.fr);
const enKeys = walk(catalogs.en);
const missing = frKeys.filter((key) => !enKeys.includes(key));
const extra = enKeys.filter((key) => !frKeys.includes(key));

if (missing.length || extra.length) {
  if (missing.length) {
    console.error(`Missing English keys (${missing.length}):\n${missing.join("\n")}`);
  }
  if (extra.length) {
    console.error(`Extra English keys (${extra.length}):\n${extra.join("\n")}`);
  }
  process.exit(1);
}

console.log(`i18n:check ok — ${frKeys.length} keys in FR and EN.`);
void (0 as unknown as Leaf);
