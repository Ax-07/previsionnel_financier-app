"use client";

/**
 * DiffTable
 *
 * Tableau des différences entre deux résultats de simulation.
 * Affiche chaque métrique clé avec : valeur A, valeur B, écart absolu et relatif.
 * Les métriques sont colorées selon leur sens (vert = meilleur pour le salarié/l'entreprise).
 */

import type { SimulationResultat } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DiffRow {
  label: string;
  valueA: number;
  valueB: number;
  /** true = une valeur plus haute est meilleure (ex. net à payer) */
  higherIsBetter: boolean;
  format: "eur" | "pct";
}

interface DiffTableProps {
  resultatA: SimulationResultat;
  labelA: string;
  resultatB: SimulationResultat;
  labelB: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function pct(v: number): string {
  return v.toFixed(2) + " %";
}

function fmt(v: number, format: "eur" | "pct"): string {
  return format === "eur" ? eur(v) : pct(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

export function DiffTable({ resultatA, labelA, resultatB, labelB }: DiffTableProps) {
  const rows: DiffRow[] = [
    {
      label: "Brut soumis",
      valueA: resultatA.brutSoumis,
      valueB: resultatB.brutSoumis,
      higherIsBetter: false,
      format: "eur",
    },
    {
      label: "Net à payer",
      valueA: resultatA.netAPayer,
      valueB: resultatB.netAPayer,
      higherIsBetter: true,
      format: "eur",
    },
    {
      label: "Net imposable",
      valueA: resultatA.netImposable,
      valueB: resultatB.netImposable,
      higherIsBetter: true,
      format: "eur",
    },
    {
      label: "Cotisations salariales",
      valueA: Math.abs(resultatA.totalCotisationsSalariales),
      valueB: Math.abs(resultatB.totalCotisationsSalariales),
      higherIsBetter: false,
      format: "eur",
    },
    {
      label: "Cotisations patronales",
      valueA: resultatA.totalCotisationsPatronales,
      valueB: resultatB.totalCotisationsPatronales,
      higherIsBetter: false,
      format: "eur",
    },
    {
      label: "RGDU (réduction)",
      valueA: Math.abs(resultatA.montantRGDU),
      valueB: Math.abs(resultatB.montantRGDU),
      higherIsBetter: true,
      format: "eur",
    },
    {
      label: "Coût total employeur",
      valueA: resultatA.coutEmployeur,
      valueB: resultatB.coutEmployeur,
      higherIsBetter: false,
      format: "eur",
    },
    {
      label: "Taux charges patronales",
      valueA: resultatA.tauxCotisationsPatronalesEffectif,
      valueB: resultatB.tauxCotisationsPatronalesEffectif,
      higherIsBetter: false,
      format: "pct",
    },
    {
      label: "Prélèvement à la source",
      valueA: Math.abs(resultatA.pas),
      valueB: Math.abs(resultatB.pas),
      higherIsBetter: false,
      format: "eur",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground w-50">
              Indicateur
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
              {labelA}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-violet-600 dark:text-violet-400">
              {labelB}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">
              Écart
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">
              Δ relatif
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const diff = row.valueB - row.valueA;
            const relPct = row.valueA !== 0 ? (diff / Math.abs(row.valueA)) * 100 : 0;
            const improved = row.higherIsBetter ? diff > 0 : diff < 0;
            const degraded = row.higherIsBetter ? diff < 0 : diff > 0;
            const diffColor =
              diff === 0
                ? "text-muted-foreground"
                : improved
                  ? "text-green-600 dark:text-green-400"
                  : degraded
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground";

            return (
              <tr
                key={row.label}
                className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
              >
                <td className="px-4 py-2 font-medium text-foreground">{row.label}</td>
                <td className="px-4 py-2 text-right tabular-nums text-blue-700 dark:text-blue-300">
                  {fmt(row.valueA, row.format)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-violet-700 dark:text-violet-300">
                  {fmt(row.valueB, row.format)}
                </td>
                <td className={`px-4 py-2 text-right tabular-nums font-medium ${diffColor}`}>
                  {diff === 0
                    ? "—"
                    : `${diff > 0 ? "+" : ""}${fmt(diff, row.format)}`}
                </td>
                <td className={`px-4 py-2 text-right tabular-nums text-xs ${diffColor}`}>
                  {diff === 0
                    ? "—"
                    : `${relPct > 0 ? "+" : ""}${relPct.toFixed(1)} %`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
