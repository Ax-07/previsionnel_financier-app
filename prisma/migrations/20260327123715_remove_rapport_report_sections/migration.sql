/*
  Warnings:

  - You are about to drop the `rapport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_section` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rapport" DROP CONSTRAINT "rapport_dossierId_fkey";

-- DropForeignKey
ALTER TABLE "report_section" DROP CONSTRAINT "report_section_dossierId_fkey";

-- DropTable
DROP TABLE "rapport";

-- DropTable
DROP TABLE "report_section";
