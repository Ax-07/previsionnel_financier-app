"use client";

import { Fragment, useCallback } from "react";
import { cn, formatAmount, formatPct } from "@/lib/utils";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useSyntheseData } from "@/hooks/controle/use-synthese-data";
import type { SyntheseData, SynthRow } from "@/hooks/controle/use-synthese-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { ControlTabActionBar } from "./shared/control-tab-action-bar";
import { ControlTabContent } from "./shared/control-tab-content";
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

// ── Constantes ────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtSm, ANNUAL_REM.pct);

// ── Helpers de formatage ──────────────────────────────────────────────────────

function formatTaux(amount: number): string {
  if (amount === 0) return "—";
  return `${amount.toFixed(1)} %`;
}

function formatDays(amount: number): string {
  if (amount === 0) return "—";
  return `${Math.round(amount)} j`;
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface SynthRowProps {
  row: SynthRow;
}

function SynthRowItem({ row }: SynthRowProps) {
  const isSection = row.style === "section";
  const isHighlight = row.style === "highlight";

  return (
    <ControlTabTableRow variant={row.style}>
      <ControlTabTableCell colType="label" className={cn(isSection && "text-xs")}>
        {row.label}
      </ControlTabTableCell>

      {YEAR_KEYS_3.map((yk) => {
        const val = row.values[yk];
        const isNeg = val.amount !== null && val.amount < 0;

        let displayAmount: string;
        if (isSection) {
          displayAmount = "";
        } else if (row.isTaux) {
          displayAmount = formatTaux(val.amount ?? 0);
        } else if (row.isDays) {
          displayAmount = formatDays(val.amount ?? 0);
        } else {
          displayAmount = formatAmount(val.amount ?? 0);
        }

        return (
          <Fragment key={`${row.key}_${yk}`}>
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
              {!isSection && row.showPct && val.pct !== null
                ? formatPct(val.pct)
                : ""}
            </ControlTabTableCell>
          </Fragment>
        );
      })}
    </ControlTabTableRow>
  );
}

// ── En-tête du tableau ────────────────────────────────────────────────────────

function SyntheseHeader({
  yearLabels,
}: {
  yearLabels: SyntheseData["yearLabels"];
}) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <Fragment key={yk}>
            <ControlTabTableHead colType="amtSm">{yearLabels[yk]}</ControlTabTableHead>
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

interface SyntheseTabProps {
  dossierId: string;
}

export default function SyntheseTab({ dossierId }: SyntheseTabProps) {
  const { data, status, error } = useSyntheseData(dossierId);

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Synthèse"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul de la synthèse en cours…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <ControlTabTable>
              <SyntheseHeader yearLabels={data.yearLabels} />
              <ControlTabTableBody>
                {data.rows.map((row) => (
                  <SynthRowItem key={row.key} row={row} />
                ))}
              </ControlTabTableBody>
            </ControlTabTable>
          </div>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
