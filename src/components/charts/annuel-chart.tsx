"use client";

import { useState } from "react";
import { BarChartIcon, CalendarIcon } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AnnuelBarPoint, MonthlyBarPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { fmtK } from "../app/tabs/controle/dashboard-kpi-tab/utils";
import { TooltipCurrency } from "../app/tabs/controle/dashboard-kpi-tab/chart-tooltip";

export function AnnuelChart({
  data,
  monthly,
  selectedYear,
}: {
  data: AnnuelBarPoint[];
  monthly: Record<string, MonthlyBarPoint[]>;
  selectedYear: string;
}) {
  const [view, setView] = useState<"annual" | "monthly">("annual");

  const chartData = view === "annual" ? data : (monthly[selectedYear] ?? []);
  const xKey = view === "annual" ? "exercice" : "mois";
  const barSize = view === "annual" ? 40 : 14;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold">CA · Charges · Résultat net</h4>
        <div role="group" aria-label="Bascule vue annuelle / mensuelle" className="flex gap-0.5 rounded border p-0.5">
          <button
            type="button"
            aria-pressed={view === "annual"}
            onClick={() => setView("annual")}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              view === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BarChartIcon className="size-2.5" />
            Annuel
          </button>
          <button
            type="button"
            aria-pressed={view === "monthly"}
            onClick={() => setView("monthly")}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              view === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarIcon className="size-2.5" />
            Mensuel
          </button>
        </div>
      </div>
      <div role="img" aria-label="Graphique CA vs Charges vs Résultat net" className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData as object[]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<TooltipCurrency />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
            <Bar dataKey="ca" name="CA" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={barSize} />
            <Bar dataKey="charges" name="Charges" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={barSize} />
            <Line
              type="monotone"
              dataKey="resNet"
              name="Résultat net"
              stroke="#10b981"
              strokeWidth={2}
              dot={view === "annual" ? { r: 4, fill: "#10b981", strokeWidth: 0 } : false}
              activeDot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
