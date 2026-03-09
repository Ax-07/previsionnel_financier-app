/*
  Warnings:

  - The `formeJuridique` column on the `parametres_entreprise` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "parametres_entreprise" DROP COLUMN "formeJuridique",
ADD COLUMN     "formeJuridique" TEXT NOT NULL DEFAULT 'SAS';

-- DropEnum
DROP TYPE "FormeJuridique";
