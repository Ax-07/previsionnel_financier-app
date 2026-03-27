/**
 * Types du moteur de conventions collectives (Lot 6).
 *
 * Couvre les surcharges conventionnelles : minima, primes, maintien,
 * prévoyance, forfaits, absences, classifications.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §11
 */

import type { FamilleCotisation } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue conventions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entrée du catalogue des conventions collectives supportées.
 */
export interface ConventionMetadata {
  /** Code IDCC (ex. "1486") */
  idcc: string;
  /** Libellé officiel */
  label: string;
  /** Version / millésime de l'accord (ex. "2026-01-01") */
  version?: string;
  /** Branches couvertes (ex. ["informatique", "conseil"]) */
  branches?: string[];
  /**
   * Date d'entrée en vigueur du dernier avenant intégré (ISO 8601).
   * Correspond à `ConventionRuleSet.dateEffet` de l'implémentation.
   */
  dateEffet?: string;
  /**
   * Fiabilité des données chargées :
   * - "verified"          : grille officielle sourçée et testée
   * - "partial"           : données partielles ou en cours de validation
   * - "needs-validation"  : non vérifié, à revoir avant production
   */
  statut?: "verified" | "partial" | "needs-validation";
}

// ─────────────────────────────────────────────────────────────────────────────
// Primes et éléments de salaire conventionnels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mode de calcul d'une prime conventionnelle.
 *
 * - "fixe"       : montant fixe en euros par période
 * - "taux_brut"  : pourcentage du salaire brut
 * - "taux_salaire_ref" : pourcentage d'un salaire de référence (ex. mensuel légal)
 * - "jours"      : montant journalier × nombre de jours travaillés
 */
export type ModePrime =
  | "fixe"
  | "taux_brut"
  | "taux_salaire_ref"
  | "jours";

/**
 * Définition d'une prime conventionnelle.
 */
export interface PrimeConventionnelle {
  /** Code technique unique de la prime */
  code: string;
  /** Libellé affiché sur le bulletin */
  libelle: string;
  /** Mode de calcul */
  mode: ModePrime;
  /** Valeur de calcul (montant en € ou taux en décimal) */
  valeur: number;
  /** La prime est-elle soumise à cotisations sociales ? */
  soumiseCotisations: boolean;
  /** La prime est-elle imposable ? */
  imposable: boolean;
  /** Famille de cotisation si soumise */
  famille?: FamilleCotisation;
  /** Note / référence légale (ex. "Art. 36 CCN HCR") */
  reference?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prévoyance conventionnelle obligatoire
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ligne de prévoyance/mutuelle obligatoire issue de la convention collective.
 */
export interface PrevoyanceConventionnelle {
  /** Code de la ligne */
  code: string;
  /** Libellé */
  libelle: string;
  /** Famille */
  famille: "prevoyance_prevoyance" | "prevoyance_mutuelle";
  /** Organisme recommandé (ex. "Malakoff Humanis", "Klésia") */
  organisme?: string;
  /** Assiette : "brut" | "tranche1" | "tranche2" | "ta_tb" */
  assiette: "brut" | "tranche1" | "tranche2" | "ta_tb";
  /** Taux salarié */
  tauxSalarie: number;
  /** Taux employeur */
  tauxEmployeur: number;
  /** Déductible ? */
  deductible: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Minima conventionnels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Niveau de classification et salaire minimum associé.
 */
export interface NiveauClassification {
  /** Code niveau (ex. "I-1", "ETAM_B", "IC_2.1") */
  code: string;
  /** Libellé du niveau */
  libelle: string;
  /** Salaire minimum mensuel brut (en euros) = tauxHoraire × 151.66669 si horaire */
  salaireMinimumMensuel: number;
  /** Coefficient ou indice (informatif) */
  coefficient?: number;
  /** Taux horaire conventionnel minimum (€/h) */
  tauxHoraire?: number;
  /** Échelon dans le niveau (1, 2, 3…) */
  echelon?: number;
  /**
   * Filière métier (ex. "exploitation", "administrative", "cadres").
   * Utilisé notamment pour Propreté (IDCC 3043) et BAD (IDCC 2941).
   */
  filiere?: string;
  /**
   * Revenu minimum annuel garanti (€/an).
   * Utilisé pour la Restauration collective (IDCC 1266) dont la CCN impose
   * un contrôle du minimum annuel en plus du minimum mensuel.
   * Droit ouvert après 1 an d'ancienneté continue.
   */
  revenuMinimumAnnuel?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Heures supplémentaires conventionnelles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tranche de majoration des heures supplémentaires.
 *
 * Exemple HCR : { heureDebut: 36, heureFin: 39, taux: 0.10 }
 * La tranche ouverte (dernière) a heureFin = null.
 */
export interface TrancheHeuresSup {
  /** Heure hebdomadaire de début de la tranche (inclus) */
  heureDebut: number;
  /** Heure hebdomadaire de fin de la tranche (inclus) — null = illimitée */
  heureFin: number | null;
  /** Taux de majoration (ex. 0.10 pour 10 %) */
  taux: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule set conventionnel complet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensemble complet des surcharges d'une convention collective.
 *
 * Toutes les propriétés sont optionnelles. Seules les surcharges effectivement
 * définies par la CCN sont renseignées.
 */
export interface ConventionRuleSet {
  // ── Primes et éléments de rémunération ───────────────────────────────────
  /** Primes conventionnelles à ajouter au bulletin */
  primes?: PrimeConventionnelle[];

