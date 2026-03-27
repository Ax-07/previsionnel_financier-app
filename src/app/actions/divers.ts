"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  diversFluxDateSchema,
  diversOperationCapitalSchema,
  diversPretSchema,
  type DiversFluxDateRow,
  type DiversOperationCapitalRow,
  type DiversPretRow,
} from "@/lib/schemas/divers";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ── Helpers internes ─────────────────────────────────────────────────────────

function validateRows<T>(
  rows: T[],
  parser: { safeParse: (v: unknown) => { success: boolean; error?: { issues: Array<{ message: string; path: PropertyKey[] }> } } }
): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const result = parser.safeParse(row);
    if (!result.success) {
      const issue = result.error?.issues[0];
      const field = (issue?.path ?? [])
        .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
        .join(".");
      const msg = issue?.message ?? "Données invalides";
      const labelVal = (row as Record<string, unknown>)["libelle"];
      const rowName = typeof labelVal === "string" && labelVal.trim() ? labelVal.trim() : `ligne ${i + 1}`;
      return field ? `« ${rowName} » — ${field} : ${msg}` : `« ${rowName} » : ${msg}`;
    }
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FLUX DATÉS (remboursements C/C, dividendes, déblocages, encaissements, décaissements)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchFluxDates(
  dossierId: string,
  type: DiversFluxDateRow["type"]
): Promise<DiversFluxDateRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.diversFluxDate.findMany({
      where: { scenarioId: scenario.id, type },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      hypothese: r.hypothese ?? undefined,
      type: r.type as DiversFluxDateRow["type"],
      dateN: r.dateN ?? undefined,
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? undefined,
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? undefined,
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchFluxDates]", error);
    throw new Error(`Impossible de charger les flux (${type})`);
  }
}

export async function saveFluxDates(
  dossierId: string,
  type: DiversFluxDateRow["type"],
  rows: DiversFluxDateRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, diversFluxDateSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.diversFluxDate.deleteMany({
        where: { scenarioId, type, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif,
          libelle: row.libelle,
          hypothese: row.hypothese ?? null,
          type,
          dateN: row.dateN ?? null,
          montantN: row.montantN,
          dateN1: row.dateN1 ?? null,
          montantN1: row.montantN1,
          dateN2: row.dateN2 ?? null,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.diversFluxDate.update({ where: { id: row.id }, data });
        } else {
          await tx.diversFluxDate.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Enregistré avec succès" };
  } catch (error) {
    console.error("[saveFluxDates]", error);
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPÉRATIONS EN CAPITAL (augmentations + réductions)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchOperationsCapital(
  dossierId: string,
  type: DiversOperationCapitalRow["type"]
): Promise<DiversOperationCapitalRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.diversOperationCapital.findMany({
      where: { scenarioId: scenario.id, type },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      hypothese: r.hypothese ?? undefined,
      type: r.type as DiversOperationCapitalRow["type"],
      date: r.date ?? undefined,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchOperationsCapital]", error);
    throw new Error(`Impossible de charger les opérations capital (${type})`);
  }
}

export async function saveOperationsCapital(
  dossierId: string,
  type: DiversOperationCapitalRow["type"],
  rows: DiversOperationCapitalRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, diversOperationCapitalSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.diversOperationCapital.deleteMany({
        where: { scenarioId, type, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif,
          libelle: row.libelle,
          hypothese: row.hypothese ?? null,
          type,
          date: row.date ?? null,
          montantN: row.montantN,
          montantN1: row.montantN1,
          montantN2: row.montantN2,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.diversOperationCapital.update({ where: { id: row.id }, data });
        } else {
          await tx.diversOperationCapital.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Enregistré avec succès" };
  } catch (error) {
    console.error("[saveOperationsCapital]", error);
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRÊTS INTER-ENTREPRISES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchPrets(dossierId: string): Promise<DiversPretRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.diversPret.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      hypothese: r.hypothese ?? undefined,
      dateDebut: r.dateDebut ?? undefined,
      capital: Number(r.capital),
      taux: Number(r.taux),
      dureeMois: r.dureeMois,
      periodicite: r.periodicite as DiversPretRow["periodicite"],
      ordre: r.ordre,
    }));
  } catch (error) {
    console.error("[fetchPrets]", error);
    throw new Error("Impossible de charger les prêts inter-entreprises");
  }
}

export async function savePrets(
  dossierId: string,
  rows: DiversPretRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, diversPretSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.diversPret.deleteMany({
        where: { scenarioId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif,
          libelle: row.libelle,
          hypothese: row.hypothese ?? null,
          dateDebut: row.dateDebut ?? null,
          capital: row.capital,
          taux: row.taux,
          dureeMois: row.dureeMois,
          periodicite: row.periodicite,
          ordre: i,
          scenarioId,
        };
        if (row.id) {
          await tx.diversPret.update({ where: { id: row.id }, data });
        } else {
          await tx.diversPret.create({ data });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Enregistré avec succès" };
  } catch (error) {
    console.error("[savePrets]", error);
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}
