"use client";

import { useCallback } from "react";
import { formatAmount } from "@/lib/utils";
import {
  type TfData,
  type TfRow,
} from "@/lib/finance/aggregations/tableau-financement";
import { YEAR_KEYS_4 } from "@/lib/finance/utils";
import { useTableauFinancementData } from "@/hooks/controle/use-tableau-financement-data";
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

function TfHeader({ yearLabels }: { yearLabels: TfData["yearLabels"] }) {
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

interface TfRowItemProps {
  row: TfRow;
  depth?: number;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function TfRowItem({ row, depth = 0, isExpanded, onToggle }: TfRowItemProps) {
  const isHighlight = row.style === "highlight";
  const hasChildren = (row.children?.length ?? 0) > 0;

  // Masquer si hideIfZero et toutes les valeurs sont nulles
  if (row.hideIfZero && YEAR_KEYS_4.every((yk) => row.values[yk].amount === 0)) {
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

      {hasChildren &&
        isExpanded(row.key) &&
        row.children!.map((child) => (
          <TfRowItem
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

interface TableauFinancementTabProps {
  dossierId: string;
}

export default function TableauFinancementTab({
  dossierId,
}: TableauFinancementTabProps) {
  const { data, status, error } = useTableauFinancementData(dossierId);
  const { isExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Tableau de financement"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {(["y1", "y2", "y3"] as const).map((yk) => {
            const amount = data.rows.find((r) => r.key === "fonds_roulement")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`Fonds de roulement — ${data.yearLabels[yk]}`}
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
        loadingMessage="Calcul du tableau de financement…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <TfHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) =>
                row.style === "section" ? (
                  <SectionBannerRow key={row.key} label={row.label} colSpan={COL_COUNT} />
                ) : (
                  <TfRowItem
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
