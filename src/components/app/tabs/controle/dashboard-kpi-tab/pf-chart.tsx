"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PfChartPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { fmtK } from "./utils";
import { TooltipCurrency } from "./chart-tooltip";

export function PfChart({ data }: { data: PfChartPoint[] }) {
  const hasData = data.some((d) => d.besoins > 0 || d.ressources > 0);
  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
        Aucune donnée de financement disponible
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-2 text-xs font-semibold">Plan de financement — Besoins vs Ressources</h4>
      <div role="img" aria-label="Graphique plan de financement" className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtK(v as number)}
              width={56}
            />
            <Tooltip content={<TooltipCurrency />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="besoins" name="Besoins" fill="hsl(var(--destructive))" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar dataKey="ressources" name="Ressources" fill="hsl(142 71% 45%)" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            <Line dataKey="solde" name="Solde cumulé" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
