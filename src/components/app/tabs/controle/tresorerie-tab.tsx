"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronRight, RefreshCwIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTresorerieStore } from "@/stores/tresorerie-store";
import type { TresorerieRow } from "@/app/actions/controle/tresorerie";
import type { YearKey } from "@/lib/finance/utils";

// ── Constantes ────────────────────────────────────────────────────────────────

const LABEL_COL_WIDTH = 256;
const MONTH_COL_WIDTH = 84;
const TOTAL_COL_WIDTH = 104;

const YEAR_LABELS: Record<YearKey, string> = {
  y1: "Année N",
  y2: "Année N+1",
  y3: "Année N+2",
};

// ── Formatage ─────────────────────────────────────────────────────────────────

function formatAmount(v: number): string {
  if (v === 0) return "–";
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(v));
}

function formatAmountColored(v: number): { text: string; cls: string } {
  if (v === 0) return { text: "–", cls: "text-muted-foreground" };
  const text = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(v));
  return { text, cls: v < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400" };
}

// ── Styles de lignes ──────────────────────────────────────────────────────────

function rowBg(style: TresorerieRow["style"]): string {
  switch (style) {
    case "section":
      return "bg-primary/10 dark:bg-primary/15";
    case "subtotal":
      return "bg-muted/60";
    case "result":
      return "bg-blue-50 dark:bg-blue-950/30";
    case "highlight":
      return "bg-primary/5 border-t-2 border-primary/30";
    case "indent":
      return "bg-background/50";
    default:
      return "";
  }
}

function labelCls(style: TresorerieRow["style"]): string {
  switch (style) {
    case "section":
      return "font-bold text-primary uppercase tracking-wide text-xs";
    case "subtotal":
      return "font-semibold";
    case "result":
      return "font-semibold text-blue-700 dark:text-blue-300";
    case "highlight":
      return "font-bold text-primary";
    case "indent":
      return "text-muted-foreground pl-6 text-sm";
    default:
      return "text-sm";
  }
}

// ── Sous-composant : cellule de montant ───────────────────────────────────────

function AmountCell({
  value,
  style,
  width,
  colored = false,
}: {
  value: number;
  style: TresorerieRow["style"];
  width: number;
  colored?: boolean;
}) {
  const isSection = style === "section";
  if (isSection) {
    return (
      <td
        style={{ minWidth: width, maxWidth: width }}
        className="border-x border-border/30 px-2 py-2"
      />
    );
  }

  if (colored) {
    const { text, cls } = formatAmountColored(value);
    return (
      <td
        style={{ minWidth: width, maxWidth: width }}
        className={cn(
          "border-x border-border/30 px-2 py-2 text-right font-mono text-xs tabular-nums",
          cls,
        )}
      >
        {text}
      </td>
    );
  }

  return (
    <td
      style={{ minWidth: width, maxWidth: width }}
      className="border-x border-border/30 px-2 py-2 text-right font-mono text-xs tabular-nums"
    >
      {formatAmount(value)}
    </td>
  );
}

// ── Sous-composant : ligne du tableau ─────────────────────────────────────────

interface TresorerieRowItemProps {
  row: TresorerieRow;
  yearKey: YearKey;
  monthCount: number;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
  depth?: number;
}

