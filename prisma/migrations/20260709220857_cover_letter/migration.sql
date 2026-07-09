-- AlterTable
ALTER TABLE "GeneratedCV" ADD COLUMN     "coverLetter" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coverLetterDocxUrl" TEXT,
ADD COLUMN     "coverLetterPdfUrl" TEXT;
