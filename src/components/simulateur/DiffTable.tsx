"use client";

/**
 * DiffTable
 *
 * Tableau des différences entre deux résultats de simulation.
 * Affiche chaque métrique clé avec : valeur A, valeur B, écart absolu et relatif.
 * Les métriques sont colorées selon leur sens (vert = meilleur pour le salarié/l'entreprise).
 */

import type { SimulationResultat } from "@/lib/paie/types";
import { formatEur as eur } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-muted-foreground w-50">
              Indicateur
            </TableHead>
            <TableHead className="text-right font-semibold text-blue-600 dark:text-blue-400">
              {labelA}
            </TableHead>
            <TableHead className="text-right font-semibold text-violet-600 dark:text-violet-400">
              {labelB}
            </TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground">
              Écart
            </TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground">
              Δ relatif
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
              <TableRow
                key={row.label}
                className={i % 2 === 0 ? "" : "bg-muted/20"}
              >
                <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                <TableCell className="text-right tabular-nums text-blue-700 dark:text-blue-300">
                  {fmt(row.valueA, row.format)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-violet-700 dark:text-violet-300">
                  {fmt(row.valueB, row.format)}
                </TableCell>
                <TableCell className={`text-right tabular-nums font-medium ${diffColor}`}>
                  {diff === 0
                    ? "—"
                    : `${diff > 0 ? "+" : ""}${fmt(diff, row.format)}`}
                </TableCell>
                <TableCell className={`text-right tabular-nums text-xs ${diffColor}`}>
                  {diff === 0
                    ? "—"
                    : `${relPct > 0 ? "+" : ""}${relPct.toFixed(1)} %`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