function TresorerieRowItem({
  row,
  yearKey,
  monthCount,
  collapsed,
  onToggle,
  depth = 0,
}: TresorerieRowItemProps) {
  const val = row.values[yearKey];
  const hasChildren = (row.children?.length ?? 0) > 0;
  // Une ligne est dépliée si elle n'est pas dans l'ensemble collapsed
  const isExpanded = hasChildren && !collapsed.has(row.key);
  const isSection = row.style === "section";
  const isColored =
    row.style === "result" ||
    row.style === "highlight";

  // Lignes "hideIfZero" : masquer si tous les mois sont nuls
  const allZero = val.months.every((v) => v === 0);
  if (row.hideIfZero && allZero) return null;

  return (
    <>
      <tr className={cn("border-b border-border/20 hover:bg-muted/20 transition-colors", rowBg(row.style))}>
        {/* Colonne libellé */}
        <td
          style={{ minWidth: LABEL_COL_WIDTH, maxWidth: LABEL_COL_WIDTH, paddingLeft: depth > 0 ? `${depth * 20 + 16}px` : undefined }}
          className="sticky left-0 z-10 border-r border-border/50 px-3 py-2"
        >
          <div
            className={cn(
              "flex items-center gap-1.5",
              rowBg(row.style),
            )}
          >
            {hasChildren && !isSection ? (
              <button
                type="button"
                onClick={() => onToggle(row.key)}
                className="rounded p-0.5 hover:bg-muted transition-colors"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Replier" : "Déplier"}
              >
                {isExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={labelCls(row.style)}>{row.label}</span>
          </div>
        </td>

        {/* Colonnes mensuelles */}
        {Array.from({ length: monthCount }, (_, m) => (
          <AmountCell
            key={m}
            value={val.months[m] ?? 0}
            style={row.style}
            width={MONTH_COL_WIDTH}
            colored={isColored}
          />
        ))}

        {/* Colonne total */}
        <AmountCell
          value={val.total}
          style={row.style}
          width={TOTAL_COL_WIDTH}
          colored={isColored}
        />
      </tr>

      {/* Children dépliés */}
      {hasChildren && isExpanded &&
        row.children!.map((child) => (
          <TresorerieRowItem
            key={child.key}
            row={child}
            yearKey={yearKey}
            monthCount={monthCount}
            collapsed={collapsed}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

// ── Sous-composant : en-tête du tableau ───────────────────────────────────────

function TresorerieTableHeader({
  monthLabels,
}: {
  monthLabels: string[];
}) {
  return (
    <thead>
      <tr className="bg-muted/80 border-b border-border">
        <th
          style={{ minWidth: LABEL_COL_WIDTH, maxWidth: LABEL_COL_WIDTH }}
          className="sticky left-0 z-20 bg-muted/80 border-r border-border px-3 py-2 text-left text-xs font-semibold"
        >
          Libellé
        </th>
        {monthLabels.map((label) => (
          <th
            key={label}
            style={{ minWidth: MONTH_COL_WIDTH, maxWidth: MONTH_COL_WIDTH }}
            className="border-x border-border/50 px-2 py-2 text-center text-xs font-medium"
          >
            {label}
          </th>
        ))}
        <th
          style={{ minWidth: TOTAL_COL_WIDTH, maxWidth: TOTAL_COL_WIDTH }}
          className="border-l border-border/50 px-2 py-2 text-center text-xs font-semibold"
        >
          Total
        </th>
      </tr>
    </thead>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "positive" | "negative" | "neutral";
}) {
  const color =
    variant === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : variant === "negative"
        ? "text-destructive"
        : variant === "neutral"
          ? "text-blue-600 dark:text-blue-400"
          : "text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1 min-w-40">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={cn("text-xl font-bold tabular-nums", color)}>
        {formatAmount(value)}
        <span className="text-xs font-normal text-muted-foreground ml-1">€</span>
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface TresorerieTabProps {
  dossierId: string;
}

export function TresorerieTab({ dossierId }: TresorerieTabProps) {
  const { getData, getStatus, getError, fetch, invalidate } = useTresorerieStore();

  const data = getData(dossierId);
  const status = getStatus(dossierId);
  const error = getError(dossierId);

  useEffect(() => {
    fetch(dossierId);
  }, [dossierId]);

  const handleRefresh = useCallback(() => {
    invalidate(dossierId);
    fetch(dossierId, true);
  }, [dossierId, fetch, invalidate]);

  // ── Sélection d'exercice ─────────────────────────────────────────────────
  const [yearKey, setYearKey] = useState<YearKey>("y1");

  // ── État collapsible ─────────────────────────────────────────────────────
  // On initialise avec les clés des lignes defaultCollapsed: true
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(["enc-ca", "dec-immo", "dec-achats", "dec-emprunts", "dec-charges-ext", "dec-personnel", "dec-tva"]),
  );

  const handleToggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Chargement / erreur ──────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Calcul de la trésorerie en cours…
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-destructive text-sm">
          {error ?? "Impossible de charger le tableau de trésorerie."}
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCwIcon className="size-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const monthLabels = data.monthLabels[yearKey];
  const rows = data.rows;

  // Calcul des KPIs depuis les totaux des lignes synthèse
  const findRow = (key: string) => rows.find((r) => r.key === key);
  const encTotal = findRow("enc-total")?.values[yearKey].total ?? 0;
  const decTotal = findRow("dec-total")?.values[yearKey].total ?? 0;
  const soldeFin = findRow("tres-solde-final")?.values[yearKey].total ?? 0;

  const soldeFinalVariant =
    soldeFin > 0 ? "positive" : soldeFin < 0 ? "negative" : "neutral";

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-6">
      {/* ── Sélecteur d'exercice ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tableau de trésorerie</h2>
          <p className="text-sm text-muted-foreground">
            Flux mensuels prévisionnels — {data.yearLabels[yearKey]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={yearKey}
            onValueChange={(v) => setYearKey(v as YearKey)}
          >
            <TabsList>
              {(["y1", "y2", "y3"] as YearKey[]).map((yk) => (
                <TabsTrigger key={yk} value={yk}>
                  {YEAR_LABELS[yk]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCwIcon className="size-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-3 flex-wrap">
        <KpiCard
          label="Total encaissements"
          value={encTotal}
          variant="positive"
        />
        <KpiCard
          label="Total décaissements"
          value={decTotal}
          variant="negative"
        />
        <KpiCard
          label="Solde de clôture"
          value={soldeFin}
          variant={soldeFinalVariant}
        />
        <KpiCard
          label="Variation nette"
          value={encTotal - decTotal}
          variant={encTotal - decTotal >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* ── Tableau scrollable ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-auto mx-auto">
        <table className="w-max border-collapse text-sm">
          <TresorerieTableHeader monthLabels={monthLabels} />
          <tbody>
            {rows.map((row) => (
              <TresorerieRowItem
                key={row.key}
                row={row}
                yearKey={yearKey}
                monthCount={monthLabels.length}
                collapsed={collapsed}
                onToggle={handleToggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
