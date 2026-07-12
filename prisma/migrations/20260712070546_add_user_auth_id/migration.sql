-- Supabase Auth linkage: app keeps cuid ids, auth.users maps via authId.
ALTER TABLE "User" ADD COLUMN "authId" UUID;

CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");
