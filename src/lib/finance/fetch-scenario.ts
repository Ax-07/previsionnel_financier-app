import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";

/**
 * Centralise toutes les requêtes Prisma communes aux actions de contrôle.
 * Un seul appel = ~20 requêtes en parallèle au lieu de ~20 × 10 = ~200.
 *
 * Utiliser `ScenarioFinData = Awaited<ReturnType<typeof fetchScenarioData>>`
 * pour typer les fonctions de calcul (P3-4).
 */
export async function fetchScenarioData(dossierId: string) {
  // ── 1. Infos dossier ────────────────────────────────────────────────────────
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { dateDemarrage: true, dureeProjection: true },
  });
  const dateDemarrage = dossier?.dateDemarrage
    ? new Date(dossier.dateDemarrage)
    : new Date(`${new Date().getFullYear()}-01-01`);
  const dureeProjection = dossier?.dureeProjection ?? 3;

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
        },
      },
    },
  });
  const isIS = (scenario.parametres?.regimeFiscal ?? "IS") === "IS";

  // ── 3. Fetch parallèle ──────────────────────────────────────────────────────
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
  ]);

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

/** Type de toutes les données du scénario, utilisable dans les modules de calcul (P3-4). */
export type ScenarioFinData = Awaited<ReturnType<typeof fetchScenarioData>>;
