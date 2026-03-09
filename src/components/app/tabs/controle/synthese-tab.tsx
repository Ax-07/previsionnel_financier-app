"use client";

import { Fragment, useCallback, useEffect } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type SyntheseData, type SynthRow } from "@/app/actions/controle/synthese";
import type { YearKey } from "@/lib/finance/utils";
import { useSyntheseStore } from "@/stores/synthese-store";

// ── Constantes ────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

// ── Helpers de formatage ──────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatPct(pct: number | null): string {
  if (pct === null) return "";
  return `${pct.toFixed(1)} %`;
}

function formatTaux(amount: number): string {
  if (amount === 0) return "—";
  return `${amount.toFixed(1)} %`;
}

function formatDays(amount: number): string {
  if (amount === 0) return "—";
  return `${Math.round(amount)} j`;
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface SynthRowProps {
  row: SynthRow;
}

function SynthRowItem({ row }: SynthRowProps) {
  const isSection = row.style === "section";
  const isHighlight = row.style === "highlight";

  const rowClass = cn(
    "grid h-9 items-center border-b transition-colors",
    "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
    isSection &&
      "bg-muted/60 font-semibold uppercase tracking-wide text-xs text-muted-foreground",
    isHighlight && "bg-primary/10 font-bold text-primary",
    !isSection && !isHighlight && "hover:bg-muted/20",
  );

  return (
    <div className={rowClass}>
      {/* Libellé */}
      <div
        className={cn(
          "truncate px-4 py-1 text-sm leading-tight",
          isSection && "text-xs",
        )}
      >
        {row.label}
      </div>

      {/* Valeurs par exercice */}
      {YEAR_KEYS.map((yk) => {
        const val = row.values[yk];
        const isNeg = val.amount < 0;

        let displayAmount: string;
        if (isSection) {
          displayAmount = "";
        } else if (row.isTaux) {
          displayAmount = formatTaux(val.amount);
        } else if (row.isDays) {
          displayAmount = formatDays(val.amount);
        } else {
          displayAmount = formatAmount(val.amount);
        }

        return (
          <Fragment key={`${row.key}_${yk}`}>
            {/* Montant */}
            <div
              className={cn(
                "pr-3 text-right text-sm tabular-nums",
                isNeg && !isHighlight && !row.isTaux && "text-destructive",
                isSection && "text-xs text-muted-foreground",
                row.isTaux && "text-muted-foreground font-medium",
              )}
            >
              {displayAmount}
            </div>
            {/* % */}
            <div
              className={cn(
                "pr-2 text-right text-xs tabular-nums text-muted-foreground",
                isHighlight && "text-primary/70",
              )}
            >
              {!isSection && row.showPct && val.pct !== null
                ? formatPct(val.pct)
                : ""}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── En-tête du tableau ────────────────────────────────────────────────────────

function SyntheseHeader({
  yearLabels,
}: {
  yearLabels: SyntheseData["yearLabels"];
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm",
        "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
      )}
    >
      <div className="px-4">Désignation</div>
      {YEAR_KEYS.map((yk) => (
        <Fragment key={yk}>
          <div className="pr-3 text-right">{yearLabels[yk]}</div>
          <div className="pr-2 text-right text-xs font-normal text-muted-foreground">
            %
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface SyntheseTabProps {
  dossierId: string;
}

export default function SyntheseTab({ dossierId }: SyntheseTabProps) {
  const { fetch, invalidate, getData, getStatus, getError } = useSyntheseStore();

  const data = getData(dossierId);
  const status = getStatus(dossierId);
  const error = getError(dossierId);
  const isPending = status === "loading";

  useEffect(() => {
    fetch(dossierId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleRefresh = useCallback(() => {
    invalidate(dossierId);
    fetch(dossierId, true);
  }, [dossierId, fetch, invalidate]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Synthèse</h2>
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
          <RefreshCwIcon
            className={cn("size-3.5", isPending && "animate-spin")}
          />
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
            Calcul de la synthèse en cours…
          </div>
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-175">
            <SyntheseHeader yearLabels={data.yearLabels} />
            {data.rows.map((row) => (
              <SynthRowItem key={row.key} row={row} />
            ))}
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
