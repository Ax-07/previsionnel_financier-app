-- AlterTable
ALTER TABLE "activite" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "evolutionN1" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "evolutionN2" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "hypothese" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "reglementClients" INTEGER,
ADD COLUMN     "reglementFournisseurs" INTEGER,
ADD COLUMN     "secteur" TEXT NOT NULL DEFAULT 'SERVICE',
ADD COLUMN     "stocks" INTEGER,
ADD COLUMN     "tauxMarge" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "tvaAchats" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
ALTER COLUMN "prixUnitaireHT" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "activite_commission" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "hypothese" TEXT NOT NULL DEFAULT 'normal',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN1" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN2" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "calculCommission" TEXT NOT NULL DEFAULT 'HT',
    "tauxCommission" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "tvaCommission" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "stocks" INTEGER,
    "reglementFournisseurs" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "activite_commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_immobilisee" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "nature" TEXT NOT NULL DEFAULT 'CORPOREL',
    "hypothese" TEXT NOT NULL DEFAULT 'normal',
    "date" TEXT NOT NULL DEFAULT '',
    "montant" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amortissement" TEXT NOT NULL DEFAULT 'LINEAIRE',
    "differe" INTEGER,
    "duree" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "production_immobilisee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subvention_exploitation" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "hypothese" TEXT NOT NULL DEFAULT 'normal',
    "dateN" TEXT,
    "montantN" DECIMAL(15,2),
    "dateN1" TEXT,
    "montantN1" DECIMAL(15,2),
    "dateN2" TEXT,
    "montantN2" DECIMAL(15,2),
    "tva" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "typeTva" TEXT NOT NULL DEFAULT 'RECUPERABLE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "subvention_exploitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activite_commission" ADD CONSTRAINT "activite_commission_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_immobilisee" ADD CONSTRAINT "production_immobilisee_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention_exploitation" ADD CONSTRAINT "subvention_exploitation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
