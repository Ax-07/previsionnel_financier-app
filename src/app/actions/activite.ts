"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  activiteSchema,
  activiteCommissionSchema,
  productionImmobiliseeSchema,
  subventionExploitationSchema,
  type ActiviteRow,
  type ActiviteCommissionRow,
  type ProductionImmobiliseeRow,
  type SubventionExploitationRow,
} from "@/lib/schemas/activite";
import type { ActionResult } from "@/app/actions/types";
import { isPrismaError } from "@/lib/utils/prisma-error";
import { validateRows } from "@/lib/utils/validate-rows";

// ── Helpers internes ─────────────────────────────────────────────────────────

function secteurToTypeActivite(secteur: ActiviteRow["secteur"]) {
  switch (secteur) {
    case "PRODUCTION": return "PRODUCTION_VENDUE" as const;
    case "SERVICE":    return "PRESTATION_SERVICES" as const;
    case "NEGOCE":     return "VENTE_MARCHANDISES" as const;
    default:           return "PRESTATION_SERVICES" as const;
  }
}

function typeActiviteToSecteur(type: string): ActiviteRow["secteur"] {
  switch (type) {
    case "PRODUCTION_VENDUE":  return "PRODUCTION";
    case "VENTE_MARCHANDISES": return "NEGOCE";
    default:                   return "SERVICE";
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITES (Chiffre d'affaires)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchActivites(dossierId: string): Promise<ActiviteRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.activite.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((a) => ({
      id: a.id,
      libelle: a.libelle,
      secteur: typeActiviteToSecteur(a.typeActivite),
      hypothese: (a.hypothese ?? "normal") as ActiviteRow["hypothese"],
      montantN: Number(a.montantN),
      evolutionN1: Number(a.evolutionN1),
      montantN1: Number(a.montantN1),
      evolutionN2: Number(a.evolutionN2),
      montantN2: Number(a.montantN2),
      tauxMarge: Number(a.tauxMarge),
      stocks: a.stocks ?? 0,
      reglementClients: a.reglementClients ?? 30,
      tvaVentes: Number(a.tauxTVA),
      reglementFournisseurs: a.reglementFournisseurs ?? 30,
      tvaAchats: Number(a.tvaAchats),
      actif: a.actif,
      saisonnaliteCA:
        a.saisonnaliteCA != null
          ? (a.saisonnaliteCA as Record<string, number[]>)
          : undefined,
      saisonnaliteAchats:
        a.saisonnaliteAchats != null
          ? (a.saisonnaliteAchats as Record<string, number[]>)
          : undefined,
      achatsStockPonctuel:
        a.achatsStockPonctuel != null
          ? (a.achatsStockPonctuel as Record<string, number[]>)
          : undefined,
    }));
  } catch (error) {
    console.error("[fetchActivites] Erreur :", error);
    throw new Error("Impossible de charger les activités");
  }
}

