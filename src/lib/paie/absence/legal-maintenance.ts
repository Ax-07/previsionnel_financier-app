/**
 * Moteur de maintien légal employeur (art. L1226-1 Code du Travail).
 *
 * Calcule, pour un événement d'absence donné, la politique de maintien
 * applicable (délais de carence, durées, taux) + le brut maintenu.
 *
 * Formule :
 *   1. Vérifier que l'ancienneté ≥ 12 mois
 *   2. Trouver la tranche d'ancienneté dans la grille L1226-1
 *   3. Calculer les jours maintenus (après carence employeur)
 *   4. Brut maintenu = (brut théorique / 30.42) × jours maintenus × taux
 */

import type { AbsenceEvent, PolitiqueMaintien } from "@/lib/paie/absence/types";
import {
  PARAMS_IJSS_2026,
  GRILLE_MAINTIEN_LEGAL_2026,
  TAUX_MAINTIEN_PLEIN_LEGAL,
  TAUX_MAINTIEN_PARTIEL_LEGAL,
  type TrancheAncienneteMaintien,
} from "@/lib/paie/params/ijss-2026";

// ─────────────────────────────────────────────────────────────────────────────
// Politique légale par type d'absence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la politique de maintien légal pour un type d'absence
 * et une ancienneté donnés.
 *
 * Retourne null si l'ancienneté est insuffisante (< 12 mois).
 */
export function getPolitiqueMaintenLegal(
  absence: AbsenceEvent,
): PolitiqueMaintien | null {
  const ancienneteEnAns = absence.ancienneteEnMois / 12;

  // Ancienneté insuffisante → pas de droit au maintien
  if (ancienneteEnAns < 1) return null;

  // Types non couverts par L1226-1 (maternité, paternité → règles spécifiques)
  if (absence.type === "maternite" || absence.type === "paternite_accueil" || absence.type === "adoption") {
    return getPolitiqueMaintenMaternite();
  }

  const carenceSS =
    absence.type === "at_mp" ? PARAMS_IJSS_2026.carenceSSAtMp
    : absence.type === "maladie_longue_duree" ? PARAMS_IJSS_2026.carenceSSMaladieLongueDuree
    : PARAMS_IJSS_2026.carenceSSMaladie;

  const carenceEmployeur =
    absence.type === "at_mp"
      ? PARAMS_IJSS_2026.carenceEmployeurAtMp
      : PARAMS_IJSS_2026.carenceEmployeurMaladie;

  const tranche = getTrancheAnciennete(ancienneteEnAns);

  return {
    joursCarenceSS: carenceSS,
    joursCarenceEmployeur: carenceEmployeur,
    dureeTauxPleinJours: tranche.joursTauxPlein,
    dureeTauxPartielJours: tranche.joursTauxPartiel,
    tauxMaintienPlein: TAUX_MAINTIEN_PLEIN_LEGAL,
    tauxMaintienPartiel: TAUX_MAINTIEN_PARTIEL_LEGAL,
    sousDedictionIjss: true, // Le maintien légal s'entend sous déduction des IJ SS
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul du brut maintenu
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résultat intermédiaire du calcul de maintien légal.
 */
export interface ResultatMaintenLegal {
  /** Droit au maintien effectif */
  droitAuMaintien: boolean;
  /** Jours maintenus à taux plein (après carence employeur) */
  joursMaintenusPlein: number;
  /** Jours maintenus à taux partiel */
  joursMaintenusPartiel: number;
  /** Jours non maintenus (carence employeur + au-delà de la durée max) */
  joursNonMaintenus: number;
  /** Brut maintenu à taux plein (€) */
  maintienBrutTauxPlein: number;
  /** Brut maintenu à taux partiel (€) */
  maintienBrutTauxPartiel: number;
  /** Total brut maintenu (€) */
  maintienBrutTotal: number;
}

/**
 * Calcule le maintien légal pour une absence et un brut mensuel donnés.
 *
 * @param absence    Événement d'absence
 * @param brutMensuelTheorique  Brut mensuel hors absence
 * @returns Résultat détaillé du maintien légal
 */
export function calculerMaintenLegal(
  absence: AbsenceEvent,
  brutMensuelTheorique: number,
): ResultatMaintenLegal {
  const politique = getPolitiqueMaintenLegal(absence);

  if (politique === null) {
    return {
      droitAuMaintien: false,
      joursMaintenusPlein: 0,
      joursMaintenusPartiel: 0,
      joursNonMaintenus: absence.joursCivils,
      maintienBrutTauxPlein: 0,
      maintienBrutTauxPartiel: 0,
      maintienBrutTotal: 0,
    };
  }

  // Jours réellement maintenus (après carence employeur)
  const joursApresCarence = Math.max(
    0,
    absence.joursCivils - politique.joursCarenceEmployeur,
  );

  const joursMaintenusPlein = Math.min(joursApresCarence, politique.dureeTauxPleinJours);
  const joursApresPlein = Math.max(0, joursApresCarence - joursMaintenusPlein);
  const joursMaintenusPartiel = Math.min(joursApresPlein, politique.dureeTauxPartielJours);
  const joursNonMaintenus = absence.joursCivils - joursMaintenusPlein - joursMaintenusPartiel;

  // Brut journalier théorique
  const brutJournalier = brutMensuelTheorique / PARAMS_IJSS_2026.diviseurSjrMensuel;

  const maintienBrutTauxPlein =
    brutJournalier * joursMaintenusPlein * politique.tauxMaintienPlein;
  const maintienBrutTauxPartiel =
    brutJournalier * joursMaintenusPartiel * politique.tauxMaintienPartiel;

  return {
    droitAuMaintien: true,
    joursMaintenusPlein,
    joursMaintenusPartiel,
    joursNonMaintenus,
    maintienBrutTauxPlein,
    maintienBrutTauxPartiel,
    maintienBrutTotal: maintienBrutTauxPlein + maintienBrutTauxPartiel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTrancheAnciennete(ancienneteEnAns: number): TrancheAncienneteMaintien {
  const tranche = GRILLE_MAINTIEN_LEGAL_2026.find(
    (t) =>
      ancienneteEnAns >= t.minAnsInclus &&
      (t.maxAnsExclus === undefined || ancienneteEnAns < t.maxAnsExclus),
  );
  // Fallback sur la première tranche (ancienneté ≥ 1 an validé avant appel)
  return tranche ?? GRILLE_MAINTIEN_LEGAL_2026[0]!;
}

/**
 * Politique spécifique maternité / paternité / adoption.
 * Pas de carence (légalement ou règlementairement encadré par la SS directement).
 */
function getPolitiqueMaintenMaternite(): PolitiqueMaintien {
  return {
    joursCarenceSS: 0,
    joursCarenceEmployeur: 0,
    // Durée : toute la période légale (simplification — l'employeur gère selon CCN)
    dureeTauxPleinJours: 112,
    dureeTauxPartielJours: 0,
    tauxMaintienPlein: 1.00,
    tauxMaintienPartiel: 0,
    sousDedictionIjss: true,
  };
}
