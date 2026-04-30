import type { KpiCard, KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import { YEAR_KEYS_3 as YEAR_KEYS } from "@/lib/finance/utils";
import { formatEurCompact } from "@/lib/format";

export { YEAR_KEYS };

/**
 * Formate une valeur KPI selon son type (currency, percent, days, ratio, months).
 * Remplace l'ancienne fonction `formatAmount` pour éviter le conflit de nommage.
 */
export function formatKpiValue(amount: number, format: KpiCard["format"]): string {
  if (format === "currency") {
    if (amount === 0) return "—";
    return formatEurCompact(amount);
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
