"use client";

import { Fragment, useCallback, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { YearKey } from "@/lib/finance/utils";
import { useBudgetData } from "@/hooks/controle/use-budget-data";
import type { BudgetData, BudgetNode, BudgetNodeStyle } from "@/hooks/controle/use-budget-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

function isAllZeroNode(node: BudgetNode): boolean {
  return YEAR_KEYS.every((k) => node.values[k].total === 0);
}

// ── Styles par type de ligne ──────────────────────────────────────────────────

function rowStyleClass(style: BudgetNodeStyle): string {
  switch (style) {
    case "section":
      return "bg-muted/60 font-semibold uppercase tracking-wide text-xs text-muted-foreground";
    case "total":
      return "bg-muted/30 font-semibold";
    case "result":
      return "bg-primary/10 font-bold text-primary";
    case "highlight":
      return "bg-primary/20 font-bold text-primary border-t-2 border-primary/30";
    default:
      return "hover:bg-muted/20";
  }
}

// ── Types colonnes ────────────────────────────────────────────────────────────

const MONTH_COL_WIDTH = 72; // px
const TOTAL_COL_WIDTH = 90; // px
const LABEL_COL_WIDTH = 220; // px

// ── Composant ligne ───────────────────────────────────────────────────────────

interface BudgetRowProps {
  node: BudgetNode;
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  activeYear: YearKey;
}

function BudgetRow({
  node,
  depth,
  expandedKeys,
  onToggle,
  activeYear,
}: BudgetRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isSection = node.style === "section";
  const isResult = node.style === "result" || node.style === "highlight";

  if (node.hideIfZero && isAllZeroNode(node)) return null;

  const val = node.values[activeYear];
  const monthVals = val.months;

  const rowClass = cn(
    "flex h-9 items-stretch border-b transition-colors",
    rowStyleClass(node.style),
  );

  return (
    <>
      <div className={rowClass} role="row">
        {/* Colonne libellé – fixe */}
        <div
          className="flex shrink-0 items-center gap-1 border-r px-3 py-1"
          style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH }}
        >
          {/* Indentation */}
          {depth > 0 && (
            <span
              className="shrink-0"
              style={{ width: depth * 12, display: "inline-block" }}
            />
          )}
          {/* Bouton dépli */}
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

        {/* Colonnes mois M1..M12 */}
        {isSection
          ? // Section : cellules vides
            Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="shrink-0 border-r"
                style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_WIDTH }}
              />
            ))
          : monthVals.map((mv, i) => {
              const isNeg = mv < 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex shrink-0 items-center justify-end border-r px-2 text-xs tabular-nums",
                    isNeg && !isResult && "text-destructive",
                  )}
                  style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_WIDTH }}
                >
                  {formatAmount(mv)}
                </div>
              );
            })}

        {/* Colonne Total */}
        {isSection ? (
          <div
            className="shrink-0"
            style={{ width: TOTAL_COL_WIDTH, minWidth: TOTAL_COL_WIDTH }}
          />
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-end px-3 text-sm tabular-nums font-semibold",
              val.total < 0 && !isResult && "text-destructive",
            )}
            style={{ width: TOTAL_COL_WIDTH, minWidth: TOTAL_COL_WIDTH }}
          >
            {formatAmount(val.total)}
          </div>
        )}
      </div>

      {/* Enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <BudgetRow
            key={child.key}
            node={child}
            depth={depth + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
            activeYear={activeYear}
          />
        ))}
    </>
  );
}

// ── En-tête ───────────────────────────────────────────────────────────────────

interface BudgetHeaderProps {
  data: BudgetData;
  activeYear: YearKey;
}

function BudgetHeader({ data, activeYear }: BudgetHeaderProps) {
  const labels = data.monthLabels[activeYear];

  return (
    <div
      className="sticky top-0 z-20 flex h-10 items-stretch border-b bg-background font-semibold text-xs"
      role="row"
    >
      {/* Libellé */}
      <div
        className="flex shrink-0 items-center border-r px-3 text-sm"
        style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH }}
      >
        Désignation
      </div>

      {/* Mois */}
      {labels.map((label, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 items-center justify-end border-r px-2 text-center leading-tight",
            "text-muted-foreground",
          )}
          style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_WIDTH }}
        >
          {label}
        </div>
      ))}

      {/* Total */}
      <div
        className="flex shrink-0 items-center justify-end px-3 text-muted-foreground"
        style={{ width: TOTAL_COL_WIDTH, minWidth: TOTAL_COL_WIDTH }}
      >
        Total
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BudgetTabProps {
  dossierId: string;
}

export default function BudgetTab({ dossierId }: BudgetTabProps) {
  const { data, status, error } = useBudgetData(dossierId);
  const isPending = status === "loading";

  const [activeYear, setActiveYear] = useState<YearKey>("y1");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  const handleToggle = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!data) return;
    const keys = new Set<string>();
    function collectKeys(nodes: BudgetNode[]) {
      for (const node of nodes) {
        if (node.children?.length) {
          keys.add(node.key);
          collectKeys(node.children);
        }
      }
    }
    collectKeys(data.nodes);
    setExpandedKeys(keys);
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys(new Set());
  }, []);

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Budget prévisionnel mensuel</h2>
          {data && (
            <Badge variant="secondary" className="text-xs">
              Lecture seule
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sélecteur exercice */}
          {data && (
            <div className="flex gap-1 rounded-md border bg-background p-0.5">
              {YEAR_KEYS.map((yk) => (
                <button
                  key={yk}
                  type="button"
                  onClick={() => setActiveYear(yk)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition-colors",
                    activeYear === yk
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {data.yearLabels[yk]}
                </button>
              ))}
            </div>
          )}

          {/* Déplier / Replier tout */}
          {data && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="h-7 px-2 text-xs"
              >
                Tout déplier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="h-7 px-2 text-xs"
              >
                Tout replier
              </Button>
            </div>
          )}

          {/* Actualiser */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5"
          >
            <RefreshCwIcon className={cn("size-3.5", isPending && "animate-spin")} />
            {isPending ? "Chargement…" : "Actualiser"}
          </Button>
        </div>
      </div>

      {/* ── Contenu ────────────────────────────────────────────────────────── */}
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
            Calcul du budget mensuel en cours…
          </div>
        )}

        {/* Tableau */}
        {data && data.nodes.length > 0 && (
          <div
            role="grid"
            aria-label="Budget prévisionnel mensuel"
            style={{
              minWidth:
                LABEL_COL_WIDTH +
                12 * MONTH_COL_WIDTH +
                TOTAL_COL_WIDTH,
            }}
          >
            <BudgetHeader data={data} activeYear={activeYear} />
            {data.nodes.map((node) => (
              <BudgetRow
                key={node.key}
                node={node}
                depth={0}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
                activeYear={activeYear}
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
