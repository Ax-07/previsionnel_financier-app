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
import type { DashboardChartData } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { fmtK } from "../app/tabs/controle/dashboard-kpi-tab/utils";
import { TooltipCurrency } from "../app/tabs/controle/dashboard-kpi-tab/chart-tooltip";

export function TresoChart({
  data,
  yearLabels,
  selectedYear,
}: {
  data: DashboardChartData["tresorerie"];
  yearLabels: Record<YearKey, string>;
  selectedYear: YearKey;
}) {
  const points = data[selectedYear];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold">Évolution de trésorerie</h4>
        <span className="text-[10px] text-muted-foreground">{yearLabels[selectedYear]}</span>
      </div>
      <div role="img" aria-label={`Graphique trésorerie ${yearLabels[selectedYear]}`} className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<TooltipCurrency />} />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: "0", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--destructive))" }}
            />
            <Bar dataKey="encaissements" name="Encaissements" fill="#10b981" opacity={0.85} maxBarSize={16} radius={[2, 2, 0, 0]} />
            <Bar dataKey="decaissements" name="Décaissements" fill="#ef4444" opacity={0.85} maxBarSize={16} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="solde" name="Solde cumulé" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
