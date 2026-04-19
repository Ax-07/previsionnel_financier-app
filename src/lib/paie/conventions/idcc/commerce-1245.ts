/**
 * CCN Commerce de détail non alimentaire — habillement, maroquinerie,
 * chaussures, arts de la table, jouets, bimbeloterie
 * IDCC 1245
 *
 * Règles 2026 implémentées :
 * - Classifications : 5 niveaux (Employé I à Cadre)
 * - Prime d'ancienneté : 2 % par an jusqu'à 15 % (sur brut conventionnel)
 * - Prévoyance obligatoire Malakoff Humanis (accord de branche 2007)
 * - Maintien maladie : carence 7j légale maintenue
 * - Congés payés 5 semaines légales (pas de jours supplémentaires dans la branche)
 *
 * Référence : CCN Commerce détail non alimentaire IDCC 1245 — barème 2026
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const COMMERCE_1245: ConventionRuleSet = {
  // ── Primes ────────────────────────────────────────────────────────────────
  primes: [
    {
      code: "commerce_prime_anciennete",
      libelle: "Prime d'ancienneté (commerce détail)",
      mode: "taux_brut",
      // Note : le taux dépend de l'ancienneté réelle du salarié.
      // Valeur par défaut à 2 % (1 an d'ancienneté). À surcharger par profil.
      valeur: 0.02,
      soumiseCotisations: true,
      imposable: true,
      reference: "CCN Commerce 1245 — Art. 15 bis",
    },
  ],

  // ── Classifications ────────────────────────────────────────────────────────
  niveauxClassification: [
    { code: "EMP1", libelle: "Employé niveau I",             salaireMinimumMensuel: 1766.92, coefficient: 100 },
    { code: "EMP2", libelle: "Employé niveau II",            salaireMinimumMensuel: 1820.00, coefficient: 110 },
    { code: "EMP3", libelle: "Employé niveau III",           salaireMinimumMensuel: 1900.00, coefficient: 120 },
    { code: "AM1",  libelle: "Agent de maîtrise",            salaireMinimumMensuel: 2100.00, coefficient: 145 },
    { code: "CAD1", libelle: "Cadre",                        salaireMinimumMensuel: 2700.00, coefficient: 180 },
  ],

  // ── Prévoyance Malakoff Humanis ───────────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "commerce_prevoyance_sal",
      libelle: "Prévoyance Commerce détail salarié",
      famille: "prevoyance_prevoyance",
      organisme: "Malakoff Humanis",
      assiette: "brut",
      tauxSalarie: 0.0030,
      tauxEmployeur: 0.0090,
      deductible: true,
    },

  ],

  // Pas de surcharge de maintien spécifique (légal s'applique)
};

// Auto-enregistrement à l'import
registerConvention("1245", COMMERCE_1245);
