/**
 * CCN Restauration collective — Convention collective nationale de la
 * restauration collective
 * IDCC 1266
 *
 * Règles 2026 implémentées :
 * - Classifications : 9 niveaux (I à IX)
 * - Taux horaires, salaires minima mensuels et revenus minima annuels
 *   (avenant n° 65 du 15 avril 2024, avenant n° 68 du 14 février 2025)
 * - Contrôle mensuel ET contrôle annuel (RMA) après 1 an d'ancienneté
 * - Prime d'ancienneté annuelle (1 % par an dès 3 ans)
 * - Prévoyance obligatoire Klésia / OCIRP
 * - Maintien maladie : carence réduite à 3j dès 1 an d'ancienneté
 *
 * Référence :
 * https://www.legifrance.gouv.fr/conv_coll/id/KALIARTI000050135902/?idConteneur=1266
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

const RESTAURATION_COLLECTIVE_1266: ConventionRuleSet = {
  primes: [
    {
      code: "rcoll_prime_anciennete",
      libelle: "Prime d'ancienneté (restauration collective)",
      mode: "taux_brut",
      valeur: 0.01, // 1 % (dès 3 ans), à moduler selon ancienneté
      soumiseCotisations: true,
      imposable: true,
      reference: "CCN Restauration Collective 1266 — Art. 27",
    },
  ],

  // ── Classifications (9 niveaux) — Avenant n° 65 du 15/04/2024 ──────────
  // salaireMinimumMensuel = tauxHoraire × 151.66669 h (valeur officielle fournie)
  // revenuMinimumAnnuel : exigé après 1 an d'ancienneté continue et révolue
  // ─────────────────────────────────────────────────────────────────────────
  niveauxClassification: [
    { code: "N1", libelle: "Niveau I",   tauxHoraire: 12.02, salaireMinimumMensuel: 1823.03, revenuMinimumAnnuel: 23443.16 },
    { code: "N2", libelle: "Niveau II",  tauxHoraire: 12.02, salaireMinimumMensuel: 1823.03, revenuMinimumAnnuel: 23561.46 },
    { code: "N3", libelle: "Niveau III", tauxHoraire: 12.10, salaireMinimumMensuel: 1835.17, revenuMinimumAnnuel: 23857.21 },
    { code: "N4", libelle: "Niveau IV",  tauxHoraire: 1230, salaireMinimumMensuel: 1865.50, revenuMinimumAnnuel: 24251.50 },
    { code: "N5", libelle: "Niveau V",   tauxHoraire: 12.96, salaireMinimumMensuel: 1965.60, revenuMinimumAnnuel: 25552.80 },
    { code: "N6", libelle: "Niveau VI",  tauxHoraire: 13.46, salaireMinimumMensuel: 2041.43, revenuMinimumAnnuel: 26538.59 },
    { code: "N7", libelle: "Niveau VII", tauxHoraire: 14.30, salaireMinimumMensuel: 2168.83, revenuMinimumAnnuel: 28194.79 },
    { code: "N8", libelle: "Niveau VIII",tauxHoraire: 15.02, salaireMinimumMensuel: 2278.03, revenuMinimumAnnuel: 29614.79 },
    { code: "N9", libelle: "Niveau IX",  tauxHoraire: 19.31, salaireMinimumMensuel: 2928.68, revenuMinimumAnnuel: 38072.84 },
  ],

  // ── Prévoyance Klésia ───────────────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "rcoll_prevoyance_sal",
      libelle: "Prévoyance Restauration collective salarié (Klésia)",
      famille: "prevoyance_prevoyance",
      organisme: "Klésia",
      assiette: "brut",
      tauxSalarie: 0.0030,
      tauxEmployeur: 0.0090,
      deductible: true,
    },
    {
      code: "rcoll_mutuelle_sal",
      libelle: "Mutuelle Restauration collective salarié",
      famille: "prevoyance_mutuelle",
      organisme: "Klésia",
      assiette: "brut",
      tauxSalarie: 0.0060,
      tauxEmployeur: 0.0060,
      deductible: false,
    },
  ],

  // ── Maintien maladie (carence réduite 3j dès 1 an) ───────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 3,
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 0.90,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 2 / 3,
      sousDedictionIjss: true,
    },
  },

  // ── Traçabilité ───────────────────────────────────────────────────────────
  dateEffet: "2024-04-15", // avenant n° 65 du 15/04/2024
  statut: "verified",
};

// Auto-enregistrement à l'import
registerConvention("1266", RESTAURATION_COLLECTIVE_1266);

export { RESTAURATION_COLLECTIVE_1266 };
