/*
  Warnings:

  - You are about to alter the column `evolutionN1` on the `ligne_dirigeant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `evolutionN2` on the `ligne_dirigeant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `tauxFixe` on the `ligne_dirigeant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `evolutionN1` on the `ligne_salarie` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `evolutionN2` on the `ligne_salarie` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `tauxCotSal` on the `ligne_salarie` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `tauxCotPat` on the `ligne_salarie` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `tauxFixe` on the `ligne_salarie` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.
  - You are about to alter the column `taux` on the `ligne_taxe_salaire` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(8,2)`.

*/
-- AlterTable
ALTER TABLE "ligne_dirigeant" ALTER COLUMN "evolutionN1" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "evolutionN2" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "tauxFixe" SET DATA TYPE DECIMAL(8,2);

-- AlterTable
ALTER TABLE "ligne_salarie" ALTER COLUMN "evolutionN1" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "evolutionN2" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "tauxCotSal" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "tauxCotPat" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "tauxFixe" SET DATA TYPE DECIMAL(8,2);

-- AlterTable
ALTER TABLE "ligne_taxe_salaire" ALTER COLUMN "taux" SET DATA TYPE DECIMAL(8,2);