  // ── Minima et classifications ─────────────────────────────────────────────
  /** Grille de classifications et minima par niveau */
  niveauxClassification?: NiveauClassification[];

  // ── Prévoyance obligatoire ────────────────────────────────────────────────
  /** Lignes de prévoyance/mutuelle conventionnelle obligatoire */
  prevoyanceObligatoire?: PrevoyanceConventionnelle[];

  // ── Maintien conventionnel (Lot 5) ────────────────────────────────────────
  /**
   * Politique de maintien pour chaque type d'absence.
   * Injectée dans ConventionalMaintenanceEngine via registerConventionMaintenance().
   */
  politiqueMaintien?: import("@/lib/paie/absence/conventional-maintenance").ConventionMaintenancePolicies;

  // ── Abattements sur assiette ──────────────────────────────────────────────
  /**
   * Facteur d'abattement sur l'assiette de certaines cotisations.
   * Ex. VRP : 0.70 (abattement 30 % sur l'assiette des cotisations sociales).
   */
  facteurAbattementAssiette?: number;

  // ── Paramètres divers ─────────────────────────────────────────────────────
  /** La convention prévoit-elle un forfait jours ? */
  forfaitJours?: boolean;
  /** Nombre de jours du forfait (ex. 218 pour Syntec cadres) */
  joursForfait?: number;
  /** 13e mois conventionnel : taux (ex. 1/12 ≈ 0.0833) */
  tauxTreizieme?: number;
  /** Prime de vacances conventionnelle : taux du brut annuel (ex. 0.10 pour Syntec) */
  tauxPrimeVacances?: number;

  // ── Heures supplémentaires ────────────────────────────────────────────────
  /**
   * Grille conventionnelle de majoration des heures supplémentaires.
   * Remplace ou complète le régime légal (25 % h36-43, 50 % h44+).
   * Les tranches sont ordonnées par heureDebut croissant.
   */
  majorationsHeuresSup?: TrancheHeuresSup[];

  // ── Traçabilité et fiabilité ──────────────────────────────────────────────
  /**
   * Date d'effet des paramètres (ISO 8601, ex. "2026-01-01").
   * Correspond à la date d'effet de l'avenant ou de l'arrêté d'extension.
   */
  dateEffet?: string;
  /**
   * Statut de fiabilité des données :
   * - "verified"         : grilles officielles datées et sourcées, primes modélisées
   * - "partial"          : couverture partielle (minima OK, primes non toutes modélisées)
   * - "needs-validation" : données à vérifier avant mise en production
   */
  statut?: "verified" | "partial" | "needs-validation";
}
