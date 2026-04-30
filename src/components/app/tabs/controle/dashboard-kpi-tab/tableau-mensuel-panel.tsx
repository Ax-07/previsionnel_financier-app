"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DashboardChartData } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { formatKpiValue, YEAR_KEYS } from "./utils";

export function TableauMensuelPanel({
  data,
  yearLabels,
  defaultYear,
}: {
  data: DashboardChartData;
  yearLabels: Record<YearKey, string>;
  defaultYear: YearKey;
}) {
  const [year, setYear] = useState<YearKey>(defaultYear);

  // Synchroniser avec le sélecteur global quand defaultYear change
  useEffect(() => { setYear(defaultYear); }, [defaultYear]);

  const points = data.tresorerie[year];

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <h4 className="text-xs font-semibold">Tableau mensuel de trésorerie</h4>
        <div role="group" aria-label="Sélecteur d'exercice" className="flex gap-1">
          {YEAR_KEYS.map((yk) => (
            <button
              key={yk}
              type="button"
              aria-pressed={yk === year}
              onClick={() => setYear(yk)}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                year === yk
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {yearLabels[yk]}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Mois</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">CA (encaissé)</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Charges (expl.)</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Encaissements</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Décaissements</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Variation</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Solde cumulé</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => {
              const variation = p.encaissements - p.decaissements;
              return (
                <tr
                  key={p.mois}
                  className={cn(
                    "border-b last:border-0 transition-colors hover:bg-muted/20",
                    p.solde < 0 && "bg-destructive/5",
                  )}
                >
                  <td className="px-3 py-1.5 font-medium">{p.mois}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-blue-600 dark:text-blue-400">
                    {formatKpiValue(p.ca, "currency")}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-orange-600 dark:text-orange-400">
                    {formatKpiValue(p.charges, "currency")}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatKpiValue(p.encaissements, "currency")}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-destructive">
                    {formatKpiValue(p.decaissements, "currency")}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 text-right tabular-nums",
                      variation >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                    )}
                  >
                    {variation >= 0 ? "+" : ""}{formatKpiValue(variation, "currency")}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 text-right tabular-nums font-medium",
                      p.solde >= 0 ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {formatKpiValue(p.solde, "currency")}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-muted/30">
              <td className="px-3 py-1.5 text-[11px] font-semibold">Total</td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                {formatKpiValue(points.reduce((s, p) => s + p.ca, 0), "currency")}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-orange-600 dark:text-orange-400">
                {formatKpiValue(points.reduce((s, p) => s + p.charges, 0), "currency")}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {formatKpiValue(points.reduce((s, p) => s + p.encaissements, 0), "currency")}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-destructive">
                {formatKpiValue(points.reduce((s, p) => s + p.decaissements, 0), "currency")}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold">
                {formatKpiValue(points.reduce((s, p) => s + (p.encaissements - p.decaissements), 0), "currency")}
              </td>
              <td
                className={cn(
                  "px-3 py-1.5 text-right tabular-nums font-bold",
                  (points[points.length - 1]?.solde ?? 0) >= 0 ? "text-foreground" : "text-destructive",
                )}
              >
                {formatKpiValue(points[points.length - 1]?.solde ?? 0, "currency")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
