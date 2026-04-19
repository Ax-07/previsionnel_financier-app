"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  autreChargeProvisionSchema,
  autreChargeDateeSchema,
  autreChargeBilanSchema,
  type AutreChargeProvisionRow,
  type AutreChargeDateeRow,
  type AutreChargeBilanRow,
} from "@/lib/schemas/autres-charges";
import type { ActionResult } from "@/app/actions/types";
import { validateRows } from "@/lib/utils/validate-rows";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOTATIONS SUR PROVISIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchProvisions(dossierId: string): Promise<AutreChargeProvisionRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreChargeProvision.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      nature: r.nature,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchProvisions]", error);
    throw new Error("Impossible de charger les dotations sur provisions");
  }
}

export async function saveProvisions(
  dossierId: string,
  rows: AutreChargeProvisionRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreChargeProvisionSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.autreChargeProvision.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif ?? true,
          libelle: row.libelle,
          nature: row.nature ?? "",
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.autreChargeProvision.update({ where: { id: row.id }, data });
        } else {
          await tx.autreChargeProvision.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Dotations sur provisions enregistrées." };
  } catch (error) {
    console.error("[saveProvisions]", error);
    return { success: false, error: "Erreur lors de l'enregistrement des provisions." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHARGES DATÉES (gestion courante / financières / exceptionnelles)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchChargesDatees(
  dossierId: string,
  categorie: "GESTION_COURANTE" | "FINANCIERE" | "EXCEPTIONNELLE"
): Promise<AutreChargeDateeRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreChargeDatee.findMany({
      where: { scenarioId: scenario.id, categorie },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      categorie: r.categorie as AutreChargeDateeRow["categorie"],
      dateN: r.dateN ?? undefined,
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? undefined,
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? undefined,
      montantN2: Number(r.montantN2),
      tauxTVA: Number(r.tauxTVA),
      typeTVA: r.typeTVA as AutreChargeDateeRow["typeTVA"],
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchChargesDatees]", error);
    throw new Error("Impossible de charger les charges datées");
  }
}

export async function saveChargesDatees(
  dossierId: string,
  categorie: "GESTION_COURANTE" | "FINANCIERE" | "EXCEPTIONNELLE",
  rows: AutreChargeDateeRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreChargeDateeSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.autreChargeDatee.deleteMany({
        where: {
          scenarioId,
          categorie,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif ?? true,
          libelle: row.libelle,
          categorie,
          dateN: row.dateN ?? null,
          montantN: row.montantN,
          dateN1: row.dateN1 ?? null,
          montantN1: row.montantN1,
          dateN2: row.dateN2 ?? null,
          montantN2: row.montantN2,
          tauxTVA: row.tauxTVA ?? 0,
          typeTVA: row.typeTVA ?? null,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.autreChargeDatee.update({ where: { id: row.id }, data });
        } else {
          await tx.autreChargeDatee.create({ data });
        }
      }
    });

    const labels: Record<string, string> = {
      GESTION_COURANTE: "Autres charges de gestion courante",
      FINANCIERE: "Charges financières",
      EXCEPTIONNELLE: "Charges exceptionnelles",
    };
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: `${labels[categorie] ?? "Charges"} enregistrées.` };
  } catch (error) {
    console.error("[saveChargesDatees]", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHARGES BILAN (CCA et CAP)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchChargesBilan(
  dossierId: string,
  type: "CHARGE_CONSTATEE_AVANCE" | "CHARGE_A_PAYER"
): Promise<AutreChargeBilanRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreChargeBilan.findMany({
      where: { scenarioId: scenario.id, type },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      type: r.type as AutreChargeBilanRow["type"],
      nature: r.nature,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchChargesBilan]", error);
    throw new Error("Impossible de charger les charges bilan");
  }
}

export async function saveChargesBilan(
  dossierId: string,
  type: "CHARGE_CONSTATEE_AVANCE" | "CHARGE_A_PAYER",
  rows: AutreChargeBilanRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreChargeBilanSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.autreChargeBilan.deleteMany({
        where: {
          scenarioId,
          type,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif ?? true,
          libelle: row.libelle,
          type,
          nature: row.nature ?? "",
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.autreChargeBilan.update({ where: { id: row.id }, data });
        } else {
          await tx.autreChargeBilan.create({ data });
        }
      }
    });

    const labels: Record<string, string> = {
      CHARGE_CONSTATEE_AVANCE: "Charges constatées d'avance",
      CHARGE_A_PAYER: "Charges à payer",
    };
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: `${labels[type] ?? "Charges"} enregistrées.` };
  } catch (error) {
    console.error("[saveChargesBilan]", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}
