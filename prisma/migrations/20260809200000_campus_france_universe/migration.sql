-- CreateEnum
CREATE TYPE "GenerationUniverse" AS ENUM ('EMPLOYMENT', 'CAMPUS_FRANCE');

-- AlterTable GeneratedCV
ALTER TABLE "GeneratedCV" ADD COLUMN "universe" "GenerationUniverse" NOT NULL DEFAULT 'EMPLOYMENT';

-- AlterTable GenerationJob
ALTER TABLE "GenerationJob" ADD COLUMN "universe" "GenerationUniverse" NOT NULL DEFAULT 'EMPLOYMENT';

-- CreateTable FormationAnalysis
CREATE TABLE "FormationAnalysis" (
    "id" TEXT NOT NULL,
    "programTextHash" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "domain" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectionCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormationAnalysis_programTextHash_key" ON "FormationAnalysis"("programTextHash");

-- CreateIndex
CREATE INDEX "GeneratedCV_userId_universe_createdAt_idx" ON "GeneratedCV"("userId", "universe", "createdAt");
