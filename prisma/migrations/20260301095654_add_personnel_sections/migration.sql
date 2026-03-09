-- CreateTable
CREATE TABLE "ligne_cotisation_tns" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "calcAuto" BOOLEAN NOT NULL DEFAULT false,
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "ligne_cotisation_tns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_taxe_salaire" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "hypothese" TEXT NOT NULL DEFAULT 'normale',
    "calcAuto" BOOLEAN NOT NULL DEFAULT false,
    "taux" DECIMAL(6,4) NOT NULL DEFAULT 0,
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

    CONSTRAINT "ligne_taxe_salaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_charge_personnel" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "hypothese" TEXT NOT NULL DEFAULT 'normale',
    "type" TEXT NOT NULL DEFAULT 'AUTRE',
    "calcAuto" BOOLEAN NOT NULL DEFAULT false,
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

    CONSTRAINT "ligne_charge_personnel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ligne_cotisation_tns" ADD CONSTRAINT "ligne_cotisation_tns_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_taxe_salaire" ADD CONSTRAINT "ligne_taxe_salaire_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_charge_personnel" ADD CONSTRAINT "ligne_charge_personnel_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
