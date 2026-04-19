/**
 * Moteur de calcul des congés payés.
 *
 * Règles métier françaises :
 * - Acquisition : 2,5 jours ouvrables par mois de travail effectif
 *   (proratisé si mois incomplet — seuil : 10 jours de travail = 1 mois)
 * - Provision CP : 10 % de la rémunération brute (méthode du 1/10ème simplifiée)
 *   Inclut les charges sociales patronales sur l'indemnité CP
 * - Indemnité compensatrice de CP (fin de contrat CDD) :
 *   10 % de la rémunération brute totale perçue pendant le contrat
 *   (art. L1243-8 Code du travail)
 *
 * Toutes les fonctions sont pures et déterministes.
 */

import type { CongesPayesState } from "@/lib/paie/contrat/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Jours ouvrables de CP acquis par mois de travail complet */
export const JOURS_CP_PAR_MOIS = 2.5;

/**
 * Seuil minimum de jours ouvrés travaillés pour compter un mois complet d'acquisition.
 * En dessous de ce seuil, l'acquisition est proratisée.
 * Règle usuelle : 10 jours ouvrés ≈ 2 semaines de travail.
 */
const SEUIL_JOURS_MOIS_COMPLET = 10;

/** Taux de provision CP (indemnité = 10 % du brut) */
export const TAUX_PROVISION_CP = 0.10;

/**
 * Taux d'indemnité compensatrice de CP en fin de CDD.
 * Art. L1243-8 C.trav. : 10 % de la rémunération brute totale.
 */
export const TAUX_INDEMNITE_CP_CDD = 0.10;

// ─────────────────────────────────────────────────────────────────────────────
// État initial
// ─────────────────────────────────────────────────────────────────────────────

/** Crée un état initial vide de congés payés */
export function creerCongesPayesVides(): CongesPayesState {
  return {
    joursAcquisCumules: 0,
    joursPrisCumules: 0,
    soldeCP: 0,
    provisionCPCumulee: 0,
    joursAcquisMois: 0,
    provisionCPMois: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul mensuel
// ─────────────────────────────────────────────────────────────────────────────

/** Paramètres pour le calcul CP d'un mois */
export interface CalcCPMoisParams {
  /** État CP du mois précédent (null pour le premier mois) */
  etatPrecedent: CongesPayesState | null;
  /** Brut soumis du mois (résultat de la simulation) */
  brutSoumisMois: number;
  /** Jours ouvrés effectivement travaillés dans le mois */
  joursOuvresTravailles: number;
  /** Jours ouvrés totaux du mois calendaire */
  joursOuvresDuMois: number;
  /** Facteur de prorata du mois (0-1) */
  facteurProrata: number;
}

/**
 * Calcule l'état des congés payés pour un mois donné.
 *
 * @param params - Paramètres du calcul
 * @returns Nouvel état CP en fin de mois
 */
export function calcCongesPayesMois(params: CalcCPMoisParams): CongesPayesState {
  const {
    etatPrecedent,
    brutSoumisMois,
    joursOuvresTravailles,
    joursOuvresDuMois,
    facteurProrata,
  } = params;

  const base = etatPrecedent ?? creerCongesPayesVides();

  // ── Acquisition ─────────────────────────────────────────────────────────
  // Si le salarié a travaillé au moins SEUIL_JOURS_MOIS_COMPLET jours ouvrés,
  // il acquiert 2.5 jours complets. Sinon, prorata linéaire.
  let joursAcquisMois: number;
  if (joursOuvresDuMois === 0) {
    joursAcquisMois = 0;
  } else if (joursOuvresTravailles >= SEUIL_JOURS_MOIS_COMPLET) {
    joursAcquisMois = JOURS_CP_PAR_MOIS;
  } else {
    joursAcquisMois = roundCP(JOURS_CP_PAR_MOIS * facteurProrata);
  }

  // ── Provision ───────────────────────────────────────────────────────────
  // 10 % du brut soumis = estimation de l'indemnité de congés payés à provisionner
  const provisionCPMois = roundEuro(brutSoumisMois * TAUX_PROVISION_CP);

  // ── Cumuls ──────────────────────────────────────────────────────────────
  const joursAcquisCumules = roundCP(base.joursAcquisCumules + joursAcquisMois);
  const joursPrisCumules = base.joursPrisCumules; // Pas de prise en simulation
  const soldeCP = roundCP(joursAcquisCumules - joursPrisCumules);
  const provisionCPCumulee = roundEuro(base.provisionCPCumulee + provisionCPMois);

  return {
    joursAcquisCumules,
    joursPrisCumules,
    soldeCP,
    provisionCPCumulee,
    joursAcquisMois,
    provisionCPMois,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Indemnité compensatrice de fin de contrat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule l'indemnité compensatrice de congés payés en fin de contrat (CDD).
 *
 * Deux méthodes de calcul (art. L3141-24 C.trav.), on retient la plus favorable :
 * 1. **Méthode du 1/10ème** : 10 % de la rémunération brute totale × (jours / total acquis)
 * 2. **Méthode du maintien** : (brut mensuel moyen × jours CP) / 26 jours ouvrables
 *
 * @param brutTotal      - Total brut perçu sur la durée du contrat
 * @param joursCPConcernes - Jours de CP concernés par le calcul
 * @param joursCPAcquisTotal - Total jours CP acquis (pour proportionner la méthode 1/10ème)
 * @param brutMensuelMoyen - Brut mensuel moyen sur la période
 * @returns L'indemnité (le montant le plus favorable)
 */
export function calcIndemniteCP(
  brutTotal: number,
  joursCPConcernes: number,
  joursCPAcquisTotal: number,
  brutMensuelMoyen: number,
): number {
  if (joursCPConcernes <= 0 || joursCPAcquisTotal <= 0) return 0;

  // Méthode du 1/10ème (proportionnée aux jours concernés)
  const methode10eme = roundEuro(
    brutTotal * TAUX_INDEMNITE_CP_CDD * (joursCPConcernes / joursCPAcquisTotal),
  );

  // Méthode du maintien de salaire
  const JOURS_OUVRABLES_PAR_MOIS = 26;
  const methodeMaintien = roundEuro(
    brutMensuelMoyen * (joursCPConcernes / JOURS_OUVRABLES_PAR_MOIS),
  );

  return Math.max(methode10eme, methodeMaintien);
}

/**
 * @deprecated Utiliser `calcIndemniteCP` à la place (interface plus flexible).
 * Conservée pour compatibilité — délègue vers `calcIndemniteCP`.
 */
export function calcIndemniteCompensatriceCP(
  brutTotal: number,
  joursCPAcquis: number,
  brutMensuelMoyen: number,
): number {
  return calcIndemniteCP(brutTotal, joursCPAcquis, joursCPAcquis, brutMensuelMoyen);
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrondis
// ─────────────────────────────────────────────────────────────────────────────

/** Arrondi à 2 décimales pour les montants en euros */
function roundEuro(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Arrondi à 1 décimale pour les jours de CP (demi-journées) */
function roundCP(v: number): number {
  return Math.round(v * 10) / 10;
}
