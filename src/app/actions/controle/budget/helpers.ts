import type { YearKey } from "@/lib/finance/utils";
import {
  totalOf,
  distributeByFrequency,
  type MonthlySeries,
  type MonthlyAcc,
} from "@/lib/finance/calculs/monthly";
import type { BudgetValue, BudgetNode, BudgetNodeStyle } from "./types";

export function isAllZeroSeries(vals: MonthlyAcc): boolean {
  return (["y1", "y2", "y3"] as YearKey[]).every((k) =>
    vals[k].every((v) => v === 0),
  );
}

export function budgetValue(months: MonthlySeries): BudgetValue {
  return { months, total: totalOf(months) };
}

export function buildBudgetMonthLabels(startMonth: number, startYear: number): string[] {
  const FR_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return Array.from({ length: 12 }, (_, i) => {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    return `${FR_MONTHS[m]} ${y}`;
  });
}

export function budgetNode(
  key: string,
  label: string,
  vals: MonthlyAcc,
  style: BudgetNodeStyle,
  children?: BudgetNode[],
  hideIfZero = false,
): BudgetNode {
  return {
    key,
    label,
    values: {
      y1: budgetValue(vals.y1),
      y2: budgetValue(vals.y2),
      y3: budgetValue(vals.y3),
    },
    style,
    children,
    hideIfZero,
  };
}

/** Construit un nœud ou retourne null si hideIfZero est vrai et toutes les séries sont vides. */
export function n12(
  key: string,
  label: string,
  vals: MonthlyAcc,
  style: BudgetNodeStyle,
  children?: BudgetNode[],
  hideIfZero = false,
): BudgetNode | null {
  if (hideIfZero && isAllZeroSeries(vals)) return null;
  return budgetNode(key, label, vals, style, children, hideIfZero);
}

export function zeroAcc(): MonthlyAcc {
  return {
    y1: Array(12).fill(0) as MonthlySeries,
    y2: Array(12).fill(0) as MonthlySeries,
    y3: Array(12).fill(0) as MonthlySeries,
  };
}

export function childActivityNodes(
  rows: { libelle: string; series: MonthlyAcc }[],
  parentKey: string,
): BudgetNode[] {
  return rows
    .filter((r) => !isAllZeroSeries(r.series))
    .map((r, i) =>
      budgetNode(`${parentKey}_c${i}`, r.libelle, r.series, "normal", undefined, true),
    );
}

export function childChargeNodes(
  rows: {
    montantN: unknown;
    montantN1: unknown;
    montantN2: unknown;
    libelle: string;
    frequence?: string | null;
    moisPaiement?: number | null;
    actif?: boolean | null;
  }[],
  parentKey: string,
): BudgetNode[] {
  const nv = (v: unknown) => Number(v ?? 0);
  return rows
    .filter((r) => r.actif !== false)
    .filter((r) => nv(r.montantN) !== 0 || nv(r.montantN1) !== 0 || nv(r.montantN2) !== 0)
    .map((r, i) => {
      const series: MonthlyAcc = {
        y1: distributeByFrequency(nv(r.montantN), r.frequence, r.moisPaiement),
        y2: distributeByFrequency(nv(r.montantN1), r.frequence, r.moisPaiement),
        y3: distributeByFrequency(nv(r.montantN2), r.frequence, r.moisPaiement),
      };
      return budgetNode(`${parentKey}_c${i}`, r.libelle, series, "normal", undefined, true);
    });
}

export function childSimpleNodes(
  rows: { montantN: unknown; montantN1: unknown; montantN2: unknown; libelle: string; actif?: boolean | null }[],
  parentKey: string,
): BudgetNode[] {
  const nv = (v: unknown) => Number(v ?? 0);
  return rows
    .filter((r) => r.actif !== false)
    .filter((r) => nv(r.montantN) !== 0 || nv(r.montantN1) !== 0 || nv(r.montantN2) !== 0)
    .map((r, i) => {
      const series: MonthlyAcc = {
        y1: Array(12).fill(nv(r.montantN) / 12) as MonthlySeries,
        y2: Array(12).fill(nv(r.montantN1) / 12) as MonthlySeries,
        y3: Array(12).fill(nv(r.montantN2) / 12) as MonthlySeries,
      };
      return budgetNode(`${parentKey}_c${i}`, r.libelle, series, "normal", undefined, true);
    });
}
