/**
 * Moteur d'exonérations heures supplémentaires / complémentaires.
 *
 * Sources légales :
 * - Art. 81 quater CGI   — Exonération IR HS        (plafond 7 500 €/an)
 * - Art. L241-17 CSS     — Réduction cotisations salariales HS (≤ 11,31 %)
 *
 * Les deux mécanismes sont indépendants et cumulatifs :
 * - La réduction cot. sal. augmente le net social du salarié
 * - L'exonération IR réduit la base PAS (net imposable)
 *
 * @see https://www.service-public.fr/particuliers/vosdroits/F2403
 */

import type { LigneCotisation } from "@/lib/paie/types";
import { TAUX_URSSAF_2026, TAUX_ARRCO_2026 } from "@/lib/paie/params/2026";
import { roundMontant } from "@/lib/paie/engine/arrondi";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes légales
// ─────────────────────────────────────────────────────────────────────────────

/** Plafond annuel d'exonération IR des HS (art. 81 quater CGI) */
export const PLAFOND_EXO_HS_IR_ANNUEL = 7_500;

/**
 * Taux maximal réglementaire de réduction des cotisations salariales HS.
 *
 * = vieillesse plafonnée (6,90 %) + vieillesse déplafonnée (0,40 %)
 *   + ARRCO T1 (3,15 %) + CEG T1 (0,86 %) = 11,31 %
 *
 * (art. L241-17 CSS, arrêté annuel)
 */
export const TAUX_MAX_REDUCTION_HS_COT_SAL = 0.1131;

