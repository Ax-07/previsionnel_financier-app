/**
 * BAD — Branche Aide à domicile / ADMR
 * Convention collective nationale de la branche de l'aide, de
 * l'accompagnement, des soins et des services à domicile
 * IDCC 2941
 *
 * Règles 2026 implémentées :
 * - Classifications par catégories A à E (agents techniques, auxiliaires,
 *   assistants, responsables, encadrement, cadres)
 * - Indemnité kilométrique conventionnelle (véhicule personnel) : 0,40 €/km
 *   → forfait mensuel estimatif ; à personnaliser selon les km réels
 * - Prévoyance obligatoire Chorum (groupe Matmut) – accord de branche 2013
 * - Maintien maladie : 0j carence dès 1 an d'ancienneté (plus favorable)
 * - 13e mois conventionnel à partir de 3 ans d'ancienneté
 *
 * Référence : Convention collective nationale IDCC 2941 — barème 2026,
 * accord de branche BAD du 21 mai 2010 + avenants
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

export const AIDE_DOMICILE_2941: ConventionRuleSet = {
  // ── 13e mois (dès 3 ans d'ancienneté) ────────────────────────────────────
  tauxTreizieme: 1 / 12,

  // ── Primes / indemnités ───────────────────────────────────────────────────
  primes: [
    {
      code: "bad_indemnite_km",
      libelle: "Indemnité kilométrique aide à domicile",
      mode: "fixe",
      // Estimation : 100 km/mois × 0.40 €/km = 40 €
      // Note : à surcharger par l'employeur selon les km réels
      valeur: 40.0,
      soumiseCotisations: false,
      imposable: false,
      reference: "CCN BAD 2941 — Art. 38",
    },
  ],

  // ── Classifications (avenant 61/2023) ──────────────────────────────────────
  // Coefficients des employés degré 1 et 2 (filières intervention / support) :
  // 308, 315, 331, 344, 359, 383 — validés par l'avenant 61/2023
  // Les filières encadrement et cadres sont partiellement modélisées.
  niveauxClassification: [
    // Filière intervention — Degré 1
    { code: "A1", libelle: "Employé à domicile (interv. degré 1 ech.1)",      salaireMinimumMensuel: 1766.92, coefficient: 257, filiere: "intervention" },
    { code: "A2", libelle: "Employé à domicile (interv. degré 1 ech.2)",      salaireMinimumMensuel: 1790.00, coefficient: 262, filiere: "intervention" },
    // Filière intervention — Degré 2
    { code: "B1", libelle: "Auxiliaire de vie sociale AVS (degré 2 ech.1)",   salaireMinimumMensuel: 1840.00, coefficient: 270, filiere: "intervention" },
    { code: "B2", libelle: "Auxiliaire de vie sociale AVS (degré 2 ech.2)",   salaireMinimumMensuel: 1900.00, coefficient: 280, filiere: "intervention" },
    // Filière support — Emplois administratifs
    { code: "C1", libelle: "Assistant(e) RH / compta (support degré 1)",      salaireMinimumMensuel: 1980.00, coefficient: 291, filiere: "support" },
    { code: "C2", libelle: "TISF / Conseiller en économie sociale (ech.2)",   salaireMinimumMensuel: 2100.00, coefficient: 308, filiere: "support" },
    // Avenant 61/2023 — nouveaux niveaux employés degré 1-2
    { code: "D1a", libelle: "Employé qualifié (av.61 coeff 315)",             salaireMinimumMensuel: 2140.00, coefficient: 315, filiere: "intervention" },
    { code: "D1b", libelle: "Employé qualifié (av.61 coeff 331)",             salaireMinimumMensuel: 2250.00, coefficient: 331, filiere: "intervention" },
    { code: "D1c", libelle: "Employé qualifié (av.61 coeff 344)",             salaireMinimumMensuel: 2340.00, coefficient: 344, filiere: "intervention" },
    { code: "D1d", libelle: "Employé qualifié (av.61 coeff 359)",             salaireMinimumMensuel: 2440.00, coefficient: 359, filiere: "intervention" },
    { code: "D1e", libelle: "Employé qualifié (av.61 coeff 383)",             salaireMinimumMensuel: 2600.00, coefficient: 383, filiere: "intervention" },
    // Filière encadrement
    { code: "D2", libelle: "Responsable de secteur",                          salaireMinimumMensuel: 2700.00, coefficient: 394, filiere: "encadrement" },
    // Filière cadres
    { code: "E1", libelle: "Cadre niveau E1",                                 salaireMinimumMensuel: 3200.00, coefficient: 468, filiere: "cadres" },
    { code: "E2", libelle: "Directeur / Cadre supérieur E2",                  salaireMinimumMensuel: 4200.00, coefficient: 613, filiere: "cadres" },
  ],

  // ── Prévoyance Chorum (groupe Matmut) ─────────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "bad_prevoyance_sal",
      libelle: "Prévoyance Aide à domicile salarié (Chorum)",
      famille: "prevoyance_prevoyance",
      organisme: "Chorum (Groupe Matmut)",
      assiette: "brut",
      tauxSalarie: 0.0030,
      tauxEmployeur: 0.0080,
      deductible: true,
    },

  ],

  // ── Maintien maladie (0j carence dès 1 an) ───────────────────────────────
  politiqueMaintien: {
    maladie_ordinaire: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 0, // 0j (plus favorable que légal)
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 1.0,  // 100 % (branche plus favorable)
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 0.75,
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
  dateEffet: "2023-01-01", // avenant 61/2023
  statut: "partial",       // structure filières partielle — à compléter pour prod.
};

// Auto-enregistrement à l'import
registerConvention("2941", AIDE_DOMICILE_2941);
