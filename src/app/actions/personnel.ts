"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  ligneSalarieSchema,
  ligneDirigeantSchema,
  ligneCotisationTNSSchema,
  ligneTaxeSalaireSchema,
  ligneChargePersonnelSchema,
  type LigneSalarieRow,
  type LigneDirigeantRow,
  type LigneCotisationTNSRow,
  type LigneTaxeSalaireRow,
  type LigneChargePersonnelRow,
  type DetailMensuelExercice,
  type ParamsGlobauxTNS,
} from "@/lib/schemas/personnel";
import { calculerMontantsTNS, detecterACRE, remuTNSBase } from "@/lib/calcul/taux-tns";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ── Helpers internes ─────────────────────────────────────────────────────────

function validateRows<T>(
  rows: T[],
  parser: {
    safeParse: (v: unknown) => {
      success: boolean;
      error?: { issues: Array<{ message: string; path: PropertyKey[] }> };
    };
  },
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
      const label = (row as Record<string, unknown>)["libelle"];
      const rowName =
        typeof label === "string" && label.trim() ? label.trim() : `ligne ${i + 1}`;
      return field ? `« ${rowName} » — ${field} : ${msg}` : `« ${rowName} » : ${msg}`;
    }
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIGNES SALARIÉS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchLignesSalaries(dossierId: string): Promise<LigneSalarieRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ligneSalarie.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      hypothese: r.hypothese,
      montantN: Number(r.montantN),
      evolutionN1: Number(r.evolutionN1),
      montantN1: Number(r.montantN1),
      evolutionN2: Number(r.evolutionN2),
      montantN2: Number(r.montantN2),
      tauxCotSal: Number(r.tauxCotSal),
      tauxCotPat: Number(r.tauxCotPat),
      tauxFixe: Number(r.tauxFixe),
      hasCommission: r.hasCommission,
      hasPrime: r.hasPrime,
      cotisationConges: r.cotisationConges,
      detailMensuelN: (r.detailMensuelN as unknown) as DetailMensuelExercice | undefined,
      detailMensuelN1: (r.detailMensuelN1 as unknown) as DetailMensuelExercice | undefined,
      detailMensuelN2: (r.detailMensuelN2 as unknown) as DetailMensuelExercice | undefined,
    }));
  } catch (error) {
    console.error("[fetchLignesSalaries] Erreur :", error);
    throw new Error("Impossible de charger les lignes salariés");
  }
}

export async function saveLignesSalaries(
  dossierId: string,
  rows: LigneSalarieRow[],
): Promise<ActionResult & { ids?: string[] }> {
  try {
    const err = validateRows(rows, ligneSalarieSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    // Transaction atomique : suppression des orphelins + upsert
    const incomingIds = rows.filter((r) => r.id && !r.id.startsWith("__new__")).map((r) => r.id!);
    const saved = await prisma.$transaction(async (tx) => {
      await tx.ligneSalarie.deleteMany({
        where: { scenarioId, NOT: incomingIds.length ? { id: { in: incomingIds } } : undefined },
      });
      return Promise.all(
        rows.map((r, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = {
            libelle: r.libelle,
            actif: r.actif ?? true,
            hypothese: r.hypothese,
            montantN: r.montantN,
            evolutionN1: r.evolutionN1,
            montantN1: r.montantN1,
            evolutionN2: r.evolutionN2,
            montantN2: r.montantN2,
            tauxCotSal: r.tauxCotSal,
            tauxCotPat: r.tauxCotPat,
            tauxFixe: r.tauxFixe,
            // Champs détail mensuel (actifs après migration add_detail_mensuel_salarie)
            hasCommission: r.hasCommission ?? false,
            hasPrime: r.hasPrime ?? false,
            cotisationConges: r.cotisationConges ?? false,
            detailMensuelN: r.detailMensuelN ?? null,
            detailMensuelN1: r.detailMensuelN1 ?? null,
            detailMensuelN2: r.detailMensuelN2 ?? null,
            ordre: i,
            scenarioId,
          };
          const isExisting = r.id && !r.id.startsWith("__new__");
          if (isExisting) {
            return tx.ligneSalarie.update({ where: { id: r.id }, data, select: { id: true } });
          }
          return tx.ligneSalarie.create({ data, select: { id: true } });
        }),
      );
    });

    return {
      success: true,
      message: "Salariés enregistrés",
      ids: saved.map((s) => s.id),
    };
  } catch (error) {
    console.error("[saveLignesSalaries] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des salariés" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIGNES DIRIGEANT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchLignesDirigeants(dossierId: string): Promise<LigneDirigeantRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ligneDirigeant.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      hypothese: r.hypothese,
      montantN: Number(r.montantN),
      evolutionN1: Number(r.evolutionN1),
      montantN1: Number(r.montantN1),
      evolutionN2: Number(r.evolutionN2),
      montantN2: Number(r.montantN2),
      exonerationTNS: r.exonerationTNS ?? "",
      conjointCollaborateur: r.conjointCollaborateur,
      tauxFixe: Number(r.tauxFixe),
      detailMensuelN: (r.detailMensuelN as unknown) as DetailMensuelExercice | undefined,
      detailMensuelN1: (r.detailMensuelN1 as unknown) as DetailMensuelExercice | undefined,
      detailMensuelN2: (r.detailMensuelN2 as unknown) as DetailMensuelExercice | undefined,
    }));
  } catch (error) {
    console.error("[fetchLignesDirigeants] Erreur :", error);
    throw new Error("Impossible de charger les lignes dirigeant");
  }
}

