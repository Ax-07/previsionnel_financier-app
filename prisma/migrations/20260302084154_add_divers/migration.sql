-- CreateEnum
CREATE TYPE "TypeDiversFlux" AS ENUM ('REMBOURSEMENT_CC', 'DIVIDENDE', 'DEBLOCAGE_PARTICIPATION', 'ENCAISSEMENT', 'DECAISSEMENT');

-- CreateEnum
CREATE TYPE "TypeOperationCapital" AS ENUM ('AUGMENTATION_INCORPORATION', 'REDUCTION');

-- CreateEnum
CREATE TYPE "PeriodicitePret" AS ENUM ('MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE');

-- CreateTable
CREATE TABLE "divers_flux_date" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "hypothese" TEXT,
    "type" "TypeDiversFlux" NOT NULL,
    "dateN" TEXT,
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN1" TEXT,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN2" TEXT,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "divers_flux_date_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divers_operation_capital" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "hypothese" TEXT,
    "type" "TypeOperationCapital" NOT NULL,
    "date" TEXT,
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "divers_operation_capital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divers_pret" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "hypothese" TEXT,
    "dateDebut" TEXT,
    "capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taux" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "dureeMois" INTEGER NOT NULL DEFAULT 12,
    "periodicite" "PeriodicitePret" NOT NULL DEFAULT 'MENSUELLE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "divers_pret_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "divers_flux_date" ADD CONSTRAINT "divers_flux_date_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divers_operation_capital" ADD CONSTRAINT "divers_operation_capital_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divers_pret" ADD CONSTRAINT "divers_pret_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
