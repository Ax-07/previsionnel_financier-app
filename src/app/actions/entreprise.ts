"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  entrepriseSchema,
  type EntrepriseFormValues,
} from "@/lib/schemas/entreprise";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

/** Détecte une erreur Prisma par code (duck-typing, sans import fragile) */
function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}

/**
 * Récupère les paramètres entreprise du scénario par défaut d'un dossier.
 * Retourne null si le dossier n'a pas encore de scénario.
 */
export async function fetchEntrepriseParams(
  dossierId: string
): Promise<Partial<EntrepriseFormValues> | null> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      include: {
        parametres: {
          include: {
            exercices: { orderBy: { ordre: "asc" } },
          },
        },
      },
    });

    if (!scenario?.parametres) return null;

    const p = scenario.parametres;

    return {
      formeJuridique: p.formeJuridique as EntrepriseFormValues["formeJuridique"],
      regimeFiscal: p.regimeFiscal as EntrepriseFormValues["regimeFiscal"],
      regimeTVA: p.regimeTVA as EntrepriseFormValues["regimeTVA"],
      tauxIs: Number(p.tauxIs),
      tauxIsReduit:
        p.tauxIsReduit != null ? Number(p.tauxIsReduit) : undefined,
      plafondIsReduit:
        p.plafondIsReduit != null ? Number(p.plafondIsReduit) : undefined,
      tauxTvaStandard: Number(p.tauxTvaStandard),
      tauxTvaReduit:
        p.tauxTvaReduit != null ? Number(p.tauxTvaReduit) : undefined,
      periodiciteDeclarationTVA: (p.periodiciteDeclarationTVA ??
        "mensuel") as EntrepriseFormValues["periodiciteDeclarationTVA"],
      delaiPaiementClients: p.delaiPaiementClients,
      delaiPaiementFournisseurs: p.delaiPaiementFournisseurs,
      joursStockMoyen: p.joursStockMoyen ?? undefined,
      repartitionResultat:
        p.repartitionResultat != null
          ? Number(p.repartitionResultat)
          : undefined,
      activite: p.activite ?? "",
      codeNAF: p.codeNAF ?? "",
      dateDebutExerciceN:
        p.dateDebutExerciceN != null
          ? p.dateDebutExerciceN.toISOString().slice(0, 10)
          : "",
      dureePrevisionnelle: p.dureePrevisionnelle,
      exercices: p.exercices.map((e) => ({
        dateCloture: e.dateCloture.toISOString().slice(0, 10),
        duree: e.duree,
        annee: e.annee,
      })),
    };
  } catch (err) {
    console.error("[fetchEntrepriseParams]", err);
    return null;
  }
}

/**
 * Crée ou met à jour les paramètres entreprise du scénario par défaut.
 * Valide les données côté serveur avant persistance.
 */
export async function upsertEntrepriseParams(
  dossierId: string,
  rawData: EntrepriseFormValues
): Promise<ActionResult> {
  // Validation serveur (défense en profondeur)
  const parsed = entrepriseSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  const data = parsed.data;

  try {
    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    // Données communes ParametresEntreprise
    const parametresData = {
      formeJuridique: data.formeJuridique,
      regimeFiscal: data.regimeFiscal,
      regimeTVA: data.regimeTVA,
      tauxIs: data.tauxIs,
      tauxIsReduit: data.tauxIsReduit ?? null,
      plafondIsReduit: data.plafondIsReduit ?? null,
      tauxTvaStandard: data.tauxTvaStandard,
      tauxTvaReduit: data.tauxTvaReduit ?? null,
      periodiciteDeclarationTVA: data.periodiciteDeclarationTVA,
      delaiPaiementClients: data.delaiPaiementClients,
      delaiPaiementFournisseurs: data.delaiPaiementFournisseurs,
      joursStockMoyen: data.joursStockMoyen ?? null,
      repartitionResultat: data.repartitionResultat ?? null,
      activite: data.activite || null,
      codeNAF: data.codeNAF || null,
      dateDebutExerciceN:
        data.dateDebutExerciceN ? new Date(data.dateDebutExerciceN) : null,
      dureePrevisionnelle: data.dureePrevisionnelle,
    };

    const upserted = await prisma.parametresEntreprise.upsert({
      where: { scenarioId },
      create: { scenarioId, ...parametresData },
      update: { ...parametresData },
      select: { id: true },
    });

    // Recréer les exercices (deleteMany + createMany)
    if (data.exercices && data.exercices.length > 0) {
      await prisma.exercicePrevisionnel.deleteMany({
        where: { parametresId: upserted.id },
      });
      await prisma.exercicePrevisionnel.createMany({
        data: data.exercices.map((ex, index) => ({
          ordre: index + 1,
          dateCloture: new Date(ex.dateCloture),
          duree: ex.duree,
          annee: ex.annee,
          parametresId: upserted.id,
        })),
      });
    }

    return {
      success: true,
      message: "Paramètres entreprise enregistrés avec succès.",
    };
  } catch (err) {
    console.error("[upsertEntrepriseParams]", err);

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
          : "Une erreur inattendue est survenue.",
    };
  }
}
