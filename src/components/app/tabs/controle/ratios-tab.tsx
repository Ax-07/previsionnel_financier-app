"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { ControlTabActionBar } from "./shared/control-tab-action-bar";
import { ControlTabContent } from "./shared/control-tab-content";
import { type RatiosData, type RatioRow } from "@/lib/finance/aggregations/ratios";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useRatiosData } from "@/hooks/controle/use-ratios-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  ControlTabTable,
  ControlTabTableHeader,
  ControlTabTableBody,
  ControlTabTableRow,
  ControlTabTableHead,
  ControlTabTableCell,
  SectionBannerRow,
  ANNUAL_REM,
  annualTableMinWidth,
} from "./shared/control-tab-table";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.value);

/** Clés par section pour les séparateurs visuels */
const SECTIONS: Array<{ label: string; keys: string[] }> = [
  {
    label: "Ratios de rotation",
    keys: ["delai_stocks", "delai_fournisseurs"],
  },
  {
    label: "Ratios de structure financière",
    keys: ["autonomie_lt", "solvabilite_mt", "solvabilite_ct", "taux_endettement"],
  },
  {
    label: "Capacité de remboursement",
    keys: ["capacite_remboursement"],
  },
];

// 1 label + 3 valeurs = 4 colonnes
const COL_COUNT = 4;

const frFmtCache = new Map<number, Intl.NumberFormat>();

function getFormatter(decimals: number): Intl.NumberFormat {
  let fmt = frFmtCache.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    frFmtCache.set(decimals, fmt);
  }
  return fmt;
}

function formatValue(value: number | null, decimals: number, unit: string): string {
  if (value === null) return "n/a";
  const formatted = getFormatter(decimals).format(value);
  return `${formatted} ${unit}`;
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function RatiosHeader({ yearLabels }: { yearLabels: RatiosData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <ControlTabTableHead key={yk} colType="value">{yearLabels[yk]}</ControlTabTableHead>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne de ratio ────────────────────────────────────────────────────────────

function RatioRowItem({ row }: { row: RatioRow }) {
  return (
    <ControlTabTableRow className="group hover:bg-muted/20">
      <ControlTabTableCell colType="label">{row.label}</ControlTabTableCell>
      {YEAR_KEYS_3.map((yk) => {
        const val = row.values[yk].value;
        const isNull = val === null;
        return (
          <ControlTabTableCell
            key={`${row.key}_${yk}`}
            colType="value"
            className={cn(
              isNull && "text-muted-foreground italic",
            )}
          >
            {formatValue(val, row.decimals, row.unit)}
          </ControlTabTableCell>
        );
      })}
    </ControlTabTableRow>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface RatiosTabProps {
  dossierId: string;
}

export default function RatiosTab({ dossierId }: RatiosTabProps) {
  const { data, status, error } = useRatiosData(dossierId);

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  /** Construit les lignes ordonnées avec bandeaux de section */
  function renderRows(rows: RatioRow[]) {
    const rowMap = new Map(rows.map((r) => [r.key, r]));
    return SECTIONS.flatMap((section) => {
      const sectionRows = section.keys
        .map((k) => rowMap.get(k))
        .filter((r): r is RatioRow => r !== undefined);
      if (sectionRows.length === 0) return [];
      return [
        <SectionBannerRow key={`section_${section.label}`} label={section.label} colSpan={COL_COUNT} />,
        ...sectionRows.map((row) => <RatioRowItem key={row.key} row={row} />),
      ];
    });
  }

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Ratios financiers"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {YEAR_KEYS_3.map((yk) => {
            const value = data.rows.find((r) => r.key === "autonomie_lt")?.values[yk]?.value ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`Autonomie financière — ${data.yearLabels[yk]}`}
                value={value}
                variant={value >= 0 ? "positive" : "negative"}
                unit="%"
                decimals={1}
              />
            );
          })}
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul des ratios financiers…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <ControlTabTable>
              <RatiosHeader yearLabels={data.yearLabels} />
              <ControlTabTableBody>
                {renderRows(data.rows)}
              </ControlTabTableBody>
            </ControlTabTable>
          </div>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
