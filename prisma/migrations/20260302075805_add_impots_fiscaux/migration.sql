-- CreateEnum
CREATE TYPE "TypeAjustementFiscal" AS ENUM ('REINTEGRATION', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "ModaliteAcomptes" AS ENUM ('CALCUL', 'MANUEL', 'AUCUN');

-- CreateEnum
CREATE TYPE "ModaliteCIR" AS ENUM ('REPORT', 'REMBOURSEMENT', 'MIXTE');

-- CreateTable
CREATE TABLE "ajustement_fiscal" (
    "id" TEXT NOT NULL,
    "type" "TypeAjustementFiscal" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL DEFAULT '',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "ajustement_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres_is" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tauxReduitN" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "plafondReduitN" DECIMAL(15,2) NOT NULL DEFAULT 42500,
    "tauxNormalN" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "contributionVolN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditImpotN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "modaliteAcomptesN" "ModaliteAcomptes" NOT NULL DEFAULT 'CALCUL',
    "montantAcomptesManuelN" DECIMAL(15,2),
    "tauxReduitN1" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "plafondReduitN1" DECIMAL(15,2) NOT NULL DEFAULT 42500,
    "tauxNormalN1" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "contributionVolN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditImpotN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "modaliteAcomptesN1" "ModaliteAcomptes" NOT NULL DEFAULT 'CALCUL',
    "montantAcomptesManuelN1" DECIMAL(15,2),
    "tauxReduitN2" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "plafondReduitN2" DECIMAL(15,2) NOT NULL DEFAULT 42500,
    "tauxNormalN2" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "contributionVolN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditImpotN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "modaliteAcomptesN2" "ModaliteAcomptes" NOT NULL DEFAULT 'CALCUL',
    "montantAcomptesManuelN2" DECIMAL(15,2),
    "plancherDispense" DECIMAL(15,2) NOT NULL DEFAULT 3000,
    "delaiSoldeJours" INTEGER NOT NULL DEFAULT 105,
    "delaiRemboursementMois" INTEGER NOT NULL DEFAULT 2,
    "cirEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cirMontantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cirMontantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cirMontantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cirModaliteN" "ModaliteCIR" NOT NULL DEFAULT 'REPORT',
    "cirModaliteN1" "ModaliteCIR" NOT NULL DEFAULT 'REPORT',
    "cirModaliteN2" "ModaliteCIR" NOT NULL DEFAULT 'REPORT',
    "cirDelaiN" INTEGER NOT NULL DEFAULT 3,
    "cirDelaiN1" INTEGER NOT NULL DEFAULT 3,
    "cirDelaiN2" INTEGER NOT NULL DEFAULT 3,
    "pvltEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pvltTaux" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "parametres_is_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parametres_is_scenarioId_key" ON "parametres_is"("scenarioId");

-- AddForeignKey
ALTER TABLE "ajustement_fiscal" ADD CONSTRAINT "ajustement_fiscal_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametres_is" ADD CONSTRAINT "parametres_is_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
