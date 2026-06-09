"use server";

import { fetchPorteur } from "@/app/actions/porteur";
import { fetchEntrepriseParams } from "@/app/actions/entreprise";
import {
  fetchImmobilisations,
  fetchCessions,
  fetchCreditsBaux,
} from "@/app/actions/investissement";
import {
  fetchApports,
  fetchEmprunts,
} from "@/app/actions/financement";
import {
  fetchActivites,
  fetchActivitesCommission,
  fetchProductionsImmobilisees,
  fetchSubventionsExploitation,
} from "@/app/actions/activite";
import {
  fetchFournitures,
  fetchServices,
  fetchImpots,
} from "@/app/actions/charges";
import {
  fetchLignesSalaries,
  fetchLignesDirigeants,
  fetchLignesCotisationsTNS,
  fetchLignesTaxesSalaires,
  fetchLignesChargesPersonnel,
} from "@/app/actions/personnel";
import {
  fetchReintegrations,
  fetchDeductions,
  fetchParametresIS,
} from "@/app/actions/impots-fiscaux";
import {
  fetchProvisions,
  fetchChargesDatees,
  fetchChargesBilan,
} from "@/app/actions/autres-charges";
import {
  fetchReprises,
  fetchProduitsDate,
  fetchConstates,
} from "@/app/actions/autres-produits";
import {
  fetchFluxDates,
  fetchOperationsCapital,
  fetchPrets,
} from "@/app/actions/divers";
import { fetchUnitesDOeuvre } from "@/app/actions/unites-oeuvre";
import { fetchTableauxLibres } from "@/app/actions/tableau-libre";
import { prisma } from "@/lib/prisma";
import { defaultParametresIS } from "@/lib/schemas/impots-fiscaux";

/**
 * Charge toutes les données de saisie d'un dossier en un seul appel.
 * Point d'entrée réseau unique pour l'onglet Saisie (même pattern que
 * `loadScenarioData` pour l'onglet Contrôle).
 *
 * Optimisation : le scenarioId est résolu une seule fois au lieu de
 * ~46 fois en parallèle dans chaque fetch individuel.
 */
