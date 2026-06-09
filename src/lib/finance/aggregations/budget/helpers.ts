import type { YearKey } from "@/lib/finance/utils";
import {
  totalOf,
  distributeByFrequency,
  type MonthlySeries,
  type MonthlyAcc,
} from "@/lib/finance/calculs/monthly";
import type { BudgetValue, BudgetNode, BudgetNodeStyle } from "./types";

const DEFAULT_DUREES: Record<YearKey, number> = { y1: 12, y2: 12, y3: 12 };

export function isAllZeroSeries(vals: MonthlyAcc): boolean {
  return (["y1", "y2", "y3"] as YearKey[]).every((k) =>
    vals[k].every((v) => v === 0),
  );
}

export function budgetValue(months: MonthlySeries): BudgetValue {
  return { months, total: totalOf(months) };
}

export function buildBudgetMonthLabels(startMonth: number, startYear: number, nMois = 12): string[] {
  const FR_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return Array.from({ length: nMois }, (_, i) => {
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

export function zeroAcc(durees: Record<YearKey, number> = DEFAULT_DUREES): Record<YearKey, number[]> {
  return {
    y1: Array(durees.y1).fill(0),
    y2: Array(durees.y2).fill(0),
    y3: Array(durees.y3).fill(0),
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
  durees: Record<YearKey, number> = DEFAULT_DUREES,
): BudgetNode[] {
  const nv = (v: unknown) => Number(v ?? 0);
  return rows
    .filter((r) => r.actif !== false)
    .filter((r) => nv(r.montantN) !== 0 || nv(r.montantN1) !== 0 || nv(r.montantN2) !== 0)
    .map((r, i) => {
      const series: MonthlyAcc = {
        y1: distributeByFrequency(nv(r.montantN), r.frequence, r.moisPaiement, durees.y1),
        y2: distributeByFrequency(nv(r.montantN1), r.frequence, r.moisPaiement, durees.y2),
        y3: distributeByFrequency(nv(r.montantN2), r.frequence, r.moisPaiement, durees.y3),
      };
      return budgetNode(`${parentKey}_c${i}`, r.libelle, series, "normal", undefined, true);
    });
}

export function childSimpleNodes(
  rows: {
    montantN: unknown;
    montantN1: unknown;
    montantN2: unknown;
    libelle: string;
    actif?: boolean | null;
    detailMensuelN?: unknown;
    detailMensuelN1?: unknown;
    detailMensuelN2?: unknown;
  }[],
  parentKey: string,
  moisDebut = 0,
  durees: Record<YearKey, number> = DEFAULT_DUREES,
): BudgetNode[] {
  const nv = (v: unknown) => Number(v ?? 0);

  function parseDetailMensuel(json: unknown): { effectif: number[]; brutIndividuel: number[] } | null {
    if (!json || typeof json !== "object") return null;
    const obj = json as Record<string, unknown>;
    if (!Array.isArray(obj["effectif"]) || !Array.isArray(obj["brutIndividuel"])) return null;
    if ((obj["effectif"] as unknown[]).length < 12 || (obj["brutIndividuel"] as unknown[]).length < 12) return null;
    return { effectif: obj["effectif"] as number[], brutIndividuel: obj["brutIndividuel"] as number[] };
  }

  function detailOrUniform(json: unknown, fallbackTotal: number, nMois: number): MonthlySeries {
    const detail = parseDetailMensuel(json);
    if (!detail) return Array(nMois).fill(fallbackTotal / nMois) as MonthlySeries;
    // Sécurité : détail entièrement à zéro mais montant non nul → répartition uniforme
    const detailTotal = detail.brutIndividuel.reduce((s, v) => s + v, 0);
    if (detailTotal === 0 && fallbackTotal > 0) return Array(nMois).fill(fallbackTotal / nMois) as MonthlySeries;
    return Array.from({ length: nMois }, (_, i) => {
      const m = (moisDebut + i) % 12;
      return (detail.effectif[m] ?? 0) * (detail.brutIndividuel[m] ?? 0);
    }) as MonthlySeries;
  }

  return rows
    .filter((r) => r.actif !== false)
    .filter((r) => nv(r.montantN) !== 0 || nv(r.montantN1) !== 0 || nv(r.montantN2) !== 0)
    .map((r, i) => {
      const series: MonthlyAcc = {
        y1: detailOrUniform(r.detailMensuelN, nv(r.montantN), durees.y1),
        y2: detailOrUniform(r.detailMensuelN1, nv(r.montantN1), durees.y2),
        y3: detailOrUniform(r.detailMensuelN2, nv(r.montantN2), durees.y3),
      };
      return budgetNode(`${parentKey}_c${i}`, r.libelle, series, "normal", undefined, true);
    });
}
