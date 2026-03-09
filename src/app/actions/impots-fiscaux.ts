"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  ajustementFiscalSchema,
  parametresISSchema,
  defaultParametresIS,
  type AjustementFiscalRow,
  type ParametresISData,
} from "@/lib/schemas/impots-fiscaux";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ── Réintégrations fiscales ───────────────────────────────────────────────────

export async function fetchReintegrations(
  dossierId: string
): Promise<AjustementFiscalRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ajustementFiscal.findMany({
      where: { scenarioId: scenario.id, type: "REINTEGRATION" },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      type: "REINTEGRATION" as const,
      actif: r.actif,
      libelle: r.libelle,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
    }));
  } catch (error) {
    console.error("[fetchReintegrations] Erreur :", error);
    throw new Error("Impossible de charger les réintégrations fiscales.");
  }
}

export async function saveReintegrations(
  dossierId: string,
  rows: AjustementFiscalRow[]
): Promise<ActionResult> {
  try {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      const result = ajustementFiscalSchema.safeParse(r);
      if (!result.success) {
        const issue = result.error.issues[0];
        return {
          success: false,
          error: `Ligne ${i + 1} : ${issue?.message ?? "Données invalides"}`,
        };
      }
    }

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.ajustementFiscal.deleteMany({
        where: {
          scenarioId,
          type: "REINTEGRATION",
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          type: "REINTEGRATION" as const,
          actif: row.actif ?? true,
          libelle: row.libelle,
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.ajustementFiscal.upsert({
            where: { id: row.id },
            create: data,
            update: data,
          });
        } else {
          await tx.ajustementFiscal.create({ data });
        }
      }
    });

    return { success: true, message: "Réintégrations fiscales enregistrées." };
  } catch (error) {
    console.error("[saveReintegrations] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des réintégrations." };
  }
}

// ── Déductions fiscales ───────────────────────────────────────────────────────

export async function fetchDeductions(
  dossierId: string
): Promise<AjustementFiscalRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ajustementFiscal.findMany({
      where: { scenarioId: scenario.id, type: "DEDUCTION" },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      type: "DEDUCTION" as const,
      actif: r.actif,
      libelle: r.libelle,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
    }));
  } catch (error) {
    console.error("[fetchDeductions] Erreur :", error);
    throw new Error("Impossible de charger les déductions fiscales.");
  }
}

export async function saveDeductions(
  dossierId: string,
  rows: AjustementFiscalRow[]
): Promise<ActionResult> {
  try {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      const result = ajustementFiscalSchema.safeParse(r);
      if (!result.success) {
        const issue = result.error.issues[0];
        return {
          success: false,
          error: `Ligne ${i + 1} : ${issue?.message ?? "Données invalides"}`,
        };
      }
    }

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.ajustementFiscal.deleteMany({
        where: {
          scenarioId,
          type: "DEDUCTION",
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          type: "DEDUCTION" as const,
          actif: row.actif ?? true,
          libelle: row.libelle,
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.ajustementFiscal.upsert({
            where: { id: row.id },
            create: data,
            update: data,
          });
        } else {
          await tx.ajustementFiscal.create({ data });
        }
      }
    });

    return { success: true, message: "Déductions fiscales enregistrées." };
  } catch (error) {
    console.error("[saveDeductions] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des déductions." };
  }
}

// ── Paramètres IS / CIR / PVLT ────────────────────────────────────────────────

