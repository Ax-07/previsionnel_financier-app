/*
  Warnings:

  - You are about to drop the column `tauxTvaReduit` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `tauxTvaStandard` on the `parametres_entreprise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "parametres_entreprise" DROP COLUMN "tauxTvaReduit",
DROP COLUMN "tauxTvaStandard";
