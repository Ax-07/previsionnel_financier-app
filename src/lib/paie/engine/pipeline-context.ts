/**
 * PipelineContext — objet mutable partagé entre toutes les étapes du pipeline.
 *
 * Créé au début de simulate() et enrichi progressivement à chaque étape.
 * Les modules d'extension (Lots 5–12) s'insèrent via le système d'adapters.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §13
 */

import type { SimulationInput, LigneCotisation } from "@/lib/paie/types";
import type { ProfileCode } from "@/lib/paie/profiles/types";
import type { RuleSet } from "@/lib/paie/overrides/types";

/**
 * Assiettes calculées lors de l'étape 5 du pipeline.
 */
export interface AssiettesCalculees {
  /** Salaire brut soumis à cotisations sociales */
  brutSoumis: number;
  /** PMSS proratisé (selon entrée/sortie en cours de mois) */
  pmssProratise: number;
  /** Assiette CSG/CRDS (brutSoumis × 98,25 %) */
  assietteCsg: number;
  /** Base tranche 1 Agirc-Arrco (≤ PMSS) */
  baseT1: number;
  /** Base tranche 2 Agirc-Arrco (entre 1 et 8 PMSS) */
  baseT2: number;
  /** Facteur de proratisation calendaire (0–1) */
  facteurProrata: number;
}

/**
 * Contexte mutable partagé entre toutes les étapes d'une simulation.
 *
 * Convention de nommage des étapes (spec §13) :
 *   1. Qualification du profil
 *   2. Chargement du rule set standard
 *   3. Chargement des surcharges profil/spécialité
 *   4. Chargement des surcharges conventionnelles
 *   5. Construction des assiettes
 *   6. Calcul plafonds et cumuls
 *   7. Calcul cotisations
 *   8. Calcul exonérations / aides
 *   9. Calcul absences / indemnisations spécialisées
 *  10. Calcul fiscal
 *  11. Génération bulletin et audit
 */
export interface PipelineContext {
  /** Paramètres d'entrée originaux (immuables pendant la simulation) */
  readonly input: SimulationInput;

  // ── Étape 1 : qualification du profil ──────────────────────────────────────
  /** Code du profil résolu (ex. "regime_general", "apprentissage", "btp_ouvrier") */
  profileCode: ProfileCode;

  // ── Étapes 2–4 : rule sets ─────────────────────────────────────────────────
  /** Rule set du régime général standard (chargé à l'étape 2) */
  ruleSetStandard: RuleSet;
  /** Surcharges spécifiques au profil (étape 3) */
  ruleSetProfil: RuleSet;
  /** Surcharges de la convention collective active (étape 4) */
  ruleSetConvention: RuleSet;
  /**
   * Rule set effectif = fusion standard + profil + convention.
   * Calculé après l'étape 4, utilisé à partir de l'étape 5.
   */
  ruleSetEffectif: RuleSet;

  // ── Étape 5 : assiettes ─────────────────────────────────────────────────────
  /** Null jusqu'à la fin de l'étape 5 */
  assiettes: AssiettesCalculees | null;

  // ── Étapes 7–9 : cotisations et absences ───────────────────────────────────
  /** Lignes de cotisation accumulées (mutées à chaque étape 7, 8, 9) */
  lignes: LigneCotisation[];

  // ── Étape 10 : fiscal ──────────────────────────────────────────────────────
  netSocial: number;
  netImposable: number;
  pas: number;
  netAPayer: number;

  // ── Étape 11 : totaux ──────────────────────────────────────────────────────
  totalCotisationsSalariales: number;
  totalCotisationsPatronales: number;
  montantRGDU: number;
  coutEmployeur: number;
  tauxCotisationsPatronalesEffectif: number;
}

/**
 * Crée un PipelineContext initialisé avec les valeurs par défaut.
 */
export function createPipelineContext(input: SimulationInput): PipelineContext {
  return {
    input,
    profileCode: "regime_general",
    ruleSetStandard: {},
    ruleSetProfil: {},
    ruleSetConvention: {},
    ruleSetEffectif: {},
    assiettes: null,
    lignes: [],
    netSocial: 0,
    netImposable: 0,
    pas: 0,
    netAPayer: 0,
    totalCotisationsSalariales: 0,
    totalCotisationsPatronales: 0,
    montantRGDU: 0,
    coutEmployeur: 0,
    tauxCotisationsPatronalesEffectif: 0,
  };
}
