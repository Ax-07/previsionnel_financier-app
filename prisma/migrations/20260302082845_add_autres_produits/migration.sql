-- CreateEnum
CREATE TYPE "CategorieAutreProduitDate" AS ENUM ('TRANSFERT', 'GESTION_COURANTE', 'FINANCIER', 'EXCEPTIONNEL');

-- CreateEnum
CREATE TYPE "TypeTVAAutreProduit" AS ENUM ('FACTURATION', 'ENCAISSEMENT', 'NON_APPLICABLE');

-- CreateEnum
CREATE TYPE "NatureRepriseProduit" AS ENUM ('DEPRECIATION_CREANCES', 'PROVISION_RISQUES', 'PROVISION_LITIGES', 'PROVISION_GARANTIES', 'PROVISION_CHARGES', 'AUTRE');

-- CreateEnum
CREATE TYPE "NaturePCA" AS ENUM ('CLIENTS', 'PRODUITS_EXPLOITATION', 'AUTRE');

-- CreateTable
CREATE TABLE "autre_produit_reprise" (
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

    CONSTRAINT "autre_produit_reprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_produit_date" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "libelle" TEXT NOT NULL,
    "categorie" "CategorieAutreProduitDate" NOT NULL DEFAULT 'GESTION_COURANTE',
    "dateN" TEXT,
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN1" TEXT,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dateN2" TEXT,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "typeTVA" "TypeTVAAutreProduit",
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_produit_date_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_produit_constate" (
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

    CONSTRAINT "autre_produit_constate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "autre_produit_reprise" ADD CONSTRAINT "autre_produit_reprise_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_produit_date" ADD CONSTRAINT "autre_produit_date_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_produit_constate" ADD CONSTRAINT "autre_produit_constate_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
