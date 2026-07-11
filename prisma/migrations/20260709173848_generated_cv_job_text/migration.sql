/*
  Warnings:

  - Added the required column `jobText` to the `GeneratedCV` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedCV" ADD COLUMN     "jobText" TEXT NOT NULL;