export async function saveActivites(
  dossierId: string,
  rows: ActiviteRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, activiteSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.activite.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        // Les montants N+1/N+2 et les taux d'évolution sont cohérents par construction :
        // le client calcule montantN1/N2 depuis les taux (mode évolution)
        // ou les taux depuis les montants (mode saisie directe). On persiste les valeurs telles quelles.
        const { montantN1, montantN2 } = row;
        const data = {
          libelle: row.libelle,
          typeActivite: secteurToTypeActivite(row.secteur),
          secteur: row.secteur,
          hypothese: row.hypothese,
          montantN: row.montantN,
          evolutionN1: row.evolutionN1,
          montantN1,
          evolutionN2: row.evolutionN2,
          montantN2,
          tauxMarge: row.tauxMarge,
          stocks: row.stocks ?? null,
          reglementClients: row.reglementClients ?? null,
          tauxTVA: row.tvaVentes,
          reglementFournisseurs: row.reglementFournisseurs ?? null,
          tvaAchats: row.tvaAchats,
          actif: row.actif ?? true,
          ordre: i,
          saisonnaliteCA: row.saisonnaliteCA ?? Prisma.JsonNull,
          saisonnaliteAchats: row.saisonnaliteAchats ?? Prisma.JsonNull,
          achatsStockPonctuel: row.achatsStockPonctuel ?? Prisma.JsonNull,
        };

        if (row.id) {
          await tx.activite.update({ where: { id: row.id }, data });
        } else {
          await tx.activite.create({ data: { ...data, scenarioId } });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Activités enregistrées avec succès" };
  } catch (error) {
    console.error("[saveActivites] Erreur :", error);
    if (isPrismaError(error, "P2025")) return { success: false, error: "Dossier introuvable" };
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

export async function deleteActivite(activiteId: string, dossierId: string): Promise<ActionResult> {
  try {
    // Vérifier que l'activité appartient bien au dossier (IDOR)
    const activite = await prisma.activite.findFirst({
      where: { id: activiteId, scenario: { dossierId } },
      select: { id: true },
    });
    if (!activite) return { success: false, error: "Activité introuvable" };

    await prisma.activite.delete({ where: { id: activiteId } });
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Activité supprimée" };
  } catch (error) {
    console.error("[deleteActivite] Erreur :", error);
    if (isPrismaError(error, "P2025")) return { success: false, error: "Activité introuvable" };
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITÉS COMMISSIONNÉES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchActivitesCommission(
  dossierId: string
): Promise<ActiviteCommissionRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.activiteCommission.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((a) => ({
      id: a.id,
      libelle: a.libelle,
      hypothese: (a.hypothese ?? "normal") as ActiviteCommissionRow["hypothese"],
      montantN: Number(a.montantN),
      evolutionN1: Number(a.evolutionN1),
      montantN1: Number(a.montantN1),
      evolutionN2: Number(a.evolutionN2),
      montantN2: Number(a.montantN2),
      calculCommission: (a.calculCommission ?? "HT") as "HT" | "TTC",
      tauxCommission: Number(a.tauxCommission),
      tvaCommission: Number(a.tvaCommission),
      stocks: a.stocks ?? 0,
      reglementFournisseurs: a.reglementFournisseurs ?? 30,
      actif: a.actif,
    }));
  } catch (error) {
    console.error("[fetchActivitesCommission] Erreur :", error);
    throw new Error("Impossible de charger les activités commissionnées");
  }
}

export async function saveActivitesCommission(
  dossierId: string,
  rows: ActiviteCommissionRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, activiteCommissionSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.activiteCommission.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        // Les montants N+1/N+2 et les taux d'évolution sont cohérents par construction
        // (calculés côté client). On persiste les valeurs telles quelles.
        const { montantN1, montantN2 } = row;
        const data = {
          libelle: row.libelle,
          hypothese: row.hypothese,
          montantN: row.montantN,
          evolutionN1: row.evolutionN1,
          montantN1,
          evolutionN2: row.evolutionN2,
          montantN2,
          calculCommission: row.calculCommission,
          tauxCommission: row.tauxCommission,
          tvaCommission: row.tvaCommission,
          stocks: row.stocks ?? null,
          reglementFournisseurs: row.reglementFournisseurs ?? null,
          actif: row.actif ?? true,
          ordre: i,
        };

        if (row.id) {
          await tx.activiteCommission.update({ where: { id: row.id }, data });
        } else {
          await tx.activiteCommission.create({ data: { ...data, scenarioId } });
        }
      }
    });
    revalidatePath(`/previsionnel/dossier/${dossierId}`);    return { success: true, message: "Activités commissionnées enregistrées avec succès" };
  } catch (error) {
    console.error("[saveActivitesCommission] Erreur :", error);
    if (isPrismaError(error, "P2025")) return { success: false, error: "Dossier introuvable" };
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRODUCTIONS IMMOBILISÉES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchProductionsImmobilisees(
  dossierId: string
): Promise<ProductionImmobiliseeRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.productionImmobilisee.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((p) => ({
      id: p.id,
      libelle: p.libelle,
      nature: (p.nature ?? "CORPOREL") as ProductionImmobiliseeRow["nature"],
      hypothese: (p.hypothese ?? "normal") as ProductionImmobiliseeRow["hypothese"],
      date: p.date ?? "",
      montant: Number(p.montant),
      amortissement: (p.amortissement ?? "LINEAIRE") as ProductionImmobiliseeRow["amortissement"],
      differe: p.differe ?? 0,
      duree: p.duree ?? 0,
      actif: p.actif,
    }));
  } catch (error) {
    console.error("[fetchProductionsImmobilisees] Erreur :", error);
    throw new Error("Impossible de charger les productions immobilisées");
  }
}

