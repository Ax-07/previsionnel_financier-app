"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  immobilisationSchema,
  cessionSchema,
  creditBailSchema,
  type ImmobilisationRow,
  type CessionRow,
  type CreditBailRow,
  type ImmobilisationWithPlan,
} from "@/lib/schemas/investissement";
import { calculerPlanAmortissement } from "@/lib/calcul/amortissement";
import { calcCession } from "@/lib/calcul/cession";
import { buildScenarioCalendar } from "@/lib/finance/pipeline/calendar";
import type { ActionResult } from "@/app/actions/types";
import { isPrismaError } from "@/lib/utils/prisma-error";
import { validateRows } from "@/lib/utils/validate-rows";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// ── Helpers internes ─────────────────────────────────────────────────────────

async function getDossierProjection(
  dossierId: string
): Promise<{ anneeDebut: number; nbAnnees: number }> {
  const [dossier, scenario] = await Promise.all([
    prisma.dossier.findUnique({
      where: { id: dossierId },
      select: { dateDemarrage: true, dureeProjection: true },
    }),
    prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: {
        parametres: {
          select: {
            dateDebutExerciceN: true,
            dureePrevisionnelle: true,
            exercices: {
              orderBy: { ordre: "asc" },
              select: { dateCloture: true, duree: true, ordre: true, annee: true },
            },
          },
        },
      },
    }),
  ]);
  const calendar = buildScenarioCalendar({
    dossierDateDemarrage: dossier?.dateDemarrage ?? new Date(),
    dossierDureeProjection: dossier?.dureeProjection ?? 3,
    parametres: scenario?.parametres,
  });
  return {
    anneeDebut: calendar.dateDebut.getFullYear(),
    nbAnnees: calendar.dureeProjection,
  };
}

