-- CreateTable
CREATE TABLE "report_section" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_section_dossierId_idx" ON "report_section"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "report_section_dossierId_sectionKey_key" ON "report_section"("dossierId", "sectionKey");

-- AddForeignKey
ALTER TABLE "report_section" ADD CONSTRAINT "report_section_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
