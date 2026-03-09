/**
 * Orchestrateur du moteur d'absence avancé (Lot 5) — LeaveAndBenefitsEngine.
 *
 * Point d'entrée unique pour le calcul complet d'une absence :
 *   1. Calcul IJSS (IjssSubrogationEngine)
 *   2. Maintien légal (LegalMaintenanceEngine)
 *   3. Surcharges conventionnelles (ConventionalMaintenanceEngine)
 *   4. Complément employeur (EmployerTopUpEngine)
 *   5. Brut soumis après absence
 *
 * Usage depuis simulate() à l'étape 9 :
 *   if (salarié.absenceEvent) {
 *     const r = LeaveAndBenefitsEngine.calculate(ctx, salarié.absenceEvent, entreprise)
 *     ctx.absenceDetail = r;
 *   }
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §9
 */

import type { ResultatAbsence, LeaveCalculInput } from "@/lib/paie/absence/types";
import { calcIjss } from "@/lib/paie/absence/ijss-subrogation-engine";
import {
  calculerMaintenLegal,
  getPolitiqueMaintenLegal,
} from "@/lib/paie/absence/legal-maintenance";
import {
  getPolitiqueMaintenConventionnel,
  calculerComplementConventionnel,
} from "@/lib/paie/absence/conventional-maintenance";
import { calculerComplementEmployeur } from "@/lib/paie/absence/employer-top-up-engine";
import { PARAMS_IJSS_2026 } from "@/lib/paie/params/ijss-2026";

/**
 * Taux approximatif de cotisations salariales pour l'estimation du net maintenu.
 * En réalité calculé par le moteur de cotisations — ici approximation standard.
 */
const TAUX_COTISATIONS_SALARIE_APPROX = 0.22;

export const LeaveAndBenefitsEngine = {
  /**
   * Calcule le résultat d'absence complet.
   *
   * @param input  Entrée du moteur (absence + brut théorique + convention + PASS)
   * @returns      ResultatAbsence
   */
  calculate(input: LeaveCalculInput): ResultatAbsence {
    const { absence, brutMensuelTheorique, conventionCode, tauxPAS = 0, passAnnuel } = input;

    // ── 1. Calcul IJSS ────────────────────────────────────────────────────────
    const resultIjss = calcIjss(absence, brutMensuelTheorique, passAnnuel);

    // ── 2. Maintien légal ─────────────────────────────────────────────────────
    const politiqueLegale = getPolitiqueMaintenLegal(absence) ?? {
      joursCarenceSS: resultIjss.joursCarenceSS,
      joursCarenceEmployeur: 0,
      dureeTauxPleinJours: 0,
      dureeTauxPartielJours: 0,
      tauxMaintienPlein: 0,
      tauxMaintienPartiel: 0,
      sousDedictionIjss: true,
    };

    const resultLegal = calculerMaintenLegal(absence, brutMensuelTheorique);

    // ── 3. Surcharges conventionnelles ────────────────────────────────────────
    const politiqueConv = getPolitiqueMaintenConventionnel(
      absence.type,
      politiqueLegale,
      conventionCode,
    );

    const complementConventionnelBrut = calculerComplementConventionnel(
      resultLegal,
      absence.joursCivils,
      brutMensuelTheorique,
      politiqueConv,
    );

    const maintienBrutTotal = resultLegal.maintienBrutTotal + complementConventionnelBrut;

    // ── 4. Déduction brut pour jours non maintenus ────────────────────────────
    const brutJournalier = brutMensuelTheorique / PARAMS_IJSS_2026.diviseurSjrMensuel;

    // Calcul des jours non couverts par un maintien (jours retirés du brut)
    const joursMaintenusLegal =
      resultLegal.joursMaintenusPlein + resultLegal.joursMaintenusPartiel;
    const joursNonMaintenus = Math.max(
      0,
      absence.joursCivils - joursMaintenusLegal,
    );

    // Déduction = jours réellement non rémunérés × brut journalier
    const deductionBrutAbsence = -(brutJournalier * joursNonMaintenus);

    // ── 5. Complément employeur ───────────────────────────────────────────────
    const topUp = calculerComplementEmployeur({
      maintienBrutTotal,
      tauxCotisationsSalarie: TAUX_COTISATIONS_SALARIE_APPROX,
      ijssNetteTotal: resultIjss.ijNetteTotal,
      subrogation: absence.subrogation,
      tauxPAS,
    });

    // ── 6. Brut soumis après absence ──────────────────────────────────────────
    // brutTheorique + déduction (négative) + maintien employeur (déjà dans brut maintenu)
    const brutSoumisApresAbsence = Math.max(
      0,
      brutMensuelTheorique + deductionBrutAbsence + maintienBrutTotal,
    );

    return {
      joursCivils: absence.joursCivils,
      joursCarenceSS: resultIjss.joursCarenceSS,
      joursAvecIjss: resultIjss.joursIndemnises,
      joursMaintenus: joursMaintenusLegal,

      deductionBrutAbsence,

      ijssBruteJournaliere: resultIjss.ijBruteJournaliere,
      ijssBruteTotal: resultIjss.ijBruteTotal,
      ijssCsgCrds: resultIjss.csgCrds,
      ijssNetteTotal: resultIjss.ijNetteTotal,

      maintienBrutLegal: resultLegal.maintienBrutTotal,
      maintienBrutConventionnel: complementConventionnelBrut,
      complementEmployeurNet: topUp.complementNet,

      brutSoumisApresAbsence,
      droitAuMaintienLegal: resultLegal.droitAuMaintien,
    };
  },
};
