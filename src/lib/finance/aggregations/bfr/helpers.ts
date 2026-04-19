/**
 * Helpers de construction des lignes BFR.
 * @module aggregations/bfr/helpers
 */

import type { YearKey4 } from "@/lib/finance/utils";
import type { BfrRow } from "./types";


export function mkRow(
  key: string,
  label: string,
  sign: BfrRow["sign"],
  style: BfrRow["style"],
  vals: Record<YearKey4, number>,
  options?: { hideIfZero?: boolean; children?: BfrRow[] },
): BfrRow {
  return {
    key,
    label,
    sign,
    style,
    values: {
      y0: { amount: vals.y0 },
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    hideIfZero: options?.hideIfZero,
    children: options?.children,
  };
}
