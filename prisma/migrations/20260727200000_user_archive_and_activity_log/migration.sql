-- Soft-archive users + append-only activity log (survives hard delete via SetNull).

CREATE TYPE "ArchiveSource" AS ENUM ('SELF', 'ADMIN');

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "archivedBy" "ArchiveSource";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "archiveReason" TEXT;

CREATE INDEX IF NOT EXISTS "User_archivedAt_idx" ON "User"("archivedAt");

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "subjectUserId" TEXT,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_subjectUserId_createdAt_idx" ON "ActivityLog"("subjectUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_subjectUserId_fkey"
    FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
