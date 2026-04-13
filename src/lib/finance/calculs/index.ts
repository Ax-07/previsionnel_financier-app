/**
 * Barrel de la couche calculs/ — rétro-compatibilité.
 *
 * `buildFinCalc` est maintenant défini dans `pipeline/build.ts`.
 * Tous les imports existants `from "@/lib/finance/calculs"` continuent de fonctionner.
 *
 * NE PAS ajouter de logique ici — ce fichier est un barrel pur.
 */

// ── Pipeline (point d'entrée moteur) ─────────────────────────────────────────
export { buildFinCalc } from "@/lib/finance/pipeline/build";

// ── Types ─────────────────────────────────────────────────────────────────────
export type { FinCalcResult } from "@/lib/finance/types/results";
export type { YearAcc } from "@/lib/finance/types/series";
export type { TVACalcResult, TVACalcHelpers } from "@/lib/finance/calculs/calc-tva";
export { calcTVA } from "@/lib/finance/calculs/calc-tva";

// ── Helpers calendrier ────────────────────────────────────────────────────────
export { makeExerciceHelpers, fmtExercice } from "@/lib/finance/pipeline/calendar";
export type { ExerciceHelpers, TemporelCtx } from "@/lib/finance/pipeline/calendar";

// ── Séries temporelles ────────────────────────────────────────────────────────
export {
  zeroSeries, sumSeries, subSeries, sumAll, totalOf, uniformMonthly,
  buildMonthLabels, monthlyToYearAcc, seasonalMonthly, ponctuelMonthly,
  distributeByFrequency, chargeExplMonthly,
} from "./monthly";

// ── Calculs atomiques ─────────────────────────────────────────────────────────
export { calcCA, calcCAByType, calcStocks } from "./ca";
export { calcBfr } from "./bfr";
export { calcCAF } from "./caf";
export { calcISParAnnee, calcAjustementNet } from "./is";
export { calcValeurAjoutee, calcEBE, calcResExpl } from "./sig";
export { calcSeuil } from "./seuil";

// ── TVA, Trésorerie ───────────────────────────────────────────────────────────
export { computeTVAMonthly } from "./tva";
export {
  calcEncaissements, calcDecaissements,
  buildTemporelCtx, dateToSlot, addToYk3,
  shiftYk3, buildFrequenceSeries,
} from "./tresorerie";

// ── Helpers séries ────────────────────────────────────────────────────────────
export * from "./series-helpers";
