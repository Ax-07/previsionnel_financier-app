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
import type { ActionResult } from "@/app/actions/types";
import { isPrismaError } from "@/lib/utils/prisma-error";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// ── Helpers internes ─────────────────────────────────────────────────────────

async function getDossierProjection(
  dossierId: string
): Promise<{ anneeDebut: number; nbAnnees: number }> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { dateDemarrage: true, dureeProjection: true },
  });
  const anneeDebut = dossier?.dateDemarrage
    ? new Date(dossier.dateDemarrage).getFullYear()
    : new Date().getFullYear();
  const nbAnnees = dossier?.dureeProjection ?? 3;
  return { anneeDebut, nbAnnees };
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

export async function upsertImmobilisation(
  dossierId: string,
  rawData: ImmobilisationRow
): Promise<ActionResult> {
  const parsed = immobilisationSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const [scenarioId, { anneeDebut, nbAnnees }] = await Promise.all([
      getOrCreateDefaultScenario(dossierId),
      getDossierProjection(dossierId),
    ]);
    const dateAcquisition = new Date(data.dateAcquisition);

    const payload = {
      libelle: data.libelle,
      nature: data.nature,
      montantHT: data.montantHT,
      tauxTVA: data.tauxTVA,
      typeTva: data.typeTva,
      dateAcquisition,
      modeAmortissement: data.modeAmortissement,
      differe: data.differe ?? 0,
      dureeAmortissement: data.dureeAmortissement ?? 5,
      hypothese: data.hypothese,
      actif: data.actif ?? true,
      ordre: data.ordre ?? 0,
      groupe: data.groupe ?? null,
      scenarioId,
    };

    const id = await prisma.$transaction(async (tx) => {
      let immoId = data.id;
      if (immoId) {
        await tx.immobilisation.update({ where: { id: immoId }, data: payload });
      } else {
        const created = await tx.immobilisation.create({ data: payload });
        immoId = created.id;
      }
      await recalculerPlan(
        immoId,
        data.montantHT,
        data.dureeAmortissement ?? 5,
        data.modeAmortissement,
        dateAcquisition,
        anneeDebut,
        nbAnnees,
        tx,
      );
      return immoId;
    });

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return {
      success: true,
      message: data.id ? "Immobilisation mise à jour." : "Immobilisation créée.",
      id,
    };
  } catch (err) {
    console.error("[upsertImmobilisation]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Immobilisation introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteImmobilisation(id: string, dossierId: string): Promise<ActionResult> {
  try {
    // Vérifier que l'immobilisation appartient bien au dossier (IDOR)
    const immo = await prisma.immobilisation.findFirst({
      where: { id, scenario: { dossierId } },
      select: { id: true },
    });
    if (!immo) return { success: false, error: "Immobilisation introuvable." };

    await prisma.immobilisation.delete({ where: { id } });
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Immobilisation supprimée." };
  } catch (err) {
    console.error("[deleteImmobilisation]", err);
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
      hypothese: item.hypothese,
      actif: item.actif,
      ordre: item.ordre,
      groupe: item.groupe ?? undefined,
    }));
  } catch (err) {
    console.error("[fetchCessions]", err);
    return [];
  }
}

