/**
 * Moteur de calcul de la Réduction Générale Dégressive Unique (RGDU) 2026.
 *
 * La RGDU est une réduction des cotisations patronales s'appliquant aux
 * salaires inférieurs à 3 fois le SMIC (salariés éligibles).
 *
 * Sources : Urssaf, BOSS — paramètres 2026.
 */

import { PARAMS_2026, RGDU_2026 } from "@/lib/paie/params/2026";
import type { LigneCotisation, SalarieInput, EntrepriseInput } from "@/lib/paie/types";
import type { AssiettesResult } from "@/lib/paie/engine/assiettes";
import { roundMontant, roundCoeff, roundAssiette } from "@/lib/paie/engine/arrondi";

// ─────────────────────────────────────────────────────────────────────────────
// Éligibilité
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie si le salarié est éligible à la RGDU.
 * Conditions :
 *   - Contrat de travail de droit commun (pas stage)
 *   - Rémunération annuelle brute < 3 × SMIC annuel calculé
 *
 * En cas de proratisation (entrée/sortie en cours de mois), le SMIC de référence
 * est lui aussi proratisé pour une comparaison équitable (méthode Urssaf).
 */
export function estEligibleRGDU(
  salarié: SalarieInput,
  brutMensuelEffectif: number,
  facteurProrata = 1,
): boolean {
  if (salarié.typeContrat === "stage") return false;

  // SMIC annuel = SMIC horaire × heures contractuelles × 12 (Urssaf)
  const smicAnnuel = PARAMS_2026.smicHoraire * salarié.heuresContrat * 12;
  const brutAnnuelRef = brutMensuelEffectif * 12;
  const smicAnnuelCalc = smicAnnuel * facteurProrata;
  const seuil = RGDU_2026.facteurSortie * smicAnnuelCalc;

  return brutAnnuelRef < seuil;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul du coefficient RGDU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le coefficient de réduction RGDU.
 *
 * Formule :
 *   coefficient = T_min + (T_delta × [0,5 × (3 × SMIC_annuel / remun_annuelle - 1)] ^ P)
 *
 * Le résultat est arrondi à 4 décimales et plafonné au coefficient maximum.
 */
export function calcCoeffRGDU(
  brutMensuelEffectif: number,
  estGrandEntreprise: boolean,
  heuresContrat: number,
): number {
  // SMIC annuel = SMIC horaire × heures contractuelles × 12 (Urssaf)
  const smicAnnuel = PARAMS_2026.smicHoraire * heuresContrat * 12;
  const remunAnnuelle = brutMensuelEffectif * 12;

  const { tMin, p, facteurSortie } = RGDU_2026;
  const tDelta = estGrandEntreprise ? RGDU_2026.tDeltaSup50 : RGDU_2026.tDeltaInf50;
  const coeffMax = estGrandEntreprise ? RGDU_2026.coeffMaxSup50 : RGDU_2026.coeffMaxInf50;

  const facteur = 0.5 * ((facteurSortie * smicAnnuel) / remunAnnuelle - 1);

  if (facteur <= 0) return 0; // au-dessus du seuil de sortie

  const coeff = tMin + tDelta * Math.pow(facteur, p);
  return roundCoeff(Math.min(coeff, coeffMax));
}

// ─────────────────────────────────────────────────────────────────────────────
// Montant RGDU total
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le montant annuel de la RGDU puis le proratise en mensuel.
 * La RGDU est calculée sur la rémunération annuelle brute.
 */
export function calcMontantRGDU(
  brutMensuelEffectif: number,
  coefficient: number,
): number {
  const remunAnnuelle = brutMensuelEffectif * 12;
  const rgduAnnuel = remunAnnuelle * coefficient;
  return roundMontant(rgduAnnuel / 12);
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée public : ligne RGDU dans le bulletin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule et retourne la ligne RGDU du bulletin, ou null si le salarié n'est pas éligible.
 *
 * La RGDU est une ligne de type "exonération" côté employeur (montant négatif sur les charges patronales).
 */
export function calcRGDU(
  assiettes: AssiettesResult,
  salarié: SalarieInput,
  entreprise: EntrepriseInput,
): LigneCotisation | null {
  const { brutSoumis, facteurProrata } = assiettes;

  if (!estEligibleRGDU(salarié, brutSoumis, facteurProrata)) return null;

  const estGrand = entreprise.effectif >= 50;
  const coefficient = calcCoeffRGDU(brutSoumis, estGrand, salarié.heuresContrat);

  if (coefficient <= 0) return null;

  const montantMensuel = calcMontantRGDU(brutSoumis, coefficient);

  // Pour la simulation, on retourne une ligne unique d'exonération globale
  // (côté employeur uniquement — montantSalarie = 0)
  return {
    code: "RGDU",
    libelle: `Réduction générale dégressive (coefficient ${coefficient.toFixed(4)})`,
    famille: "rgdu",
    organisme: "Urssaf",
    assiette: roundAssiette(brutSoumis),
    tranche: "totalite",
    tauxSalarie: 0,
    tauxEmployeur: -coefficient,
    montantSalarie: 0,
    // La réduction est un crédit pour l'employeur (on la stocke en positif)
    montantEmployeur: -montantMensuel,
    deductible: false,
    regleCode: `RGDU_2026_${estGrand ? "SUP50" : "INF50"}`,
  };
}
