"use client";

import { useCallback, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type CafData, type CafRow } from "@/lib/finance/aggregations/caf";
import type { YearKey } from "@/lib/finance/utils";
import { useCafData } from "@/hooks/controle/use-caf-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function CafHeader({ yearLabels }: { yearLabels: CafData["yearLabels"] }) {
  return (
    <div className="sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm grid-cols-[1fr_repeat(3,minmax(0,140px))]">
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

interface CafRowItemProps {
  row: CafRow;
  depth?: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function CafRowItem({ row, depth = 0, expandedKeys, onToggle }: CafRowItemProps) {
  const isHighlight = row.style === "highlight";
  const isSubtotal = row.style === "subtotal";
  const hasChildren = !!row.children && row.children.length > 0;
  const isExpanded = expandedKeys.has(row.key);
  const indent = depth > 0 ? 8 + depth * 16 : 16;

  return (
    <>
      <div
        className={cn(
          "grid items-center border-b transition-colors",
          "grid-cols-[1fr_repeat(3,minmax(0,140px))]",
          "min-h-10",
          isHighlight && "bg-primary/10 font-bold text-primary",
          isSubtotal && "bg-muted/30 font-semibold",
          !isHighlight && !isSubtotal && "hover:bg-muted/20",
          hasChildren && !isHighlight && "cursor-pointer",
          depth > 0 && "bg-muted/10 text-muted-foreground",
        )}
        onClick={hasChildren && !isHighlight ? () => onToggle(row.key) : undefined}
      >
        {/* Libellé */}
        <div
          className="flex items-center gap-1.5 py-2.5"
          style={{ paddingLeft: `${indent}px` }}
        >
          {hasChildren && !isHighlight ? (
            isExpanded ? (
              <ChevronDownIcon className="shrink-0 size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="shrink-0 size-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="shrink-0 size-3.5" />
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
          <span className={cn("text-sm leading-tight", depth > 0 && "text-xs")}>{row.label}</span>
        </div>

        {/* Valeurs */}
        {YEAR_KEYS.map((yk) => {
          const val = row.values[yk];
          const isNeg = val.amount < 0;
          return (
            <div
              key={`${row.key}_${yk}`}
              className={cn(
                "pr-4 py-2.5 text-right tabular-nums",
                depth > 0 ? "text-xs" : "text-sm",
                isNeg && !isHighlight && "text-destructive",
              )}
            >
              {formatAmount(val.amount)}
            </div>
          );
        })}
      </div>

      {/* Lignes enfants */}
      {hasChildren && isExpanded &&
        row.children!.map((child) => (
          <CafRowItem
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

interface CafTabProps {
  dossierId: string;
}

export default function CafTab({ dossierId }: CafTabProps) {
  const { data, status, error } = useCafData(dossierId);
  const isPending = status === "loading";

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const handleToggle = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">
            Capacité d&apos;Autofinancement
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
            Calcul de la capacité d&apos;autofinancement…
          </div>
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-150">
            <CafHeader yearLabels={data.yearLabels} />
            {data.rows.map((row) => (
              <CafRowItem
                key={row.key}
                row={row}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
              />
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
