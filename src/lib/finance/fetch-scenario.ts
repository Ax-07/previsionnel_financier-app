import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";

/**
 * Vérifie que l'utilisateur identifié par `userId` a bien accès au dossier
 * `dossierId` via la table `UserDossier`. Lève une erreur 403 en cas d'accès
 * non autorisé.
 *
 * Fix C1 : à appeler dans chaque Server Action exposée avant d'invoquer
 * `fetchScenarioData`. La récupération du `userId` depuis la session
 * (ex: `const session = await auth()`) est de la responsabilité de l'appelant.
 *
 * TODO: intégrer l'appel côté `loadScenarioData` une fois Better Auth configuré.
 */
export async function assertDossierAccess(
  dossierId: string,
  userId: string
): Promise<void> {
  const access = await prisma.userDossier.findUnique({
    where: { userId_dossierId: { userId, dossierId } },
    select: { id: true },
  });
  if (!access) {
    throw new Error("Accès refusé : vous n'avez pas accès à ce dossier.");
  }
}

/**
 * Centralise toutes les requêtes Prisma communes aux actions de contrôle.
 * Un seul appel = ~32 requêtes en parallèle au lieu de ~32 × 13 = ~416.
 *
 * Note : `react.cache()` n'a aucun effet ici — `fetchScenarioData` est appelé
 * depuis des Server Actions déclenchées par le client (Zustand). Chaque appel
 * crée un nouveau contexte serveur ; la déduplication par `cache()` ne s'applique
 * qu'à des appels dans le même arbre de rendu serveur (même Request).
 *
 * Utiliser `ScenarioFinData = Awaited<ReturnType<typeof fetchScenarioData>>`
 * pour typer les fonctions de calcul.
 */
export async function fetchScenarioData(dossierId: string) {
  // ── 1. Infos dossier ────────────────────────────────────────────────────────
  // Fix C3 : findUniqueOrThrow lève une erreur explicite si le dossier n'existe
  // pas, au lieu d'un fallback silencieux sur une date par défaut incorrecte.
  const dossier = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    select: { dateDemarrage: true, dureeProjection: true },
  });
  const dateDemarrage = new Date(dossier.dateDemarrage);
  const dureeProjection = dossier.dureeProjection;

  // ── 2. Scénario par défaut ──────────────────────────────────────────────────
  const scenarioId = await getOrCreateDefaultScenario(dossierId);
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: {
      id: true,
      parametres: {
        select: {
          regimeFiscal: true,
          tauxIs: true,
          tauxIsReduit: true,
          plafondIsReduit: true,
          regimeTVA: true,
          periodiciteDeclarationTVA: true,
          tauxTvaStandard: true,
          moisPaiementSalaires: true,
          tnsRegimeSocial: true,
          tnsModeCalcul: true,
          delaiPaiementClients: true,
        },
      },
    },
  });
  const isIS = (scenario.parametres?.regimeFiscal ?? "IS") === "IS";

  // ── 3. Fetch parallèle ──────────────────────────────────────────────────────
  // Fix C2 : encapsulation dans .catch() pour éviter qu'une seule requête DB
  // en échec ne provoque un crash silencieux de toutes les données de contrôle.
  const [
    activites,
    activiteCommissions,
    subventionsExploitation,
    productionsImmobilisees,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    immobilisations,
    provisions,
    chargesFinancieres,
    chargesExceptionnelles,
    chargesGestionCourante,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
    transfertsProduits,
    gestionCouranteProduits,
    emprunts,
    apports,
    subventions,
    diversEncaissements,
    diversDecaissements,
    diversRemboursementsCC,
    parametresIS,
    ajustementsFiscaux,
  ] = await Promise.all([
    prisma.activite.findMany({ where: { scenarioId } }),
    prisma.activiteCommission.findMany({ where: { scenarioId } }),
    prisma.subventionExploitation.findMany({ where: { scenarioId } }),
    prisma.productionImmobilisee.findMany({ where: { scenarioId } }),
    prisma.chargeExploitation.findMany({
      where: { scenarioId, categorie: "FOURNITURE_CONSOMMABLE" },
    }),
    prisma.chargeExploitation.findMany({
      where: { scenarioId, categorie: "SERVICE_EXTERIEUR" },
    }),
    prisma.impotTaxe.findMany({ where: { scenarioId } }),
    prisma.ligneSalarie.findMany({ where: { scenarioId } }),
    prisma.ligneDirigeant.findMany({ where: { scenarioId } }),
    prisma.ligneCotisationTNS.findMany({ where: { scenarioId } }),
    prisma.ligneTaxeSalaire.findMany({ where: { scenarioId, actif: true } }),
    prisma.immobilisation.findMany({
      where: { scenarioId },
      include: { lignesAmortissement: true },
    }),
    prisma.autreChargeProvision.findMany({ where: { scenarioId } }),
    prisma.autreChargeDatee.findMany({
      where: { scenarioId, categorie: "FINANCIERE" },
    }),
    prisma.autreChargeDatee.findMany({
      where: { scenarioId, categorie: "EXCEPTIONNELLE" },
    }),
    prisma.autreChargeDatee.findMany({
      where: { scenarioId, categorie: "GESTION_COURANTE" },
    }),
    prisma.autreProduitReprise.findMany({ where: { scenarioId } }),
    prisma.autreProduitDate.findMany({
      where: { scenarioId, categorie: "FINANCIER" },
    }),
    prisma.autreProduitDate.findMany({
      where: { scenarioId, categorie: "EXCEPTIONNEL" },
    }),
    prisma.autreProduitDate.findMany({
      where: { scenarioId, categorie: "TRANSFERT" },
    }),
    prisma.autreProduitDate.findMany({
      where: { scenarioId, categorie: "GESTION_COURANTE" },
    }),
    prisma.emprunt.findMany({
      where: { scenarioId },
      include: { lignesEcheancier: true },
    }),
    prisma.apport.findMany({ where: { scenarioId } }),
    prisma.subvention.findMany({ where: { scenarioId } }),
    prisma.diversFluxDate.findMany({
      where: { scenarioId, type: "ENCAISSEMENT" },
    }),
    prisma.diversFluxDate.findMany({
      where: { scenarioId, type: "DECAISSEMENT" },
    }),
    prisma.diversFluxDate.findMany({
      where: { scenarioId, type: "REMBOURSEMENT_CC" },
    }),
    prisma.parametresIS.findUnique({ where: { scenarioId } }),
    prisma.ajustementFiscal.findMany({ where: { scenarioId } }),
  ]).catch((cause: unknown) => {
    console.error("[fetchScenarioData] Échec du chargement parallèle des données", {
      dossierId,
      cause,
    });
    throw new Error(
      "Impossible de charger les données du dossier. Veuillez réessayer.",
      { cause: cause instanceof Error ? cause : undefined }
    );
  });

  return {
    dossierId,
    scenarioId,
    dateDemarrage,
    dureeProjection,
    scenario,
    isIS,
    activites,
    activiteCommissions,
    subventionsExploitation,
    productionsImmobilisees,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    immobilisations,
    provisions,
    chargesFinancieres,
    chargesExceptionnelles,
    chargesGestionCourante,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
    transfertsProduits,
    gestionCouranteProduits,
    emprunts,
    apports,
    subventions,
    diversEncaissements,
    diversDecaissements,
    diversRemboursementsCC,
    parametresIS,
    ajustementsFiscaux,
  };
}

/** Type de toutes les données du scénario, utilisable dans les modules de calcul. */
export type ScenarioFinData = Awaited<ReturnType<typeof fetchScenarioData>>;
