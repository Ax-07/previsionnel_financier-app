"use client";

import { Fragment, useCallback, useState } from "react";
import { cn, formatAmount, formatPct } from "@/lib/utils";
import { useComparisonData } from "@/hooks/controle/use-comparison-data";
import type { SynthRow, SyntheseData } from "@/lib/finance/aggregations/synthese";
import { YEAR_KEYS_3, type YearKey } from "@/lib/finance/utils";
import { ControlTabContainer } from "@/components/app/tabs/controle/shared/control-tab-container";
import { ControlTabActionBar } from "@/components/app/tabs/controle/shared/control-tab-action-bar";
import { ControlTabContent } from "@/components/app/tabs/controle/shared/control-tab-content";
import { YearSelector } from "@/components/app/tabs/controle/shared/year-selector";
import {
  ControlTabTable,
  ControlTabTableHeader,
  ControlTabTableBody,
  ControlTabTableRow,
  ControlTabTableHead,
  ControlTabTableCell,
  ANNUAL_REM,
  annualTableMinWidth,
} from "@/components/app/tabs/controle/shared/control-tab-table";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

// ── Constantes ────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtSm, ANNUAL_REM.pct);

const HYPOTHESE_LABELS = ["Pessimiste", "Réaliste", "Optimiste"] as const;

// ── Helpers de formatage ──────────────────────────────────────────────────────

function formatTaux(amount: number): string {
  if (amount === 0) return "—";
  return `${amount.toFixed(1)} %`;
}

function formatDays(amount: number): string {
  if (amount === 0) return "—";
  return `${Math.round(amount)} j`;
}

// ── Ligne de comparaison ──────────────────────────────────────────────────────

interface CompRowProps {
  row: SynthRow;
  yearKey: YearKey;
  pessimiste: SyntheseData;
  realiste: SyntheseData;
  optimiste: SyntheseData;
}

function CompRow({ row, yearKey, pessimiste, realiste, optimiste }: CompRowProps) {
  const isSection   = row.style === "section";
  const isHighlight = row.style === "highlight";

  const synths: SyntheseData[] = [pessimiste, realiste, optimiste];

  return (
    <ControlTabTableRow variant={row.style}>
      <ControlTabTableCell colType="label" className={cn(isSection && "text-xs")}>
        {row.label}
      </ControlTabTableCell>

      {synths.map((synth, i) => {
        const val    = synth.rows.find((r) => r.key === row.key)?.values[yearKey];
        const amount = val?.amount ?? 0;
        const pct    = val?.pct ?? null;
        const isNeg  = amount < 0;

        let displayAmount: string;
        if (isSection) {
          displayAmount = "";
        } else if (row.isTaux) {
          displayAmount = formatTaux(amount);
        } else if (row.isDays) {
          displayAmount = formatDays(amount);
        } else {
          displayAmount = formatAmount(amount);
        }

        return (
          <Fragment key={i}>
            <ControlTabTableCell
              colType="amtSm"
              className={cn(
                "text-right text-sm",
                isNeg && !isHighlight && !row.isTaux && "text-destructive",
                isSection && "text-xs text-muted-foreground",
                row.isTaux && "text-muted-foreground font-medium",
              )}
            >
              {displayAmount}
            </ControlTabTableCell>
            <ControlTabTableCell
              colType="pct"
              className={cn(
                "text-right text-xs text-muted-foreground",
                isHighlight && "text-highlight-foreground/70",
              )}
            >
              {!isSection && row.showPct && pct !== null ? formatPct(pct) : ""}
            </ControlTabTableCell>
          </Fragment>
        );
      })}
    </ControlTabTableRow>
  );
}

// ── En-tête du tableau ────────────────────────────────────────────────────────

function CompHeader() {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {HYPOTHESE_LABELS.map((label) => (
          <Fragment key={label}>
            <ControlTabTableHead colType="amtSm">{label}</ControlTabTableHead>
            <ControlTabTableHead colType="pct" className="text-xs font-normal text-primary-foreground/70">
              %
            </ControlTabTableHead>
          </Fragment>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface HypotheseComparisonViewProps {
  dossierId: string;
}

/**
 * Vue comparative des 3 scénarios (Pessimiste / Réaliste / Optimiste).
 * Reprend le design de l'onglet Synthèse (ControlTab*) avec les hypothèses
 * en colonnes au lieu des exercices.
 * Un tableau par exercice.
 */
export function HypotheseComparisonView({ dossierId }: HypotheseComparisonViewProps) {
  const { data, status, error } = useComparisonData(dossierId);
  const [activeYear, setActiveYear] = useState<YearKey>("y1");

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  const yearKeys = data
    ? (YEAR_KEYS_3.slice(0, data.dureeProjection) as readonly YearKey[])
    : YEAR_KEYS_3;

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Comparaison des scénarios"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
        rightContent={
          data ? (
            <YearSelector
              yearKeys={yearKeys}
              activeYear={activeYear}
              yearLabels={data.yearLabels}
              onSelect={setActiveYear}
            />
          ) : undefined
        }
      />

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul de la comparaison en cours…"
        dataLoaded={!!data}
        hasRows={!!data}
      >
        {data && (
          <div className="">
            <div style={{ minWidth: TABLE_MIN_WIDTH }}>
              <ControlTabTable>
                <CompHeader />
                <ControlTabTableBody>
                  {data.pessimiste.rows.map((row) => (
                    <CompRow
                      key={row.key}
                      row={row}
                      yearKey={activeYear}
                      pessimiste={data.pessimiste}
                      realiste={data.realiste}
                      optimiste={data.optimiste}
                    />
                  ))}
                </ControlTabTableBody>
              </ControlTabTable>
            </div>
          </div>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