async function recalculerPlan(
  immobilisationId: string,
  montantHT: number,
  duree: number,
  mode: "AUCUN" | "LINEAIRE" | "DEGRESSIF",
  dateAcquisition: Date,
  anneeDebut: number,
  nbAnnees: number,
  tx?: TxClient
): Promise<void> {
  const client = tx ?? prisma;
  const lignes = calculerPlanAmortissement({
    montantHT,
    duree,
    mode,
    dateAcquisition,
    anneeDebut,
    nbAnnees,
  });
  await client.ligneAmortissement.deleteMany({ where: { immobilisationId } });
  if (lignes.length > 0) {
    await client.ligneAmortissement.createMany({
      data: lignes.map((l) => ({
        immobilisationId,
        annee: l.annee,
        valeurBruteDebut: l.valeurBruteDebut,
        dotationAnnuelle: l.dotationAnnuelle,
        amortissementCumule: l.amortissementCumule,
        valeurNette: l.valeurNette,
      })),
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMMOBILISATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchImmobilisations(
  dossierId: string
): Promise<ImmobilisationWithPlan[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const items = await prisma.immobilisation.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
      include: { lignesAmortissement: { orderBy: { annee: "asc" } } },
    });

    return items.map((item) => ({
      id: item.id,
      libelle: item.libelle,
      nature: item.nature as ImmobilisationRow["nature"],
      montantHT: Number(item.montantHT),
      tauxTVA: Number(item.tauxTVA),
      typeTva: item.typeTva as ImmobilisationRow["typeTva"],
      dateAcquisition: item.dateAcquisition.toISOString().slice(0, 10),
      modeAmortissement: item.modeAmortissement as ImmobilisationRow["modeAmortissement"],
      differe: item.differe ?? undefined,
      dureeAmortissement: item.dureeAmortissement ?? undefined,
      hypothese: item.hypothese,
      actif: item.actif,
      ordre: item.ordre,
      groupe: item.groupe ?? undefined,
      lignesAmortissement: item.lignesAmortissement.map((l) => ({
        annee: l.annee,
        valeurBruteDebut: Number(l.valeurBruteDebut),
        dotationAnnuelle: Number(l.dotationAnnuelle),
        amortissementCumule: Number(l.amortissementCumule),
        valeurNette: Number(l.valeurNette),
      })),
    }));
  } catch (err) {
    console.error("[fetchImmobilisations]", err);
    return [];
  }
}

export async function saveImmobilisations(
  dossierId: string,
  rows: ImmobilisationRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    const err = validateRows(rows, immobilisationSchema);
    if (err) return { success: false, error: err };

    const [scenarioId, { anneeDebut, nbAnnees }] = await Promise.all([
      getOrCreateDefaultScenario(dossierId),
      getDossierProjection(dossierId),
    ]);

    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = rows
        .map((r) => r.id)
        .filter((id): id is string => !!id && !id.startsWith("__new__"));

      await tx.immobilisation.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const dateAcquisition = new Date(row.dateAcquisition);

        const payload = {
          libelle: row.libelle,
          nature: row.nature,
          montantHT: row.montantHT,
          tauxTVA: row.tauxTVA,
          typeTva: row.typeTva,
          dateAcquisition,
          modeAmortissement: row.modeAmortissement,
          differe: row.differe ?? 0,
          dureeAmortissement: row.dureeAmortissement ?? 5,
          hypothese: row.hypothese,
          actif: row.actif ?? true,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        let immoId: string;
        if (row.id && !row.id.startsWith("__new__")) {
          await tx.immobilisation.update({ where: { id: row.id }, data: payload });
          immoId = row.id;
        } else {
          const created = await tx.immobilisation.create({ data: payload });
          immoId = created.id;
          if (row.id) idMap[row.id] = immoId;
        }

        await recalculerPlan(
          immoId,
          row.montantHT,
          row.dureeAmortissement ?? 5,
          row.modeAmortissement,
          dateAcquisition,
          anneeDebut,
          nbAnnees,
          tx,
        );
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Immobilisations enregistrées.", idMap };
  } catch (err) {
    console.error("[saveImmobilisations]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Immobilisation introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CESSIONS D'IMMOBILISATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchCessions(dossierId: string): Promise<CessionRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const items = await prisma.cessionImmobilisation.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return items.map((item) => ({
      id: item.id,
      libelle: item.libelle,
      nature: item.nature as CessionRow["nature"],
      dateCession: item.dateCession.toISOString().slice(0, 10),
      prixVente: Number(item.prixVente),
      prixAchat: Number(item.prixAchat),
      dejaAmortie: Number(item.dejaAmortie),
      hypothese: item.hypothese,
      tauxTVA: Number(item.tauxTVA),
      actif: item.actif,
      ordre: item.ordre,
      groupe: item.groupe ?? undefined,
    }));
  } catch (err) {
    console.error("[fetchCessions]", err);
    return [];
  }
}

export async function saveCessions(
  dossierId: string,
  rows: CessionRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    const err = validateRows(rows, cessionSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = rows
        .map((r) => r.id)
        .filter((id): id is string => !!id && !id.startsWith("__new__"));

      await tx.cessionImmobilisation.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;

        // Validation métier côté serveur
        const { resteAAmortir, plusValue, pvLT } = calcCession(row);
        if (resteAAmortir < 0 || row.prixVente < 0) {
          throw new Error("Montants de cession invalides.");
        }
        if (pvLT) {
          console.info(`[saveCessions] PVLT détectée — ${row.libelle} : plus-value ${plusValue.toFixed(2)} €`);
        }

        const payload = {
          libelle: row.libelle,
          nature: row.nature,
          dateCession: new Date(row.dateCession),
          prixVente: row.prixVente,
          prixAchat: row.prixAchat,
          dejaAmortie: row.dejaAmortie,
          tauxTVA: row.tauxTVA,
          hypothese: row.hypothese,
          actif: row.actif ?? true,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        if (row.id && !row.id.startsWith("__new__")) {
          await tx.cessionImmobilisation.update({ where: { id: row.id }, data: payload });
        } else {
          const created = await tx.cessionImmobilisation.create({ data: payload });
          if (row.id) idMap[row.id] = created.id;
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Cessions enregistrées.", idMap };
  } catch (err) {
    console.error("[saveCessions]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Cession introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRÉDIT-BAIL / LOCATION FINANCIÈRE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchCreditsBaux(dossierId: string): Promise<CreditBailRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const items = await prisma.creditBail.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return items.map((item) => ({
      id: item.id,
      libelle: item.libelle,
      dateDebut: item.dateDebut.toISOString().slice(0, 10),
      montantHT: Number(item.montantHT),
      taux: Number(item.taux),
      duree: item.duree,
      periodicite: item.periodicite as CreditBailRow["periodicite"],
      dateEcheance: item.dateEcheance ? item.dateEcheance.toISOString().slice(0, 10) : undefined,
      valeurResiduelle: item.valeurResiduelle != null ? Number(item.valeurResiduelle) : undefined,
      premierLoyer: item.premierLoyer != null ? Number(item.premierLoyer) : undefined,
      hypothese: item.hypothese,
      loyerHT: item.loyerHT != null ? Number(item.loyerHT) : undefined,
      tauxTVA: Number(item.tauxTVA),
      actif: item.actif,
      ordre: item.ordre,
      groupe: item.groupe ?? undefined,
    }));
  } catch (err) {
    console.error("[fetchCreditsBaux]", err);
    return [];
  }
}

