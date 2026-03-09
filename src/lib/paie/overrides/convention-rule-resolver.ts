/**
 * ConventionRuleResolver — résolution des surcharges conventionnelles.
 *
 * Étape 4 du pipeline (spec §13).
 * Les surcharges réelles seront définies dans lib/paie/conventions/ (Lot 6).
 * Ce resolver est le point d'entrée du noyau — il délègue aux catalogues.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §11
 */

import type { RuleSet } from "./types";

/**
 * Registre interne des surcharges par code IDCC.
 * Les modules de convention (Lot 6) s'enregistrent via register().
 */
const conventionRuleSets = new Map<string, Partial<RuleSet>>();

export class ConventionRuleResolver {
  /**
   * Résout les surcharges conventionnelles pour un code IDCC donné.
   *
   * @param conventionCode - Code IDCC (ex. "1486" pour Syntec, "1979" pour HCR)
   *                         ou null/undefined si aucune convention saisie.
   * @returns Surcharges RuleSet (objet vide si convention inconnue ou absente)
   */
  static resolve(conventionCode: string | null | undefined): Partial<RuleSet> {
    if (!conventionCode) return {};
    return conventionRuleSets.get(conventionCode) ?? {};
  }

  /**
   * Enregistre les surcharges d'une convention collective dans le resolver.
   *
   * Appelé automatiquement lors de l'import d'un module de convention (Lot 6).
   * Idempotent : un second appel avec le même IDCC remplace l'entrée existante.
   *
   * @param idcc    - Code IDCC de la convention (ex. "1486")
   * @param ruleSet - Surcharges à appliquer pour cette convention
   *
   * @example
   * // Dans lib/paie/conventions/syntec.ts (Lot 6)
   * ConventionRuleResolver.register("1486", {
   *   lignesAdditionnelles: [{ code: "syntec_prime_vacances", ... }],
   * });
   */
  static register(idcc: string, ruleSet: Partial<RuleSet>): void {
    conventionRuleSets.set(idcc, ruleSet);
  }

  /**
   * Retourne la liste des codes IDCC actuellement enregistrés.
   * Utile pour la page admin /admin/conventions (Lot 6).
   */
  static listRegistered(): string[] {
    return [...conventionRuleSets.keys()].sort();
  }

  /**
   * Supprime toutes les conventions enregistrées (utile en tests).
   */
  static clearAll(): void {
    conventionRuleSets.clear();
  }
}
