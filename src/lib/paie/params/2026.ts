/**
 * Paramètres réglementaires 2026.
 *
 * Source : Urssaf, BOSS, Agirc-Arrco, Service Public — application 1er janvier 2026.
 * Ce fichier est la source unique des constantes légales pour le millésime 2026.
 */

import type { ParamsReglementaires } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres généraux
// ─────────────────────────────────────────────────────────────────────────────

export const PARAMS_2026: ParamsReglementaires = {
  millesime: "2026",
  smicHoraire: 12.02,
  smicMensuel: 1823.03,
  smicAnnuel: 21876.4,
  passAnnuel: 48060,
  passMensuel: 4005,
  heuresLegalesMensuelles: 151.67,
  gratifStageHoraire: 4.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Taux de cotisations Urssaf — régime général secteur privé 2026
// ─────────────────────────────────────────────────────────────────────────────

export const TAUX_URSSAF_2026 = {
  /** Assurance maladie, maternité, invalidité, décès — employeur sur totalité */
  assuranceMaladie: { employeur: 0.13, salarie: 0 },

  /** Contribution développement apprentissage (CDA) — incluse dans maladie depuis 2026 pour simplification — NON : cotisation solidarité autonomie */
  csa: { employeur: 0.003, salarie: 0 },

  /** Assurance vieillesse plafonnée (limite PASS) */
  vieillessePlafonnee: { employeur: 0.0855, salarie: 0.069 },

  /** Assurance vieillesse déplafonnée (sur totalité) */
  vieillesseDeplafonee: { employeur: 0.0211, salarie: 0.004 },

  /** Allocations familiales — employeur sur totalité (droit commun 2026) */
  allocationsFamiliales: { employeur: 0.0525, salarie: 0 },

  /** Assurance chômage — employeur, plafonné 4 PASS */
  assuranceChomage: { employeur: 0.04, salarie: 0 },

  /** AGS (Association pour la gestion du régime de garantie des créances des salariés) — plafonné 4 PASS */
  ags: { employeur: 0.0025, salarie: 0 },

  /** FNAL — employeur */
  fnalInferieur50: { employeur: 0.001, salarie: 0 },       // < 50 sal : plafonné PASS
  fnalSuperieurOuEgal50: { employeur: 0.005, salarie: 0 }, // ≥ 50 sal : sur totalité

  /** Contribution dialogue social — employeur sur totalité */
  dialogueSocial: { employeur: 0.00016, salarie: 0 },

  /** CSG déductible — salarié sur assiette CSG */
  csgDeductible: { employeur: 0, salarie: 0.068 },

  /** CSG non déductible — salarié sur assiette CSG */
  csgNonDeductible: { employeur: 0, salarie: 0.024 },

  /** CRDS — salarié sur assiette CSG */
  crds: { employeur: 0, salarie: 0.005 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Taux Agirc-Arrco 2026
// ─────────────────────────────────────────────────────────────────────────────

export const TAUX_ARRCO_2026 = {
  /** Tranche 1 : jusqu'à 1 PASS */
  t1: { salarie: 0.0315, employeur: 0.0472 },
  /** Tranche 2 : de 1 PASS à 8 PASS */
  t2: { salarie: 0.0864, employeur: 0.1295 },

  /** Contribution d'équilibre généralisée T1 */
  cegT1: { salarie: 0.0086, employeur: 0.0129 },
  /** Contribution d'équilibre généralisée T2 */
  cegT2: { salarie: 0.0108, employeur: 0.0162 },

  /** Contribution d'équilibre technique — si rémunération > PASS */
  cet: { salarie: 0.0014, employeur: 0.0021 },

  /** APEC — cadres uniquement, limité à 4 PASS */
  apec: { salarie: 0.00024, employeur: 0.00036 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres RGDU 2026
// ─────────────────────────────────────────────────────────────────────────────

export const RGDU_2026 = {
  /** Taux minimum (plancher de la réduction) */
  tMin: 0.02,
  /** T_delta pour entreprise < 50 salariés */
  tDeltaInf50: 0.3781,
  /** Coefficient max pour entreprise < 50 salariés */
  coeffMaxInf50: 0.3981,
  /** T_delta pour entreprise ≥ 50 salariés */
  tDeltaSup50: 0.3821,
  /** Coefficient max pour entreprise ≥ 50 salariés */
  coeffMaxSup50: 0.4021,
  /** Exposant P de dégressivité */
  p: 1.75,
  /** Point de sortie : 3 × SMIC */
  facteurSortie: 3,
  /** Plafond d'imputation sur AT/MP */
  plafondImputationATMP: 0.0049,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Assiette CSG/CRDS
// ─────────────────────────────────────────────────────────────────────────────

/** Taux d'abattement appliqué à la rémunération pour assiette CSG */
export const ABATTEMENT_CSG = 0.9825; // 98,25 %

// ─────────────────────────────────────────────────────────────────────────────
// Grilles d'exonération apprentissage 2026
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seuil d'exonération selon génération du contrat (en fraction du SMIC mensuel).
 * - avant_mars_2025 : exonération SS + CSG/CRDS jusqu'à 79 % du SMIC
 * - depuis_mars_2025 : exonération SS salariale + CSG/CRDS jusqu'à 50 % du SMIC
 */
export const EXONERATION_APPRENTISSAGE_2026 = {
  avant_mars_2025: { seuilExoFraction: 0.79 },
  depuis_mars_2025: { seuilExoFraction: 0.50 },
} as const;

/**
 * Rémunération minimale légale apprentissage 2026 (fraction du SMIC mensuel).
 * Clé : `${annee}_${trancheAge}` où trancheAge : "16-17" | "18-20" | "21-25" | "26+"
 */
export const REMUN_MIN_APPRENTISSAGE_2026: Record<string, number> = {
  "1_16-17": 0.27,
  "1_18-20": 0.43,
  "1_21-25": 0.53,
  "1_26+": 1.00,
  "2_16-17": 0.39,
  "2_18-20": 0.51,
  "2_21-25": 0.61,
  "2_26+": 1.00,
  "3_16-17": 0.55,
  "3_18-20": 0.67,
  "3_21-25": 0.78,
  "3_26+": 1.00,
};

/**
 * Rémunération minimale légale contrat de professionnalisation 2026 (fraction SMIC).
 * Clé : `${trancheAge}_${qualif}` où qualif : "standard" | "qualif"
 */
export const REMUN_MIN_CONTRAT_PRO_2026: Record<string, number> = {
  "moins_21_standard": 0.55,
  "moins_21_qualif":   0.65,
  "21_25_standard":    0.70,
  "21_25_qualif":      0.80,
  "26+_standard":      1.00,
};

// ─────────────────────────────────────────────────────────────────────────────
// Seuil de gratification stage 2026
// ─────────────────────────────────────────────────────────────────────────────

/** Gratification stage mensuelle exonérée = gratifStageHoraire × heuresLégales */
export function seuilExoStage(heuresMensuelles: number): number {
  return PARAMS_2026.gratifStageHoraire * heuresMensuelles;
}
