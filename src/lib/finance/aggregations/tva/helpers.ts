import type { YearKey } from "@/lib/finance/utils";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import type { VATValue, VATRow, VATRowStyle } from "./types";

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

/** Retourne l'exercice (y1/y2/y3) et l'index de mois (0–11) pour une date donnée. */
export function dateToExercise(
  dateDemarrage: Date,
  d: Date,
): { yk: YearKey | null; monthIndex: number } {
  const starts = [
    new Date(dateDemarrage.getFullYear(), dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 1, dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 2, dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 3, dateDemarrage.getMonth(), 1),
  ];
  const YKS: YearKey[] = ["y1", "y2", "y3"];

  for (let i = 0; i < 3; i++) {
    if (d >= starts[i]! && d < starts[i + 1]!) {
      const yearDiff = d.getFullYear() - starts[i]!.getFullYear();
      const monthDiff = d.getMonth() - starts[i]!.getMonth();
      const monthIndex = Math.min(11, Math.max(0, yearDiff * 12 + monthDiff));
      return { yk: YKS[i]!, monthIndex };
    }
  }
  return { yk: null, monthIndex: -1 };
}
