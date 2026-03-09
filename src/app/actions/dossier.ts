"use server";

import { prisma } from "@/lib/prisma";
import {
  createDossierSchema,
  updateDossierSchema,
  type CreateDossierValues,
  type UpdateDossierValues,
} from "@/lib/schemas/dossier";
import { recalculerTousLesPlans } from "@/app/actions/investissement";
import { redirect } from "next/navigation";

// ── Types partagés ────────────────────────────────────────────────────────────

export type DossierListItem = {
  id: string;
  nom: string;
  reference: string | null;
  typeDossier: "CREATION" | "REPRISE";
  statut: "ACTIF" | "ARCHIVE" | "SUPPRIME";
  dateDemarrage: Date;
  dureeProjection: number;
  updatedAt: Date;
};

export type DossierDetail = DossierListItem;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Retourne la liste de tous les dossiers actifs triés par date de mise à jour.
 * TODO: filtrer par cabinet/utilisateur une fois Better Auth intégré.
 */
export async function fetchDossiers(): Promise<DossierListItem[]> {
  const rows = await prisma.dossier.findMany({
    where: { statut: "ACTIF" },
    select: {
      id: true,
      nom: true,
      reference: true,
      typeDossier: true,
      statut: true,
      dateDemarrage: true,
      dureeProjection: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows as DossierListItem[];
}

/**
 * Retourne un dossier par son id.
 * Retourne null si introuvable.
 */
export async function fetchDossierById(
  id: string
): Promise<DossierDetail | null> {
  const row = await prisma.dossier.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      reference: true,
      typeDossier: true,
      statut: true,
      dateDemarrage: true,
      dureeProjection: true,
      updatedAt: true,
    },
  });
  return row as DossierDetail | null;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export type CreateDossierResult =
  | { success: true; dossierId: string }
  | { success: false; error: string };

/** Duck-typing pour les erreurs Prisma (sans import fragile) */
function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}

/**
 * Récupère ou crée un cabinet de démonstration.
 * À remplacer par `getServerSession()` une fois Better Auth configuré.
 */
async function getOrCreateDemoCabinet(): Promise<string> {
  const existing = await prisma.cabinet.findFirst({
    select: { id: true },
  });
  if (existing) return existing.id;

  const demo = await prisma.cabinet.create({
    data: { nom: "Cabinet Démo" },
    select: { id: true },
  });
  return demo.id;
}

/**
 * Crée un nouveau dossier prévisionnel.
 * Valide les données côté serveur, insère en base, puis redirige vers
 * la page du dossier créé.
 */
export async function createDossier(
  rawData: CreateDossierValues
): Promise<CreateDossierResult> {
  // Validation serveur
  const parsed = createDossierSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  const data = parsed.data;

  // Vérification de l'unicité de la référence (si fournie)
  if (data.reference) {
    const exists = await prisma.dossier.findUnique({
      where: { reference: data.reference },
      select: { id: true },
    });
    if (exists) {
      return {
        success: false,
        error: `La référence « ${data.reference} » est déjà utilisée.`,
      };
    }
  }

  // Résolution du cabinet (TODO: remplacer par la session utilisateur)
  const cabinetId = await getOrCreateDemoCabinet();

  try {
    const dossier = await prisma.dossier.create({
      data: {
        nom: data.nom,
        typeDossier: data.typeDossier,
        dateDemarrage: new Date(data.dateDemarrage),
        dureeProjection: data.dureeProjection,
        reference: data.reference || null,
        cabinetId,
      },
      select: { id: true },
    });

    return { success: true, dossierId: dossier.id };
  } catch (err) {
    console.error("[createDossier]", err);

    if (isPrismaError(err, "P2002")) {
      return {
        success: false,
        error: "Cette référence est déjà utilisée par un autre dossier.",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue.",
    };
  }
}

/**
 * Crée un dossier puis redirige vers sa page (pour usage server-side).
 * Utilisation : dans un Server Component ou une action de formulaire HTML.
 */
export async function createDossierAndRedirect(
  rawData: CreateDossierValues
): Promise<never | CreateDossierResult> {
  const result = await createDossier(rawData);
  if (result.success) {
    redirect(`/app/dossier/${result.dossierId}`);
  }
  return result;
}

// ── Mise à jour d'un dossier ──────────────────────────────────────────────────

export type UpdateDossierResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Met à jour les paramètres d'un dossier.
 * Si `dureeProjection` ou `dateDemarrage` changent, recalcule tous les plans
 * d'amortissement pour que les dotations restent cohérentes.
 */
export async function updateDossier(
  dossierId: string,
  rawData: UpdateDossierValues,
): Promise<UpdateDossierResult> {
  const parsed = updateDossierSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const current = await prisma.dossier.findUniqueOrThrow({
      where: { id: dossierId },
      select: { dateDemarrage: true, dureeProjection: true },
    });

    const payload: Record<string, unknown> = {};
    if (data.nom !== undefined) payload.nom = data.nom;
    if (data.reference !== undefined) payload.reference = data.reference || null;
    if (data.typeDossier !== undefined) payload.typeDossier = data.typeDossier;
    if (data.dateDemarrage !== undefined) payload.dateDemarrage = new Date(data.dateDemarrage);
    if (data.dureeProjection !== undefined) payload.dureeProjection = data.dureeProjection;

    await prisma.dossier.update({ where: { id: dossierId }, data: payload });

    // Recalcul des plans si la fenêtre temporelle a changé
    const dateChanged =
      data.dateDemarrage !== undefined &&
      new Date(data.dateDemarrage).getTime() !== new Date(current.dateDemarrage).getTime();
    const dureeChanged =
      data.dureeProjection !== undefined && data.dureeProjection !== current.dureeProjection;

    if (dateChanged || dureeChanged) {
      await recalculerTousLesPlans(dossierId);
    }

    return { success: true };
  } catch (err) {
    console.error("[updateDossier]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Dossier introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}