export async function saveCreditBails(
  dossierId: string,
  rows: CreditBailRow[]
): Promise<ActionResult & { idMap?: Record<string, string> }> {
  try {
    const err = validateRows(rows, creditBailSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const idMap: Record<string, string> = {};

    await prisma.$transaction(async (tx) => {
      const keepIds = rows
        .map((r) => r.id)
        .filter((id): id is string => !!id && !id.startsWith("__new__"));

      await tx.creditBail.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;

        const payload = {
          libelle: row.libelle,
          dateDebut: new Date(row.dateDebut),
          montantHT: row.montantHT,
          taux: row.taux,
          duree: row.duree,
          periodicite: row.periodicite,
          dateEcheance: row.dateEcheance ? new Date(row.dateEcheance) : null,
          valeurResiduelle: row.valeurResiduelle ?? null,
          premierLoyer: row.premierLoyer ?? null,
          loyerHT: row.loyerHT ?? null,
          tauxTVA: row.tauxTVA,
          hypothese: row.hypothese,
          actif: row.actif ?? true,
          ordre: i,
          groupe: row.groupe ?? null,
          scenarioId,
        };

        if (row.id && !row.id.startsWith("__new__")) {
          await tx.creditBail.update({ where: { id: row.id }, data: payload });
        } else {
          const created = await tx.creditBail.create({ data: payload });
          if (row.id) idMap[row.id] = created.id;
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Crédit-baux enregistrés.", idMap };
  } catch (err) {
    console.error("[saveCreditBails]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Crédit-bail introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECALCUL GLOBAL DES PLANS D’AMORTISSEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Recalcule tous les plans d’amortissement d’un dossier.
 * À appeler après chaque modification de `dureeProjection` ou `dateDemarrage`.
 */
export async function recalculerTousLesPlans(dossierId: string): Promise<void> {
  const { anneeDebut, nbAnnees } = await getDossierProjection(dossierId);
  await recalculerTousLesPlansPourProjection(dossierId, anneeDebut, nbAnnees);
}

export async function recalculerTousLesPlansPourProjection(
  dossierId: string,
  anneeDebut: number,
  nbAnnees: number,
): Promise<void> {
  const projectionAnnees = Math.min(3, Math.max(1, Math.trunc(nbAnnees)));
  const scenario = await prisma.scenario.findFirst({
    where: { dossierId, isDefault: true },
    select: { id: true },
  });
  if (!scenario) return;

  const immobilisations = await prisma.immobilisation.findMany({
    where: { scenarioId: scenario.id },
    select: {
      id: true,
      montantHT: true,
      dureeAmortissement: true,
      modeAmortissement: true,
      dateAcquisition: true,
    },
  });

  await Promise.all(
    immobilisations.map((immo) =>
      recalculerPlan(
        immo.id,
        Number(immo.montantHT),
        immo.dureeAmortissement ?? 5,
        immo.modeAmortissement as "AUCUN" | "LINEAIRE" | "DEGRESSIF",
        immo.dateAcquisition,
        anneeDebut,
        projectionAnnees,
      ),
    ),
  );
}
