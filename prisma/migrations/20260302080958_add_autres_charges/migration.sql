-- CreateEnum
CREATE TYPE "CategorieAutreChargeDatee" AS ENUM ('GESTION_COURANTE', 'FINANCIERE', 'EXCEPTIONNELLE');

-- CreateEnum
CREATE TYPE "TypeTVAAutreCharge" AS ENUM ('FACTURATION', 'DECAISSEMENT', 'NON_RECUPERABLE');

-- CreateEnum
CREATE TYPE "TypeAutreChargeBilan" AS ENUM ('CHARGE_CONSTATEE_AVANCE', 'CHARGE_A_PAYER');

-- CreateTable
CREATE TABLE "autre_charge_provision" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "nature" TEXT NOT NULL DEFAULT '',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_charge_provision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_charge_datee" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "categorie" "CategorieAutreChargeDatee" NOT NULL DEFAULT 'GESTION_COURANTE',
    "dateN" TEXT,
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN1" TEXT,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN2" TEXT,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "typeTVA" "TypeTVAAutreCharge",
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_charge_datee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_charge_bilan" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "type" "TypeAutreChargeBilan" NOT NULL DEFAULT 'CHARGE_CONSTATEE_AVANCE',
    "nature" TEXT NOT NULL DEFAULT '',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_charge_bilan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "autre_charge_provision" ADD CONSTRAINT "autre_charge_provision_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_charge_datee" ADD CONSTRAINT "autre_charge_datee_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_charge_bilan" ADD CONSTRAINT "autre_charge_bilan_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
