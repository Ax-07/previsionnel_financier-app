"use client";

import { useCallback, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type BfrData, type BfrRow } from "@/lib/finance/aggregations/bfr";
import type { YearKey4 as YearKey } from "@/lib/finance/utils";
import { useBfrData } from "@/hooks/controle/use-bfr-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y0", "y1", "y2", "y3"];

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function BfrHeader({ yearLabels }: { yearLabels: BfrData["yearLabels"] }) {
  return (
    <div className="sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm grid-cols-[1fr_repeat(4,minmax(0,140px))]">
      <div className="px-4">Désignation</div>
      {YEAR_KEYS.map((yk) => (
        <div key={yk} className="pr-4 text-right">
          {yearLabels[yk]}
        </div>
      ))}
    </div>
  );
}

// ── Ligne ─────────────────────────────────────────────────────────────────────

interface BfrRowItemProps {
  row: BfrRow;
  depth?: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function BfrRowItem({ row, depth = 0, expandedKeys, onToggle }: BfrRowItemProps) {
  const hasChildren = row.children && row.children.length > 0;
  const isExpanded = expandedKeys.has(row.key);
  const isHighlight = row.style === "highlight";
  const isSubtotal = row.style === "subtotal";
  const isSection = row.style === "section";

  if (isSection) {
    return (
      <div className="grid grid-cols-[1fr_repeat(4,minmax(0,140px))] border-b bg-muted/50">
        <div className="col-span-5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {row.label}
        </div>
      </div>
    );
  }

  // Masquer si hideIfZero et toutes les valeurs sont nulles
  if (
    row.hideIfZero &&
    row.values.y0.amount === 0 &&
    row.values.y1.amount === 0 &&
    row.values.y2.amount === 0 &&
    row.values.y3.amount === 0
  ) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "grid items-center border-b transition-colors",
          "grid-cols-[1fr_repeat(4,minmax(0,140px))]",
          "min-h-10",
          isHighlight && "bg-primary/10 font-bold text-primary",
          isSubtotal && "bg-muted/30 font-semibold",
          !isHighlight && !isSubtotal && "hover:bg-muted/20",
        )}
      >
        {/* Libellé */}
        <div
          className={cn(
            "flex items-center gap-1 px-4 py-2.5",
            depth === 1 && "pl-8",
            depth >= 2 && "pl-12",
          )}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(row.key)}
              className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Replier" : "Déplier"}
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          {row.sign && (
            <span
              className={cn(
                "shrink-0 font-mono text-xs tabular-nums w-3 text-center",
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
          const val = row.values[yk];
          const isNeg = val.amount < 0;
          return (
            <div
              key={`${row.key}_${yk}`}
              className={cn(
                "pr-4 py-2.5 text-right text-sm tabular-nums",
                isNeg && !isHighlight && "text-destructive",
              )}
            >
              {formatAmount(val.amount)}
            </div>
          );
        })}
      </div>

      {/* Lignes enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        row.children!.map((child) => (
          <BfrRowItem
            key={child.key}
            row={child}
            depth={depth + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BfrTabProps {
  dossierId: string;
}

export default function BfrTab({ dossierId }: BfrTabProps) {
  const { data, status, error } = useBfrData(dossierId);
  const isPending = status === "loading";

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">
            Besoin en Fonds de Roulement
          </h2>
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
            Calcul du besoin en fonds de roulement…
          </div>
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-150">
            <BfrHeader yearLabels={data.yearLabels} />
            {data.rows.map((row) => (
              <BfrRowItem key={row.key} row={row} expandedKeys={expandedKeys} onToggle={handleToggle} />
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
