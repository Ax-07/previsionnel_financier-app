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
  // salaireMinimumMensuel = tauxHoraire × 151.67 h (valeur officielle fournie)
  // revenuMinimumAnnuel : exigé après 1 an d'ancienneté continue et révolue
  // ─────────────────────────────────────────────────────────────────────────
  niveauxClassification: [
    { code: "N1", libelle: "Niveau I",   tauxHoraire: 11.66, salaireMinimumMensuel: 1768.43, revenuMinimumAnnuel: 22989.59 },
    { code: "N2", libelle: "Niveau II",  tauxHoraire: 11.72, salaireMinimumMensuel: 1777.53, revenuMinimumAnnuel: 23107.89 },
    { code: "N3", libelle: "Niveau III", tauxHoraire: 11.86, salaireMinimumMensuel: 1798.77, revenuMinimumAnnuel: 23384.01 },
    { code: "N4", libelle: "Niveau IV",  tauxHoraire: 12.06, salaireMinimumMensuel: 1829.10, revenuMinimumAnnuel: 23778.30 },
    { code: "N5", libelle: "Niveau V",   tauxHoraire: 12.72, salaireMinimumMensuel: 1929.20, revenuMinimumAnnuel: 25079.60 },
    { code: "N6", libelle: "Niveau VI",  tauxHoraire: 13.23, salaireMinimumMensuel: 2006.55, revenuMinimumAnnuel: 26085.15 },
    { code: "N7", libelle: "Niveau VII", tauxHoraire: 14.06, salaireMinimumMensuel: 2132.43, revenuMinimumAnnuel: 27721.59 },
    { code: "N8", libelle: "Niveau VIII",tauxHoraire: 14.78, salaireMinimumMensuel: 2241.63, revenuMinimumAnnuel: 29141.19 },
    { code: "N9", libelle: "Niveau IX",  tauxHoraire: 19.07, salaireMinimumMensuel: 2892.28, revenuMinimumAnnuel: 37599.64 },
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
