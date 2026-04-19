/**
 * Profil apprentissage — exonérations spécifiques 2026.
 *
 * Deux générations de contrats :
 *   - avant le 1er mars 2025 : exonération SS salariale + CSG/CRDS jusqu'à 79 % du SMIC
 *   - depuis le 1er mars 2025 : exonération SS salariale + CSG/CRDS jusqu'à 50 % du SMIC
 *
 * L'exonération s'applique uniquement sur la fraction du brut ≤ seuil.
 * Au-delà, le régime général s'applique sur la fraction excédentaire.
 */

import {
  PARAMS_2026,
  EXONERATION_APPRENTISSAGE_2026,
  REMUN_MIN_APPRENTISSAGE_2026,
} from "@/lib/paie/params/2026";
import type { LigneCotisation, FamilleCotisation, SalarieInput } from "@/lib/paie/types";
import { roundMontant, roundAssiette } from "@/lib/paie/engine/arrondi";

/**
 * Retourne la tranche d'âge pour la grille de rémunération minimale.
 */
export function trancheAge(age: number): "16-17" | "18-20" | "21-25" | "26+" {
  if (age <= 17) return "16-17";
  if (age <= 20) return "18-20";
  if (age <= 25) return "21-25";
  return "26+";
}

/**
 * Rémunération minimale légale pour un apprenti (€ / mois).
 */
export function remunMinApprenti(
  annee: 1 | 2 | 3,
  age: number,
): number {
  const key = `${annee}_${trancheAge(age)}`;
  const fraction = REMUN_MIN_APPRENTISSAGE_2026[key] ?? 1;
  return roundMontant(fraction * PARAMS_2026.smicMensuel);
}

/**
 * Calcule les lignes d'exonération de cotisations salariales et CSG/CRDS
 * applicables à un apprenti selon la génération de son contrat.
 *
 * Returns un tableau de lignes d'exonération (montantSalarie négatif).
 */
export function exonerationsApprenti(
  salarié: SalarieInput,
  lignesBase: LigneCotisation[],
): LigneCotisation[] {
  if (salarié.typeContrat !== "apprentissage" || !salarié.apprentissage) {
    return [];
  }

  const { generation } = salarié.apprentissage;
  const { seuilExoFraction } = EXONERATION_APPRENTISSAGE_2026[generation];
  const seuilExo = seuilExoFraction * PARAMS_2026.smicMensuel;
  const brutSoumis = salarié.brutMensuel;

  // Si le brut est totalement au-dessus du seuil, aucune exonération SS/CSG
  if (brutSoumis <= 0) return [];

  // Proportion du brut couverte par l'exonération
  const fractionExo = Math.min(1, seuilExo / brutSoumis);

  const codesExoSalariales = new Set<string>([
    "VIEILL_PLAF_SAL",
    "VIEILL_DEPLAF",
    "CSG_DED_SAL",
    "CSG_NDED_SAL",
    "CRDS_SAL",
  ]);

  const exonerations: LigneCotisation[] = [];

  for (const l of lignesBase) {
    if (!codesExoSalariales.has(l.code)) continue;
    if (l.montantSalarie === 0) continue;

    const montantExo = roundMontant(l.montantSalarie * fractionExo);
    if (montantExo === 0) continue;

    exonerations.push({
      code: `EXO_APPRENT_${l.code}`,
      libelle: `Exonération apprentissage — ${l.libelle}`,
      famille: "exoneration" as FamilleCotisation,
      organisme: "Urssaf",
      assiette: roundAssiette(l.assiette * fractionExo),
      tranche: l.tranche,
      tauxSalarie: -l.tauxSalarie,
      tauxEmployeur: 0,
      montantSalarie: -montantExo,
      montantEmployeur: 0,
      deductible: l.deductible,
      regleCode: `EXO_APPRENT_${generation.toUpperCase()}_2026`,
    });
  }

  return exonerations;
}
