-- AlterTable
ALTER TABLE "parametres_entreprise" ADD COLUMN     "dateDebutExerciceN" TIMESTAMP(3),
ADD COLUMN     "dureePrevisionnelle" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "exercice_previsionnel" (
    "id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "dateCloture" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "parametresId" TEXT NOT NULL,

    CONSTRAINT "exercice_previsionnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercice_previsionnel_parametresId_ordre_key" ON "exercice_previsionnel"("parametresId", "ordre");

-- AddForeignKey
ALTER TABLE "exercice_previsionnel" ADD CONSTRAINT "exercice_previsionnel_parametresId_fkey" FOREIGN KEY ("parametresId") REFERENCES "parametres_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
