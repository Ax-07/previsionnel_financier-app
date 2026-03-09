-- AlterTable
ALTER TABLE "ligne_salarie" ADD COLUMN     "cotisationConges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detailMensuelN" JSONB,
ADD COLUMN     "detailMensuelN1" JSONB,
ADD COLUMN     "detailMensuelN2" JSONB,
ADD COLUMN     "hasCommission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPrime" BOOLEAN NOT NULL DEFAULT false;
