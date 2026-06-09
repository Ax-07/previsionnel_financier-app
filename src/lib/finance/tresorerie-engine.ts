/**
 * Moteur de calcul trésorerie — helpers métier extraits de tresorerie.ts.
 *
 * Contient les fonctions de bas niveau manipulant des séries mensuelles
 * spécifiques au tableau de trésorerie prévisionnel.
 */

import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import { zeroSeries, uniformMonthly } from "@/lib/finance/calculs/monthly";

// ── Parsers salariés ──────────────────────────────────────────────────────────

/**
 * Lit un détail mensuel JSON `{ effectif: number[12], brutIndividuel: number[12] }`
 * et retourne la série brut mensuel (effectif × brutIndividuel par mois).
 * Retourne `null` si le détail est absent, mal formé ou entièrement nul.
 */
export function parseDetailMensuel(json: unknown): MonthlySeries | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  const effectif = obj["effectif"];
  const brutIndividuel = obj["brutIndividuel"];
  if (!Array.isArray(effectif) || !Array.isArray(brutIndividuel)) return null;
  if (effectif.length < 12 || brutIndividuel.length < 12) return null;
  const series = Array.from(
    { length: 12 },
    (_, i) => Number(effectif[i] ?? 0) * Number(brutIndividuel[i] ?? 0),
  ) as MonthlySeries;
  const total = series.reduce((a, b) => a + b, 0);
  return total > 0 ? series : null;
}

/**
 * Retourne la série mensuelle brut d'un salarié/dirigeant :
 *  - depuis le détailMensuel JSON si disponible et non nul
 *  - sinon répartition annuelle uniforme sur 12 mois
 *
 * `moisDebut` (0 = Jan) permet de pivoter la série depuis l'indexation
 * calendaire vers l'indexation relative à l'exercice, corrigeant le
 * décalage quand l'exercice ne commence pas en janvier.
 */
export function salarieMonthlyBrut(
  montantAnnuel: number,
  detail: unknown,
  moisDebut = 0,
  nMois = 12,
): MonthlySeries {
  const raw = parseDetailMensuel(detail);
  if (!raw) return uniformMonthly(montantAnnuel, nMois);
  // Pivot : exercice[k] = calendrier[(moisDebut + k) % 12]
  return Array.from({ length: nMois }, (_, k) => raw[(moisDebut + k) % 12]!) as MonthlySeries;
}

// ── Décalages client / fournisseur ────────────────────────────────────────────

/**
 * Décale une série mensuelle de `delayMonths` mois entiers.
 * Le flux qui dépasse M12 est retourné dans `overflow` pour être
 * injecté comme `prevYearOverflow` de l'exercice suivant.
 */
export function shiftSeries(
  series: MonthlySeries,
  delayMonths: number,
  prevYearOverflow?: MonthlySeries,
  outputLength = series.length,
  overflowLength = series.length,
): { shifted: MonthlySeries; overflow: MonthlySeries } {
  const shifted = zeroSeries(outputLength);
  const overflow = zeroSeries(overflowLength);

  if (prevYearOverflow) {
    for (let m = 0; m < outputLength; m++) {
      shifted[m] = (shifted[m] ?? 0) + (prevYearOverflow[m] ?? 0);
    }
  }

  for (let m = 0; m < series.length; m++) {
    const val = series[m] ?? 0;
    const target = m + delayMonths;
    if (target < outputLength) {
      shifted[target] = (shifted[target] ?? 0) + val;
    } else if (target < outputLength + overflowLength) {
      overflow[target - outputLength] = (overflow[target - outputLength] ?? 0) + val;
    }
  }
  return { shifted, overflow };
}

/**
 * Décale une série mensuelle d'un délai fractionnaire (en mois, ex : 1.5 pour 45 j).
 * La fraction est répartie linéairement entre les deux mois adjacents :
 *   - `(1 - frac) × valeur` → mois `m + floor`
 *   - `frac × valeur`       → mois `m + floor + 1`
 *
 * Permet de distinguer 15 j, 30 j, 45 j, 60 j avec une précision demi-mois.
 */
