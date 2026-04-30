"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { AnnuelBarPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { formatNumber } from "@/lib/format";
import { useChartExpanded } from "../app/tabs/controle/dashboard-kpi-tab/chart-tooltip";
import { formatKpiValue } from "../app/tabs/controle/dashboard-kpi-tab/utils";

// -- Formatage -----------------------------------------------------------------

const fmtEur = (v: number): string => `${formatNumber(Math.round(v), 0)} €`;

// -- Couleurs ------------------------------------------------------------------

const COLOR_CA  = "hsl(213 85% 56%)";
const COLOR_EBE = "hsl(152 58% 40%)";
const COLOR_RES = "hsl(25 95% 53%)";

// -- Tooltip custom ------------------------------------------------------------

interface TooltipEntry {
  dataKey?: string;
  name?: string;
  value?: number;
  fill?: string;
  color?: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-[11px] space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: entry.fill ?? entry.color }} />
          <span className="text-muted-foreground">{entry.name}&nbsp;:</span>
          <span className="font-semibold tabular-nums">{fmtEur(entry.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

// -- Legende statique hors SVG -------------------------------------------------

const LEGEND = [
  { key: "ca",     label: "Chiffre d'affaires", color: COLOR_CA },
  { key: "ebe",    label: "EBE (EBITDA)",        color: COLOR_EBE },
  { key: "resNet", label: "Resultat net",         color: COLOR_RES },
];

// -- Composant principal -------------------------------------------------------

interface RentabiliteChartProps {
  data: AnnuelBarPoint[];
}

export function RentabiliteChart({ data }: RentabiliteChartProps) {
  const expanded = useChartExpanded();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="block size-2 shrink-0 rounded-sm" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <div
        role="img"
        aria-label="Graphique CA, EBE et Resultat net"
        className="min-h-0 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data as object[]}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="25%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="exercice"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={expanded ? 0 : "preserveStartEnd"}
            />
            <YAxis
              tickFormatter={(value) => formatKpiValue(value, "currency")}
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
            <Bar dataKey="ca"     name="CA"       fill={COLOR_CA}  radius={[2, 2, 0, 0]} maxBarSize={32} />
            <Bar dataKey="ebe"    name="EBE"      fill={COLOR_EBE} radius={[2, 2, 0, 0]} maxBarSize={32} />
            <Bar dataKey="resNet" name="Res. net" fill={COLOR_RES} radius={[2, 2, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
