/**
 * Helpers de présentation du tableau de trésorerie.
 * @module aggregations/tresorerie/helpers
 */

import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import type { YearKey } from "@/lib/finance/utils";
import type { TresorerieValue, TresorerieRow, TresorerieRowStyle, Yk3 } from "@/lib/finance/tresorerie-types";

export function tresoValue(
  months: MonthlySeries,
  endValue?: boolean,
  firstValue?: boolean,
): TresorerieValue {
  const total = firstValue
    ? (months[0] ?? 0)
    : endValue
      ? (months[months.length - 1] ?? 0)
      : months.reduce((a, b) => a + b, 0);
  return { months, total };
}

export function mkRow(
  key: string,
  label: string,
  style: TresorerieRowStyle,
  vals: Yk3,
  options?: {
    hideIfZero?: boolean;
    totalIsEndValue?: boolean;
    /** Pour les soldes d'ouverture : le total annuel = valeur du mois 0 (début d'exercice). */
    totalIsFirstValue?: boolean;
    children?: TresorerieRow[];
    defaultCollapsed?: boolean;
  },
): TresorerieRow {
  const endV = options?.totalIsEndValue;
  const firstV = options?.totalIsFirstValue;
  return {
    key,
    label,
    style,
    hideIfZero: options?.hideIfZero,
    totalIsEndValue: options?.totalIsEndValue,
    children: options?.children,
    defaultCollapsed: options?.defaultCollapsed,
    values: {
      y1: tresoValue(vals.y1, endV, firstV),
      y2: tresoValue(vals.y2, endV, firstV),
      y3: tresoValue(vals.y3, endV, firstV),
    },
  };
}

export function sectionRow(
  key: string,
  label: string,
  durees: Record<YearKey, number> = { y1: 12, y2: 12, y3: 12 },
): TresorerieRow {
  const empty: Yk3 = {
    y1: new Array(durees.y1).fill(0) as MonthlySeries,
    y2: new Array(durees.y2).fill(0) as MonthlySeries,
    y3: new Array(durees.y3).fill(0) as MonthlySeries,
  };
  return mkRow(key, label, "section", empty);
}
