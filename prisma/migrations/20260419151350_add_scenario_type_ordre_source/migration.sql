/*
  Warnings:

  - A unique constraint covering the columns `[dossierId,nom]` on the table `scenario` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('PESSIMISTE', 'CENTRAL', 'OPTIMISTE', 'PERSONNALISE');

-- AlterTable
ALTER TABLE "scenario" ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "type" "ScenarioType" NOT NULL DEFAULT 'CENTRAL';

-- CreateIndex
CREATE UNIQUE INDEX "scenario_dossierId_nom_key" ON "scenario"("dossierId", "nom");

-- AddForeignKey
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
