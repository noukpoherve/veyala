import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * One-shot, idempotent migration of pre-Supabase accounts into GoTrue.
 * For each Prisma User without an authId:
 *  - creates/links the auth.users entry (email marked confirmed if it was,
 *    ADMIN role pinned in app_metadata). Password must be reset via
 *    "forgot password" if the Auth.js hash was never imported.
 *  - stores the new auth id back on the User row.
 *
 * Usage: npx tsx scripts/migrate-users-to-supabase.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.
 */

const db = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing`);
  return value;
}

const admin = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function findAuthUserByEmail(email: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const users = await db.user.findMany({ where: { authId: null } });
  console.log(`${users.length} account(s) to migrate`);

  let migrated = 0;
  let linked = 0;
  const failures: string[] = [];

  for (const user of users) {
    const email = user.email.toLowerCase();
    try {
      const existing = await findAuthUserByEmail(email);
      if (existing) {
        await db.user.update({ where: { id: user.id }, data: { authId: existing.id } });
        linked++;
        console.log(`~ linked   ${email}`);
        continue;
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: !!user.emailVerified,
        app_metadata: user.role === "ADMIN" ? { role: "ADMIN" } : undefined,
        user_metadata: user.name ? { full_name: user.name } : undefined,
      });
      if (error || !data.user) throw error ?? new Error("no user returned");

      await db.user.update({ where: { id: user.id }, data: { authId: data.user.id } });
      migrated++;
      console.log(`+ migrated ${email} (password reset required)`);
    } catch (error) {
      failures.push(email);
      console.error(`! failed   ${email}:`, error);
    }
  }

  console.log(`\nDone: ${migrated} migrated, ${linked} linked, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.error("Failed accounts:", failures.join(", "));
    process.exitCode = 1;
  }
}

main().finally(() => db.$disconnect());
