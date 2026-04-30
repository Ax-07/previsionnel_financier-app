-- AlterTable
ALTER TABLE "activite" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ajustement_fiscal" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "apport" ADD COLUMN     "groupe" TEXT,
ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "autre_charge_bilan" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "autre_charge_datee" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "autre_charge_provision" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "autre_produit_constate" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "autre_produit_date" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "autre_produit_reprise" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "charge_exploitation" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "charge_fixe" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "charge_variable" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "divers_flux_date" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "divers_operation_capital" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "divers_pret" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "emprunt" ADD COLUMN     "groupe" TEXT,
ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "impot_taxe" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ligne_charge_personnel" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ligne_cotisation_tns" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ligne_dirigeant" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ligne_salarie" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "ligne_taxe_salaire" ADD COLUMN     "groupe" TEXT;
