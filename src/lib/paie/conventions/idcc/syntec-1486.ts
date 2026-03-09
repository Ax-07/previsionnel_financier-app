/**
 * CCN Syntec — Bureaux d'études techniques, cabinets d'ingénieurs-conseils,
 * sociétés de conseils, informatique, numérique
 * IDCC 1486
 *
 * Règles 2026 implémentées :
 * - Classifications ETAM (positions 1.1 à 3.3) et IC (positions 1.1 à 3.3)
 * - Minima mensuels : accord du 26 juin 2024, étendu par arrêté du 8 novembre 2024
 * - Prime de vacances conventionnelle : 10 % du brut annuel (art. 31)
 * - Forfait jours cadres : 218 jours/an (art. 5 avenant 1)
 * - Maintien maladie : 0j de carence dès 1 an, 100 % pendant 90j (art. 23)
 * - Prévoyance APEC + AG2R obligatoires
 *
 * Référence : accord du 26/06/2024 IDCC 1486 — Annexe III salaires minimaux
 * https://www.legifrance.gouv.fr/conv_coll/id/KALIARTI000050228718/?idConteneur=1486
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

const SYNTEC_1486: ConventionRuleSet = {
  // ── Prime de vacances (10 % brut annuel, versée en juin) ──────────────────
  tauxPrimeVacances: 0.10,

  // ── Forfait jours (cadres IC) ──────────────────────────────────────────
  forfaitJours: true,
  joursForfait: 218,

  // ── Classifications — Minima officiels accord 26/06/2024 ──────────────────
  niveauxClassification: [
    // ETAM — Employés Techniciens Agents de Maîtrise
    { code: "ETAM_1_1", libelle: "ETAM pos. 1.1",  coefficient: 240, salaireMinimumMensuel: 1815, filiere: "ETAM" },
    { code: "ETAM_1_2", libelle: "ETAM pos. 1.2",  coefficient: 250, salaireMinimumMensuel: 1845, filiere: "ETAM" },
    { code: "ETAM_2_1", libelle: "ETAM pos. 2.1",  coefficient: 275, salaireMinimumMensuel: 1875, filiere: "ETAM" },
    { code: "ETAM_2_2", libelle: "ETAM pos. 2.2",  coefficient: 310, salaireMinimumMensuel: 1905, filiere: "ETAM" },
    { code: "ETAM_2_3", libelle: "ETAM pos. 2.3",  coefficient: 355, salaireMinimumMensuel: 2045, filiere: "ETAM" },
    { code: "ETAM_3_1", libelle: "ETAM pos. 3.1",  coefficient: 400, salaireMinimumMensuel: 2185, filiere: "ETAM" },
    { code: "ETAM_3_2", libelle: "ETAM pos. 3.2",  coefficient: 450, salaireMinimumMensuel: 2340, filiere: "ETAM" },
    { code: "ETAM_3_3", libelle: "ETAM pos. 3.3",  coefficient: 500, salaireMinimumMensuel: 2490, filiere: "ETAM" },
    // IC — Ingénieurs et Cadres
    { code: "IC_1_1",   libelle: "IC pos. 1.1",   coefficient:  95, salaireMinimumMensuel: 2135, filiere: "IC" },
    { code: "IC_1_2",   libelle: "IC pos. 1.2",   coefficient: 100, salaireMinimumMensuel: 2240, filiere: "IC" },
    { code: "IC_2_1",   libelle: "IC pos. 2.1",   coefficient: 105, salaireMinimumMensuel: 2315, filiere: "IC" },
    // IC 2.1 " confirmé » — coefficient intermédiaire prévu par l'annexe III
    { code: "IC_2_1b",  libelle: "IC pos. 2.1 (coeff. 115)", coefficient: 115, salaireMinimumMensuel: 2530, filiere: "IC" },
    { code: "IC_2_2",   libelle: "IC pos. 2.2",   coefficient: 130, salaireMinimumMensuel: 2850, filiere: "IC" },
    { code: "IC_2_3",   libelle: "IC pos. 2.3",   coefficient: 150, salaireMinimumMensuel: 3275, filiere: "IC" },
    { code: "IC_3_1",   libelle: "IC pos. 3.1",   coefficient: 170, salaireMinimumMensuel: 3650, filiere: "IC" },
    { code: "IC_3_2",   libelle: "IC pos. 3.2",   coefficient: 210, salaireMinimumMensuel: 4495, filiere: "IC" },
    { code: "IC_3_3",   libelle: "IC pos. 3.3",   coefficient: 270, salaireMinimumMensuel: 5755, filiere: "IC" },
  ],

  // ── Prévoyance AG2R + cotisation APEC ───────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "syntec_prevoyance_sal",
      libelle: "Prévoyance Syntec salarié (AG2R)",
      famille: "prevoyance_prevoyance",
      organisme: "AG2R La Mondiale",
      assiette: "brut",
      tauxSalarie: 0.0050,
      tauxEmployeur: 0.0150,
      deductible: true,
    },
    {
      code: "syntec_mutuelle_sal",
      libelle: "Mutuelle Syntec salarié (AG2R)",
      famille: "prevoyance_mutuelle",
      organisme: "AG2R La Mondiale",
      assiette: "brut",
      tauxSalarie: 0.0090,
      tauxEmployeur: 0.0090,
      deductible: false,
    },
    {
      code: "syntec_apec_sal",
      libelle: "Cotisation APEC cadres salarié",
      famille: "prevoyance_prevoyance",
      organisme: "APEC",
      assiette: "ta_tb",          // tranches A + B Agirc-Arrco
      tauxSalarie: 0.0006,        // 0.06 %
      tauxEmployeur: 0.0012,      // 0.12 %
      deductible: true,
    },
  ],

  // ── Maintien maladie Syntec (art. 23) ─────────────────────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 0, // 0j de carence (plus favorable)
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 1.0, // 100 % (plus favorable que légal 90 %)
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 0.75, // 75 % (plus favorable que légal 66.67 %)
      sousDedictionIjss: true,
    },
    at_mp: {
      ancienneteMinimumMois: 0,
      joursCarenceEmployeur: 0,
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 1.0,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 0.80,
      sousDedictionIjss: true,
    },
  },

  // ── Traçabilité ───────────────────────────────────────────────────────────
  dateEffet: "2024-11-01", // arrêté extension 08/11/2024
  statut: "verified",
};

// Auto-enregistrement à l'import
registerConvention("1486", SYNTEC_1486);

export { SYNTEC_1486 };
