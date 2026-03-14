-- AlterTable
ALTER TABLE "parametres_entreprise" ADD COLUMN     "tnsDecalerN2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tnsModeCalcul" TEXT NOT NULL DEFAULT 'DEFINITIF',
ADD COLUMN     "tnsRegimeSocial" TEXT NOT NULL DEFAULT 'commerce';
