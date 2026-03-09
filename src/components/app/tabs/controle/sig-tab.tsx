"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type SigData, type SigNode } from "@/app/actions/controle/sig";
import type { YearKey } from "@/lib/finance/utils";
import { useSigStore } from "@/stores/sig-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

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

function isAllZero(node: SigNode): boolean {
  return YEAR_KEYS.every((k) => node.values[k].amount === 0);
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface SigRowProps {
  node: SigNode;
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function SigRow({ node, depth, expandedKeys, onToggle }: SigRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isSection = node.style === "section";
  const isTotal = node.style === "total";
  const isHighlight = node.style === "highlight";

  if (node.hideIfZero && isAllZero(node)) return null;

  const rowClass = cn(
    "grid h-9 items-center border-b transition-colors",
    "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
    isSection &&
      "bg-muted/60 font-semibold uppercase tracking-wide text-xs text-muted-foreground",
    isTotal && "bg-muted/30 font-semibold",
    isHighlight && "bg-primary/10 font-bold text-primary",
    !isSection && !isTotal && !isHighlight && "hover:bg-muted/20",
  );

  return (
    <>
      <div className={rowClass}>
        {/* Libellé */}
        <div
          className={cn(
            "flex items-center gap-1 truncate px-3 py-1",
            depth === 1 && "pl-6",
            depth === 2 && "pl-10",
            depth > 2 && "pl-14",
          )}
        >
          {hasChildren && !isSection ? (
            <button
              type="button"
              onClick={() => onToggle(node.key)}
              className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Replier" : "Déplier"}
              aria-expanded={isExpanded}
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
          <span
            className={cn(
              "truncate text-sm leading-tight",
              isSection && "text-xs",
            )}
          >
            {node.label}
          </span>
        </div>

        {/* Valeurs par exercice */}
        {YEAR_KEYS.map((yk) => {
          const val = node.values[yk];
          const isNeg = val.amount < 0;
          return (
            <Fragment key={`${node.key}_${yk}`}>
              <div
                className={cn(
                  "pr-3 text-right text-sm tabular-nums",
                  isNeg && !isHighlight && "text-destructive",
                  isSection && "text-xs text-muted-foreground",
                )}
              >
                {isSection ? "" : formatAmount(val.amount)}
              </div>
              <div
                className={cn(
                  "pr-2 text-right text-xs tabular-nums text-muted-foreground",
                  isHighlight && "text-primary/70",
                )}
              >
                {isSection ? "" : val.pct !== null ? formatPct(val.pct) : ""}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <SigRow
            key={child.key}
            node={child}
            depth={depth + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function SigHeader({ yearLabels }: { yearLabels: SigData["yearLabels"] }) {
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

// ── Composant principal ───────────────────────────────────────────────────────

interface SigTabProps {
  dossierId: string;
}

export default function SigTab({ dossierId }: SigTabProps) {
  const { fetch, invalidate, getData, getStatus, getError } = useSigStore();

  const data = getData(dossierId);
  const status = getStatus(dossierId);
  const error = getError(dossierId);
  const isPending = status === "loading";

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(dossierId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleRefresh = useCallback(() => {
    invalidate(dossierId);
    fetch(dossierId, true);
  }, [dossierId, fetch, invalidate]);

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
            Soldes Intermédiaires de Gestion
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
            Calcul des soldes intermédiaires de gestion…
          </div>
        )}

        {/* Tableau */}
        {data && data.nodes.length > 0 && (
          <div className="min-w-175">
            <SigHeader yearLabels={data.yearLabels} />
            {data.nodes.map((node) => (
              <SigRow
                key={node.key}
                node={node}
                depth={0}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* État vide */}
        {data && data.nodes.length === 0 && (
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
