/**
 * Moteur de calcul des IJSS subrogées (Lot 5).
 *
 * Calcule l'estimation des Indemnités Journalières SS pour un arrêt donné :
 *   - Maladie ordinaire : 50 % du SJR (plafond 1/730 du PASS)
 *   - AT/MP : 60 % (28 premiers jours) puis 80 %
 *   - Maternité / paternité : 100 % du SJR (plafond 3 × 1/360 du PASS)
 *
 * En mode subrogé, l'IJ est versée à l'employeur.
 * En mode non subrogé, l'IJ est versée directement au salarié.
 *
 * Référence : art. L323-1, L331-3, L433-2 CSS + circulaire BOSS 2026
 */

import type { AbsenceEvent } from "@/lib/paie/absence/types";
import { PARAMS_IJSS_2026 } from "@/lib/paie/params/ijss-2026";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résultat du calcul IJSS pour une période d'absence.
 */
export interface ResultatIjss {
  /** SJR utilisé pour le calcul (en brut) */
  sjrBrut: number;

  /** SJR plafonné (après application du plafond légal) */
  sjrPlafonne: number;

  /** Taux d'indemnisation appliqué (pondéré si AT/MP change en cours d'absence) */
  tauxEffectif: number;

  /** Nombre de jours indemnisés par la SS (après carence SS) */
  joursCarenceSS: number;
  joursIndemnises: number;

  /** IJ brute journalière (SJR × taux) */
  ijBruteJournaliere: number;

  /** Total IJ brutes sur la période */
  ijBruteTotal: number;

  /** Prélèvements sociaux sur les IJ (CSG + CRDS) */
  csgCrds: number;

  /** Total IJ nettes sur la période (après CSG/CRDS) */
  ijNetteTotal: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule les IJSS pour un événement d'absence.
 *
 * @param absence   Événement d'absence avec type, durée, et optionnellement SJR
 * @param brutMensuelTheorique  Brut mensuel pour estimer le SJR si non fourni
 * @param passAnnuel           PASS annuel (48 060 € en 2026)
 */
export function calcIjss(
  absence: AbsenceEvent,
  brutMensuelTheorique: number,
  passAnnuel: number,
): ResultatIjss {
  // ── 1. Salaire journalier de référence (SJR) ────────────────────────────────
  const sjrBrut =
    absence.salairejournalierRef ??
    brutMensuelTheorique / PARAMS_IJSS_2026.diviseurSjrMensuel;

  // ── 2. Plafond légal du SJR ─────────────────────────────────────────────────
  const sjrPlafond = getPlafondSjr(absence.type, passAnnuel);
  const sjrPlafonne = Math.min(sjrBrut, sjrPlafond);

  // ── 3. Délai de carence SS ──────────────────────────────────────────────────
  const joursCarenceSS = getCarenceSS(absence.type);
  const joursIndemnises = Math.max(0, absence.joursCivils - joursCarenceSS);

  // ── 4. IJ brute journalière ─────────────────────────────────────────────────
  const { ijBruteJournaliere, tauxEffectif } = calcIjJournaliere(
    absence.type,
    sjrPlafonne,
    joursIndemnises,
  );

  const ijBruteTotal = ijBruteJournaliere * joursIndemnises;

  // ── 5. Prélèvements sociaux sur IJ ─────────────────────────────────────────
  const tauxPrelevements =
    PARAMS_IJSS_2026.csgIj + PARAMS_IJSS_2026.crdsIj;
  const csgCrds = ijBruteTotal * tauxPrelevements;
  const ijNetteTotal = ijBruteTotal - csgCrds;

  return {
    sjrBrut,
    sjrPlafonne,
    tauxEffectif,
    joursCarenceSS,
    joursIndemnises,
    ijBruteJournaliere,
    ijBruteTotal,
    csgCrds,
    ijNetteTotal,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de calcul
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne le plafond du SJR pour un type d'absence.
 * Maternité/paternité : plafond = PASS / 360 (journalier)
 * Autres : plafond = PASS / 730 (journalier)
 */
function getPlafondSjr(type: AbsenceEvent["type"], passAnnuel: number): number {
  if (type === "maternite" || type === "paternite_accueil" || type === "adoption") {
    return passAnnuel / PARAMS_IJSS_2026.plafondIjMaterniteDiviseur;
  }
  return passAnnuel / PARAMS_IJSS_2026.plafondIjJournalierDiviseur;
}

/**
 * Retourne le délai de carence SS en jours selon le type d'absence.
 */
function getCarenceSS(type: AbsenceEvent["type"]): number {
  switch (type) {
    case "at_mp":
      return PARAMS_IJSS_2026.carenceSSAtMp;
    case "maternite":
    case "paternite_accueil":
    case "adoption":
    case "conge_pathologique":
      return PARAMS_IJSS_2026.carenceSSMaternite;
    case "maladie_longue_duree":
      return PARAMS_IJSS_2026.carenceSSMaladieLongueDuree;
    default:
      return PARAMS_IJSS_2026.carenceSSMaladie;
  }
}

/**
 * Calcule l'IJ journalière et le taux effectif selon le type d'absence.
 *
 * AT/MP : split entre phase 1 (60 %) et phase 2 (80 %) pondéré sur la durée.
 */
function calcIjJournaliere(
  type: AbsenceEvent["type"],
  sjrPlafonne: number,
  joursIndemnises: number,
): { ijBruteJournaliere: number; tauxEffectif: number } {
  if (joursIndemnises === 0) {
    return { ijBruteJournaliere: 0, tauxEffectif: 0 };
  }

  if (type === "maternite" || type === "paternite_accueil" || type === "adoption" || type === "conge_pathologique") {
    return {
      ijBruteJournaliere: sjrPlafonne * PARAMS_IJSS_2026.tauxIjMaternite,
      tauxEffectif: PARAMS_IJSS_2026.tauxIjMaternite,
    };
  }

  if (type === "at_mp") {
    const carenceSS = PARAMS_IJSS_2026.carenceSSAtMp;
    const joursPhase1 = Math.min(
      joursIndemnises,
      Math.max(0, PARAMS_IJSS_2026.joursPhase1AtMp - carenceSS),
    );
    const joursPhase2 = Math.max(0, joursIndemnises - joursPhase1);

    const totalIjBrute =
      sjrPlafonne * PARAMS_IJSS_2026.tauxIjAtMpPhase1 * joursPhase1 +
      sjrPlafonne * PARAMS_IJSS_2026.tauxIjAtMpPhase2 * joursPhase2;

    const ijBruteJournaliere = joursIndemnises > 0 ? totalIjBrute / joursIndemnises : 0;
    const tauxEffectif = joursIndemnises > 0 ? totalIjBrute / (sjrPlafonne * joursIndemnises) : 0;

    return { ijBruteJournaliere, tauxEffectif };
  }

  // Maladie ordinaire / longue durée
  return {
    ijBruteJournaliere: sjrPlafonne * PARAMS_IJSS_2026.tauxIjMaladie,
    tauxEffectif: PARAMS_IJSS_2026.tauxIjMaladie,
  };
}
