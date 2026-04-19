/**
 * Helpers de construction des lignes CAF.
 * @module aggregations/caf/helpers
 */

import type { YearKey } from "@/lib/finance/utils";
import type { CafRow } from "./types";

export function mkRow(
  key: string,
  label: string,
  sign: CafRow["sign"],
  style: CafRow["style"],
  vals: Record<YearKey, number>,
  options?: { hideIfZero?: boolean; children?: CafRow[] },
): CafRow {
  return {
    key,
    label,
    sign,
    style,
    values: {
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    ...(options?.children && options.children.length > 0 ? { children: options.children } : {}),
  };
}
