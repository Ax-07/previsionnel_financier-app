"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ChargesBreakdownPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { formatKpiValue, YEAR_KEYS } from "../app/tabs/controle/dashboard-kpi-tab/utils";

type ChargesKey = keyof Omit<ChargesBreakdownPoint, "exercice">;

const CHARGES_CATS: Array<{ key: ChargesKey; label: string; color: string }> = [
  { key: "achats",          label: "Achats consommés", color: "#6366f1" },
  { key: "chargesExternes", label: "Charges ext.",     color: "#8b5cf6" },
  { key: "personnel",       label: "Personnel",        color: "#ec4899" },
  { key: "impotsTaxes",     label: "Impôts & taxes",   color: "#f59e0b" },
  { key: "amortissements",  label: "Amortiss.",        color: "#14b8a6" },
  { key: "interets",        label: "Intérêts",         color: "#64748b" },
];

function PieTooltipCompact({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name: string; value: number; payload: { color: string } }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-md border bg-background/95 px-2 py-1.5 shadow-lg text-[11px]">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="font-medium">{p.name}</span>
      </div>
      <p className="tabular-nums text-muted-foreground">
        {formatKpiValue(p.value, "currency")} · {pct} %
      </p>
    </div>
  );
}

export function ChargesChart({
  data,
  yearLabels,
  selectedYear,
}: {
  data: ChargesBreakdownPoint[];
  yearLabels: Record<YearKey, string>;
  selectedYear: YearKey;
}) {
  const yearIdx = YEAR_KEYS.indexOf(selectedYear);
  const row = data[yearIdx];

  const slices = row
    ? CHARGES_CATS.map((c) => ({ name: c.label, value: row[c.key], color: c.color })).filter(
        (s) => s.value > 0,
      )
    : [];

  const total = slices.reduce((s, c) => s + c.value, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-xs font-semibold">Répartition des charges</h4>
        <span className="text-[10px] text-muted-foreground">{yearLabels[selectedYear]}</span>
      </div>
      <div role="img" aria-label={`Répartition des charges ${yearLabels[selectedYear]}`} className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="48%"
              innerRadius="38%"
              outerRadius="62%"
              paddingAngle={1}
              dataKey="value"
              label={({ name }) => `${name}`}
              labelLine
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <PieTooltipCompact
                  active={active}
                  payload={payload as ReadonlyArray<{ name: string; value: number; payload: { color: string } }>}
                  total={total}
                />
              )}
            />
            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
