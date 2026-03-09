/**
 * Profil stage — règles sociales spécifiques 2026.
 *
 * Le stagiaire n'est pas un salarié. Le moteur utilise un profil distinct :
 *   - Pas d'assurance chômage (ni salarié ni employeur)
 *   - Pas de retraite complémentaire standard
 *   - Pas de RGDU
 *   - Franchise de cotisations SS sur la fraction ≤ seuil de gratification
 *   - CSG/CRDS seulement sur la fraction excédant le seuil
 *
 * La gratification mensuelle exonérée = 4,50 € × heures légales (151,67 h) = 682,52 €/mois.
 */

import { PARAMS_2026 } from "@/lib/paie/params/2026";
import type { LigneCotisation, SalarieInput } from "@/lib/paie/types";

/**
 * Codes de cotisations à supprimer pour un stagiaire.
 * Les lignes avec ces codes sont retirées du bulletin.
 */
export const CODES_EXCLUS_STAGE = new Set([
  "CHOMAGE_PAT",
  "AGS_PAT",
  "ARRCO_T1_SAL",
  "ARRCO_T2_SAL",
  "CEG_T1",
  "CEG_T2",
  "CET",
  "APEC",
  // Assurance maladie, vieillesse : exclues sous le seuil
  "MALADIE_PAT",
  "CSA_PAT",
  "VIEILL_PLAF_SAL",
  "VIEILL_DEPLAF",
  "ALLOC_FAM_PAT",
  "FNAL_PAT",
  "DIAL_SOC_PAT",
  "ATMP_PAT",
]);

/**
 * Seuil mensuel de franchise de cotisations pour un stage.
 * gratifStageHoraire × heuresLegalesMensuelles.
 */
export function seuilFranchiseStage(): number {
  return Math.round(
    PARAMS_2026.gratifStageHoraire * PARAMS_2026.heuresLegalesMensuelles * 100,
  ) / 100;
}

/**
 * Filtre les lignes de cotisations pour un stagiaire.
 *
 * - Supprime les lignes non applicables aux stagiaires.
 * - Si la gratification est entièrement sous le seuil : supprime aussi CSG/CRDS.
 * - Si la gratification dépasse le seuil : conserve CSG/CRDS sur la fraction excédentaire.
 */
export function filtrerLignesStage(
  lignes: LigneCotisation[],
  salarié: SalarieInput,
): LigneCotisation[] {
  const seuil = seuilFranchiseStage();
  const brut = salarié.brutMensuel;

  if (brut <= seuil) {
    // Aucune cotisation n'est due sous le seuil
    return [];
  }

  // Au-dessus du seuil : CSG/CRDS seulement sur la fraction excédentaire
  const fractionExcedent = (brut - seuil) / brut;

  return lignes
    .filter((l) => !CODES_EXCLUS_STAGE.has(l.code))
    .map((l) => {
      if (
        l.famille === "csg_deductible" ||
        l.famille === "csg_non_deductible" ||
        l.famille === "crds"
      ) {
        const nouvelleAssiette = Math.round(l.assiette * fractionExcedent * 100) / 100;
        return {
          ...l,
          assiette: nouvelleAssiette,
          montantSalarie: Math.round(nouvelleAssiette * l.tauxSalarie * 100) / 100,
          montantEmployeur: Math.round(nouvelleAssiette * l.tauxEmployeur * 100) / 100,
        };
      }
      return l;
    });
}
