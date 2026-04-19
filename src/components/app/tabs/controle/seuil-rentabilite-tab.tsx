"use client";

import { Fragment, useCallback } from "react";
import { cn, formatPct } from "@/lib/utils";
import {
  type BreakEvenData,
  type BreakEvenRow,
} from "@/lib/finance/calculs/seuil";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { ControlTabActionBar } from "./shared/control-tab-action-bar";
import { ControlTabContent } from "./shared/control-tab-content";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  ControlTabTable,
  ControlTabTableHeader,
  ControlTabTableBody,
  ControlTabTableRow,
  ControlTabTableHead,
  ControlTabTableCell,
  ANNUAL_REM,
  annualTableMinWidth,
} from "./shared/control-tab-table";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtSm, ANNUAL_REM.pct);
// 1 col label + 3 × (montant + %) = 7 colonnes
const COL_COUNT = 7;

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

// ── En-tête ───────────────────────────────────────────────────────────────────

function BreakEvenHeader({ yearLabels }: { yearLabels: BreakEvenData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <Fragment key={yk}>
            <ControlTabTableHead colType="amtSm">{yearLabels[yk]}</ControlTabTableHead>
            <ControlTabTableHead colType="pct" className="text-muted-foreground/70 font-normal">%</ControlTabTableHead>
          </Fragment>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne ─────────────────────────────────────────────────────────────────────

function BreakEvenRowItem({ row }: { row: BreakEvenRow }) {
  const isSection   = row.style === "section";
  const isSeparator = row.style === "separator";
  const isHighlight = row.style === "highlight";
  const isIndent    = row.style === "indent";
  const isJours     = JOURS_KEYS.has(row.key);
  const isTaux      = TAUX_KEYS.has(row.key);

  // Ligne séparateur : <tr><td colSpan> avec trait tireté
  if (isSeparator) {
    return (
      <tr>
        <td colSpan={COL_COUNT} className="h-3 border-b border-dashed border-muted p-0" />
      </tr>
    );
  }

  // Ligne section : bandeau pleine largeur, cellules années vides
  if (isSection) {
    return (
      <ControlTabTableRow variant="section">
        <ControlTabTableCell colType="label">
          {row.label}
        </ControlTabTableCell>
        {YEAR_KEYS_3.map((yk) => (
          <Fragment key={yk}>
            <ControlTabTableCell colType="amtSm" />
            <ControlTabTableCell colType="pct" />
          </Fragment>
        ))}
      </ControlTabTableRow>
    );
  }

  return (
    <ControlTabTableRow variant={row.style}>
      {/* Libellé */}
      <ControlTabTableCell colType="label" depth={isIndent ? 1 : 0}>
        <div className="flex items-center gap-1.5">
          {row.sign && (
            <span
              className={cn(
                "w-3 shrink-0 text-center font-mono text-xs tabular-nums",
                isHighlight ? "text-highlight-foreground/70" : "text-muted-foreground",
              )}
            >
              {row.sign}
            </span>
          )}
          <span className="truncate text-sm leading-tight">{row.label}</span>
        </div>
      </ControlTabTableCell>

      {/* Valeurs */}
      {YEAR_KEYS_3.map((yk) => {
        const val  = row.values[yk];
        const isNeg = val.amount !== null && val.amount < 0;
        return (
          <Fragment key={`${row.key}_${yk}`}>
            <ControlTabTableCell
              colType="amtSm"
              negative={isNeg && !isHighlight}
            >
              {formatAmount(val.amount ?? 0, isJours, isTaux)}
            </ControlTabTableCell>
            <ControlTabTableCell
              colType="pct"
              className={cn(isHighlight && "text-highlight-foreground/70")}
            >
              {row.showPct ? formatPct(val.pct) : ""}
            </ControlTabTableCell>
          </Fragment>
        );
      })}
    </ControlTabTableRow>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface SeuilRentabiliteTabProps {
  dossierId: string;
}

export default function SeuilRentabiliteTab({ dossierId }: SeuilRentabiliteTabProps) {
  const { data, status, error } = useSeuilRentabiliteData(dossierId);

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Seuil de rentabilité"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {YEAR_KEYS_3.map((yk) => {
            const amount = data.rows.find((r) => r.key === "seuil_eco")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`Seuil de rentabilité — ${data.yearLabels[yk]}`}
                value={amount}
                variant="neutral"
              />
            );
          })}
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul du seuil de rentabilité…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <BreakEvenHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) => (
                <BreakEvenRowItem key={row.key} row={row} />
              ))}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