export async function upsertCession(
  dossierId: string,
  rawData: CessionRow
): Promise<ActionResult> {
  const parsed = cessionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const dateCession = new Date(data.dateCession);

    // Calcul des valeurs dérivées côté serveur (validation métier)
    const { resteAAmortir, plusValue, pvLT } = calcCession(data);
    if (resteAAmortir < 0 || data.prixVente < 0) {
      return { success: false, error: "Montants de cession invalides." };
    }
    // Log PVLT pour traçabilité (pas encore stocké en base)
    if (pvLT) {
      console.info(`[upsertCession] PVLT détectée — ${data.libelle} : plus-value ${plusValue.toFixed(2)} €`);
    }

    const payload = {
      libelle: data.libelle,
      nature: data.nature,
      dateCession,
      prixVente: data.prixVente,
      prixAchat: data.prixAchat,
      dejaAmortie: data.dejaAmortie,
      tauxTVA: data.tauxTVA,
      hypothese: data.hypothese,
      actif: data.actif ?? true,
      ordre: data.ordre ?? 0,
      groupe: data.groupe ?? null,
      scenarioId,
    };

    let id = data.id;
    if (id) {
      await prisma.cessionImmobilisation.update({ where: { id }, data: payload });
    } else {
      const created = await prisma.cessionImmobilisation.create({ data: payload });
      id = created.id;
    }

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return {
      success: true,
      message: data.id ? "Cession mise à jour." : "Cession créée.",
      id,
    };
  } catch (err) {
    console.error("[upsertCession]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Cession introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteCession(id: string, dossierId: string): Promise<ActionResult> {
  try {
    // Vérifier que la cession appartient bien au dossier (IDOR)
    const cession = await prisma.cessionImmobilisation.findFirst({
      where: { id, scenario: { dossierId } },
      select: { id: true },
    });
    if (!cession) return { success: false, error: "Cession introuvable." };

    await prisma.cessionImmobilisation.delete({ where: { id } });
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Cession supprimée." };
  } catch (err) {
    console.error("[deleteCession]", err);
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
      hypothese: item.hypothese,
      actif: item.actif,
      ordre: item.ordre,
      groupe: item.groupe ?? undefined,
    }));
  } catch (err) {
    console.error("[fetchCreditsBaux]", err);
    return [];
  }
}

export async function upsertCreditBail(
  dossierId: string,
  rawData: CreditBailRow
): Promise<ActionResult> {
  const parsed = creditBailSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    const payload = {
      libelle: data.libelle,
      dateDebut: new Date(data.dateDebut),
      montantHT: data.montantHT,
      taux: data.taux,
      duree: data.duree,
      periodicite: data.periodicite,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      valeurResiduelle: data.valeurResiduelle ?? null,
      premierLoyer: data.premierLoyer ?? null,
      loyerHT: data.loyerHT ?? null,
      tauxTVA: data.tauxTVA,
      hypothese: data.hypothese,
      actif: data.actif ?? true,
      ordre: data.ordre ?? 0,
      groupe: data.groupe ?? null,
      scenarioId,
    };

    let id = data.id;
    if (id) {
      await prisma.creditBail.update({ where: { id }, data: payload });
    } else {
      const created = await prisma.creditBail.create({ data: payload });
      id = created.id;
    }

    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return {
      success: true,
      message: data.id ? "Crédit-bail mis à jour." : "Crédit-bail créé.",
      id,
    };
  } catch (err) {
    console.error("[upsertCreditBail]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Crédit-bail introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteCreditBail(id: string, dossierId: string): Promise<ActionResult> {
  try {
    // Vérifier que le crédit-bail appartient bien au dossier (IDOR)
    const cb = await prisma.creditBail.findFirst({
      where: { id, scenario: { dossierId } },
      select: { id: true },
    });
    if (!cb) return { success: false, error: "Crédit-bail introuvable." };

    await prisma.creditBail.delete({ where: { id } });
    revalidatePath(`/previsionnel/dossier/${dossierId}`);
    return { success: true, message: "Crédit-bail supprimé." };
  } catch (err) {
    console.error("[deleteCreditBail]", err);
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
  const scenario = await prisma.scenario.findFirst({
    where: { dossierId, isDefault: true },
    select: { id: true },
  });
  if (!scenario) return;

  const [dossier, immobilisations] = await Promise.all([
    prisma.dossier.findUniqueOrThrow({
      where: { id: dossierId },
      select: { dateDemarrage: true, dureeProjection: true },
    }),
    prisma.immobilisation.findMany({
      where: { scenarioId: scenario.id },
      select: {
        id: true,
        montantHT: true,
        dureeAmortissement: true,
        modeAmortissement: true,
        dateAcquisition: true,
      },
    }),
  ]);

  const anneeDebut = new Date(dossier.dateDemarrage).getFullYear();
  const nbAnnees = dossier.dureeProjection;

  await Promise.all(
    immobilisations.map((immo) =>
      recalculerPlan(
        immo.id,
        Number(immo.montantHT),
        immo.dureeAmortissement ?? 5,
        immo.modeAmortissement as "AUCUN" | "LINEAIRE" | "DEGRESSIF",
        immo.dateAcquisition,
        anneeDebut,
        nbAnnees,
      ),
    ),
  );
}
