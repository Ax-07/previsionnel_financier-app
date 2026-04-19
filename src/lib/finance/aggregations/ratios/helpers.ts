/**
 * Helpers de construction des lignes Ratios.
 * @module aggregations/ratios/helpers
 */

import type { YearKey } from "@/lib/finance/utils";
import type { RatioRow } from "./types";


/** Division sécurisée — renvoie null si le dénominateur vaut 0 */
export function safeDiv(num: number, den: number): number | null {
  return Math.abs(den) < 0.001 ? null : num / den;
}

export function mkRow(
  key: string,
  label: string,
  unit: string,
  decimals: number,
  vals: Record<YearKey, number | null>,
): RatioRow {
  return {
    key,
    label,
    unit,
    decimals,
    values: {
      y1: { value: vals.y1 },
      y2: { value: vals.y2 },
      y3: { value: vals.y3 },
    },
  };
}
