-- CreateEnum
CREATE TYPE "FormatTableauLibre" AS ENUM ('MONTANT', 'POURCENTAGE', 'QUANTITE', 'CALCULE');

-- CreateEnum
CREATE TYPE "ExerciceTableauLibre" AS ENUM ('N', 'N1', 'N2');

-- CreateTable
CREATE TABLE "tableau_libre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Nouveau tableau',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "showZeroLines" BOOLEAN NOT NULL DEFAULT false,
    "hidePreviousYear" BOOLEAN NOT NULL DEFAULT false,
    "pieChart" BOOLEAN NOT NULL DEFAULT false,
    "histogram" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "tableau_libre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tableau_libre_ligne" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL DEFAULT '',
    "format" "FormatTableauLibre" NOT NULL DEFAULT 'MONTANT',
    "detailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "nValeur" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "growthRateN1" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "growthRateN2" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableauId" TEXT NOT NULL,

    CONSTRAINT "tableau_libre_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tableau_libre_detail" (
    "id" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pourcentage" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "exercice" "ExerciceTableauLibre" NOT NULL DEFAULT 'N',
    "ligneId" TEXT NOT NULL,

    CONSTRAINT "tableau_libre_detail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tableau_libre_detail_ligneId_mois_exercice_key" ON "tableau_libre_detail"("ligneId", "mois", "exercice");

-- AddForeignKey
ALTER TABLE "tableau_libre" ADD CONSTRAINT "tableau_libre_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tableau_libre_ligne" ADD CONSTRAINT "tableau_libre_ligne_tableauId_fkey" FOREIGN KEY ("tableauId") REFERENCES "tableau_libre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tableau_libre_detail" ADD CONSTRAINT "tableau_libre_detail_ligneId_fkey" FOREIGN KEY ("ligneId") REFERENCES "tableau_libre_ligne"("id") ON DELETE CASCADE ON UPDATE CASCADE;
