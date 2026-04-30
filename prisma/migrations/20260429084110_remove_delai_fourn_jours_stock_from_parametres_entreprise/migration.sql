/*
  Warnings:

  - You are about to drop the column `delaiPaiementFournisseurs` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `joursStockMoyen` on the `parametres_entreprise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "parametres_entreprise" DROP COLUMN "delaiPaiementFournisseurs",
DROP COLUMN "joursStockMoyen";
