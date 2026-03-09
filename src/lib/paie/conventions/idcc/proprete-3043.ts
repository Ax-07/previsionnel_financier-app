/**
 * CCN Propreté — Convention collective nationale des entreprises de propreté
 * et services associés
 * IDCC 3043
 *
 * Règles 2026 implémentées :
 * - Filière exploitation : 26 niveaux/échelons (ASP B → MP5)
 * - Filière administrative : 7 niveaux (EA1 → MA3)
 * - Filière cadres : 6 niveaux CA1–CA6 (minima mensuels)
 * - Grille Grille 2 (métropole hors Mayotte) — avenant n° 26 du 05/03/2025
 * - Indemnité de salissure forfaitaire (non soumise à cotisations)
 * - Prévoyance obligatoire HUMANIS / Chorum
 * - Maintien AT/MP : 0j dès 12 mois (accord branche)
 *
 * IMPORTANT : Pour Mayotte ou grille 1 antérieure, versionner les tables
 * séparément avant d'importer ce module.
 *
 * Référence :
 * https://legifrance.gouv.fr/conv_coll/id/KALIARTI000051694391/?idConteneur=KALICONT000027172335
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

const PROPRETE_3043: ConventionRuleSet = {
  primes: [
    {
      code: "proprete_indemnite_salissure",
      libelle: "Indemnité de salissure",
      mode: "fixe",
      valeur: 12.02, // forfait mensuel conventionnel 2026
      soumiseCotisations: false,
      imposable: false,
      reference: "CCN Propreté 3043 — Art. 2.7",
    },
  ],

  // ── Classifications — Avenant n° 26 du 05/03/2025 (Grille 2 métropole) ──
  // Filière exploitation : taux horaires
  // Filière administrative : taux horaires
  // Filière cadres : salaires mensuels
  // ─────────────────────────────────────────────────────────────────────────
  niveauxClassification: [
    // ─ Filière exploitation ────────────────────────────────────────────
    { code: "ASP_A",    libelle: "ASP A",       tauxHoraire: 12.38, salaireMinimumMensuel: 1877.42, filiere: "exploitation" },
    { code: "ASP_B",    libelle: "ASP B",       tauxHoraire: 12.57, salaireMinimumMensuel: 1906.29, filiere: "exploitation" },
    { code: "ASC_A",    libelle: "ASC A",       tauxHoraire: 12.43, salaireMinimumMensuel: 1885.52, filiere: "exploitation" },
    { code: "ASC_B",    libelle: "ASC B",       tauxHoraire: 12.65, salaireMinimumMensuel: 1918.82, filiere: "exploitation" },
    { code: "ASCS_A",   libelle: "AS/ASCS A",  tauxHoraire: 12.50, salaireMinimumMensuel: 1895.88, filiere: "exploitation" },
    { code: "ASCS_B",   libelle: "AS/ASCS B",  tauxHoraire: 12.72, salaireMinimumMensuel: 1929.24, filiere: "exploitation" },
    { code: "AQS_1A",   libelle: "AQS 1A",     tauxHoraire: 12.56, salaireMinimumMensuel: 1904.98, filiere: "exploitation" },
    { code: "AQS_1B",   libelle: "AQS 1B",     tauxHoraire: 12.77, salaireMinimumMensuel: 1936.84, filiere: "exploitation" },
    { code: "AQS_2A",   libelle: "AQS 2A",     tauxHoraire: 12.67, salaireMinimumMensuel: 1921.63, filiere: "exploitation" },
    { code: "AQS_2B",   libelle: "AQS 2B",     tauxHoraire: 12.91, salaireMinimumMensuel: 1957.98, filiere: "exploitation" },
    { code: "AQS_3A",   libelle: "AQS 3A",     tauxHoraire: 12.78, salaireMinimumMensuel: 1938.30, filiere: "exploitation" },
    { code: "AQS_3B",   libelle: "AQS 3B",     tauxHoraire: 13.02, salaireMinimumMensuel: 1974.74, filiere: "exploitation" },
    { code: "ATQS_1A",  libelle: "ATQS 1A",    tauxHoraire: 13.03, salaireMinimumMensuel: 1976.26, filiere: "exploitation" },
    { code: "ATQS_1B",  libelle: "ATQS 1B",    tauxHoraire: 13.24, salaireMinimumMensuel: 2008.15, filiere: "exploitation" },
    { code: "ATQS_2A",  libelle: "ATQS 2A",    tauxHoraire: 13.76, salaireMinimumMensuel: 2086.97, filiere: "exploitation" },
    { code: "ATQS_2B",  libelle: "ATQS 2B",    tauxHoraire: 14.01, salaireMinimumMensuel: 2124.86, filiere: "exploitation" },
    { code: "ATQS_3A",  libelle: "ATQS 3A",    tauxHoraire: 14.79, salaireMinimumMensuel: 2243.20, filiere: "exploitation" },
    { code: "ATQS_3B",  libelle: "ATQS 3B",    tauxHoraire: 15.10, salaireMinimumMensuel: 2290.22, filiere: "exploitation" },
    { code: "CE1",      libelle: "CE1",         tauxHoraire: 14.27, salaireMinimumMensuel: 2164.33, filiere: "exploitation" },
    { code: "CE2",      libelle: "CE2",         tauxHoraire: 15.10, salaireMinimumMensuel: 2290.22, filiere: "exploitation" },
    { code: "CE3",      libelle: "CE3",         tauxHoraire: 15.27, salaireMinimumMensuel: 2316.07, filiere: "exploitation" },
    { code: "MP1",      libelle: "MP1",         tauxHoraire: 15.35, salaireMinimumMensuel: 2328.20, filiere: "exploitation" },
    { code: "MP2",      libelle: "MP2",         tauxHoraire: 16.21, salaireMinimumMensuel: 2458.67, filiere: "exploitation" },
    { code: "MP3",      libelle: "MP3",         tauxHoraire: 17.98, salaireMinimumMensuel: 2727.02, filiere: "exploitation" },
    { code: "MP4",      libelle: "MP4",         tauxHoraire: 20.03, salaireMinimumMensuel: 3038.54, filiere: "exploitation" },
    { code: "MP5",      libelle: "MP5",         tauxHoraire: 21.66, salaireMinimumMensuel: 3285.17, filiere: "exploitation" },
    // ─ Filière administrative ────────────────────────────────────────
    { code: "EA1",      libelle: "EA1",         tauxHoraire: 12.47, salaireMinimumMensuel: 1890.82, filiere: "administrative" },
    { code: "EA2",      libelle: "EA2",         tauxHoraire: 13.37, salaireMinimumMensuel: 2027.33, filiere: "administrative" },
    { code: "EA3",      libelle: "EA3",         tauxHoraire: 14.72, salaireMinimumMensuel: 2232.58, filiere: "administrative" },
    { code: "EA4",      libelle: "EA4",         tauxHoraire: 16.10, salaireMinimumMensuel: 2441.90, filiere: "administrative" },
    { code: "MA1",      libelle: "MA1",         tauxHoraire: 17.89, salaireMinimumMensuel: 2713.37, filiere: "administrative" },
    { code: "MA2",      libelle: "MA2",         tauxHoraire: 20.32, salaireMinimumMensuel: 3081.94, filiere: "administrative" },
    { code: "MA3",      libelle: "MA3",         tauxHoraire: 21.42, salaireMinimumMensuel: 3248.77, filiere: "administrative" },
    // ─ Filière cadres (salaires mensuels) ───────────────────────────
    { code: "CA1",      libelle: "CA1",         salaireMinimumMensuel: 3240.86, filiere: "cadres" },
    { code: "CA2",      libelle: "CA2",         salaireMinimumMensuel: 3823.05, filiere: "cadres" },
    { code: "CA3",      libelle: "CA3",         salaireMinimumMensuel: 4272.46, filiere: "cadres" },
    { code: "CA4",      libelle: "CA4",         salaireMinimumMensuel: 4938.88, filiere: "cadres" },
    { code: "CA5",      libelle: "CA5",         salaireMinimumMensuel: 5241.68, filiere: "cadres" },
    { code: "CA6",      libelle: "CA6",         salaireMinimumMensuel: 5727.03, filiere: "cadres" },
  ],

  // ── Prévoyance Humanis obligatoire ─────────────────────────────────
  prevoyanceObligatoire: [
    {
      code: "proprete_prevoyance_sal",
      libelle: "Prévoyance Propreté salarié (Humanis)",
      famille: "prevoyance_prevoyance",
      organisme: "Humanis",
      assiette: "brut",
      tauxSalarie: 0.0025,
      tauxEmployeur: 0.0075,
      deductible: true,
    },
    {
      code: "proprete_mutuelle_sal",
      libelle: "Mutuelle Propreté salarié",
      famille: "prevoyance_mutuelle",
      organisme: "Humanis",
      assiette: "brut",
      tauxSalarie: 0.0060,
      tauxEmployeur: 0.0060,
      deductible: false,
    },
  ],

  // ── Maintien AT/MP (accord branche) ──────────────────────────────
  politiqueMaintien: {
    at_mp: {
      ancienneteMinimumMois: 12,
      joursCarenceEmployeur: 0,
      dureeTauxPleinJours: 90,
      tauxMaintienPlein: 1.0,
      dureeTauxPartielJours: 90,
      tauxMaintienPartiel: 0.80,
      sousDedictionIjss: true,
    },
  },

  // ── Traçabilité ───────────────────────────────────────────────────────────
  dateEffet: "2025-03-05", // avenant n° 26 du 05/03/2025
  statut: "verified",
};

// Auto-enregistrement à l'import
registerConvention("3043", PROPRETE_3043);

export { PROPRETE_3043 };
