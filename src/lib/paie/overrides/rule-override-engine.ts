/**
 * RuleOverrideEngine — fusion immutable des rule sets.
 *
 * Fusionne le rule set standard avec les surcharges profil et convention,
 * sans aucune mutation des objets sources.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §3.1 (RuleOverrideEngine)
 */

import type { RuleSet } from "./types";

export class RuleOverrideEngine {
  /**
   * Fusionne deux rule sets en donnant priorité à `override`.
   *
   * Règles de fusion :
   * - Tableaux : concaténation (standard d'abord, override ensuite)
   * - Booleans : override.value ?? standard.value (override gagne si défini)
   * - assietteSurcharges : spread (override écrase clé par clé)
   *
   * Aucune mutation des arguments en entrée.
   *
   * @example
   * const effectif = RuleOverrideEngine.merge(standard, { disableRGDU: true });
   */
  static merge(standard: RuleSet, override: Partial<RuleSet>): RuleSet {
    return {
      exonerations: [
        ...(standard.exonerations ?? []),
        ...(override.exonerations ?? []),
      ],
      tauxOverrides: [
        ...(standard.tauxOverrides ?? []),
        ...(override.tauxOverrides ?? []),
      ],
      assietteSurcharges: {
        ...(standard.assietteSurcharges ?? {}),
        ...(override.assietteSurcharges ?? {}),
      },
      lignesAdditionnelles: [
        ...(standard.lignesAdditionnelles ?? []),
        ...(override.lignesAdditionnelles ?? []),
      ],
      disableRGDU: override.disableRGDU ?? standard.disableRGDU,
      disableChomage: override.disableChomage ?? standard.disableChomage,
      disableRetraiteComplementaire:
        override.disableRetraiteComplementaire ??
        standard.disableRetraiteComplementaire,
      // Convention override remplace entièrement le régime légal des HS
      majorationsHeuresSup:
        override.majorationsHeuresSup ?? standard.majorationsHeuresSup,
    };
  }

  /**
   * Fusionne N rule sets en séquence (left-to-right).
   * Le dernier a la priorité maximale.
   *
   * @example
   * const effectif = RuleOverrideEngine.mergeAll(standard, profil, convention);
   */
  static mergeAll(...ruleSets: Partial<RuleSet>[]): RuleSet {
    return ruleSets.reduce<RuleSet>(
      (acc, rs) => RuleOverrideEngine.merge(acc, rs),
      {},
    );
  }

  /**
   * Vérifie si un code de cotisation est exonéré dans le rule set effectif.
   */
  static isExonere(ruleSet: RuleSet, cotisationCode: string): boolean {
    return ruleSet.exonerations?.includes(cotisationCode) ?? false;
  }
}
