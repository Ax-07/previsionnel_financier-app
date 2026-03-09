-- AlterTable
ALTER TABLE "activite" ADD COLUMN     "achatsStockPonctuel" JSONB;

-- CreateTable
CREATE TABLE "paie_special_profile" (
    "profileCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentProfile" TEXT,
    "description" TEXT,
    "validFrom" TEXT,
    "validTo" TEXT,
    "ruleSetCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paie_special_profile_pkey" PRIMARY KEY ("profileCode")
);

-- CreateTable
CREATE TABLE "paie_profile_rule_set" (
    "id" TEXT NOT NULL,
    "profileCode" TEXT NOT NULL,
    "ruleSetCode" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TEXT,
    "validTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paie_profile_rule_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paie_external_scheme_adapter" (
    "adapterCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "schemeType" TEXT NOT NULL,
    "insertAtSteps" TEXT NOT NULL,
    "activationCondition" TEXT,
    "validFrom" TEXT,
    "validTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paie_external_scheme_adapter_pkey" PRIMARY KEY ("adapterCode")
);

-- CreateIndex
CREATE INDEX "paie_profile_rule_set_profileCode_idx" ON "paie_profile_rule_set"("profileCode");

-- AddForeignKey
ALTER TABLE "paie_profile_rule_set" ADD CONSTRAINT "paie_profile_rule_set_profileCode_fkey" FOREIGN KEY ("profileCode") REFERENCES "paie_special_profile"("profileCode") ON DELETE CASCADE ON UPDATE CASCADE;
