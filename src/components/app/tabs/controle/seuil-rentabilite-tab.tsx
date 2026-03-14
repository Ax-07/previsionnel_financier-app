"use client";

import { Fragment, useCallback } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type BreakEvenData,
  type BreakEvenRow,
} from "@/lib/finance/calculs/seuil";
import type { YearKey } from "@/lib/finance/utils";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Clés de lignes dont la valeur est en jours (entiers) */
const JOURS_KEYS = new Set(["point_mort_eco", "point_mort_fin"]);

/** Clés de lignes dont la valeur est un taux (%) à afficher directement */
const TAUX_KEYS = new Set(["taux_marge_cv"]);

function formatAmount(amount: number, isJours: boolean, isTaux: boolean): string {
  if (isJours) {
    if (amount === 0) return "—";
    return `${Math.round(amount)} j`;
  }
  if (isTaux) {
    if (amount === 0) return "—";
    return `${amount.toFixed(1)} %`;
  }
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

function formatPct(pct: number | null): string {
  if (pct === null) return "";
  return `${pct.toFixed(1)} %`;
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function BreakEvenHeader({ yearLabels }: { yearLabels: BreakEvenData["yearLabels"] }) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm",
        "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
      )}
    >
      <div className="px-3">Désignation</div>
      {YEAR_KEYS.map((yk) => (
        <Fragment key={yk}>
          <div className="pr-3 text-right">{yearLabels[yk]}</div>
          <div className="pr-2 text-right text-xs text-muted-foreground font-normal">%</div>
        </Fragment>
      ))}
    </div>
  );
}

// ── Ligne ─────────────────────────────────────────────────────────────────────

function BreakEvenRowItem({ row }: { row: BreakEvenRow }) {
  const isSection   = row.style === "section";
  const isSeparator = row.style === "separator";
  const isHighlight = row.style === "highlight";
  const isSubtotal  = row.style === "subtotal";
  const isIndent    = row.style === "indent";
  const isJours     = JOURS_KEYS.has(row.key);
  const isTaux      = TAUX_KEYS.has(row.key);

  if (isSeparator) {
    return <div className="h-3 border-b border-dashed border-muted" />;
  }

  if (isSection) {
    return (
      <div className="grid h-8 items-center border-b bg-muted/50 grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))] px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {row.label}
        </span>
        {YEAR_KEYS.map((yk) => (
          <Fragment key={yk}>
            <div />
            <div />
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid items-center border-b transition-colors",
        "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
        "min-h-10",
        isHighlight && "bg-primary/10 font-bold text-primary",
        isSubtotal  && "bg-muted/30 font-semibold",
        !isHighlight && !isSubtotal && "hover:bg-muted/20",
      )}
    >
      {/* Libellé */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-2.5",
          isIndent && "pl-8",
        )}
      >
        {row.sign && (
          <span
            className={cn(
              "w-3 shrink-0 text-center font-mono text-xs tabular-nums",
              isHighlight ? "text-primary/70" : "text-muted-foreground",
            )}
          >
            {row.sign}
          </span>
        )}
        <span className="text-sm leading-tight">{row.label}</span>
      </div>

      {/* Valeurs */}
      {YEAR_KEYS.map((yk) => {
        const val  = row.values[yk];
        const isNeg = val.amount < 0;
        return (
          <Fragment key={`${row.key}_${yk}`}>
            {/* Montant */}
            <div
              className={cn(
                "pr-3 py-2.5 text-right text-sm tabular-nums",
                isNeg && !isHighlight && "text-destructive",
              )}
            >
              {formatAmount(val.amount, isJours, isTaux)}
            </div>
            {/* % */}
            <div
              className={cn(
                "pr-2 py-2.5 text-right text-xs tabular-nums text-muted-foreground",
                isHighlight && "text-primary/70",
              )}
            >
              {row.showPct ? formatPct(val.pct) : ""}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface SeuilRentabiliteTabProps {
  dossierId: string;
}

export default function SeuilRentabiliteTab({ dossierId }: SeuilRentabiliteTabProps) {
  const { data, status, error } = useSeuilRentabiliteData(dossierId);
  const isPending = status === "loading";

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Seuil de rentabilité</h2>
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
            Calcul du seuil de rentabilité…
          </div>
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-175">
            <BreakEvenHeader yearLabels={data.yearLabels} />
            {data.rows.map((row) => (
              <BreakEvenRowItem key={row.key} row={row} />
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
