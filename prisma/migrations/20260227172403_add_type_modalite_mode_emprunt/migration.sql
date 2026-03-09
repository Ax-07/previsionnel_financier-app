-- CreateEnum
CREATE TYPE "TypeEmprunt" AS ENUM ('AMORTISSABLE', 'IN_FINE');

-- CreateEnum
CREATE TYPE "ModaliteRemboursement" AS ENUM ('ECHEANCE_CONSTANTE', 'CAPITAL_CONSTANT');

-- CreateEnum
CREATE TYPE "ModeAssurance" AS ENUM ('CAPITAL_RESTANT', 'CAPITAL_INITIAL');

-- AlterTable
ALTER TABLE "emprunt" ADD COLUMN     "modaliteRemboursement" "ModaliteRemboursement" NOT NULL DEFAULT 'ECHEANCE_CONSTANTE',
ADD COLUMN     "modeAssurance" "ModeAssurance" NOT NULL DEFAULT 'CAPITAL_RESTANT',
ADD COLUMN     "typeEmprunt" "TypeEmprunt" NOT NULL DEFAULT 'AMORTISSABLE';
