"use client";

import { Fragment, useCallback, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type CompteResultatData, type CRNode } from "@/lib/finance/aggregations/compte-resultat";
import type { YearKey } from "@/lib/finance/utils";
import { useCompteResultatData } from "@/hooks/controle/use-compte-resultat-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];

const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

function formatPct(pct: number | null): string {
  if (pct === null) return "";
  return `${pct.toFixed(1)} %`;
}

function isAllZero(node: CRNode): boolean {
  return YEAR_KEYS.every((k) => node.values[k].amount === 0);
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface CRRowProps {
  node: CRNode;
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function CRRow({ node, depth, expandedKeys, onToggle }: CRRowProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isSection = node.style === "section";
  const isSubtotal = node.style === "subtotal";
  const isTotal = node.style === "total";
  const isResult = node.style === "result";
  const isNormal = node.style === "normal";

  // Masquer les lignes vides avec hideIfZero
  if (node.hideIfZero && isAllZero(node)) return null;

  const rowClass = cn(
    "grid h-9 items-center border-b transition-colors",
    // Colonnes responsive : libellé + 3× (montant + %)
    "grid-cols-[1fr_repeat(3,minmax(0,120px)_minmax(0,68px))]",
    isSection && "bg-primary font-semibold uppercase tracking-wide text-xs text-primary-foreground hover:bg-primary/90",
    isNormal && "italic",
    isSubtotal && "bg-secondary/10 font-medium hover:bg-secondary/20",
    isTotal && "bg-secondary/30 font-semibold hover:bg-secondary/40",
    isResult && "bg-amber-500/30 font-bold text-secondary-foreground hover:bg-amber-500/40",
    !isSection && !isSubtotal && !isTotal && !isResult && "hover:bg-muted",
  );

  return (
    <>
      <div className={rowClass}>
        {/* Libellé */}
        <div
          className={cn(
            "flex items-center gap-1 truncate px-3 py-1",
            depth > 0 && "pl-6",
            depth > 1 && "pl-10",
          )}
        >
          {hasChildren && !isSection && (
            <button
              type="button"
              onClick={() => onToggle(node.key)}
              className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Replier" : "Déplier"}
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>
          )}
          {(!hasChildren || isSection) && <span className="size-3.5 shrink-0" />}
          <span className={cn("truncate text-sm leading-tight", isSection && "text-xs")}>{node.label}</span>
        </div>

        {/* Valeurs N / N+1 / N+2 */}
        {YEAR_KEYS.map((yk) => {
          const val = node.values[yk];
          const isNeg = val.amount < 0;
          return (
            <Fragment key={`${node.key}_${yk}`}>
              <div
                className={cn(
                  "pr-3 text-right text-sm tabular-nums",
                  isNeg && "text-destructive",
                  isSection && "text-xs text-muted-foreground",
                )}
              >
                {isSection ? "" : formatAmount(val.amount)}
              </div>
              <div
                className={cn(
                  "pr-2 text-right text-xs tabular-nums text-muted-foreground",
                  isSection && "text-xs",
                )}
              >
                {isSection ? "" : val.pct !== null ? formatPct(val.pct) : ""}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Lignes enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <CRRow
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

// ── Composant header ──────────────────────────────────────────────────────────

interface CRHeaderProps {
  yearLabels: CompteResultatData["yearLabels"];
}

function CRHeader({ yearLabels }: CRHeaderProps) {
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
          <div className="pr-2 text-right text-xs text-muted-foreground">
            %
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface CompteResultatTabProps {
  dossierId: string;
}

export default function CompteResultatTab({ dossierId }: CompteResultatTabProps) {
  const { data, status, error } = useCompteResultatData(dossierId);
  const isPending = status === "loading";

  // Clés des nœuds dépliés
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

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Compte de résultat prévisionnel</h2>
          {data && (
            <Badge variant="outline" className="text-xs">
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
          {isPending ? "Chargement…" : "Actualiser"}
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

        {/* Skeleton chargement */}
        {isPending && !data && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Calcul du compte de résultat en cours…
          </div>
        )}

        {/* Tableau */}
        {data && data.nodes.length > 0 && (
          <div className="min-w-175">
            <CRHeader yearLabels={data.yearLabels} />
            {data.nodes.map((node) => (
              <CRRow
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
            <p className="text-xs">Renseignez les onglets de saisie puis actualisez.</p>
          </div>
        )}
      </div>
    </div>
  );
}
