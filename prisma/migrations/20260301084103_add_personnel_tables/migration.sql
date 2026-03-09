-- CreateTable
CREATE TABLE "ligne_salarie" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "hypothese" TEXT NOT NULL DEFAULT 'normale',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN1" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN2" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tauxCotSal" DECIMAL(6,4) NOT NULL DEFAULT 22,
    "tauxCotPat" DECIMAL(6,4) NOT NULL DEFAULT 42,
    "tauxFixe" DECIMAL(6,4) NOT NULL DEFAULT 100,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "ligne_salarie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_dirigeant" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "hypothese" TEXT NOT NULL DEFAULT 'normale',
    "montantN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN1" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "montantN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "evolutionN2" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "montantN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "exonerationTNS" TEXT,
    "conjointCollaborateur" BOOLEAN NOT NULL DEFAULT false,
    "tauxFixe" DECIMAL(6,4) NOT NULL DEFAULT 100,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "ligne_dirigeant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ligne_salarie" ADD CONSTRAINT "ligne_salarie_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_dirigeant" ADD CONSTRAINT "ligne_dirigeant_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
