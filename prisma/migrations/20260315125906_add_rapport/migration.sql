-- CreateTable
CREATE TABLE "rapport" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rapport_dossierId_key" ON "rapport"("dossierId");

-- AddForeignKey
ALTER TABLE "rapport" ADD CONSTRAINT "rapport_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