export async function loadSaisieData(dossierId: string) {
  // Résoudre le scénario une seule fois — short-circuit si absent
  const scenario = await prisma.scenario.findFirst({
    where: { dossierId, isDefault: true },
    select: { id: true },
  });

  if (!scenario) {
    const entreprise = await fetchEntrepriseParams(dossierId);
    // Pas de scénario → retourner des données vides (évite ~46 requêtes inutiles)
    return {
      porteur: null,
      entreprise,
      immobilisations: [],
      cessions: [],
      creditsBaux: [],
      apports: [],
      emprunts: [],
      activites: [],
      activitesCommissions: [],
      productionsImmobilisees: [],
      subventionsExploitation: [],
      fournitures: [],
      services: [],
      impots: [],
      salaries: [],
      dirigeants: [],
      cotisationsTNS: [],
      taxesSalaires: [],
      autresChargesPersonnel: [],
      remboursements: [],
      participations: [],
      reintegrations: [],
      deductions: [],
      parametresIS: { ...defaultParametresIS },
      provisions: [],
      gestionCourante: [],
      financieres: [],
      exceptionnelles: [],
      cca: [],
      cap: [],
      reprisesProduits: [],
      transferts: [],
      gestionCouranteProduits: [],
      financiersProduits: [],
      exceptionnelsProduits: [],
      pcaProduits: [],
      diversRemboursementsCC: [],
      diversDividendes: [],
      diversDeblocagesParticipation: [],
      diversEncaissements: [],
      diversDecaissements: [],
      diversAugmentationsCapital: [],
      diversReductionsCapital: [],
      diversPrets: [],
      unitesDOeuvre: [],
      tableauxLibres: [],
    };
  }

  const [
    porteur,
    entreprise,
    immobilisations,
    cessions,
    creditsBaux,
    apports,
    emprunts,
    activites,
    activitesCommissions,
    productionsImmobilisees,
    subventionsExploitation,
    fournitures,
    services,
    impots,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    autresChargesPersonnel,
    remboursements,
    participations,
    reintegrations,
    deductions,
    parametresIS,
    provisions,
    gestionCourante,
    financieres,
    exceptionnelles,
    cca,
    cap,
    reprisesProduits,
    transferts,
    gestionCouranteProduits,
    financiersProduits,
    exceptionnelsProduits,
    pcaProduits,
    diversRemboursementsCC,
    diversDividendes,
    diversDeblocagesParticipation,
    diversEncaissements,
    diversDecaissements,
    diversAugmentationsCapital,
    diversReductionsCapital,
    diversPrets,
    unitesDOeuvre,
    tableauxLibres,
  ] = await Promise.all([
    fetchPorteur(dossierId),
    fetchEntrepriseParams(dossierId),
    fetchImmobilisations(dossierId),
    fetchCessions(dossierId),
    fetchCreditsBaux(dossierId),
    fetchApports(dossierId),
    fetchEmprunts(dossierId),
    fetchActivites(dossierId),
    fetchActivitesCommission(dossierId),
    fetchProductionsImmobilisees(dossierId),
    fetchSubventionsExploitation(dossierId),
    fetchFournitures(dossierId),
    fetchServices(dossierId),
    fetchImpots(dossierId),
    fetchLignesSalaries(dossierId),
    fetchLignesDirigeants(dossierId),
    fetchLignesCotisationsTNS(dossierId),
    fetchLignesTaxesSalaires(dossierId),
    fetchLignesChargesPersonnel(dossierId, "AUTRE"),
    fetchLignesChargesPersonnel(dossierId, "REMBOURSEMENT"),
    fetchLignesChargesPersonnel(dossierId, "PARTICIPATION"),
    fetchReintegrations(dossierId),
    fetchDeductions(dossierId),
    fetchParametresIS(dossierId),
    fetchProvisions(dossierId),
    fetchChargesDatees(dossierId, "GESTION_COURANTE"),
    fetchChargesDatees(dossierId, "FINANCIERE"),
    fetchChargesDatees(dossierId, "EXCEPTIONNELLE"),
    fetchChargesBilan(dossierId, "CHARGE_CONSTATEE_AVANCE"),
    fetchChargesBilan(dossierId, "CHARGE_A_PAYER"),
    fetchReprises(dossierId),
    fetchProduitsDate(dossierId, "TRANSFERT"),
    fetchProduitsDate(dossierId, "GESTION_COURANTE"),
    fetchProduitsDate(dossierId, "FINANCIER"),
    fetchProduitsDate(dossierId, "EXCEPTIONNEL"),
    fetchConstates(dossierId),
    fetchFluxDates(dossierId, "REMBOURSEMENT_CC"),
    fetchFluxDates(dossierId, "DIVIDENDE"),
    fetchFluxDates(dossierId, "DEBLOCAGE_PARTICIPATION"),
    fetchFluxDates(dossierId, "ENCAISSEMENT"),
    fetchFluxDates(dossierId, "DECAISSEMENT"),
    fetchOperationsCapital(dossierId, "AUGMENTATION_INCORPORATION"),
    fetchOperationsCapital(dossierId, "REDUCTION"),
    fetchPrets(dossierId),
    fetchUnitesDOeuvre(dossierId),
    fetchTableauxLibres(dossierId),
  ]);

  return {
    porteur,
    entreprise,
    immobilisations,
    cessions,
    creditsBaux,
    apports,
    emprunts,
    activites,
    activitesCommissions,
    productionsImmobilisees,
    subventionsExploitation,
    fournitures,
    services,
    impots,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    autresChargesPersonnel,
    remboursements,
    participations,
    reintegrations,
    deductions,
    parametresIS,
    provisions,
    gestionCourante,
    financieres,
    exceptionnelles,
    cca,
    cap,
    reprisesProduits,
    transferts,
    gestionCouranteProduits,
    financiersProduits,
    exceptionnelsProduits,
    pcaProduits,
    diversRemboursementsCC,
    diversDividendes,
    diversDeblocagesParticipation,
    diversEncaissements,
    diversDecaissements,
    diversAugmentationsCapital,
    diversReductionsCapital,
    diversPrets,
    unitesDOeuvre,
    tableauxLibres,
  };
}

export type SaisieFormData = Awaited<ReturnType<typeof loadSaisieData>>;
