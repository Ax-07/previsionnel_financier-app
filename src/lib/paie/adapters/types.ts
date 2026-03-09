/**
 * Types du système ExternalSchemeAdapters.
 *
 * Un adapter permet à un module externe (caisse BTP, épargne salariale,
 * cotisations intermittents, mobilité internationale…) de s'insérer dans le
 * pipeline de simulation sans modifier le code du noyau.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §3.1
 */

import type { PipelineContext } from "@/lib/paie/engine/pipeline-context";

/**
 * Type de schéma externe géré par l'adapter.
 */
export type SchemeType =
  | "paid_leave_fund"   // Caisse de congés payés (BTP Pro-BTP / CNETP)
  | "savings"           // Épargne salariale (intéressement, participation, abondement)
  | "international"     // Mobilité internationale (CFE, split payroll)
  | "entertainment"     // Spectacle (AUDIENS, AFDAS, annexes 8 et 10)
  | "public"            // Secteur public (CNRACL, Pension civile, IRCANTEC)
  | "absence"           // Absences spécialisées (IJSS subrogées, maintien)
  | "specific";         // Autres schémas spécifiques

/**
 * Étape du pipeline où l'adapter peut s'insérer.
 * Correspond aux 11 étapes définies dans la spec §13.
 */
export type PipelineStep =
  | 1   // Qualification du profil
  | 2   // Chargement du rule set standard
  | 3   // Surcharges profil/spécialité
  | 4   // Surcharges conventionnelles
  | 5   // Construction des assiettes
  | 6   // Calcul plafonds et cumuls
  | 7   // Calcul cotisations
  | 8   // Calcul exonérations / aides
  | 9   // Calcul absences / indemnisations spécialisées
  | 10  // Calcul fiscal
  | 11; // Génération bulletin et audit

/**
 * Interface qu'un adapter externe doit implémenter pour s'enregistrer
 * dans ADAPTER_REGISTRY et être invoqué par le pipeline.
 */
export interface ExternalSchemeAdapter {
  /** Code unique de l'adapter (ex. "btp_cnetp", "cfe_expatrie") */
  code: string;
  /** Label descriptif (affiché en audit) */
  label: string;
  /** Type de schéma externe */
  schemeType: SchemeType;
  /** Étapes du pipeline où cet adapter doit être exécuté */
  insertAtSteps: PipelineStep[];
  /**
   * Vérifie si l'adapter est applicable pour le contexte courant.
   * Retourne true uniquement si l'adapter doit être exécuté.
   */
  eligibilityCheck: (ctx: PipelineContext) => boolean;
  /**
   * Exécute la logique de l'adapter.
   * PEUT muter `ctx` (ex. ajouter des lignes, modifier les totaux).
   * NE DOIT PAS remplacer ctx.input (immuable).
   *
   * @param ctx  - Contexte pipeline mutable
   * @param step - Étape courante (parmi insertAtSteps)
   */
  execute: (ctx: PipelineContext, step: PipelineStep) => void;
}
