/**
 * Algorithme de conversion net cible → brut.
 *
 * Méthode : dichotomie bornée avec tolérance 0,01 €.
 * Le calcul complet du bulletin est exécuté à chaque itération.
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";
import { PARAMS_2026 } from "@/lib/paie/params/2026";

// Import différé pour éviter la dépendance circulaire
type SimulateFn = (input: SimulationInput) => SimulationResultat;

const TOLERANCE = 0.01;
const MAX_ITERATIONS = 80;

/**
 * Converge vers le brut mensuel correspondant au net à payer cible.
 *
 * @param netCible     - Net à payer cible (€ / mois)
 * @param baseInput    - Paramètres de simulation (hors brutMensuel)
 * @param simulateFn   - Pipeline de simulation complet
 * @returns Résultat de simulation avec le brut convergeant, ou null si échec
 */
export function netToGross(
  netCible: number,
  baseInput: SimulationInput,
  simulateFn: SimulateFn,
): SimulationResultat | null {
  if (netCible <= 0) return null;

  // Initialisation : borne basse = SMIC, borne haute = net × 2,5 (approximation linéaire)
  let lo = PARAMS_2026.smicMensuel * 0.5;
  let hi = Math.max(netCible * 2.5, PARAMS_2026.smicMensuel * 5);
  let best: SimulationResultat | null = null;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    const mid = (lo + hi) / 2;

    const input: SimulationInput = {
      ...baseInput,
      salarié: { ...baseInput.salarié, brutMensuel: mid },
    };

    const result = simulateFn(input);
    const ecart = result.netAPayer - netCible;

    if (Math.abs(ecart) <= TOLERANCE) {
      return result;
    }

    best = result;

    if (ecart < 0) {
      // Net trop faible → augmenter le brut
      lo = mid;
    } else {
      // Net trop élevé → diminuer le brut
      hi = mid;
    }

    // Condition d'arrêt : intervalle trop petit (< 0,01 €)
    if (hi - lo < TOLERANCE / 10) break;

    iterations++;
  }

  // Retourner la meilleure approximation même si tolérance non atteinte
  return best;
}
