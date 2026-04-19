"use client";

import { useCallback } from "react";
import { formatAmount } from "@/lib/utils";
import {
  type PfData,
  type PfRow,
} from "@/lib/finance/aggregations/plan-financement";
import { YEAR_KEYS_4 } from "@/lib/finance/utils";
import { usePlanFinancementData } from "@/hooks/controle/use-plan-financement-data";
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

const TABLE_MIN_WIDTH = annualTableMinWidth(4, ANNUAL_REM.amtMd);
// 1 label + 4 montants = 5 colonnes
const COL_COUNT = 5;

// ── En-tête ───────────────────────────────────────────────────────────────────

function PfHeader({ yearLabels }: { yearLabels: PfData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_4.map((yk) => (
          <ControlTabTableHead key={yk} colType="amtMd">{yearLabels[yk]}</ControlTabTableHead>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne de données ──────────────────────────────────────────────────────────

interface PfRowItemProps {
  row: PfRow;
  depth?: number;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function PfRowItem({ row, depth = 0, isExpanded, onToggle }: PfRowItemProps) {
  const isHighlight = row.style === "highlight";
  const hasChildren = !!row.children && row.children.length > 0;

  if (
    row.hideIfZero &&
    YEAR_KEYS_4.every((yk) => row.values[yk].amount === 0) &&
    (!hasChildren || row.children!.every((c) =>
      YEAR_KEYS_4.every((yk) => c.values[yk].amount === 0)
    ))
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
            hasChildren={hasChildren}
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
              colType="amtMd"
              negative={isNeg && !isHighlight}
            >
              {formatAmount(val.amount)}
            </ControlTabTableCell>
          );
        })}
      </ControlTabTableRow>

      {hasChildren && isExpanded(row.key) &&
        row.children!.map((child) => (
          <PfRowItem
            key={child.key}
            row={child}
            depth={depth + 1}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ))
      }
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface PlanFinancementTabProps {
  dossierId: string;
}

export default function PlanFinancementTab({
  dossierId,
}: PlanFinancementTabProps) {
  const { data, status, error } = usePlanFinancementData(dossierId);
  const { isExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Plan de financement"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {(["y1", "y2", "y3"] as const).map((yk) => {
            const amount = data.rows.find((r) => r.key === "solde_tresorerie")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`Solde de trésorerie — ${data.yearLabels[yk]}`}
                value={amount}
                variant={amount >= 0 ? "positive" : "negative"}
              />
            );
          })}
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul du plan de financement…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <PfHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) =>
                row.style === "section" ? (
                  <SectionBannerRow key={row.key} label={row.label} colSpan={COL_COUNT} />
                ) : (
                  <PfRowItem
                    key={row.key}
                    row={row}
                    depth={0}
                    isExpanded={isExpanded}
                    onToggle={toggle}
                  />
                ),
              )}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
