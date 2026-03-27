"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SeuilBarPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { fmtK } from "./utils";
import { TooltipCurrency } from "./chart-tooltip";

export function SeuilChart({ data }: { data: SeuilBarPoint[] }) {
  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-2 text-xs font-semibold">CA réalisé vs Seuil de rentabilité</h4>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="exercice" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<TooltipCurrency />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
            <Bar dataKey="caRealise" name="CA réalisé" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={44} />
            <Bar dataKey="seuilEco" name="Seuil" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={44} />
            <Bar dataKey="excedent" name="Excédent" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
