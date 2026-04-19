"use server";

import { prisma } from "@/lib/prisma";
import {
  porteurSchema,
  type PorteurFormValues,
} from "@/lib/schemas/porteur";
import type { ActionResult } from "@/app/actions/types";
import { isPrismaError } from "@/lib/utils/prisma-error";

/**
 * Met à jour la section Description d'un dossier.
 * Valide les données côté serveur avant persistance.
 */
export async function upsertPorteur(
  dossierId: string,
  rawData: PorteurFormValues
): Promise<ActionResult> {
  // Validation serveur (défense en profondeur)
  const parsed = porteurSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  const data = parsed.data;

  try {
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        nom: data.nom,
        reference: data.reference || null,
        raisonSociale: data.raisonSociale || null,
        siret: data.siret || null,
        activiteSociete: data.activiteSociete || null,
        responsableCivilite: data.responsableCivilite || null,
        responsableNom: data.responsableNom || null,
        responsablePrenom: data.responsablePrenom || null,
        responsableFonction: data.responsableFonction || null,
        adresse1: data.adresse1 || null,
        adresse2: data.adresse2 || null,
        codePostal: data.codePostal || null,
        ville: data.ville || null,
        pays: data.pays || null,
        telephone: data.telephone || null,
        portable: data.portable || null,
        telecopie: data.telecopie || null,
        email: data.email || null,
      },
    });

    return { success: true, message: "Porteur de projet enregistré avec succès." };
  } catch (err) {
    console.error("[upsertPorteur]", err);

    if (isPrismaError(err, "P2025")) {
      return {
        success: false,
        error: `Dossier introuvable (id\u00a0: ${dossierId}). Vérifiez que le dossier existe en base.`,
      };
    }

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement.",
    };
  }
}

/**
 * Récupère les données de description d'un dossier pour pré-remplir le formulaire.
 * Convertit les champs null (Prisma) en undefined (compatibles avec PorteurFormValues).
 */
export async function fetchPorteur(
  dossierId: string
): Promise<Partial<PorteurFormValues> | null> {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        nom: true,
        reference: true,
        raisonSociale: true,
        siret: true,
        activiteSociete: true,
        responsableCivilite: true,
        responsableNom: true,
        responsablePrenom: true,
        responsableFonction: true,
        adresse1: true,
        adresse2: true,
        codePostal: true,
        ville: true,
        pays: true,
        telephone: true,
        portable: true,
        telecopie: true,
        email: true,
      },
    });

    if (!dossier) return null;

    // Prisma retourne string | null ; le formulaire attend string | undefined
    return {
      nom:                  dossier.nom,
      reference:            dossier.reference            ?? undefined,
      raisonSociale:        dossier.raisonSociale        ?? undefined,
      siret:                dossier.siret                ?? undefined,
      activiteSociete:      dossier.activiteSociete      ?? undefined,
      responsableCivilite:  dossier.responsableCivilite  ?? undefined,
      responsableNom:       dossier.responsableNom       ?? undefined,
      responsablePrenom:    dossier.responsablePrenom    ?? undefined,
      responsableFonction:  dossier.responsableFonction  ?? undefined,
      adresse1:             dossier.adresse1             ?? undefined,
      adresse2:             dossier.adresse2             ?? undefined,
      codePostal:           dossier.codePostal           ?? undefined,
      ville:                dossier.ville                ?? undefined,
      pays:                 dossier.pays                 ?? undefined,
      telephone:            dossier.telephone            ?? undefined,
      portable:             dossier.portable             ?? undefined,
      telecopie:            dossier.telecopie            ?? undefined,
      email:                dossier.email                ?? undefined,
    };
  } catch (err) {
    console.error("[fetchPorteur]", err);
    return null;
  }
}
