/*
  Warnings:

  - You are about to drop the column `coutUnitaire` on the `unite_d_oeuvre` table. All the data in the column will be lost.
  - You are about to drop the column `unite` on the `unite_d_oeuvre` table. All the data in the column will be lost.
  - You are about to drop the column `volumesAnnuels` on the `unite_d_oeuvre` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeUniteOeuvre" AS ENUM ('COUVERT', 'PRODUIT', 'HEURE', 'CLIENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeIndicateurUO" AS ENUM ('CHIFFRE_AFFAIRES', 'QUANTITE', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "TypeDureeUO" AS ENUM ('JOURS_AN', 'MOIS_AN', 'PERSONNALISEE');

-- AlterTable
ALTER TABLE "unite_d_oeuvre" DROP COLUMN "coutUnitaire",
DROP COLUMN "unite",
DROP COLUMN "volumesAnnuels",
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "chiffreAffairesN" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chiffreAffairesN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chiffreAffairesN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "indicateurBaseN" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "indicateurBaseN1" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "indicateurBaseN2" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "nbJoursN" DECIMAL(7,2) NOT NULL DEFAULT 365,
ADD COLUMN     "nbJoursN1" DECIMAL(7,2) NOT NULL DEFAULT 365,
ADD COLUMN     "nbJoursN2" DECIMAL(7,2) NOT NULL DEFAULT 365,
ADD COLUMN     "parJourN" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "parJourN1" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "parJourN2" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "partPctN" DECIMAL(7,4) NOT NULL DEFAULT 0,
ADD COLUMN     "partPctN1" DECIMAL(7,4) NOT NULL DEFAULT 0,
ADD COLUMN     "partPctN2" DECIMAL(7,4) NOT NULL DEFAULT 0,
ADD COLUMN     "prixMoyenN" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "prixMoyenN1" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "prixMoyenN2" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "quantiteN" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "quantiteN1" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "quantiteN2" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "typeDuree" "TypeDureeUO" NOT NULL DEFAULT 'JOURS_AN',
ADD COLUMN     "typeIndicateur" "TypeIndicateurUO" NOT NULL DEFAULT 'CHIFFRE_AFFAIRES',
ADD COLUMN     "typeUnite" "TypeUniteOeuvre" NOT NULL DEFAULT 'COUVERT',
ALTER COLUMN "libelle" SET DEFAULT '';