export function shiftSeriesWeighted(
  series: MonthlySeries,
  delayMonths: number,
  prevYearOverflow?: MonthlySeries,
  outputLength = series.length,
  overflowLength = series.length,
): { shifted: MonthlySeries; overflow: MonthlySeries } {
  const shifted = zeroSeries(outputLength);
  const overflow = zeroSeries(overflowLength);

  if (prevYearOverflow) {
    for (let m = 0; m < outputLength; m++) {
      shifted[m] = (shifted[m] ?? 0) + (prevYearOverflow[m] ?? 0);
    }
  }

  const floor = Math.floor(delayMonths);
  const frac = delayMonths - floor;
  const w0 = 1 - frac;
  const w1 = frac;

  for (let m = 0; m < series.length; m++) {
    const val = series[m] ?? 0;
    if (val === 0) continue;

    if (w0 > 0) {
      const t0 = m + floor;
      if (t0 < outputLength) shifted[t0] = (shifted[t0] ?? 0) + val * w0;
      else if (t0 < outputLength + overflowLength) overflow[t0 - outputLength] = (overflow[t0 - outputLength] ?? 0) + val * w0;
    }

    if (w1 > 0) {
      const t1 = m + floor + 1;
      if (t1 < outputLength) shifted[t1] = (shifted[t1] ?? 0) + val * w1;
      else if (t1 < outputLength + overflowLength) overflow[t1 - outputLength] = (overflow[t1 - outputLength] ?? 0) + val * w1;
    }
  }
  return { shifted, overflow };
}

// ── Soldes ────────────────────────────────────────────────────────────────────

/**
 * Calcule le solde de trésorerie cumulé mois par mois.
 *
 * @param variation    - flux net mensuel (encaissements − décaissements)
 * @param initialSolde - solde d'ouverture de l'exercice
 */
export function computeSoldeMonthly(
  variation: MonthlySeries,
  initialSolde: number,
): { soldePrecedent: MonthlySeries; soldeFinal: MonthlySeries } {
  const soldePrecedent = zeroSeries(variation.length);
  const soldeFinal = zeroSeries(variation.length);
  let running = initialSolde;
  for (let m = 0; m < variation.length; m++) {
    soldePrecedent[m] = running;
    soldeFinal[m] = running + (variation[m] ?? 0);
    running = soldeFinal[m]!;
  }
  return { soldePrecedent, soldeFinal };
}

// ── IS ────────────────────────────────────────────────────────────────────────

/**
 * Répartit l'IS annuel en 4 acomptes trimestriels versés aux mois 3, 6, 9 et 12
 * (index 2, 5, 8, 11 en base zéro).
 */
export function isQuarterly(isTotal: number, nMois = 12): MonthlySeries {
  if (isTotal <= 0) return zeroSeries(nMois);
  const q = isTotal / 4;
  const s = zeroSeries(nMois);
  for (const idx of quarterSlots(nMois, true)) s[idx] = (s[idx] ?? 0) + q;
  return s;
}

/**
 * IS mensuel pour le tableau de trésorerie — 3 acomptes dans l'exercice courant
 * (M3, M6, M9 = indices 2, 5, 8) + solde de l'exercice précédent (M12 = index 11).
 *
 * Cohérent avec dettesIS = IS/4 dans le BFR : la dette fin d'exercice correspond
 * au 4ème acompte décaissé en M12 de l'exercice suivant (solde de régularisation).
 *
 * Formule cash IS : IS_charge + dette_début − dette_fin
 *   = IS_Y + (IS_{Y-1}/4) − (IS_Y/4) = 3/4 IS_Y + IS_{Y-1}/4
 *
 * @param isCurrent  IS de l'exercice en cours (3 acomptes dans l'année)
 * @param isPrevious IS de l'exercice précédent (solde ← 4ème acompte en M12)
 */
export function isQuarterlyDecaissement(isCurrent: number, isPrevious: number, nMois = 12): MonthlySeries {
  const s = zeroSeries(nMois);
  if (isCurrent > 0) {
    const q = isCurrent / 4;
    for (const idx of quarterSlots(nMois, false)) s[idx] = (s[idx] ?? 0) + q;
  }
  if (isPrevious > 0) s[nMois - 1] = (s[nMois - 1] ?? 0) + isPrevious / 4;
  return s;
}

function quarterSlots(nMois: number, includeLast: boolean): number[] {
  if (nMois === 12) return includeLast ? [2, 5, 8, 11] : [2, 5, 8];
  const factors = includeLast ? [0.25, 0.5, 0.75, 1] : [0.25, 0.5, 0.75];
  return Array.from(
    new Set(
      factors
        .map((f) => Math.min(nMois - 1, Math.max(0, Math.ceil(nMois * f) - 1)))
        .filter((idx) => idx >= 0),
    ),
  );
}