// ─────────────────────────────────────────────────────────────────────────────
// Exonération fiscale IR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule l'exonération fiscale IR des heures supplémentaires (art. 81 quater CGI).
 *
 * Les HS restent intégralement dans le brut soumis à cotisations,
 * mais sont déduites du net imposable (base PAS) dans la limite du plafond annuel.
 *
 * @param remHS       - Rémunération HS du mois (brut majoré, après surcharge conventionnelle)
 * @param cumulAvant  - Cumul annuel REM_HS avant ce mois (0 = début d'année, plafond plein)
 * @returns Montant exonéré d'IR ce mois (≥ 0)
 */
export function calcExonerationHSIR(remHS: number, cumulAvant = 0): number {
  if (remHS <= 0) return 0;
  const resteDisponible = Math.max(0, PLAFOND_EXO_HS_IR_ANNUEL - cumulAvant);
  return roundMontant(Math.min(remHS, resteDisponible));
}

// ─────────────────────────────────────────────────────────────────────────────
// Réduction cotisations salariales
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule la réduction de cotisations salariales sur les heures supplémentaires
 * (art. L241-17 CSS).
 *
 * Cotisations salariales éligibles — méthode différentielle sur la part HS :
 * - Vieillesse plafonnée   : 6,90 % (assiette ≤ PMSS)
 * - Vieillesse déplafonnée : 0,40 % (assiette = totalité)
 * - AGIRC-ARRCO T1         : 3,15 % (assiette ≤ PMSS)
 * - CEG T1                 : 0,86 % (assiette ≤ PMSS)
 *   → Total max             = 11,31 %
 *
 * Non éligibles : CSG / CRDS / chômage / prévoyance / cotisations patronales.
 *
 * @param remHS         - Rémunération HS (brut majoré)
 * @param brutSoumis    - Brut soumis total (incluant HS)
 * @param pmssProratise - PMSS proratisé du mois (issu des assiettes)
 * @returns Montant de réduction (positif, à créditer au salarié)
 */
export function calcReductionHSCotSal(
  remHS: number,
  brutSoumis: number,
  pmssProratise: number,
): number {
  if (remHS <= 0) return 0;

  const brutSansHS = brutSoumis - remHS;

  // Part de la HS tombant dans l'assiette plafonnée (vieillesse plaf + ARRCO T1 + CEG T1)
  const assPlafTotal  = Math.min(brutSoumis,              pmssProratise);
  const assPlafSansHS = Math.min(Math.max(0, brutSansHS), pmssProratise);
  const deltaPlaf     = Math.max(0, assPlafTotal - assPlafSansHS);

  // Cotisations salariales théoriques sur la part HS
  const cotVieillessePlaf   = deltaPlaf * TAUX_URSSAF_2026.vieillessePlafonnee.salarie;  // 6,90 %
  const cotVieillesseDeplaf = remHS     * TAUX_URSSAF_2026.vieillesseDeplafonee.salarie; // 0,40 %
  const cotArrcoT1          = deltaPlaf * TAUX_ARRCO_2026.t1.salarie;                    // 3,15 %
  const cotCegT1            = deltaPlaf * TAUX_ARRCO_2026.cegT1.salarie;                 // 0,86 %

  const cotSalHsTheorique = cotVieillessePlaf + cotVieillesseDeplaf + cotArrcoT1 + cotCegT1;

  return roundMontant(Math.min(cotSalHsTheorique, remHS * TAUX_MAX_REDUCTION_HS_COT_SAL));
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction de la ligne de cotisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit la ligne de bulletin pour la réduction salariale HS.
 *
 * La ligne est injectée dans le pipeline avec un montantSalarie négatif
 * (crédit salarié : augmente le net social).
 *
 * @param reduction - Montant de la réduction (positif, calculé par calcReductionHSCotSal)
 * @param remHS     - Assiette affichée (rémunération HS)
 */
export function buildLigneReductionHSCotSal(
  reduction: number,
  remHS: number,
): LigneCotisation {
  return {
    code:             "EXONERATION_HS_COT_SAL",
    libelle:          "Réduction cotisations salariales HS",
    famille:          "exoneration",
    organisme:        "URSSAF / Agirc-Arrco",
    assiette:         remHS,
    tranche:          "totalite",
    tauxSalarie:      remHS > 0 ? -(reduction / remHS) : 0,
    tauxEmployeur:    0,
    montantSalarie:   -reduction, // négatif = crédit salarié
    montantEmployeur: 0,
    deductible:       false,      // réduction sociale, non déductible fiscalement
    regleCode:        "L241-17_CSS",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Déduction forfaitaire patronale HS (art. L241-18 CSS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Montant forfaitaire par heure supplémentaire, selon l'effectif de l'entreprise.
 *
 * - < 20 salariés  : 1,50 € / heure sup (art. L241-18 CSS, al. 1)
 * - 20–249 salariés : 0,50 € / heure sup (loi 2022-1158 pouvoir d'achat, al. 2)
 * - ≥ 250 salariés : 0 € (non éligible)
 */
export function montantForfaitaireParHeureHS(effectif: number): number {
  if (effectif < 20)  return 1.50;
  if (effectif < 250) return 0.50;
  return 0;
}

/**
 * Calcule la déduction forfaitaire patronale sur les heures supplémentaires.
 *
 * @param heuresSupplementaires - Nombre d'heures supplémentaires réalisées ce mois
 * @param effectif              - Effectif de l'entreprise
 * @returns Montant de la déduction patronale (positif, à déduire des charges patronales)
 */
export function calcDeductionForfaitaireHS(
  heuresSupplementaires: number,
  effectif: number,
): number {
  if (heuresSupplementaires <= 0) return 0;
  const forfait = montantForfaitaireParHeureHS(effectif);
  if (forfait <= 0) return 0;
  return roundMontant(heuresSupplementaires * forfait);
}

/**
 * Construit la ligne de bulletin pour la déduction forfaitaire patronale HS.
 *
 * Montant négatif côté employeur = crédit patronal (réduction charges).
 */
export function buildLigneDeductionForfaitaireHS(
  deduction: number,
  heuresSupplementaires: number,
): LigneCotisation {
  return {
    code:             "DEDUCTION_FORFAITAIRE_HS",
    libelle:          "Déduction forfaitaire patronale HS",
    famille:          "exoneration",
    organisme:        "Urssaf",
    assiette:         heuresSupplementaires,
    tranche:          "totalite",
    tauxSalarie:      0,
    tauxEmployeur:    0,
    montantSalarie:   0,
    montantEmployeur: -deduction, // négatif = crédit employeur
    deductible:       false,
    regleCode:        "L241-18_CSS",
  };
}
