/**
 * CCN Transport routier — Convention collective nationale des transports
 * routiers et activités auxiliaires du transport
 * IDCC 16
 *
 * Règles 2026 implémentées :
 * - Classifications conducteurs : groupe 3 à 9 (grandes lignes / courte distance)
 * - Prime de fin d'année (équivalente à un mois de salaire pour conducteurs)
 * - Frais de déplacement (indemnités repas/nuit forfaitaires, exonérées)
 * - Prévoyance obligatoire PRÉVIFRANCE / KLESIA
 * - Maintien maladie : carence 3j réduite à 0j dès 2 ans d'ancienneté
 * - Durées de travail spécifiques (non gérées ici — hors scope cotisations)
 *
 * Référence : CCN Transport routier IDCC 16 — barème 2026, annexe conducteurs
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const TRANSPORT_16: ConventionRuleSet = {
  // ── 13e mois / prime annuelle ─────────────────────────────────────────────
  tauxTreizieme: 1 / 12, // prime de fin d'année = 1 mois

  // ── Classifications conducteurs ────────────────────────────────────────────
  niveauxClassification: [
    { code: "GR3", libelle: "Conducteur gr. 3 — Courte distance",           salaireMinimumMensuel: 1800.00, coefficient: 138 },
    { code: "GR4", libelle: "Conducteur gr. 4 — Régional / messagerie",     salaireMinimumMensuel: 1900.00, coefficient: 150 },
    { code: "GR5", libelle: "Conducteur gr. 5 — Grand régional",            salaireMinimumMensuel: 2000.00, coefficient: 155 },
    { code: "GR6", libelle: "Conducteur gr. 6 — Longue distance 1",         salaireMinimumMensuel: 2080.00, coefficient: 162 },
    { code: "GR7", libelle: "Conducteur gr. 7 — Longue distance 2",         salaireMinimumMensuel: 2200.00, coefficient: 175 },
    { code: "GR8", libelle: "Conducteur gr. 8 — Traction",                  salaireMinimumMensuel: 2350.00, coefficient: 185 },
    { code: "GR9", libelle: "Conducteur gr. 9 — Conducteur déménagement",   salaireMinimumMensuel: 2500.00, coefficient: 200 },
  ],

  // ── Indemnités frais de déplacement (valeurs 2026 ACOSS/URSAFF) ──────────
  primes: [
    {
      code: "transport_frais_repas",
      libelle: "Indemnité repas chauffeur (grande distance)",
      mode: "fixe",
      valeur: 15.96, // repas unique journalier 2026
      soumiseCotisations: false,
      imposable: false,
      reference: "CCN Transport IDCC 16 — Annexe frais",
    },
  ],

  // ── Prévoyance Klésia obligatoire ─────────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "transport_prevoyance_sal",
      libelle: "Prévoyance Transport salarié (Klésia)",
      famille: "prevoyance_prevoyance",
      organisme: "Klésia",
      assiette: "brut",
      tauxSalarie: 0.0030,
      tauxEmployeur: 0.0090,
      deductible: true,
    },

  ],

  // ── Maintien maladie ──────────────────────────────────────────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 24, // 2 ans requis pour carence réduite
      joursCarenceEmployeur: 0,
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 0.90,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 2 / 3,
      sousDedictionIjss: true,
    },
  },
};

// Auto-enregistrement à l'import
registerConvention("16", TRANSPORT_16);
