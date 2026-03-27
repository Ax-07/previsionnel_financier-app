import type { KpiCard, KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";

export const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

export const frCurrency = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function fmtK(v: number): string {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)} k€`;
  return `${Math.round(v)} €`;
}

export function formatAmount(amount: number, format: KpiCard["format"]): string {
  if (format === "currency") {
    if (amount === 0) return "—";
    return frCurrency.format(Math.round(amount));
  }
  if (format === "percent") {
    if (amount === 0) return "—";
    return `${amount.toFixed(1)} %`;
  }
  if (format === "days") {
    if (amount === 0) return "—";
    return `${Math.round(amount)} j`;
  }
  if (format === "ratio") {
    if (amount === 0) return "—";
    return `× ${amount.toFixed(2)}`;
  }
  if (format === "months") {
    if (amount <= 0) return "—";
    if (amount >= 36) return "∞";
    return `${Math.round(amount)} mois`;
  }
  return "—";
}

export function findGroupCard(groups: KpiGroup[], cardKey: string): KpiCard | null {
  for (const g of groups) {
    const c = g.cards.find((c) => c.key === cardKey);
    if (c) return c;
  }
  return null;
}
