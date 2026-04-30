"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  autreProduitRepriseSchema,
  autreProduitDateSchema,
  autreProduitConstateSchema,
  type AutreProduitRepriseRow,
  type AutreProduitDateRow,
  type AutreProduitConstateRow,
} from "@/lib/schemas/autres-produits";
import type { ActionResult } from "@/app/actions/types";
import { validateRows } from "@/lib/utils/validate-rows";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPRISES SUR PROVISIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchReprises(
  dossierId: string
): Promise<AutreProduitRepriseRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreProduitReprise.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      hypothese: r.hypothese,
      libelle: r.libelle,
      nature: r.nature,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchReprises]", error);
    throw new Error("Impossible de charger les reprises sur provisions");
  }
}

export async function saveReprises(
  dossierId: string,
  rows: AutreProduitRepriseRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreProduitRepriseSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter((id) => id && !id.startsWith("__new__")) as string[];
      await tx.autreProduitReprise.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif ?? true,
          hypothese: row.hypothese,
          libelle: row.libelle,
          nature: row.nature ?? "",
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };
        if (row.id && !row.id.startsWith("__new__")) {
          await tx.autreProduitReprise.update({ where: { id: row.id }, data });
        } else {
          await tx.autreProduitReprise.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Reprises sur provisions enregistrées." };
  } catch (error) {
    console.error("[saveReprises]", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement des reprises sur provisions.",
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRODUITS DATÉS (transferts / gestion courante / financiers / exceptionnels)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchProduitsDate(
  dossierId: string,
  categorie: "TRANSFERT" | "GESTION_COURANTE" | "FINANCIER" | "EXCEPTIONNEL"
): Promise<AutreProduitDateRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreProduitDate.findMany({
      where: { scenarioId: scenario.id, categorie },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      hypothese: r.hypothese,
      libelle: r.libelle,
      categorie: r.categorie as AutreProduitDateRow["categorie"],
      dateN: r.dateN ?? undefined,
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? undefined,
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? undefined,
      montantN2: Number(r.montantN2),
      tauxTVA: Number(r.tauxTVA),
      typeTVA: r.typeTVA as AutreProduitDateRow["typeTVA"],
      ordre: r.ordre,
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchProduitsDate]", error);
    throw new Error("Impossible de charger les produits datés");
  }
}

export async function saveProduitsDate(
  dossierId: string,
  categorie: "TRANSFERT" | "GESTION_COURANTE" | "FINANCIER" | "EXCEPTIONNEL",
  rows: AutreProduitDateRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreProduitDateSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter((id) => id && !id.startsWith("__new__")) as string[];
      await tx.autreProduitDate.deleteMany({
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
          hypothese: row.hypothese,
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
          groupe: row.groupe ?? null,
          scenarioId,
        };
        if (row.id && !row.id.startsWith("__new__")) {
          await tx.autreProduitDate.update({ where: { id: row.id }, data });
        } else {
          await tx.autreProduitDate.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Produits enregistrés." };
  } catch (error) {
    console.error("[saveProduitsDate]", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement des produits.",
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRODUITS CONSTATÉS D'AVANCE (PCA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchConstates(
  dossierId: string
): Promise<AutreProduitConstateRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.autreProduitConstate.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      hypothese: r.hypothese,
      libelle: r.libelle,
      nature: r.nature,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
      groupe: r.groupe ?? undefined,
    }));
  } catch (error) {
    console.error("[fetchConstates]", error);
    throw new Error("Impossible de charger les produits constatés d'avance");
  }
}

export async function saveConstates(
  dossierId: string,
  rows: AutreProduitConstateRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, autreProduitConstateSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter((id) => id && !id.startsWith("__new__")) as string[];
      await tx.autreProduitConstate.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif ?? true,
          hypothese: row.hypothese,
          libelle: row.libelle,
          nature: row.nature ?? "",
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };
        if (row.id && !row.id.startsWith("__new__")) {
          await tx.autreProduitConstate.update({ where: { id: row.id }, data });
        } else {
          await tx.autreProduitConstate.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return {
      success: true,
      message: "Produits constatés d'avance enregistrés.",
    };
  } catch (error) {
    console.error("[saveConstates]", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement des produits constatés d'avance.",
    };
  }
}
