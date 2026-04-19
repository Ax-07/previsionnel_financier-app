import type { YearKey } from "@/lib/finance/utils";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import type { VATValue, VATRow, VATRowStyle } from "./types";
import { dateToExercise } from "../helpers/shared-helpers";
export { dateToExercise };

export function vatValue(months: MonthlySeries): VATValue {
  return { months, total: months.reduce((a, b) => a + b, 0) };
}

export function vatRow(
  key: string,
  label: string,
  vals: Record<YearKey, MonthlySeries>,
  style: VATRowStyle,
  hideIfZero = false,
  children?: VATRow[],
): VATRow {
  return {
    key,
    label,
    values: {
      y1: vatValue(vals.y1),
      y2: vatValue(vals.y2),
      y3: vatValue(vals.y3),
    },
    style,
    hideIfZero,
    ...(children && children.length > 0 ? { children } : {}),
  };
}
