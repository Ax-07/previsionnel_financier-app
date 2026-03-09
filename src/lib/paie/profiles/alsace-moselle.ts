/**
 * Profil Alsace-Moselle — régime local maladie 2026.
 *
 * Le régime local d'assurance maladie Alsace-Moselle (départements 57, 67, 68)
 * implique une cotisation maladie supplémentaire à la charge du SALARIÉ :
 *   - Taux 2026 : 1,50 % sur la totalité du brut soumis
 *   - Assiette identique à la cotisation maladie régime général
 *   - Contrepartie : meilleures prestations maladie (90 % vs 60 % régime général)
 *
 * L'employeur ne supporte AUCUNE charge complémentaire spécifique.
 *
 * Source : https://www.regime-local.fr — réglementé par l'ANS.
 */

import type { LigneCotisation } from "@/lib/paie/types";
import { roundMontant } from "@/lib/paie/engine/arrondi";

/** Taux de cotisation maladie régime local Alsace-Moselle 2026 */
export const TAUX_REGIME_LOCAL_2026 = 0.015; // 1,50 %

/**
 * Ajoute la cotisation maladie supplémentaire du régime local Alsace-Moselle.
 *
 * @param lignes      - Liste de lignes déjà calculées (régime général)
 * @param brutSoumis  - Brut soumis à cotisations
 * @returns Nouvelles lignes à ajouter (liste d'un seul élément)
 */
export function cotisationAlsaceMoselle(
  brutSoumis: number,
): LigneCotisation[] {
  if (brutSoumis <= 0) return [];

  const montantSalarie = roundMontant(brutSoumis * TAUX_REGIME_LOCAL_2026);

  return [
    {
      code: "MALADIE_LOCAL_SAL",
      libelle: "Assurance maladie — régime local Alsace-Moselle",
      famille: "assurance_maladie",
      organisme: "CNAS (Régime local)",
      assiette: roundMontant(brutSoumis),
      tranche: "totalite",
      tauxSalarie: TAUX_REGIME_LOCAL_2026,
      tauxEmployeur: 0,
      montantSalarie,
      montantEmployeur: 0,
      deductible: false,
      regleCode: "ALSACE_MOSELLE_MALADIE_2026",
    },
  ];
}
