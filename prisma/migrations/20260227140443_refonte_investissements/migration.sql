/*
  Warnings:

  - You are about to drop the column `categorie` on the `immobilisation` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `immobilisation` table. All the data in the column will be lost.
  - You are about to drop the column `recuperationTVA` on the `immobilisation` table. All the data in the column will be lost.
  - You are about to drop the column `valeurResiduelle` on the `immobilisation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NatureImmobilisation" AS ENUM ('CORPOREL', 'INCORPOREL', 'FINANCIER');

-- CreateEnum
CREATE TYPE "TypeTVA" AS ENUM ('RECUPERABLE', 'NON_RECUPERABLE', 'EXONEREE');

-- CreateEnum
CREATE TYPE "PeriodiciteCredit" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL');

-- AlterEnum
ALTER TYPE "ModeAmortissement" ADD VALUE 'AUCUN';

-- AlterTable
ALTER TABLE "immobilisation" DROP COLUMN "categorie",
DROP COLUMN "description",
DROP COLUMN "recuperationTVA",
DROP COLUMN "valeurResiduelle",
ADD COLUMN     "differe" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nature" "NatureImmobilisation" NOT NULL DEFAULT 'CORPOREL',
ADD COLUMN     "typeTva" "TypeTVA" NOT NULL DEFAULT 'RECUPERABLE',
ALTER COLUMN "dureeAmortissement" SET DEFAULT 5;

-- DropEnum
DROP TYPE "CategorieImmobilisation";

-- CreateTable
CREATE TABLE "cession_immobilisation" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "nature" "NatureImmobilisation" NOT NULL DEFAULT 'CORPOREL',
    "dateCession" TIMESTAMP(3) NOT NULL,
    "prixVente" DECIMAL(15,2) NOT NULL,
    "prixAchat" DECIMAL(15,2) NOT NULL,
    "dejaAmortie" DECIMAL(15,2) NOT NULL,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "cession_immobilisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_bail" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "montantHT" DECIMAL(15,2) NOT NULL,
    "taux" DECIMAL(5,2) NOT NULL,
    "duree" INTEGER NOT NULL,
    "periodicite" "PeriodiciteCredit" NOT NULL DEFAULT 'MENSUEL',
    "dateEcheance" TIMESTAMP(3),
    "valeurResiduelle" DECIMAL(15,2),
    "premierLoyer" DECIMAL(15,2),
    "loyerHT" DECIMAL(15,2),
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "credit_bail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cession_immobilisation" ADD CONSTRAINT "cession_immobilisation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_bail" ADD CONSTRAINT "credit_bail_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
