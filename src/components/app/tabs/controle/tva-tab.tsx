"use client";

import { useCallback, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { YearKey } from "@/lib/finance/utils";
import { useTvaData } from "@/hooks/controle/use-tva-data";
import type { VATData, VATRow } from "@/hooks/controle/use-tva-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Constantes ────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

/** Largeur fixe de la colonne libellé (px) */
const LABEL_COL_WIDTH = 248;
/** Largeur de chaque colonne mensuelle (px) */
const MONTH_COL_WIDTH = 76;
/** Largeur de la colonne Total (px) */
const TOTAL_COL_WIDTH = 96;

// ── Helpers ────────────────────────────────────────────────────────────────────

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

function rowStyleClass(style: VATRow["style"]): string {
  switch (style) {
    case "section":
      return "bg-muted/60 font-semibold uppercase tracking-wide text-xs text-muted-foreground";
    case "subtotal":
      return "bg-muted/30 font-semibold";
    case "result":
      return "bg-primary/10 font-bold text-primary";
    case "highlight":
      return "bg-primary/20 font-bold text-primary border-t-2 border-primary/30";
    default:
      return "hover:bg-muted/20";
  }
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface VATRowItemProps {
  row: VATRow;
  activeYear: YearKey;
  depth?: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function VATRowItem({ row, activeYear, depth = 0, expandedKeys, onToggle }: VATRowItemProps) {
  const hasChildren = row.children && row.children.length > 0;
  const isExpanded = expandedKeys.has(row.key);
  const isSection = row.style === "section";
  const isResult = row.style === "result" || row.style === "highlight";
  const val = row.values[activeYear];

  // Masquer si hideIfZero et tout à zéro
  if (row.hideIfZero && val.total === 0 && val.months.every((m) => m === 0)) {
    return null;
  }

  const indent = depth > 0 ? 8 + depth * 16 : 16;

  return (
    <>
      <div
        className={cn("flex h-9 items-stretch border-b transition-colors", rowStyleClass(row.style))}
        role="row"
      >
        {/* Colonne libellé – fixe */}
        <div
          className="flex shrink-0 items-center border-r py-1"
          style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH, paddingLeft: indent }}
        >
          {hasChildren && !isSection ? (
            <button
              type="button"
              onClick={() => onToggle(row.key)}
              className="mr-1 flex shrink-0 items-center text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Replier" : "Déplier"}
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="mr-1 size-3.5 shrink-0" />
          )}
          <span className={cn("truncate text-sm leading-tight", isSection && "text-xs")}>
            {row.label}
          </span>
        </div>

        {/* Colonnes mois M1..M12 */}
        {isSection
          ? Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="shrink-0 border-r"
                style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_WIDTH }}
              />
            ))
          : val.months.map((mv, i) => (
              <div
                key={i}
                className={cn(
                  "flex shrink-0 items-center justify-end border-r px-2 text-xs tabular-nums",
                  mv < 0 && !isResult && "text-destructive",
                )}
                style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_WIDTH }}
              >
                {formatAmount(mv)}
              </div>
            ))}

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

      {/* Lignes enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        row.children!.map((child) => (
          <VATRowItem
            key={child.key}
            row={child}
            activeYear={activeYear}
            depth={depth + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── En-tête du tableau ────────────────────────────────────────────────────────

interface VATTableHeaderProps {
  data: VATData;
  activeYear: YearKey;
}

function VATTableHeader({ data, activeYear }: VATTableHeaderProps) {
  const labels = data.monthLabels[activeYear];

  return (
    <div
      className="sticky top-0 z-20 flex h-10 items-stretch border-b bg-background font-semibold text-xs"
      role="row"
    >
      {/* Libellé */}
      <div
        className="flex shrink-0 items-center border-r px-4 text-sm"
        style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH }}
      >
        Désignation
      </div>

      {/* Mois */}
      {labels.map((label, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center justify-end border-r px-2 text-center leading-tight text-muted-foreground"
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

interface TVATabProps {
  dossierId: string;
}

export default function TVATab({ dossierId }: TVATabProps) {
  const { data, status, error } = useTvaData(dossierId);
  const isPending = status === "loading";

  const [activeYear, setActiveYear] = useState<YearKey>("y1");
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

  const totalWidth = LABEL_COL_WIDTH + MONTH_COL_WIDTH * 12 + TOTAL_COL_WIDTH;

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Déclaration TVA prévisionnelle</h2>
          {data && (
            <>
              <Badge variant="secondary" className="text-xs">
                Lecture seule
              </Badge>
              {data.isFranchise && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-700 dark:text-amber-400"
                >
                  Franchise de TVA
                </Badge>
              )}
              {!data.isFranchise && (
                <Badge variant="outline" className="text-xs">
                  {data.periodicite === "trimestriel" ? "Déclaration trimestrielle" : "Déclaration mensuelle"}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sélecteur d'exercice */}
          {data && !data.isFranchise && (
            <div className="flex overflow-hidden rounded-md border">
              {YEAR_KEYS.map((yk, idx) => (
                <button
                  key={yk}
                  type="button"
                  onClick={() => setActiveYear(yk)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium transition-colors",
                    activeYear === yk
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                    idx < YEAR_KEYS.length - 1 && "border-r",
                  )}
                >
                  {data.yearLabels[yk]}
                </button>
              ))}
            </div>
          )}

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
            Calcul de la TVA prévisionnelle en cours…
          </div>
        )}

        {/* Franchise de TVA */}
        {data?.isFranchise && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="font-medium text-sm">Franchise de TVA</p>
            <p className="text-xs">
              Ce régime dispense de la collecte, de la déclaration et du paiement de la TVA.
            </p>
          </div>
        )}

        {/* Tableau */}
        {data && !data.isFranchise && data.rows.length > 0 && (
          <div style={{ minWidth: totalWidth }}>
            <VATTableHeader data={data} activeYear={activeYear} />
            {data.rows.map((row) => (
              <VATRowItem
                key={row.key}
                row={row}
                activeYear={activeYear}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* État vide */}
        {data && !data.isFranchise && data.rows.length === 0 && (
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
