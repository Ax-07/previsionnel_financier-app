import { cn } from "@/lib/utils";
import type { KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { YEAR_KEYS, formatAmount } from "./utils";
import { TrendBadge } from "./trend-badge";

export const INVEST_KEYS = ["total_immo", "dotations_amort", "immo_nette"];
export const FINANCE_KEYS = ["apports_capital", "nouveaux_emprunts", "capital_restant_du", "taux_endettement", "couverture_caf"];

export function FinancementKpisPanel({
  groups,
  yearLabels,
}: {
  groups: KpiGroup[];
  yearLabels: Record<YearKey, string>;
}) {
  const allCards = groups.flatMap((g) => g.cards);

  function renderKpiSection(title: string, keys: string[]) {
    return (
      <>
        <tr className="bg-muted/30">
          <td colSpan={4} className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </td>
        </tr>
        {keys.map((key) => {
          const card = allCards.find((c) => c.key === key);
          if (!card) return null;
          return (
            <tr key={key} className="border-t border-border/50 transition-colors hover:bg-muted/20">
              <td className="px-3 py-1.5 text-muted-foreground">
                {card.label}
                {card.sublabel && (
                  <span className="ml-1 text-[10px] text-muted-foreground/60">({card.sublabel})</span>
                )}
              </td>
              {YEAR_KEYS.map((yk) => {
                const val = card.values[yk];
                let colorClass =
                  val.amount !== 0
                    ? card.positive === "up"
                      ? val.amount > 0
                        ? "text-foreground"
                        : "text-destructive"
                      : val.amount < 0
                        ? "text-foreground"
                        : "text-muted-foreground"
                    : "text-muted-foreground";
                if (key === "taux_endettement" && val.amount > 100) colorClass = "font-bold text-destructive";
                if (key === "couverture_caf" && val.amount > 0 && val.amount < 1.0) colorClass = "font-bold text-destructive";
                if (key === "couverture_caf" && val.amount >= 1.2) colorClass = "font-bold text-emerald-600 dark:text-emerald-400";
                return (
                  <td key={yk} className="px-3 py-1.5 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-1">
                      <span className={cn("font-medium", colorClass)}>
                        {formatAmount(val.amount, card.format)}
                      </span>
                      {val.trend !== null && val.trend !== undefined && (
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
              {YEAR_KEYS.map((yk) => (
                <th key={yk} className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                  {yearLabels[yk]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderKpiSection("Investissements", INVEST_KEYS)}
            {renderKpiSection("Financement", FINANCE_KEYS)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
