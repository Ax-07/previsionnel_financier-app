/**
 * CCN Métallurgie — Convention collective nationale de la métallurgie
 * IDCC 3248 (accord national du 7 février 2022, entrée en vigueur 01/01/2024)
 *
 * Cette CCN remplace les nombreuses CCN métallurgie territoriales.
 * Règles 2026 implémentées :
 * - Classification par emploi (architecture Job Grading) : 11 groupes (A à K)
 * - Maintien du salaire en maladie : carence 0j dès 1 an d'ancienneté (art. 61)
 * - 13e mois conventionnel (1/12 du salaire annuel brut) à partir de 1 an
 * - Prévoyance obligatoire (accord de 2022) via Malakoff Humanis / Aon
 * - Mutuelle obligatoire
 * - Forfait jours cadres : 218 jours (art. 79)
 *
 * Référence : CCN Métallurgie 3248, texte de 2022, barème 2026
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const METALLURGIE_3248: ConventionRuleSet = {
  // ── 13e mois ───────────────────────────────────────────────────────────────
  // 1/12 du brut annuel ≈ un mois de salaire en fin d'année
  tauxTreizieme: 1 / 12,

  // ── Forfait jours ──────────────────────────────────────────────────────────
  forfaitJours: true,
  joursForfait: 218,

  // ── Classifications (groupes A à K) ────────────────────────────────────────
  niveauxClassification: [
    { code: "A", libelle: "Groupe A — Opérations simples",    salaireMinimumMensuel: 1766.92 },
    { code: "B", libelle: "Groupe B — Opérations courantes",  salaireMinimumMensuel: 1820.00 },
    { code: "C", libelle: "Groupe C — Opérations qualifiées", salaireMinimumMensuel: 1910.00 },
    { code: "D", libelle: "Groupe D — Expertise technique",   salaireMinimumMensuel: 2050.00 },
    { code: "E", libelle: "Groupe E — Expertise avancée",     salaireMinimumMensuel: 2200.00 },
    { code: "F", libelle: "Groupe F — Maîtrise d'exécution",  salaireMinimumMensuel: 2400.00 },
    { code: "G", libelle: "Groupe G — Maîtrise confirmée",    salaireMinimumMensuel: 2700.00 },
    { code: "H", libelle: "Groupe H — Cadre débutant",        salaireMinimumMensuel: 3100.00 },
    { code: "I", libelle: "Groupe I — Cadre confirmé",        salaireMinimumMensuel: 3700.00 },
    { code: "J", libelle: "Groupe J — Cadre expert",          salaireMinimumMensuel: 4500.00 },
    { code: "K", libelle: "Groupe K — Cadre dirigeant",       salaireMinimumMensuel: 6000.00 },
  ],

  // ── Prévoyance (accord collectif 2022) ────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "metal_prevoyance_sal",
      libelle: "Prévoyance Métallurgie salarié",
      famille: "prevoyance_prevoyance",
      organisme: "Malakoff Humanis",
      assiette: "brut",
      tauxSalarie: 0.0040,
      tauxEmployeur: 0.0110,
      deductible: true,
    },

  ],

  // ── Maintien maladie (art. 61 CCN 3248) ──────────────────────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 0, // 0j de carence dès 1 an (plus favorable que loi)
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 0.90,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 2 / 3,
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
};

// Auto-enregistrement à l'import
registerConvention("3248", METALLURGIE_3248);
