"use server";

import { prisma } from "@/lib/prisma";
import {
  upsertReportSectionSchema,
  type ReportSectionRow,
} from "@/lib/schemas/rapport";

/** Charge toutes les sections d'un dossier (1 seule requête). */
export async function fetchReportSections(
  dossierId: string
): Promise<ReportSectionRow[]> {
  const rows = await prisma.reportSection.findMany({
    where: { dossierId },
    select: { sectionKey: true, content: true, updatedAt: true },
    orderBy: { sectionKey: "asc" },
  });
  return rows as ReportSectionRow[];
}

/** Upsert d'une section (création ou mise à jour). */
export async function upsertReportSection(
  input: unknown
): Promise<ReportSectionRow> {
  const { dossierId, sectionKey, content } =
    upsertReportSectionSchema.parse(input);

  const row = await prisma.reportSection.upsert({
    where: { dossierId_sectionKey: { dossierId, sectionKey } },
    create: { dossierId, sectionKey, content },
    update: { content },
    select: { sectionKey: true, content: true, updatedAt: true },
  });
  return row as ReportSectionRow;
}
