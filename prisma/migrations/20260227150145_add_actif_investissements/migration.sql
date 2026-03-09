-- AlterTable
ALTER TABLE "cession_immobilisation" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "credit_bail" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "immobilisation" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;
