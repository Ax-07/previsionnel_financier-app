/**
 * Moteur de maintien conventionnel (Lot 5).
 *
 * Le maintien conventionnel peut améliorer le droit légal sur trois axes :
 *   - supprimer ou réduire la carence employeur ;
 *   - augmenter le taux de maintien (ex. 100 % au lieu de 90 %) ;
 *   - augmenter la durée de maintien.
 *
 * Ce module est alimenté par ConventionRuleResolver (Lot 6), qui injecte
 * les paramètres de maintien via le `conventionCode`. Pour l'instant, seul
 * un mécanisme de surcharge paramétrique est défini — les modules de chaque
 * convention IDCC (Lot 6) y brancheront leurs règles.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §11.2 (maintiens conventionnels)
 */

import type { AbsenceType, PolitiqueMaintien } from "@/lib/paie/absence/types";
import type { ResultatMaintenLegal } from "@/lib/paie/absence/legal-maintenance";
import { PARAMS_IJSS_2026 } from "@/lib/paie/params/ijss-2026";

// ─────────────────────────────────────────────────────────────────────────────
// Surcharges conventionnelles de maintien
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paramètres de maintien conventionnel pour un type d'absence.
 * Chaque champ est optionnel : seules les améliorations par rapport au légal
 * sont à renseigner.
 */
export interface ConventionMaintenanceParams {
  /** Ancienneté minimale requise (en mois) pour bénéficier du maintien conventionnel */
  ancienneteMinimumMois?: number;
  /** Réduit ou supprime la carence employeur (ex. 0 pour supprimer les 7 jours légaux) */
  joursCarenceEmployeur?: number;
  /** Réduit la carence SS (rare, mais certaines CCN le prévoient) */
  joursCarenceSS?: number;
  /** Durée de maintien à taux plein (si > légal) */
  dureeTauxPleinJours?: number;
  /** Durée de maintien à taux partiel (si > légal) */
  dureeTauxPartielJours?: number;
  /** Taux de maintien plein (ex. 1.00 pour 100 %) */
  tauxMaintienPlein?: number;
  /** Taux de maintien partiel */
  tauxMaintienPartiel?: number;
  /** IJSS déduites du complément employeur (principe de subrogation) */
  sousDedictionIjss?: boolean;
}

/**
 * Politique de maintien d'une convention : une map AbsenceType → paramètres.
 */
export type ConventionMaintenancePolicies = Partial<
  Record<AbsenceType, ConventionMaintenanceParams>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Registre des conventions
// ─────────────────────────────────────────────────────────────────────────────

/** Registre en mémoire des politiques de maintien par IDCC */
const CONVENTION_MAINTENANCE_REGISTRY = new Map<string, ConventionMaintenancePolicies>();

/**
 * Enregistre (ou remplace) la politique de maintien d'une convention.
 * Appelé par les modules convention du Lot 6.
 */
export function registerConventionMaintenance(
  idcc: string,
  policies: ConventionMaintenancePolicies,
): void {
  CONVENTION_MAINTENANCE_REGISTRY.set(idcc, policies);
}

/**
 * Liste les IDCC ayant une politique de maintien enregistrée.
 */
export function listConventionsWithMaintenance(): string[] {
  return Array.from(CONVENTION_MAINTENANCE_REGISTRY.keys());
}

// ─────────────────────────────────────────────────────────────────────────────
// Résolution de la politique effective
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la politique de maintien la plus favorable entre le légal et le
 * conventionnel pour un type d'absence donné.
 *
 * Règle : le conventionnel ne peut être que plus favorable que le légal
 * (jamais moins favorable — art. L2251-1 C. Trav.).
 */
export function getPolitiqueMaintenConventionnel(
  absenceType: AbsenceType,
  politiqueLegale: PolitiqueMaintien,
  conventionCode?: string,
): PolitiqueMaintien {
  if (!conventionCode) return politiqueLegale;

  const policies = CONVENTION_MAINTENANCE_REGISTRY.get(conventionCode);
  if (!policies) return politiqueLegale;

  const surcharge = policies[absenceType];
  if (!surcharge) return politiqueLegale;

  // Fusion : le conventionnel améliore le légal sur chaque paramètre
  return {
    joursCarenceSS: Math.min(
      politiqueLegale.joursCarenceSS,
      surcharge.joursCarenceSS ?? politiqueLegale.joursCarenceSS,
    ),
    joursCarenceEmployeur: Math.min(
      politiqueLegale.joursCarenceEmployeur,
      surcharge.joursCarenceEmployeur ?? politiqueLegale.joursCarenceEmployeur,
    ),
    dureeTauxPleinJours: Math.max(
      politiqueLegale.dureeTauxPleinJours,
      surcharge.dureeTauxPleinJours ?? politiqueLegale.dureeTauxPleinJours,
    ),
    dureeTauxPartielJours: Math.max(
      politiqueLegale.dureeTauxPartielJours,
      surcharge.dureeTauxPartielJours ?? politiqueLegale.dureeTauxPartielJours,
    ),
    tauxMaintienPlein: Math.max(
      politiqueLegale.tauxMaintienPlein,
      surcharge.tauxMaintienPlein ?? politiqueLegale.tauxMaintienPlein,
    ),
    tauxMaintienPartiel: Math.max(
      politiqueLegale.tauxMaintienPartiel,
      surcharge.tauxMaintienPartiel ?? politiqueLegale.tauxMaintienPartiel,
    ),
    sousDedictionIjss: politiqueLegale.sousDedictionIjss,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul du complément conventionnel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le complément de maintien conventionnel (delta entre conventionnel
 * et légal, en brut).
 *
 * @returns montant brut additionnel lié à la convention (≥ 0)
 */
export function calculerComplementConventionnel(
  resultLegal: ResultatMaintenLegal,
  absenceJoursCivils: number,
  brutMensuelTheorique: number,
  politiqueConventionnelle: PolitiqueMaintien,
): number {
  if (!resultLegal.droitAuMaintien) return 0;

  const brutJournalier = brutMensuelTheorique / PARAMS_IJSS_2026.diviseurSjrMensuel;

  // Recalcul avec la politique conventionnelle
  const joursApresCarenceConv = Math.max(
    0,
    absenceJoursCivils - politiqueConventionnelle.joursCarenceEmployeur,
  );
  const joursPleinConv = Math.min(
    joursApresCarenceConv,
    politiqueConventionnelle.dureeTauxPleinJours,
  );
  const joursApresPleinConv = Math.max(0, joursApresCarenceConv - joursPleinConv);
  const joursPartielConv = Math.min(
    joursApresPleinConv,
    politiqueConventionnelle.dureeTauxPartielJours,
  );

  const maintienConvTotal =
    brutJournalier * joursPleinConv * politiqueConventionnelle.tauxMaintienPlein +
    brutJournalier * joursPartielConv * politiqueConventionnelle.tauxMaintienPartiel;

  // Delta = conventionnel - légal (jamais négatif)
  return Math.max(0, maintienConvTotal - resultLegal.maintienBrutTotal);
}