export async function saveProductionsImmobilisees(
  dossierId: string,
  rows: ProductionImmobiliseeRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, productionImmobiliseeSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.productionImmobilisee.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          libelle: row.libelle,
          nature: row.nature,
          hypothese: row.hypothese,
          date: row.date,
          montant: row.montant,
          amortissement: row.amortissement,
          differe: row.differe ?? null,
          duree: row.duree ?? null,
          actif: row.actif ?? true,
          ordre: i,
        };

        if (row.id) {
          await tx.productionImmobilisee.update({ where: { id: row.id }, data });
        } else {
          await tx.productionImmobilisee.create({ data: { ...data, scenarioId } });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Productions immobilisées enregistrées avec succès" };
  } catch (error) {
    console.error("[saveProductionsImmobilisees] Erreur :", error);
    if (isPrismaError(error, "P2025")) return { success: false, error: "Dossier introuvable" };
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBVENTIONS D'EXPLOITATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchSubventionsExploitation(
  dossierId: string
): Promise<SubventionExploitationRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.subventionExploitation.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((s) => ({
      id: s.id,
      libelle: s.libelle,
      hypothese: (s.hypothese ?? "normal") as SubventionExploitationRow["hypothese"],
      dateN: s.dateN ?? undefined,
      montantN: s.montantN !== null ? Number(s.montantN) : undefined,
      dateN1: s.dateN1 ?? undefined,
      montantN1: s.montantN1 !== null ? Number(s.montantN1) : undefined,
      dateN2: s.dateN2 ?? undefined,
      montantN2: s.montantN2 !== null ? Number(s.montantN2) : undefined,
      tva: Number(s.tva),
      typeTva: (s.typeTva ?? "RECUPERABLE") as SubventionExploitationRow["typeTva"],
      actif: s.actif,
    }));
  } catch (error) {
    console.error("[fetchSubventionsExploitation] Erreur :", error);
    throw new Error("Impossible de charger les subventions d'exploitation");
  }
}

export async function saveSubventionsExploitation(
  dossierId: string,
  rows: SubventionExploitationRow[]
): Promise<ActionResult> {
  try {
    const err = validateRows(rows, subventionExploitationSchema);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.subventionExploitation.deleteMany({
        where: {
          scenarioId,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          libelle: row.libelle,
          hypothese: row.hypothese,
          dateN: row.dateN ?? null,
          montantN: row.montantN ?? null,
          dateN1: row.dateN1 ?? null,
          montantN1: row.montantN1 ?? null,
          dateN2: row.dateN2 ?? null,
          montantN2: row.montantN2 ?? null,
          tva: row.tva,
          typeTva: row.typeTva,
          actif: row.actif ?? true,
          ordre: i,
        };

        if (row.id) {
          await tx.subventionExploitation.update({ where: { id: row.id }, data });
        } else {
          await tx.subventionExploitation.create({ data: { ...data, scenarioId } });
        }
      }
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Subventions d'exploitation enregistrées avec succès" };
  } catch (error) {
    console.error("[saveSubventionsExploitation] Erreur :", error);
    if (isPrismaError(error, "P2025")) return { success: false, error: "Dossier introuvable" };
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTRES PRODUITS (AutreProduit — table héritée)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchAutresProduits(
  dossierId: string
): Promise<Array<{ id: string; libelle: string; montant: number; annee: number }>> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const produits = await prisma.autreProduit.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { annee: "asc" },
    });

    return produits.map((p) => ({
      id: p.id,
      libelle: p.libelle,
      montant: Number(p.montant),
      annee: p.annee,
    }));
  } catch (error) {
    console.error("[fetchAutresProduits] Erreur :", error);
    throw new Error("Impossible de charger les autres produits");
  }
}
