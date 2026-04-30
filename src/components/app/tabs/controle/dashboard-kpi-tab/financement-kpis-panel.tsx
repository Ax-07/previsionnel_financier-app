import { cn } from "@/lib/utils";
import type { KpiGroup, KpiCard } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { YEAR_KEYS, formatKpiValue } from "./utils";

import { TrendBadge } from "./trend-badge";

// Besoins de financement
const BESOINS_KEYS  = ["total_immo", "bfr", "remboursement_capital", "total_besoins"];
// Ressources de financement
const RESSOURCES_KEYS = ["apports_capital", "nouveaux_emprunts", "caf", "total_ressources"];
// Ratios de suivi
const RATIOS_KEYS = ["capital_restant_du", "capitaux_propres", "taux_endettement", "couverture_caf"];

/** Clés dont la ligne doit être mise en évidence comme total */
const TOTAL_KEYS = new Set(["total_besoins", "total_ressources"]);

export function FinancementKpisPanel({
  groups,
  yearLabels,
  y0Label,
}: {
  groups: KpiGroup[];
  yearLabels: Record<YearKey, string>;
  y0Label?: string;
}) {
  const allCards = groups.flatMap((g) => g.cards);
  const colSpan = y0Label ? 5 : 4;

  function renderCell(amount: number, format: string, positive: string, extra?: string) {
    const isGood = amount !== 0
      ? positive === "up" ? amount > 0 : amount < 0
      : null;
    let cls = isGood === null ? "text-muted-foreground" : isGood ? "text-foreground" : "text-destructive";
    if (extra) cls = extra;
    return <span className={cn("font-medium", cls)}>{formatKpiValue(amount, format as KpiCard["format"])}</span>;
  }

  function renderKpiSection(title: string, keys: string[]) {
    return (
      <>
        <tr className="bg-muted/10">
          <td colSpan={colSpan} className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </td>
        </tr>
        {keys.map((key) => {
          const card = allCards.find((c) => c.key === key);
          if (!card) return null;
          const isTotal = TOTAL_KEYS.has(key);
          // Coloration spéciale pour taux_endettement et couverture_caf
          function extraClass(yk: string, val: { amount: number }): string | undefined {
            if (key === "taux_endettement" && val.amount > 100) return "font-bold text-destructive";
            if (key === "couverture_caf" && val.amount > 0 && val.amount < 1.0) return "font-bold text-destructive";
            if (key === "couverture_caf" && val.amount >= 1.2) return "font-bold text-emerald-600 dark:text-emerald-400";
            return undefined;
          }
          return (
            <tr
              key={key}
              className={cn(
                "border-t transition-colors",
                isTotal
                  ? "border-border bg-muted/25 font-semibold"
                  : "border-border/40 hover:bg-muted/20",
              )}
            >
              <td className={cn("px-3 py-1.5", isTotal ? "text-foreground" : "text-muted-foreground")}>
                {card.label}
                {!isTotal && card.sublabel && (
                  <span className="ml-1 text-[10px] text-muted-foreground/60">({card.sublabel})</span>
                )}
              </td>
              {y0Label && (
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {card.y0value !== undefined
                    ? renderCell(card.y0value.amount, card.format, card.positive)
                    : <span className="text-muted-foreground/40">—</span>}
                </td>
              )}
              {YEAR_KEYS.map((yk) => {
                const val = card.values[yk];
                return (
                  <td key={yk} className="px-3 py-1.5 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-1">
                      {renderCell(val.amount, card.format, card.positive, extraClass(yk, val))}
                      {!isTotal && val.trend != null && (
                        <TrendBadge trend={val.trend} positive={card.positive} />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Indicateur</th>
              {y0Label && (
                <th className="px-3 py-1.5 text-right font-medium text-primary/80">
                  {y0Label}
                  <span className="ml-1 text-[9px] text-muted-foreground/70">(initial)</span>
                </th>
              )}
              {YEAR_KEYS.map((yk) => (
                <th key={yk} className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                  {yearLabels[yk]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderKpiSection("Besoins", BESOINS_KEYS)}
            {renderKpiSection("Ressources", RESSOURCES_KEYS)}
            {renderKpiSection("Ratios de financement", RATIOS_KEYS)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
