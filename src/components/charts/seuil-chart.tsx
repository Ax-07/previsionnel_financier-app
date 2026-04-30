"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { SeuilBarPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { formatKpiValue } from "../app/tabs/controle/dashboard-kpi-tab/utils";
import { useChartExpanded } from "../app/tabs/controle/dashboard-kpi-tab/chart-tooltip";

// -- Couleurs ------------------------------------------------------------------

const COLOR_CA    = "hsl(213 85% 56%)";
const COLOR_SEUIL = "hsl(25 85% 55%)";

// -- Légende statique hors SVG -------------------------------------------------

const LEGEND = [
  { key: "caRealise", label: "CA réalisé",         color: COLOR_CA },
  { key: "seuilEco",  label: "Seuil d'équilibre",  color: COLOR_SEUIL },
];

// -- Tooltip custom ------------------------------------------------------------

interface TooltipEntry {
  dataKey?: string;
  name?: string;
  value?: number;
  fill?: string;
  color?: string;
}

const fmtEur = (v: number) => `${formatNumber(Math.round(v), 0)} €`;

function SeuilTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const ca    = payload.find((p) => p.dataKey === "caRealise")?.value ?? 0;
  const seuil = payload.find((p) => p.dataKey === "seuilEco")?.value ?? 0;
  const ecart = ca - seuil;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-[11px] space-y-1 min-w-40">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: entry.fill ?? entry.color }} />
          <span className="text-muted-foreground">{entry.name}&nbsp;:</span>
          <span className="font-semibold tabular-nums">{fmtEur(entry.value ?? 0)}</span>
        </div>
      ))}
      <div className="mt-1 border-t pt-1 flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Marge de sécurité&nbsp;:</span>
        <span className={cn("font-semibold tabular-nums", ecart >= 0 ? "text-emerald-600" : "text-destructive")}>
          {ecart >= 0 ? "+" : ""}
          {fmtEur(ecart)}
        </span>
      </div>
    </div>
  );
}

// -- Badges marge de sécurité --------------------------------------------------

function MargeBadges({ data }: { data: SeuilBarPoint[] }) {
  return (
    <div className="flex items-center flex-wrap gap-2 mr-10">
      <p className="text-[9px] font-semibold text-muted-foreground">Marge de sécurité</p>
      {data.map((pt) => {
        const ecart = pt.caRealise - pt.seuilEco;
        const pct   = pt.seuilEco > 0 ? Math.round((ecart / pt.seuilEco) * 100) : 0;
        const ok    = ecart >= 0;
        return (
          <div
            key={pt.exercice}
            className={cn(
              "flex items-baseline gap-1 rounded border px-2 py-0.5 text-[10px]",
              ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950" : "border-destructive/20 bg-destructive/5",
            )}
          >
            <span className="font-medium text-muted-foreground">{pt.exercice}&nbsp;:</span>
            <span className={cn("font-semibold tabular-nums", ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
              {ok ? "+" : ""}
              {formatKpiValue(ecart, "currency")}
            </span>
            <span className={cn("text-[9px]", ok ? "text-emerald-500" : "text-destructive/70")}>
              ({ok ? "+" : ""}{pct}&nbsp;%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// -- Composant principal -------------------------------------------------------

export function SeuilChart({ data }: { data: SeuilBarPoint[] }) {
  const expanded = useChartExpanded();

  return (
    <div className="flex h-full flex-col gap-2">
      {/* En-tête : légende + badges marge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {LEGEND.map((item) => (
            <div key={item.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="block size-2 shrink-0 rounded-sm" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
        <MargeBadges data={data} />
      </div>

      {/* Graphique */}
      <div
        role="img"
        aria-label="Graphique CA réalisé vs seuil de rentabilité"
        className="min-h-0 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data as object[]}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
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
            <Tooltip content={<SeuilTooltip />} />
            <Bar dataKey="caRealise" name="CA réalisé"        fill={COLOR_CA}    radius={[2, 2, 0, 0]} maxBarSize={44} />
            <Bar dataKey="seuilEco"  name="Seuil d'équilibre" fill={COLOR_SEUIL} radius={[2, 2, 0, 0]} maxBarSize={44} fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
