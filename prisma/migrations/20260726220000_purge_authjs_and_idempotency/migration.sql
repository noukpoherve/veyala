-- Drop legacy Auth.js tables / columns (auth is Supabase-only now).
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "EmailVerification";
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

-- Generation idempotency (retries after success return the same CV).
ALTER TABLE "GeneratedCV" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedCV_userId_idempotencyKey_key"
  ON "GeneratedCV"("userId", "idempotencyKey");
