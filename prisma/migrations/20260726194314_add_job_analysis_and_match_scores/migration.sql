-- AlterTable
ALTER TABLE "GeneratedCV" ADD COLUMN     "matchBreakdown" JSONB,
ADD COLUMN     "matchScoreAfter" INTEGER,
ADD COLUMN     "matchScoreBefore" INTEGER;

-- CreateTable
CREATE TABLE "JobAnalysis" (
    "id" TEXT NOT NULL,
    "jobTextHash" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "mustHave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "niceHave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobAnalysis_jobTextHash_key" ON "JobAnalysis"("jobTextHash");

-- CreateIndex
CREATE INDEX "GeneratedCV_jobTextHash_idx" ON "GeneratedCV"("jobTextHash");
