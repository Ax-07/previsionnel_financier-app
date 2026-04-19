/**
 * Helpers de construction des lignes du Bilan.
 * @module aggregations/bilan/helpers
 */

import type { YearAcc } from "@/lib/finance/utils";
import type { BilanRow } from "./types";


export function mkRow(
  key: string,
  label: string,
  style: BilanRow["style"],
  vals: YearAcc,
  options?: { indent?: number; hideIfZero?: boolean },
): BilanRow {
  return {
    key,
    label,
    style,
    indent: options?.indent,
    hideIfZero: options?.hideIfZero,
    values: {
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
  };
}
