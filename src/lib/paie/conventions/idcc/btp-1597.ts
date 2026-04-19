/**
 * CCN BTP ouvriers — Convention collective nationale des ouvriers du bâtiment
 * IDCC 1597 (ouvriers < 10 salariés) / applicable aux ouvriers toutes tailles
 *
 * Règles 2026 implémentées :
 * - Indemnité de trajet et transport (conventionnelle, non soumise à cotisations)
 * - Prévoyance obligatoire PRO BTP (décès, incapacité, invalidité)
 * - Mutuelle obligatoire PRO BTP
 * - Maintien légal renforcé : carence réduite à 3j dès 12 mois d'ancienneté
 * - Taux AT/MP BTP majoré (via cotisations employeur, non géré ici directement)
 * - Grille de classification : ouvriers niveaux 1 à 5 (BT1–BT5)
 *
 * Référence : CCN Bâtiment ouvriers IDCC 1597, barème 2026
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const BTP_1597: ConventionRuleSet = {
  // ── Primes / indemnités ───────────────────────────────────────────────────
  primes: [
    {
      code: "btp_indemnite_trajet",
      libelle: "Indemnité de trajet BTP",
      mode: "fixe",
      // Forfait mensuel estimé (zone 1 : env. 45 € par mois)
      valeur: 45.0,
      soumiseCotisations: false,
      imposable: false,
      reference: "CCN BTP 1597 — Annexe trajet",
    },
  ],

  // ── Classifications ────────────────────────────────────────────────────────
  niveauxClassification: [
    { code: "N1", libelle: "Ouvrier niveau I (BT1)",  salaireMinimumMensuel: 1766.92, coefficient: 150 },
    { code: "N2", libelle: "Ouvrier niveau II (BT2)", salaireMinimumMensuel: 1850.00, coefficient: 170 },
    { code: "N3", libelle: "Ouvrier niveau III (BT3)",salaireMinimumMensuel: 2000.00, coefficient: 210 },
    { code: "N4", libelle: "Ouvrier niveau IV (BT4)", salaireMinimumMensuel: 2200.00, coefficient: 250 },
    { code: "N5", libelle: "Ouvrier niveau V (BT5)",  salaireMinimumMensuel: 2500.00, coefficient: 290 },
  ],

  // ── Prévoyance PRO BTP ───────────────────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "btp_prevoyance_sal",
      libelle: "Prévoyance BTP salarié (PRO BTP)",
      famille: "prevoyance_prevoyance",
      organisme: "PRO BTP",
      assiette: "brut",
      tauxSalarie: 0.0030, // 0.30 %
      tauxEmployeur: 0.0120, // 1.20 %
      deductible: true,
    },

  ],

  // ── Maintien conventionnel ────────────────────────────────────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 3, // réduit vs légal
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 0.90,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 2 / 3,
      sousDedictionIjss: true,
    },
    at_mp: {
      ancienneteMinimumMois: 0, // immédiat (pas de carence AT)
      joursCarenceEmployeur: 0,
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 1.0, // plein maintien en AT/MP (branche)
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 0.80,
      sousDedictionIjss: true,
    },
  },
};

// Auto-enregistrement à l'import
registerConvention("1597", BTP_1597);