export async function saveLignesDirigeants(
  dossierId: string,
  rows: LigneDirigeantRow[],
): Promise<ActionResult & { ids?: string[] }> {
  try {
    const err = validateRows(rows, ligneDirigeantSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    const incomingIds = rows.filter((r) => r.id && !r.id.startsWith("__new__")).map((r) => r.id!);
    const saved = await prisma.$transaction(async (tx) => {
      await tx.ligneDirigeant.deleteMany({
        where: { scenarioId, NOT: incomingIds.length ? { id: { in: incomingIds } } : undefined },
      });
      return Promise.all(
        rows.map((r, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = {
            libelle: r.libelle,
            actif: r.actif ?? true,
            hypothese: r.hypothese,
            montantN: r.montantN,
            evolutionN1: r.evolutionN1,
            montantN1: r.montantN1,
            evolutionN2: r.evolutionN2,
            montantN2: r.montantN2,
            exonerationTNS: r.exonerationTNS || null,
            conjointCollaborateur: r.conjointCollaborateur,
            tauxFixe: r.tauxFixe,
            detailMensuelN: r.detailMensuelN ?? null,
            detailMensuelN1: r.detailMensuelN1 ?? null,
            detailMensuelN2: r.detailMensuelN2 ?? null,
            ordre: i,
            scenarioId,
          };
          const isExisting = r.id && !r.id.startsWith("__new__");
          if (isExisting) {
            return tx.ligneDirigeant.update({ where: { id: r.id }, data, select: { id: true } });
          }
          return tx.ligneDirigeant.create({ data, select: { id: true } });
        }),
      );
    });

    return {
      success: true,
      message: "Dirigeant enregistré",
      ids: saved.map((s) => s.id),
    };
  } catch (error) {
    console.error("[saveLignesDirigeants] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde du dirigeant" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COTISATIONS TNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchLignesCotisationsTNS(dossierId: string): Promise<LigneCotisationTNSRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ligneCotisationTNS.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      calcAuto: r.calcAuto,
      montantN: Number(r.montantN),
      montantN1: Number(r.montantN1),
      montantN2: Number(r.montantN2),
    }));
  } catch (error) {
    console.error("[fetchLignesCotisationsTNS] Erreur :", error);
    throw new Error("Impossible de charger les cotisations TNS");
  }
}

