"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  tableauLibreSchema,
  type TableauLibreRow,
  type TableauLibreLigneRow,
  type DetailMensuelRow,
} from "@/lib/schemas/tableau-libre";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapLigneFromDb(l: {
  id: string;
  actif: boolean;
  libelle: string;
  format: string;
  detailEnabled: boolean;
  ordre: number;
  nValeur: { toNumber(): number };
  growthRateN1: { toNumber(): number };
  growthRateN2: { toNumber(): number };
  details: {
    id: string;
    mois: number;
    montant: { toNumber(): number };
    pourcentage: { toNumber(): number };
    exercice: string;
  }[];
}): TableauLibreLigneRow {
  return {
    id: l.id,
    actif: l.actif,
    libelle: l.libelle,
    format: l.format as TableauLibreLigneRow["format"],
    detailEnabled: l.detailEnabled,
    ordre: l.ordre,
    nValeur: l.nValeur.toNumber(),
    growthRateN1: l.growthRateN1.toNumber(),
    growthRateN2: l.growthRateN2.toNumber(),
    details: l.details.map((d) => ({
      id: d.id,
      mois: d.mois,
      montant: d.montant.toNumber(),
      pourcentage: d.pourcentage.toNumber(),
      exercice: d.exercice as DetailMensuelRow["exercice"],
    })),
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchTableauxLibres(dossierId: string): Promise<TableauLibreRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const tableaux = await prisma.tableauLibre.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
      include: {
        lignes: {
          orderBy: { ordre: "asc" },
          include: { details: { orderBy: { mois: "asc" } } },
        },
      },
    });

    return tableaux.map((t) => ({
      id: t.id,
      nom: t.nom,
      ordre: t.ordre,
      showZeroLines: t.showZeroLines,
      hidePreviousYear: t.hidePreviousYear,
      pieChart: t.pieChart,
      histogram: t.histogram,
      lignes: t.lignes.map(mapLigneFromDb),
    }));
  } catch (error) {
    console.error("[fetchTableauxLibres]", error);
    throw new Error("Impossible de charger les tableaux libres");
  }
}

// ── Save (upsert complet) ─────────────────────────────────────────────────────

export async function saveTableauxLibres(
  dossierId: string,
  tableaux: TableauLibreRow[]
): Promise<ActionResult & { tableaux?: TableauLibreRow[] }> {
  try {
    // Validation
    for (let i = 0; i < tableaux.length; i++) {
      const result = tableauLibreSchema.safeParse(tableaux[i]);
      if (!result.success) {
        const issue = result.error.issues[0];
        return {
          success: false,
          error: `Tableau ${i + 1} : ${issue?.message ?? "Données invalides"}`,
        };
      }
    }

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    // IDs existants en base
    const existingIds = (
      await prisma.tableauLibre.findMany({
        where: { scenarioId },
        select: { id: true },
      })
    ).map((t) => t.id);

    const incomingIds = tableaux.map((t) => t.id).filter(Boolean) as string[];
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    // Suppression des tableaux retirés
    if (toDelete.length > 0) {
      await prisma.tableauLibre.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (let tIdx = 0; tIdx < tableaux.length; tIdx++) {
      const t = tableaux[tIdx]!;

      let tableau: { id: string };
      if (t.id) {
        tableau = await prisma.tableauLibre.update({
          where: { id: t.id },
          data: {
            nom: t.nom,
            ordre: tIdx,
            showZeroLines: t.showZeroLines,
            hidePreviousYear: t.hidePreviousYear,
            pieChart: t.pieChart,
            histogram: t.histogram,
          },
          select: { id: true },
        });
      } else {
        tableau = await prisma.tableauLibre.create({
          data: {
            nom: t.nom,
            ordre: tIdx,
            showZeroLines: t.showZeroLines,
            hidePreviousYear: t.hidePreviousYear,
            pieChart: t.pieChart,
            histogram: t.histogram,
            scenarioId,
          },
          select: { id: true },
        });
      }

      // Lignes existantes
      const existingLigneIds = (
        await prisma.tableauLibreLigne.findMany({
          where: { tableauId: tableau.id },
          select: { id: true },
        })
      ).map((l) => l.id);

      const incomingLigneIds = t.lignes.map((l) => l.id).filter(Boolean) as string[];
      const lignesToDelete = existingLigneIds.filter((id) => !incomingLigneIds.includes(id));

      if (lignesToDelete.length > 0) {
        await prisma.tableauLibreLigne.deleteMany({ where: { id: { in: lignesToDelete } } });
      }

      for (let lIdx = 0; lIdx < t.lignes.length; lIdx++) {
        const l = t.lignes[lIdx]!;

        let ligne: { id: string };
        if (l.id) {
          ligne = await prisma.tableauLibreLigne.update({
            where: { id: l.id },
            data: {
              actif: l.actif,
              libelle: l.libelle,
              format: l.format,
              detailEnabled: l.detailEnabled,
              ordre: lIdx,
              nValeur: l.nValeur,
              growthRateN1: l.growthRateN1,
              growthRateN2: l.growthRateN2,
            },
            select: { id: true },
          });
        } else {
          ligne = await prisma.tableauLibreLigne.create({
            data: {
              actif: l.actif,
              libelle: l.libelle,
              format: l.format,
              detailEnabled: l.detailEnabled,
              ordre: lIdx,
              nValeur: l.nValeur,
              growthRateN1: l.growthRateN1,
              growthRateN2: l.growthRateN2,
              tableauId: tableau.id,
            },
            select: { id: true },
          });
        }

        // Upsert des détails mensuels
        for (const d of l.details) {
          await prisma.tableauLibreDetail.upsert({
            where: {
              ligneId_mois_exercice: {
                ligneId: ligne.id,
                mois: d.mois,
                exercice: d.exercice,
              },
            },
            update: { montant: d.montant, pourcentage: d.pourcentage },
            create: {
              mois: d.mois,
              montant: d.montant,
              pourcentage: d.pourcentage,
              exercice: d.exercice,
              ligneId: ligne.id,
            },
          });
        }
      }
    }

    // Refetch pour retourner les IDs frais
    const freshTableaux = await fetchTableauxLibres(dossierId);
    return {
      success: true,
      message: "Tableaux libres enregistrés.",
      tableaux: freshTableaux,
    };
  } catch (error) {
    console.error("[saveTableauxLibres]", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}
