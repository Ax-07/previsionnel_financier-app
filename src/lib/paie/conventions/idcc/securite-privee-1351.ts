/**
 * CCN Sécurité privée — Convention collective nationale des entreprises
 * de prévention et de sécurité
 * IDCC 1351
 *
 * Règles 2026 implémentées :
 * - Classification : agents de sécurité niveaux I à V (coefficients 130–230)
 * - Prime de nuit et dimanche (conventions internes fréquentes, non gérées ici)
 * - Prévoyance obligatoire OCIRP / Malakoff Humanis
 * - Maintien maladie : 7j de carence légal (pas de faveur branche en maladie)
 *   mais 0j en AT/MP dès 6 mois d'ancienneté
 * - Habilitation / autorisation (aucun impact cotisations)
 *
 * Référence : CCN Sécurité privée IDCC 1351 — barème 1er janvier 2026,
 * accord de branche du 10 juin 1988 et avenants
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const SECURITE_PRIVEE_1351: ConventionRuleSet = {
  // ── Classifications ────────────────────────────────────────────────────────
  niveauxClassification: [
    { code: "AS1",  libelle: "Agent de sécurité coeff. 130",         salaireMinimumMensuel: 1766.92, coefficient: 130 },
    { code: "AS2",  libelle: "Agent de sécurité coeff. 140",         salaireMinimumMensuel: 1820.00, coefficient: 140 },
    { code: "AS3",  libelle: "Agent de sécurité coeff. 150",         salaireMinimumMensuel: 1900.00, coefficient: 150 },
    { code: "AM1",  libelle: "Agent de maîtrise coeff. 165",         salaireMinimumMensuel: 2050.00, coefficient: 165 },
    { code: "AM2",  libelle: "Agent de maîtrise coeff. 185",         salaireMinimumMensuel: 2250.00, coefficient: 185 },
    { code: "CAD1", libelle: "Cadre coeff. 200",                     salaireMinimumMensuel: 2600.00, coefficient: 200 },
    { code: "CAD2", libelle: "Cadre supérieur coeff. 230",           salaireMinimumMensuel: 3200.00, coefficient: 230 },
  ],

  // ── Prévoyance OCIRP / Malakoff Humanis ──────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "securite_prevoyance_sal",
      libelle: "Prévoyance Sécurité privée salarié (Malakoff)",
      famille: "prevoyance_prevoyance",
      organisme: "Malakoff Humanis",
      assiette: "brut",
      tauxSalarie: 0.0035,
      tauxEmployeur: 0.0085,
      deductible: true,
    },

  ],

  // ── Maintien maladie ──────────────────────────────────────────────────────
  // La branche ne réduit pas la carence en maladie (7j légal maintenu).
  // En AT/MP, 0j de carence dès 6 mois.
  politiqueMaintien: {
    at_mp: {
      ancienneteMinimumMois: 6,
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
registerConvention("1351", SECURITE_PRIVEE_1351);