export async function saveLignesCotisationsTNS(
  dossierId: string,
  rows: LigneCotisationTNSRow[],
  paramsGlobauxTNS?: Pick<ParamsGlobauxTNS, "regimeSocial" | "modeCalculTNS">,
): Promise<ActionResult & { ids?: string[] }> {
  try {
    const err = validateRows(rows, ligneCotisationTNSSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    // Recalcul côté serveur pour les lignes calcAuto = true (P3-10)
    let finalRows: LigneCotisationTNSRow[] = rows;
    if (paramsGlobauxTNS && rows.some((r) => r.calcAuto)) {
      const dbDirigeants = await prisma.ligneDirigeant.findMany({
        where: { scenarioId },
        select: { actif: true, montantN: true, montantN1: true, montantN2: true, tauxFixe: true, exonerationTNS: true },
      });
      const dirigeants = dbDirigeants.map((d) => ({
        actif: d.actif,
        montantN: Number(d.montantN),
        montantN1: Number(d.montantN1),
        montantN2: Number(d.montantN2),
        tauxFixe: Number(d.tauxFixe),
        exonerationTNS: d.exonerationTNS ?? "",
      }));
      const { remuN, remuN1, remuN2 } = remuTNSBase(dirigeants);
      const acreN = detecterACRE(dirigeants);
      const computed = calculerMontantsTNS(
        remuN, remuN1, remuN2,
        paramsGlobauxTNS.regimeSocial,
        acreN,
        365, 365, 365,
        paramsGlobauxTNS.modeCalculTNS,
      );
      let autoIdx = 0;
      finalRows = rows.map((row) => {
        if (!row.calcAuto) return row;
        const line = computed[autoIdx++];
        if (!line) return row;
        return { ...row, montantN: line.montantN, montantN1: line.montantN1, montantN2: line.montantN2 };
      });
    }

    const incomingIds = finalRows.filter((r) => r.id && !r.id.startsWith("__new__")).map((r) => r.id!);
    const saved = await prisma.$transaction(async (tx) => {
      await tx.ligneCotisationTNS.deleteMany({
        where: { scenarioId, NOT: incomingIds.length ? { id: { in: incomingIds } } : undefined },
      });
      return Promise.all(
        finalRows.map((r, i) => {
          const data = { libelle: r.libelle, actif: r.actif ?? true, calcAuto: r.calcAuto, montantN: r.montantN, montantN1: r.montantN1, montantN2: r.montantN2, ordre: i, scenarioId };
          const isExisting = r.id && !r.id.startsWith("__new__");
          if (isExisting) return tx.ligneCotisationTNS.update({ where: { id: r.id }, data, select: { id: true } });
          return tx.ligneCotisationTNS.create({ data, select: { id: true } });
        }),
      );
    });

    return { success: true, message: "Cotisations TNS enregistrées", ids: saved.map((s) => s.id) };
  } catch (error) {
    console.error("[saveLignesCotisationsTNS] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des cotisations TNS" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAXES ASSISES SUR LES SALAIRES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchLignesTaxesSalaires(dossierId: string): Promise<LigneTaxeSalaireRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ligneTaxeSalaire.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      hypothese: r.hypothese,
      calcAuto: r.calcAuto,
      taux: Number(r.taux),
      dateN: r.dateN ?? "",
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? "",
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? "",
      montantN2: Number(r.montantN2),
    }));
  } catch (error) {
    console.error("[fetchLignesTaxesSalaires] Erreur :", error);
    throw new Error("Impossible de charger les taxes sur salaires");
  }
}

