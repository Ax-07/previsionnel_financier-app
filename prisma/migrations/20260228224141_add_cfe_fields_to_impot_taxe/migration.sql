-- AlterTable
ALTER TABLE "impot_taxe" ADD COLUMN     "baseImposableCFE" DECIMAL(15,2),
ADD COLUMN     "isCFE" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tauxCFE" DECIMAL(5,2);
