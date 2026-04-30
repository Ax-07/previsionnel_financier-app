/*
  Warnings:

  - You are about to drop the column `activite` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `codeNAF` on the `parametres_entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `repartitionResultat` on the `parametres_entreprise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "parametres_entreprise" DROP COLUMN "activite",
DROP COLUMN "codeNAF",
DROP COLUMN "repartitionResultat";