export async function saveLignesTaxesSalaires(
  dossierId: string,
  rows: LigneTaxeSalaireRow[],
): Promise<ActionResult & { ids?: string[] }> {
  try {
    const err = validateRows(rows, ligneTaxeSalaireSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const incomingIds = rows.filter((r) => r.id && !r.id.startsWith("__new__")).map((r) => r.id!);
    const saved = await prisma.$transaction(async (tx) => {
      await tx.ligneTaxeSalaire.deleteMany({
        where: { scenarioId, NOT: incomingIds.length ? { id: { in: incomingIds } } : undefined },
      });
      return Promise.all(
        rows.map((r, i) => {
          const data = { libelle: r.libelle, actif: r.actif ?? true, hypothese: r.hypothese, calcAuto: r.calcAuto, taux: r.taux, dateN: r.dateN || null, montantN: r.montantN, dateN1: r.dateN1 || null, montantN1: r.montantN1, dateN2: r.dateN2 || null, montantN2: r.montantN2, ordre: i, scenarioId };
          const isExisting = r.id && !r.id.startsWith("__new__");
          if (isExisting) return tx.ligneTaxeSalaire.update({ where: { id: r.id }, data, select: { id: true } });
          return tx.ligneTaxeSalaire.create({ data, select: { id: true } });
        }),
      );
    });

    return { success: true, message: "Taxes sur salaires enregistrées", ids: saved.map((s) => s.id) };
  } catch (error) {
    console.error("[saveLignesTaxesSalaires] Erreur :", error);
    return { success: false, error: "Erreur lors de la sauvegarde des taxes sur salaires" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHARGES DE PERSONNEL (Autres charges / Remboursements / Participation)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TypeChargePersonnel = "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION";

export async function fetchLignesChargesPersonnel(
  dossierId: string,
  type: TypeChargePersonnel,
): Promise<LigneChargePersonnelRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.ligneChargePersonnel.findMany({
      where: { scenarioId: scenario.id, type },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      libelle: r.libelle,
      actif: r.actif,
      hypothese: r.hypothese,
      type: r.type as TypeChargePersonnel,
      calcAuto: r.calcAuto,
      dateN: r.dateN ?? "",
      montantN: Number(r.montantN),
      dateN1: r.dateN1 ?? "",
      montantN1: Number(r.montantN1),
      dateN2: r.dateN2 ?? "",
      montantN2: Number(r.montantN2),
    }));
  } catch (error) {
    console.error(`[fetchLignesChargesPersonnel:${type}] Erreur :`, error);
    throw new Error(`Impossible de charger les charges personnelles (${type})`);
  }
}

export async function saveLignesChargesPersonnel(
  dossierId: string,
  type: TypeChargePersonnel,
  rows: LigneChargePersonnelRow[],
): Promise<ActionResult & { ids?: string[] }> {
  try {
    const err = validateRows(rows, ligneChargePersonnelSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const incomingIds = rows.filter((r) => r.id && !r.id.startsWith("__new__")).map((r) => r.id!);
    const saved = await prisma.$transaction(async (tx) => {
      await tx.ligneChargePersonnel.deleteMany({
        where: { scenarioId, type, NOT: incomingIds.length ? { id: { in: incomingIds } } : undefined },
      });
      return Promise.all(
        rows.map((r, i) => {
          const data = { libelle: r.libelle, actif: r.actif ?? true, hypothese: r.hypothese, type, calcAuto: r.calcAuto, dateN: r.dateN || null, montantN: r.montantN, dateN1: r.dateN1 || null, montantN1: r.montantN1, dateN2: r.dateN2 || null, montantN2: r.montantN2, ordre: i, scenarioId };
          const isExisting = r.id && !r.id.startsWith("__new__");
          if (isExisting) return tx.ligneChargePersonnel.update({ where: { id: r.id }, data, select: { id: true } });
          return tx.ligneChargePersonnel.create({ data, select: { id: true } });
        }),
      );
    });

    const labels: Record<TypeChargePersonnel, string> = { AUTRE: "Autres charges", REMBOURSEMENT: "Remboursements", PARTICIPATION: "Participation" };
    return { success: true, message: `${labels[type]} enregistré(e)s`, ids: saved.map((s) => s.id) };
  } catch (error) {
    console.error(`[saveLignesChargesPersonnel:${type}] Erreur :`, error);
    return { success: false, error: `Erreur lors de la sauvegarde (${type})` };
  }
}

// ── Utilitaire : année et mois de début d'exercice du dossier ─────────────────
export async function fetchDossierDebutExercice(
  dossierId: string,
): Promise<{ anneeDebut: number; moisDebut: number }> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { dateDemarrage: true },
  });
  const date = dossier?.dateDemarrage ? new Date(dossier.dateDemarrage) : new Date();
  return { anneeDebut: date.getFullYear(), moisDebut: date.getMonth() };
}
