/*
  Warnings:

  - The `hypothese` column on the `activite` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `activite_commission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `charge_exploitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `divers_flux_date` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `divers_operation_capital` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `divers_pret` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `impot_taxe` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `ligne_charge_personnel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `ligne_dirigeant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `ligne_salarie` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `ligne_taxe_salaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hypothese` column on the `production_immobilisee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ordre` on the `scenario` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `scenario` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `scenario` table. All the data in the column will be lost.
  - The `hypothese` column on the `subvention_exploitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "HypotheseType" AS ENUM ('COMMUNE', 'PESSIMISTE', 'REALISTE', 'OPTIMISTE');

-- DropForeignKey
ALTER TABLE "scenario" DROP CONSTRAINT "scenario_sourceId_fkey";

-- DropIndex
DROP INDEX "scenario_dossierId_nom_key";

-- AlterTable
ALTER TABLE "activite" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "activite_commission" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ajustement_fiscal" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "apport" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_charge" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_charge_bilan" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_charge_datee" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_charge_provision" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_produit" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_produit_constate" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_produit_date" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "autre_produit_reprise" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "cession_immobilisation" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "charge_exploitation" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "charge_fixe" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "charge_variable" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "credit_bail" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "dirigeant" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "divers_flux_date" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "divers_operation_capital" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "divers_pret" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "emprunt" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "immobilisation" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "impot_taxe" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ligne_charge_personnel" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ligne_cotisation_tns" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ligne_dirigeant" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ligne_salarie" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "ligne_taxe_salaire" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "production_immobilisee" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "salarie" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "scenario" DROP COLUMN "ordre",
DROP COLUMN "sourceId",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "subvention" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "subvention_exploitation" DROP COLUMN "hypothese",
ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- AlterTable
ALTER TABLE "unite_d_oeuvre" ADD COLUMN     "hypothese" "HypotheseType" NOT NULL DEFAULT 'COMMUNE';

-- DropEnum
DROP TYPE "ScenarioType";
