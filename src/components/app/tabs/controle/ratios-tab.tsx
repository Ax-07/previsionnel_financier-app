"use client";

import { useCallback } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type RatiosData, type RatioRow } from "@/lib/finance/aggregations/ratios";
import type { YearKey } from "@/lib/finance/utils";
import { useRatiosData } from "@/hooks/controle/use-ratios-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

/** Clés par section pour les séparateurs visuels */
const SECTIONS: Array<{ label: string; keys: string[] }> = [
  {
    label: "Ratios de rotation",
    keys: ["delai_stocks", "delai_fournisseurs"],
  },
  {
    label: "Ratios de structure financière",
    keys: ["autonomie_lt", "solvabilite_mt", "solvabilite_ct", "taux_endettement"],
  },
  {
    label: "Capacité de remboursement",
    keys: ["capacite_remboursement"],
  },
];

const frFmtCache = new Map<number, Intl.NumberFormat>();

function getFormatter(decimals: number): Intl.NumberFormat {
  let fmt = frFmtCache.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    frFmtCache.set(decimals, fmt);
  }
  return fmt;
}

function formatValue(value: number | null, decimals: number, unit: string): string {
  if (value === null) return "n/a";
  const formatted = getFormatter(decimals).format(value);
  return `${formatted} ${unit}`;
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function RatiosHeader({ yearLabels }: { yearLabels: RatiosData["yearLabels"] }) {
  return (
    <div className="sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm grid-cols-[1fr_repeat(3,minmax(0,180px))]">
      <div className="px-4">Désignation</div>
      {YEAR_KEYS.map((yk) => (
        <div key={yk} className="pr-4 text-right">
          {yearLabels[yk]}
        </div>
      ))}
    </div>
  );
}

// ── Bandeau de section ────────────────────────────────────────────────────────

function SectionBanner({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(3,minmax(0,180px))] border-b bg-muted/50 px-4 py-1.5">
      <span className="col-span-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── Ligne de ratio ────────────────────────────────────────────────────────────

function RatioRowItem({ row }: { row: RatioRow }) {
  return (
    <div
      className={cn(
        "grid items-center border-b transition-colors",
        "grid-cols-[1fr_repeat(3,minmax(0,180px))]",
        "min-h-10 hover:bg-muted/20",
      )}
    >
      <div className="px-4 py-2.5 text-sm leading-tight">{row.label}</div>
      {YEAR_KEYS.map((yk) => {
        const val = row.values[yk].value;
        const isNull = val === null;
        return (
          <div
            key={`${row.key}_${yk}`}
            className={cn(
              "pr-4 py-2.5 text-right text-sm tabular-nums",
              isNull && "text-muted-foreground italic",
            )}
          >
            {formatValue(val, row.decimals, row.unit)}
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface RatiosTabProps {
  dossierId: string;
}

export default function RatiosTab({ dossierId }: RatiosTabProps) {
  const { data, status, error } = useRatiosData(dossierId);
  const isPending = status === "loading";

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  /** Construit les lignes ordonnées avec bandeaux de section */
  function renderRows(rows: RatioRow[]) {
    const rowMap = new Map(rows.map((r) => [r.key, r]));
    return SECTIONS.flatMap((section) => {
      const sectionRows = section.keys
        .map((k) => rowMap.get(k))
        .filter((r): r is RatioRow => r !== undefined);
      if (sectionRows.length === 0) return [];
      return [
        <SectionBanner key={`section_${section.label}`} label={section.label} />,
        ...sectionRows.map((row) => <RatioRowItem key={row.key} row={row} />),
      ];
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Ratios financiers</h2>
          {data && (
            <Badge variant="secondary" className="text-xs">
              Lecture seule
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCwIcon className={cn("size-3.5", isPending && "animate-spin")} />
          {isPending ? "Calcul…" : "Actualiser"}
        </Button>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Erreur */}
        {error && (
          <div className="m-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Chargement */}
        {isPending && !data && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Calcul des ratios financiers…
          </div>
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-150">
            <RatiosHeader yearLabels={data.yearLabels} />
            {renderRows(data.rows)}
          </div>
        )}

        {/* État vide */}
        {data && data.rows.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">Aucune donnée disponible.</p>
            <p className="text-xs">
              Renseignez les onglets de saisie puis actualisez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
