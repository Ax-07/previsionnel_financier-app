/**
 * Fixtures de référence pour les tests unitaires du moteur de calcul financier.
 *
 * - SCENARIO_CREATION : scénario minimal de création (boulangerie, 1 activité, 3 exercices)
 * - SCENARIO_CREATION_SALARIE : idem + 1 salarié (pour les tests dettesPersonnel)
 * - SCENARIO_SERVICE_PUR : activité PRESTATION_SERVICES (achats = 0, stock = 0)
 * - SCENARIO_EXERCICE_DECALE : démarrage en avril (prorata pFin/pDeb)
 *
 * Toutes les fixtures utilisent `as unknown as ScenarioFinData` car ScenarioFinData
 * est un type dérivé de Prisma (Decimal, relations incluses). Les données de test
 * utilisent des nombres JS simples ; `n()` gère la conversion.
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Dates de démarrage ────────────────────────────────────────────────────────

export const DATE_DEMARRAGE = new Date("2026-01-01");
export const DATE_DEMARRAGE_DECALE = new Date("2026-04-01");

// ── Activités de référence ────────────────────────────────────────────────────

/** Boulangerie-pâtisserie : 180 000 €/an, 60% marge, 30j stock, TVA 5.5% */
export const ACTIVITE_CREATION = {
  id: "act-1",
  libelle: "Vente pain et viennoiserie",
  typeActivite: "VENTES_MARCHANDISES",
  actif: true,
  montantN: 180000,
  montantN1: 198000,  // +10%
  montantN2: 207900,  // +5%
  tauxMarge: 60,
  stocks: 30,
  tauxTVA: 5.5,
  tvaAchats: 5.5,
  reglementClients: 0,
  reglementFournisseurs: 30,
  saisonnaliteCA: null,
  saisonnaliteAchats: null,
  achatsStockPonctuel: null,
};

/** Activité PRESTATION_SERVICES : achatsConsommés = 0, stock = 0 */
export const ACTIVITE_SERVICE = {
  ...ACTIVITE_CREATION,
  id: "act-svc",
  typeActivite: "PRESTATION_SERVICES",
  tauxMarge: 100,
  stocks: 0,
};

// ── Nœud parametresIS standard ────────────────────────────────────────────────

const PARAMETRES_IS = {
  id: "params-is",
  scenarioId: "test-scenario",
  isEnabled: true,
  plafondReduitN: 42500,
  tauxReduitN: 15,
  tauxNormalN: 25,
  creditImpotN: 0,
  contributionVolN: 0,
  plafondReduitN1: 42500,
  tauxReduitN1: 15,
  tauxNormalN1: 25,
  creditImpotN1: 0,
  contributionVolN1: 0,
  plafondReduitN2: 42500,
  tauxReduitN2: 15,
  tauxNormalN2: 25,
  creditImpotN2: 0,
  contributionVolN2: 0,
};

// ── Nœud scenario.parametres standard ────────────────────────────────────────

const SCENARIO_PARAMETRES = {
  regimeFiscal: "IS",
  tauxIs: null,
  tauxIsReduit: null,
  plafondIsReduit: null,
  regimeTVA: "REEL_NORMAL",
  periodiciteDeclarationTVA: "mensuel",
  tauxTvaStandard: 20,
  moisPaiementSalaires: 1,
  tnsRegimeSocial: null,
  tnsModeCalcul: null,
};

// ── Helpers de construction ───────────────────────────────────────────────────

function buildScenario(overrides: Record<string, unknown> = {}) {
  return {
    dossierId: "test-dossier",
    scenarioId: "test-scenario",
    dateDemarrage: DATE_DEMARRAGE,
    dureeProjection: 3,
    scenario: { id: "test-scenario", parametres: SCENARIO_PARAMETRES },
    isIS: true,
    activites: [ACTIVITE_CREATION],
    activiteCommissions: [],
    subventionsExploitation: [],
    productionsImmobilisees: [],
    fournitures: [],
    services: [],
    impotsTaxes: [],
    salaries: [],
    dirigeants: [],
    cotisationsTNS: [],
    taxesSalaires: [],
    immobilisations: [],
    provisions: [],
    chargesFinancieres: [],
    chargesExceptionnelles: [],
    chargesGestionCourante: [],
    reprisesProduits: [],
    financiersProduits: [],
    exceptionnelsProduits: [],
    transfertsProduits: [],
    gestionCouranteProduits: [],
    emprunts: [],
    apports: [],
    subventions: [],
    diversEncaissements: [],
    diversDecaissements: [],
    diversRemboursementsCC: [],
    parametresIS: PARAMETRES_IS,
    ajustementsFiscaux: [],
    ...overrides,
  } as unknown as ScenarioFinData;
}

// ── Scénarios exportés ────────────────────────────────────────────────────────

/**
 * Scénario de référence : boulangerie en création, démarrage 1er janvier 2026.
 * Activité unique + arrays vides → résultat déterministe et facile à vérifier.
 */
export const SCENARIO_CREATION: ScenarioFinData = buildScenario();

/**
 * Même scénario + 1 salarié (2 000 €/mois brut, 42% cotisations patronales).
 * Utilisé pour les tests de dettesPersonnel / moisPaiementSalaires.
 */
export const SCENARIO_CREATION_SALARIE: ScenarioFinData = buildScenario({
  salaries: [
    {
      id: "sal-1",
      libelle: "Vendeur",
      actif: true,
      montantN: 24000,   // 2 000 €/mois
      montantN1: 24000,
      montantN2: 24000,
      tauxCotPat: 42,
      detailMensuelN: null,
      detailMensuelN1: null,
      detailMensuelN2: null,
    },
  ],
});

/**
 * Scénario M0 : salarié + moisPaiementSalaires = 0 (paiement en mois courant).
 * Teste la correction du bug 12 mars 2026 : dettesPersonnel doit être 0.
 */
export const SCENARIO_M0_SALAIRE: ScenarioFinData = buildScenario({
  scenario: {
    id: "test-scenario",
    parametres: { ...SCENARIO_PARAMETRES, moisPaiementSalaires: 0 },
  },
  salaries: [
    {
      id: "sal-1",
      libelle: "Vendeur",
      actif: true,
      montantN: 24000,
      montantN1: 24000,
      montantN2: 24000,
      tauxCotPat: 42,
      detailMensuelN: null,
      detailMensuelN1: null,
      detailMensuelN2: null,
    },
  ],
});

/** Prestation de services pure : achats = 0, stock = 0. */
export const SCENARIO_SERVICE_PUR: ScenarioFinData = buildScenario({
  activites: [ACTIVITE_SERVICE],
});

/** Démarrage en avril : exercice décalé — pFin = 3/12, pDeb = 9/12. */
export const SCENARIO_EXERCICE_DECALE: ScenarioFinData = buildScenario({
  dateDemarrage: DATE_DEMARRAGE_DECALE,
});
