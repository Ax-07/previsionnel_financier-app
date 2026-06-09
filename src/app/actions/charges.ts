"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  chargeExploitationSchema,
  impotTaxeSchema,
  type ChargeExploitationRow,
  type ImpotTaxeRow,
} from "@/lib/schemas/charges";
import type { ActionResult } from "@/app/actions/types";
import { validateRows } from "@/lib/utils/validate-rows";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FOURNITURES CONSOMMABLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchFournitures(dossierId: string): Promise<ChargeExploitationRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.chargeExploitation.findMany({
      where: { scenarioId: scenario.id, categorie: "FOURNITURE_CONSOMMABLE" },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      categorie: r.categorie as ChargeExploitationRow["categorie"],
      actif: r.actif,
      hypothese: r.hypothese,
      montantN: Number(r.montantN),
      evolutionN1: Number(r.evolutionN1),
      montantN1: Number(r.montantN1),
      evolutionN2: Number(r.evolutionN2),
      montantN2: Number(r.montantN2),
      tauxFixe: Number(r.tauxFixe),
      frequence: r.frequence as ChargeExploitationRow["frequence"],
      delaiReglement: r.delaiReglement,
      tauxTVA: Number(r.tauxTVA),
      typeTVA: r.typeTVA as ChargeExploitationRow["typeTVA"],
      detailCalc: (r.detailCalc ?? undefined) as ChargeExploitationRow["detailCalc"],
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchFournitures] Erreur :", error);
    throw new Error("Impossible de charger les fournitures consommables");
  }
}

