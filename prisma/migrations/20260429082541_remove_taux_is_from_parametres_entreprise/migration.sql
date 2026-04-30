/*
  Warnings:

  - You are about to drop the column `plafondIsReduit` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `tauxIs` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `tauxIsReduit` on the `parametres_entreprise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "parametres_entreprise" DROP COLUMN "plafondIsReduit",
DROP COLUMN "tauxIs",
DROP COLUMN "tauxIsReduit";
