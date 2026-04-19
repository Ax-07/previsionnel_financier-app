"use client";

import { useCallback } from "react";
import { formatAmount } from "@/lib/utils";
import { type BfrData, type BfrRow } from "@/lib/finance/aggregations/bfr";
import { YEAR_KEYS_4 } from "@/lib/finance/utils";
import { useBfrData } from "@/hooks/controle/use-bfr-data";
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
  ControlTabLabelCell,
  SectionBannerRow,
  useExpandableRows,
  ANNUAL_REM,
  annualTableMinWidth,
} from "./shared/control-tab-table";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(4, ANNUAL_REM.amtLg);
// 1 label + 4 montants = 5 colonnes
const COL_COUNT = 5;

// ── En-tête ───────────────────────────────────────────────────────────────────

function BfrHeader({ yearLabels }: { yearLabels: BfrData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_4.map((yk) => (
          <ControlTabTableHead key={yk} colType="amtLg">{yearLabels[yk]}</ControlTabTableHead>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne ─────────────────────────────────────────────────────────────────────

interface BfrRowItemProps {
  row: BfrRow;
  depth?: number;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function BfrRowItem({ row, depth = 0, isExpanded, onToggle }: BfrRowItemProps) {
  const hasChildren = row.children && row.children.length > 0;
  const isHighlight = row.style === "highlight";
  const isSection   = row.style === "section";

  // Ligne section : bandeau pleine largeur via colSpan
  if (isSection) {
    return <SectionBannerRow label={row.label} colSpan={COL_COUNT} />;
  }

  // Masquer les lignes sans valeurs
  if (
    !hasChildren &&
    row.values.y0.amount === 0 &&
    row.values.y1.amount === 0 &&
    row.values.y2.amount === 0 &&
    row.values.y3.amount === 0
  ) {
    return null;
  }

  return (
    <>
      <ControlTabTableRow variant={row.style} className="group">
        <ControlTabTableCell colType="label" depth={depth}>
          <ControlTabLabelCell
            label={row.label}
            style={row.style}
            sign={row.sign}
            hasChildren={hasChildren && !isHighlight}
            isExpanded={isExpanded(row.key)}
            onToggle={() => onToggle(row.key)}
          />
        </ControlTabTableCell>

        {YEAR_KEYS_4.map((yk) => {
          const val = row.values[yk];
          const isNeg = val.amount < 0;
          return (
            <ControlTabTableCell
              key={`${row.key}_${yk}`}
              colType="amtLg"
              negative={isNeg && !isHighlight}
            >
              {formatAmount(val.amount)}
            </ControlTabTableCell>
          );
        })}
      </ControlTabTableRow>

      {hasChildren &&
        isExpanded(row.key) &&
        row.children!.map((child) => (
          <BfrRowItem
            key={child.key}
            row={child}
            depth={depth + 1}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BfrTabProps {
  dossierId: string;
}

export default function BfrTab({ dossierId }: BfrTabProps) {
  const { data, status, error } = useBfrData(dossierId);
  const { isExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Besoin en Fonds de Roulement"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {(["y1", "y2", "y3"] as const).map((yk) => {
            const amount = data.rows.find((r) => r.key === "bfr")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`BFR net — ${data.yearLabels[yk]}`}
                value={amount}
                variant={amount > 0 ? "negative" : amount < 0 ? "positive" : "neutral"}
              />
            );
          })}
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul du besoin en fonds de roulement…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <BfrHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) => (
                <BfrRowItem
                  key={row.key}
                  row={row}
                  isExpanded={isExpanded}
                  onToggle={toggle}
                />
              ))}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