export async function saveFournitures(
  dossierId: string,
  rows: ChargeExploitationRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    const err = validateRows(rows, chargeExploitationSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter((id): id is string => Boolean(id) && !id?.startsWith("__new__"));
      await tx.chargeExploitation.deleteMany({
        where: {
          scenarioId,
          categorie: "FOURNITURE_CONSOMMABLE",
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          libelle: row.libelle,
          categorie: "FOURNITURE_CONSOMMABLE" as const,
          actif: row.actif ?? true,
          hypothese: row.hypothese,
          montantN: row.montantN,
          evolutionN1: row.evolutionN1,
          montantN1: row.montantN1,
          evolutionN2: row.evolutionN2,
          montantN2: row.montantN2,
          tauxFixe: row.tauxFixe,
          frequence: row.frequence,
          delaiReglement: row.delaiReglement,
          tauxTVA: row.tauxTVA,
          typeTVA: row.typeTVA,
          detailCalc: row.detailCalc ?? Prisma.JsonNull,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        if (row.id && !row.id.startsWith("__new__")) {
          await tx.chargeExploitation.upsert({
            where: { id: row.id },
            create: data,
            update: data,
          });
        } else {
          const created = await tx.chargeExploitation.create({ data });
          if (row.id) idMap[row.id] = created.id;
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Fournitures consommables enregistrées.", idMap };
  } catch (error) {
    console.error("[saveFournitures] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des fournitures." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICES EXTÉRIEURS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchServices(dossierId: string): Promise<ChargeExploitationRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.chargeExploitation.findMany({
      where: { scenarioId: scenario.id, categorie: "SERVICE_EXTERIEUR" },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      categorie: r.categorie as ChargeExploitationRow["categorie"],
      actif: r.actif,
      hypothese: r.hypothese,
      montantN: Number(r.montantN),
      evolutionN1: Number(r.evolutionN1),
      montantN1: Number(r.montantN1),
      evolutionN2: Number(r.evolutionN2),
      montantN2: Number(r.montantN2),
      tauxFixe: Number(r.tauxFixe),
      frequence: r.frequence as ChargeExploitationRow["frequence"],
      delaiReglement: r.delaiReglement,
      tauxTVA: Number(r.tauxTVA),
      typeTVA: r.typeTVA as ChargeExploitationRow["typeTVA"],
      detailCalc: (r.detailCalc ?? undefined) as ChargeExploitationRow["detailCalc"],
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchServices] Erreur :", error);
    throw new Error("Impossible de charger les services extérieurs");
  }
}

export async function saveServices(
  dossierId: string,
  rows: ChargeExploitationRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    const err = validateRows(rows, chargeExploitationSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter((id): id is string => Boolean(id) && !id?.startsWith("__new__"));
      await tx.chargeExploitation.deleteMany({
        where: {
          scenarioId,
          categorie: "SERVICE_EXTERIEUR",
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          libelle: row.libelle,
          categorie: "SERVICE_EXTERIEUR" as const,
          actif: row.actif ?? true,
          hypothese: row.hypothese,
          montantN: row.montantN,
          evolutionN1: row.evolutionN1,
          montantN1: row.montantN1,
          evolutionN2: row.evolutionN2,
          montantN2: row.montantN2,
          tauxFixe: row.tauxFixe,
          frequence: row.frequence,
          delaiReglement: row.delaiReglement,
          tauxTVA: row.tauxTVA,
          typeTVA: row.typeTVA,
          detailCalc: row.detailCalc ?? Prisma.JsonNull,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        if (row.id && !row.id.startsWith("__new__")) {
          await tx.chargeExploitation.upsert({
            where: { id: row.id },
            create: data,
            update: data,
          });
        } else {
          const created = await tx.chargeExploitation.create({ data });
          if (row.id) idMap[row.id] = created.id;
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Services extérieurs enregistrés.", idMap };
  } catch (error) {
    console.error("[saveServices] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des services." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPÔTS ET TAXES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchImpots(dossierId: string): Promise<ImpotTaxeRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.impotTaxe.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      hypothese: r.hypothese,
      isCFE: r.isCFE,
      cfeModeCalc: r.cfeModeCalc,
      baseImposableCFE: r.baseImposableCFE !== null ? Number(r.baseImposableCFE) : undefined,
      tauxCFE: r.tauxCFE !== null ? Number(r.tauxCFE) : undefined,
      dateN: r.dateN ?? "",
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? "",
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? "",
      montantN2: Number(r.montantN2),
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchImpots] Erreur :", error);
    throw new Error("Impossible de charger les impôts et taxes");
  }
}

export async function saveImpots(
  dossierId: string,
  rows: ImpotTaxeRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    // Normaliser la ligne CFE (libelle peut être vide si le store l'a perdu)
    const normalizedRows = rows.map((r) =>
      r.isCFE ? { ...r, libelle: r.libelle?.trim() || "CFE" } : r
    );
    const err = validateRows(normalizedRows, impotTaxeSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = normalizedRows.map((r) => r.id).filter((id): id is string => Boolean(id) && !id?.startsWith("__new__"));
      await tx.impotTaxe.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < normalizedRows.length; i++) {
        const row = normalizedRows[i]!;
        const data = {
          libelle: row.libelle,
          actif: row.actif ?? true,
          hypothese: row.hypothese,
          isCFE: row.isCFE ?? false,
          cfeModeCalc: row.cfeModeCalc ?? false,
          baseImposableCFE: row.baseImposableCFE ?? null,
          tauxCFE: row.tauxCFE ?? null,
          dateN: row.dateN ?? null,
          montantN: row.montantN,
          dateN1: row.dateN1 ?? null,
          montantN1: row.montantN1,
          dateN2: row.dateN2 ?? null,
          montantN2: row.montantN2,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        if (row.id && !row.id.startsWith("__new__")) {
          await tx.impotTaxe.upsert({
            where: { id: row.id },
            create: data,
            update: data,
          });
        } else {
          const created = await tx.impotTaxe.create({ data });
          if (row.id) idMap[row.id] = created.id;
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Impôts et taxes enregistrés.", idMap };
  } catch (error) {
    console.error("[saveImpots] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des impôts et taxes." };
  }
}
