/**
 * Writes GoTrue HTML files from lib/emails/auth.ts.
 * Run after copy/layout changes: `npm run emails:write`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { authEmailFiles } from "../lib/emails/auth";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../supabase/templates");
mkdirSync(dir, { recursive: true });

for (const [filename, html] of Object.entries(authEmailFiles())) {
  writeFileSync(join(dir, filename), html, "utf8");
}
