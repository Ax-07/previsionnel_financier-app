/**
 * Paramètres réglementaires IJSS et maintien employeur — millésime 2026.
 *
 * Sources :
 *  - Article L323-1 CSS : délai de carence SS (3 jours maladie)
 *  - Article L433-2 CSS : taux IJ AT/MP (60 % puis 80 %)
 *  - Article L331-3 CSS : taux IJ maternité (100 %)
 *  - Article L1226-1 Code du Travail : maintien légal employeur
 *  - Circulaire BOSS 2026
 */

// ─────────────────────────────────────────────────────────────────────────────
// Taux et délais IJSS
// ─────────────────────────────────────────────────────────────────────────────

export const PARAMS_IJSS_2026 = {
  // ── Taux d'indemnisation SS ─────────────────────────────────────────────────

  /** Taux IJ maladie ordinaire : 50 % du Salaire Journalier de Référence */
  tauxIjMaladie: 0.50,

  /** Taux IJ AT/MP pendant les 28 premiers jours civils */
  tauxIjAtMpPhase1: 0.60,

  /** Taux IJ AT/MP à partir du 29ème jour civil */
  tauxIjAtMpPhase2: 0.80,

  /** Taux IJ maternité / paternité / adoption : 100 % du SJR */
  tauxIjMaternite: 1.00,

  /** Durée de la phase 1 AT/MP (28 jours civils) */
  joursPhase1AtMp: 28,

  // ── Salaire journalier de référence ────────────────────────────────────────

  /**
   * Diviseur pour estimer le SJR depuis le salaire brut mensuel.
   * En réalité : moyenne des 3 derniers mois / 91,25.
   * Approximation simplifiée : brutMensuel / 30.42 (mois moyen civil).
   */
  diviseurSjrMensuel: 30.42,

  /**
   * Diviseur exact pour le calcul CPAM (3 mois de salaire / 91,25 jours).
   */
  diviseurSjrTrimestre: 91.25,

  // ── Plafonds ────────────────────────────────────────────────────────────────

  /**
   * Plafond IJ maladie/AT/MP : 1/730 du PASS annuel.
   * 2026 : 48 060 / 730 ≈ 65,83 € brut/jour.
   */
  plafondIjJournalierDiviseur: 730,

  /**
   * Plafond IJ maternité : 3 × (1/360) du PASS annuel.
   * 2026 : 48 060 / 360 × 3 ≈ 400,50 € brut/jour.
   */
  plafondIjMaterniteDiviseur: 360,

  // ── Prélèvements sociaux sur IJSS ──────────────────────────────────────────

  /** CSG sur IJ (taux normal, revenus > seuil d'exonération) */
  csgIj: 0.062,

  /** CRDS sur IJ */
  crdsIj: 0.005,

  /** Part déductible de la CSG sur IJ (incluse dans csgIj ci-dessus) */
  csgIjDeductible: 0.038,

  /** Taux global de prélèvements sociaux sur IJ (CSG + CRDS) */
  get prelevementsTotalIj(): number {
    return this.csgIj + this.crdsIj; // 6,7 %
  },

  // ── Délais de carence SS ────────────────────────────────────────────────────

  /** Délai de carence SS pour maladie ordinaire (art. L323-1 CSS) */
  carenceSSMaladie: 3,

  /** Délai de carence SS pour maladie longue durée (ALD) */
  carenceSSMaladieLongueDuree: 0,

  /** Délai de carence SS pour AT/MP (art. L433-2 CSS) — aucun */
  carenceSSAtMp: 0,

  /** Délai de carence SS pour maternité — aucun */
  carenceSSMaternite: 0,

  /** Délai de carence SS pour paternité / accueil — aucun */
  carenceSSPaternite: 0,

  // ── Délais de carence employeur (maintien légal L1226-1) ───────────────────

  /**
   * Délai de carence employeur pour maladie (art. L1226-1 C. Trav.).
   * L'employeur ne maintient pas les 7 premiers jours d'absence (sauf CCN).
   */
  carenceEmployeurMaladie: 7,

  /** Délai de carence employeur AT/MP : aucun (art. L1226-7 C. Trav.) */
  carenceEmployeurAtMp: 0,

  // ── Durées max d'indemnisation SS ──────────────────────────────────────────

  /** Durée max IJ maladie ordinaire (360 j sur 3 ans glissants) */
  dureeMaxIjMaladieJours: 360,

  /** Durée max IJ maternité (droit commun — naissance simple) */
  dureeMaxIjMaterniteJours: 112, // 16 semaines

  /** Durée max IJ paternité (naissance simple, hors jumeaux/triplés) */
  dureeMaxIjPaterniteJours: 25,

  /** Durée max IJ adoption (droit commun) */
  dureeMaxIjAdoptionJours: 70, // 10 semaines
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tranches d'ancienneté — maintien légal L1226-1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille d'ancienneté pour le maintien légal (art. L1226-1 C. Trav.).
 *
 * Pour chaque tranche, la durée de maintien à chaque taux est indiquée
 * en jours calendaires (après déduction du délai de carence employeur de 7 j).
 *
 * Taux plein = 90 % du salaire brut (net + brut théorique)
 * Taux partiel = 66,67 % du salaire brut
 */
export interface TrancheAncienneteMaintien {
  /** Ancienneté minimale en années (incluse) */
  minAnsInclus: number;
  /** Ancienneté maximale en années (exclue) — undefined = pas de borne haute */
  maxAnsExclus?: number;
  /** Jours de maintien à taux plein */
  joursTauxPlein: number;
  /** Jours de maintien à taux partiel */
  joursTauxPartiel: number;
}

/**
 * Grille légale L1226-1 (tranche d'ancienneté → durées de maintien).
 * Toutes les durées sont en jours calendaires après le délai de carence employeur.
 */
export const GRILLE_MAINTIEN_LEGAL_2026: TrancheAncienneteMaintien[] = [
  { minAnsInclus: 1,  maxAnsExclus: 6,  joursTauxPlein: 30, joursTauxPartiel: 30 },
  { minAnsInclus: 6,  maxAnsExclus: 11, joursTauxPlein: 40, joursTauxPartiel: 40 },
  { minAnsInclus: 11, maxAnsExclus: 16, joursTauxPlein: 50, joursTauxPartiel: 50 },
  { minAnsInclus: 16, maxAnsExclus: 21, joursTauxPlein: 60, joursTauxPartiel: 60 },
  { minAnsInclus: 21, maxAnsExclus: 26, joursTauxPlein: 70, joursTauxPartiel: 70 },
  { minAnsInclus: 26, maxAnsExclus: 31, joursTauxPlein: 80, joursTauxPartiel: 80 },
  { minAnsInclus: 31,                   joursTauxPlein: 90, joursTauxPartiel: 90 },
];

/** Taux de maintien à taux plein légal (90 %) */
export const TAUX_MAINTIEN_PLEIN_LEGAL = 0.90;

/** Taux de maintien à taux partiel légal (66,67 %) */
export const TAUX_MAINTIEN_PARTIEL_LEGAL = 2 / 3;
