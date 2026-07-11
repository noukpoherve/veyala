-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "sourceImageHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Template_sourceImageHash_key" ON "Template"("sourceImageHash");

