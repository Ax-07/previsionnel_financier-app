"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PfChartPoint } from "@/hooks/controle/use-dashboard-kpi-data";
import { fmtK } from "../app/tabs/controle/dashboard-kpi-tab/utils";
import { formatNumber } from "@/lib/format";
import { useChartExpanded } from "../app/tabs/controle/dashboard-kpi-tab/chart-tooltip";

// Palette Besoins — famille froide, 4 teintes distinctes
const B_INCORPO = "hsl(231 72% 40%)"; // indigo profond
const B_CORPO   = "hsl(213 85% 56%)"; // bleu vif
const B_BFR     = "hsl(186 78% 40%)"; // teal foncé
const B_REMB    = "hsl(280 28% 68%)"; // lavande grisée (atténué)

// Palette Ressources — famille chaude, 4 teintes distinctes
const R_APPORTS  = "hsl(152 58% 40%)"; // vert émeraude (engagement personnel)
const R_EMPRUNTS = "hsl(262 74% 52%)"; // violet (banque)
const R_SUBV     = "hsl(35  88% 50%)"; // ambre / or (fonds publics)
const R_CAF      = "hsl(340 64% 52%)"; // rose / framboise (autofinancement)
const C_SOLDE    = "hsl(25 95% 53%)";  // orange (solde)

const BESOINS_KEYS  = ["immoIncorpo", "immoCorporo", "bfr", "remboursementCapital"];
const RESSOURCES_KEYS = ["apports", "emprunts", "subventions", "caf"];

// ── Tooltip groupé ────────────────────────────────────────────────────────────
function PfTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const byKey = Object.fromEntries(
    payload.map((p) => [p.dataKey ?? "", p] as const)
  );
  const fmtRow = (key: string) => {
    const p = byKey[key];
    if (!p || !p.value) return null;
    return (
      <div key={key} className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full shrink-0" style={{ background: p.color }} />
        <span className="text-muted-foreground">{p.name} :</span>
        <span className="font-medium tabular-nums">{formatNumber(Math.round(p.value), 0)} €</span>
      </div>
    );
  };

  const besoinRows    = BESOINS_KEYS.map(fmtRow).filter(Boolean);
  const ressourceRows = RESSOURCES_KEYS.map(fmtRow).filter(Boolean);
  const solde         = byKey["solde"];

  return (
    <div className="min-w-42.5 rounded-md border bg-background/95 px-2.5 py-2 shadow-lg text-[11px] space-y-1.5">
      <p className="font-semibold text-foreground">{label}</p>
      {besoinRows.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Besoins</p>
          <div className="space-y-0.5">{besoinRows}</div>
        </div>
      )}
      {ressourceRows.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Ressources</p>
          <div className="space-y-0.5">{ressourceRows}</div>
        </div>
      )}
      {solde && (
        <div className="border-t pt-1">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full shrink-0" style={{ background: solde.color }} />
            <span className="text-muted-foreground">{solde.name} :</span>
            <span className="font-medium tabular-nums">{formatNumber(Math.round(solde.value ?? 0), 0)} €</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Légende groupée ───────────────────────────────────────────────────────────
type LegendEntry = { dataKey?: string; value?: string; color?: string };

function PfLegend({ payload }: { payload?: LegendEntry[] }) {
  if (!payload?.length) return null;

  const byKey = Object.fromEntries(
    payload.map((p) => [p.dataKey as string, p])
  );
  const item = (key: string) => {
    const p = byKey[key];
    if (!p) return null;
    return (
      <span key={key} className="flex items-center gap-1">
        <span className="size-2 rounded-sm shrink-0" style={{ background: p.color }} />
        <span>{p.value}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center gap-y-1 text-[10px] text-muted-foreground mt-1">
      <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1">
        <span className="font-semibold text-foreground">Besoins :</span>
        {BESOINS_KEYS.map(item)}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1">
        <span className="font-semibold text-foreground">Ressources :</span>
        {RESSOURCES_KEYS.map(item)}
      </div>
      <div className="flex items-center gap-x-2">
        {item("solde")}
      </div>
    </div>
  );
}

// Payload statique pour la légende (rendue hors SVG)
const LEGEND_PAYLOAD: LegendEntry[] = [
  { dataKey: "immoIncorpo",          value: "Immo. incorp.",  color: B_INCORPO },
  { dataKey: "immoCorporo",          value: "Immo. corp.",    color: B_CORPO },
  { dataKey: "bfr",                  value: "BFR",            color: B_BFR },
  { dataKey: "remboursementCapital", value: "Remb. emprunts", color: B_REMB },
  { dataKey: "apports",              value: "Apports",        color: R_APPORTS },
  { dataKey: "emprunts",             value: "Emprunts",       color: R_EMPRUNTS },
  { dataKey: "subventions",          value: "Subventions",    color: R_SUBV },
  { dataKey: "caf",                  value: "CAF",            color: R_CAF },
  { dataKey: "solde",                value: "Solde cumulé",   color: C_SOLDE },
];

// ── Chart ─────────────────────────────────────────────────────────────────────
export function PfChart({ data }: { data: PfChartPoint[] }) {
  const expanded = useChartExpanded();
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
            <CartesianGrid strokeDasharray="0" className="stroke-border" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtK(v as number)}
              tickCount={expanded ? 12 : 5}
              width={56}
            />
            <Tooltip content={<PfTooltip />} />
            {/* Besoins — empilement */}
            <Bar dataKey="immoIncorpo" name="Immo. incorp." stackId="besoins" fill={B_INCORPO} fillOpacity={0.85} />
            <Bar dataKey="immoCorporo" name="Immo. corp." stackId="besoins" fill={B_CORPO} fillOpacity={0.85} />
            <Bar dataKey="bfr" name="BFR" stackId="besoins" fill={B_BFR} fillOpacity={0.85} />
            <Bar dataKey="remboursementCapital" name="Remb. emprunts" stackId="besoins" fill={B_REMB} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
            {/* Ressources — empilement */}
            <Bar dataKey="apports" name="Apports" stackId="ressources" fill={R_APPORTS} fillOpacity={0.85} />
            <Bar dataKey="emprunts" name="Emprunts" stackId="ressources" fill={R_EMPRUNTS} fillOpacity={0.85} />
            <Bar dataKey="subventions" name="Subventions" stackId="ressources" fill={R_SUBV} fillOpacity={0.85} />
            <Bar dataKey="caf" name="CAF" stackId="ressources" fill={R_CAF} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
            {/* Solde cumulé */}
            <Line dataKey="solde" name="Solde cumulé" type="monotone" stroke={C_SOLDE} strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Légende hors SVG — pas de chevauchement */}
      <PfLegend payload={LEGEND_PAYLOAD} />
    </div>
  );
}


