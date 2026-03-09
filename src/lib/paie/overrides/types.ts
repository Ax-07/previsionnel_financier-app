/**
 * Types du système RuleOverrideEngine.
 *
 * Un RuleSet définit les surcharges applicables à un profil ou une convention.
 * Il est fusionné avec le rule set standard par RuleOverrideEngine.merge().
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §3.2
 */

import type { FamilleCotisation } from "@/lib/paie/types";

/**
 * Surcharge de taux pour une ligne de cotisation spécifique.
 */
export interface TauxOverride {
  /** Code technique de la ligne ciblée (ex. "maladie_sal", "arrco_t1_sal") */
  cotisationCode: string;
  /** Nouveau taux salarié (undefined = inchangé) */
  tauxSalarie?: number;
  /** Nouveau taux employeur (undefined = inchangé) */
  tauxEmployeur?: number;
}

/**
 * Surcharge d'assiette : modificateur appliqué avant le calcul des cotisations
 * pour une famille donnée.
 */
export interface AssietteSurcharge {
  /**
   * Facteur multiplicateur sur le brut soumis pour cette famille.
   * Ex. 0.70 = abattement forfaitaire 30 % (VRP multicarte).
   */
  facteurAbattement?: number;
  /** Assiette fixe à utiliser à la place du brut calculé (euros) */
  assietteForcee?: number;
}

/**
 * Ligne de cotisation conventionnelle additionnelle à injecter dans le bulletin.
 */
export interface LigneConventionnelle {
  /** Code technique unique de la ligne */
  code: string;
  /** Libellé affiché dans le bulletin */
  libelle: string;
  /** Famille de cotisation */
  famille: FamilleCotisation;
  /** Organisme collecteur */
  organisme: string;
  /**
   * Base de calcul :
   * - "brut"    → brutSoumis
   * - "tranche1" → baseT1 Agirc-Arrco
   * - "tranche2" → baseT2 Agirc-Arrco
   * - "fixe"    → montantFixeSalarie / montantFixeEmployeur
   */
  assiette: "brut" | "tranche1" | "tranche2" | "fixe";
  /** Montant salarié fixe (si assiette = "fixe") */
  montantFixeSalarie?: number;
  /** Montant employeur fixe (si assiette = "fixe") */
  montantFixeEmployeur?: number;
  /** Taux salarié */
  tauxSalarie: number;
  /** Taux employeur */
  tauxEmployeur: number;
  /** La cotisation salariale est-elle déductible du net imposable ? */
  deductible: boolean;
  /** Référence réglementaire (ex. "CCN_1486_PREVOYANCE") */
  regleCode: string;
}

/**
 * Ensemble de règles (rule set) pour un profil ou une convention collective.
 *
 * Toutes les propriétés sont optionnelles : seules les surcharges nécessaires
 * sont définies. L'absence d'une propriété signifie "comportement standard".
 */
export interface RuleSet {
  /**
   * Codes des lignes de cotisation à exonérer.
   * Les lignes correspondantes auront leur montantSalarie et/ou montantEmployeur
   * forcés à 0 lors du calcul des exonérations (étape 8 du pipeline).
   */
  exonerations?: string[];

  /** Surcharges de taux par code de cotisation (priorité sur les taux standards) */
  tauxOverrides?: TauxOverride[];

  /** Surcharges d'assiette par famille de cotisation */
  assietteSurcharges?: Partial<Record<FamilleCotisation, AssietteSurcharge>>;

  /** Lignes additionnelles à injecter dans le bulletin (cotisations conventionnelles) */
  lignesAdditionnelles?: LigneConventionnelle[];

  /**
   * Désactive le calcul de la RGDU (Réduction Générale Dégressive Unique).
   * Applicable aux stages par défaut.
   */
  disableRGDU?: boolean;

  /**
   * Désactive les cotisations chômage (Unédic).
   * Applicable aux fonctionnaires titulaires.
   */
  disableChomage?: boolean;

  /**
   * Désactive les cotisations retraite complémentaire Agirc-Arrco.
   * Applicable aux agents publics (CNRACL / Pension civile à la place).
   */
  disableRetraiteComplementaire?: boolean;

  // ── Heures supplémentaires conventionnelles ────────────────────────────────
  /**
   * Grille conventionnelle de majoration des heures supplémentaires.
   * Remplace le calcul légal (25 % h36-43, 50 % h44+).
   * Ex. HCR IDCC 1979 : 10 % h36-39, 20 % h40-43, 50 % h44+.
   * Les tranches sont ordonnées par heureDebut croissant.
   */
  majorationsHeuresSup?: import("@/lib/paie/conventions/types").TrancheHeuresSup[];
}