export async function fetchParametresIS(
  dossierId: string
): Promise<ParametresISData> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return { ...defaultParametresIS };

    const p = await prisma.parametresIS.findUnique({
      where: { scenarioId: scenario.id },
    });
    if (!p) return { ...defaultParametresIS };

    return {
      id: p.id,
      isEnabled: p.isEnabled,

      tauxReduitN: Number(p.tauxReduitN),
      plafondReduitN: Number(p.plafondReduitN),
      tauxNormalN: Number(p.tauxNormalN),
      contributionVolN: Number(p.contributionVolN),
      creditImpotN: Number(p.creditImpotN),
      modaliteAcomptesN: p.modaliteAcomptesN as ParametresISData["modaliteAcomptesN"],
      montantAcomptesManuelN: p.montantAcomptesManuelN != null ? Number(p.montantAcomptesManuelN) : undefined,

      tauxReduitN1: Number(p.tauxReduitN1),
      plafondReduitN1: Number(p.plafondReduitN1),
      tauxNormalN1: Number(p.tauxNormalN1),
      contributionVolN1: Number(p.contributionVolN1),
      creditImpotN1: Number(p.creditImpotN1),
      modaliteAcomptesN1: p.modaliteAcomptesN1 as ParametresISData["modaliteAcomptesN1"],
      montantAcomptesManuelN1: p.montantAcomptesManuelN1 != null ? Number(p.montantAcomptesManuelN1) : undefined,

      tauxReduitN2: Number(p.tauxReduitN2),
      plafondReduitN2: Number(p.plafondReduitN2),
      tauxNormalN2: Number(p.tauxNormalN2),
      contributionVolN2: Number(p.contributionVolN2),
      creditImpotN2: Number(p.creditImpotN2),
      modaliteAcomptesN2: p.modaliteAcomptesN2 as ParametresISData["modaliteAcomptesN2"],
      montantAcomptesManuelN2: p.montantAcomptesManuelN2 != null ? Number(p.montantAcomptesManuelN2) : undefined,

      plancherDispense: Number(p.plancherDispense),
      delaiSoldeJours: p.delaiSoldeJours,
      delaiRemboursementMois: p.delaiRemboursementMois,

      cirEnabled: p.cirEnabled,
      cirMontantN: Number(p.cirMontantN),
      cirMontantN1: Number(p.cirMontantN1),
      cirMontantN2: Number(p.cirMontantN2),
      cirModaliteN: p.cirModaliteN as ParametresISData["cirModaliteN"],
      cirModaliteN1: p.cirModaliteN1 as ParametresISData["cirModaliteN1"],
      cirModaliteN2: p.cirModaliteN2 as ParametresISData["cirModaliteN2"],
      cirDelaiN: p.cirDelaiN,
      cirDelaiN1: p.cirDelaiN1,
      cirDelaiN2: p.cirDelaiN2,

      pvltEnabled: p.pvltEnabled,
      pvltTaux: Number(p.pvltTaux),
    };
  } catch (error) {
    console.error("[fetchParametresIS] Erreur :", error);
    return { ...defaultParametresIS };
  }
}

export async function saveParametresIS(
  dossierId: string,
  data: ParametresISData
): Promise<ActionResult> {
  try {
    const result = parametresISSchema.safeParse(data);
    if (!result.success) {
      const issue = result.error.issues[0];
      return { success: false, error: issue?.message ?? "Données invalides" };
    }

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    const upsertData = {
      isEnabled: data.isEnabled,

      tauxReduitN: data.tauxReduitN,
      plafondReduitN: data.plafondReduitN,
      tauxNormalN: data.tauxNormalN,
      contributionVolN: data.contributionVolN,
      creditImpotN: data.creditImpotN,
      modaliteAcomptesN: data.modaliteAcomptesN,
      montantAcomptesManuelN: data.montantAcomptesManuelN ?? null,

      tauxReduitN1: data.tauxReduitN1,
      plafondReduitN1: data.plafondReduitN1,
      tauxNormalN1: data.tauxNormalN1,
      contributionVolN1: data.contributionVolN1,
      creditImpotN1: data.creditImpotN1,
      modaliteAcomptesN1: data.modaliteAcomptesN1,
      montantAcomptesManuelN1: data.montantAcomptesManuelN1 ?? null,

      tauxReduitN2: data.tauxReduitN2,
      plafondReduitN2: data.plafondReduitN2,
      tauxNormalN2: data.tauxNormalN2,
      contributionVolN2: data.contributionVolN2,
      creditImpotN2: data.creditImpotN2,
      modaliteAcomptesN2: data.modaliteAcomptesN2,
      montantAcomptesManuelN2: data.montantAcomptesManuelN2 ?? null,

      plancherDispense: data.plancherDispense,
      delaiSoldeJours: data.delaiSoldeJours,
      delaiRemboursementMois: data.delaiRemboursementMois,

      cirEnabled: data.cirEnabled,
      cirMontantN: data.cirMontantN,
      cirMontantN1: data.cirMontantN1,
      cirMontantN2: data.cirMontantN2,
      cirModaliteN: data.cirModaliteN,
      cirModaliteN1: data.cirModaliteN1,
      cirModaliteN2: data.cirModaliteN2,
      cirDelaiN: data.cirDelaiN,
      cirDelaiN1: data.cirDelaiN1,
      cirDelaiN2: data.cirDelaiN2,

      pvltEnabled: data.pvltEnabled,
      pvltTaux: data.pvltTaux,
    };

    await prisma.parametresIS.upsert({
      where: { scenarioId },
      create: { ...upsertData, scenarioId },
      update: upsertData,
    });

    return { success: true, message: "Paramètres fiscaux enregistrés." };
  } catch (error) {
    console.error("[saveParametresIS] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des paramètres fiscaux." };
  }
}
