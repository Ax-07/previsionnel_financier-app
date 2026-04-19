"use client";

import { useCallback } from "react";
import { cn, formatAmount } from "@/lib/utils";
import { type CafData, type CafRow } from "@/lib/finance/aggregations/caf";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useCafData } from "@/hooks/controle/use-caf-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { KpiCard } from "@/components/ui/kpi-card";
import { ControlTabActionBar } from "./shared/control-tab-action-bar";
import { ControlTabContent } from "./shared/control-tab-content";
import {
  ControlTabTable,
  ControlTabTableHeader,
  ControlTabTableBody,
  ControlTabTableRow,
  ControlTabTableHead,
  ControlTabTableCell,
  ControlTabLabelCell,
  useExpandableRows,
  ANNUAL_REM,
  annualTableMinWidth,
} from "./shared/control-tab-table";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtLg);

// ── En-tête ───────────────────────────────────────────────────────────────────

function CafHeader({ yearLabels }: { yearLabels: CafData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <ControlTabTableHead key={yk} colType="amtLg">{yearLabels[yk]}</ControlTabTableHead>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne ─────────────────────────────────────────────────────────────────────

interface CafRowItemProps {
  row: CafRow;
  depth?: number;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function CafRowItem({ row, depth = 0, isExpanded, onToggle }: CafRowItemProps) {
  const isHighlight = row.style === "highlight";
  const hasChildren = !!row.children && row.children.length > 0;
  const expanded = isExpanded(row.key);

  return (
    <>
      <ControlTabTableRow variant={row.style} className={cn(depth > 0 && "bg-muted/10 text-muted-foreground hover:bg-muted/20")}>
        <ControlTabTableCell colType="label" depth={depth}>
          <ControlTabLabelCell
            label={row.label}
            style={row.style}
            sign={row.sign}
            depth={depth}
            hasChildren={hasChildren && !isHighlight}
            isExpanded={expanded}
            onToggle={() => onToggle(row.key)}
          />
        </ControlTabTableCell>
        {YEAR_KEYS_3.map((yk) => {
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

      {hasChildren && expanded &&
        row.children!.map((child) => (
          <CafRowItem
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

interface CafTabProps {
  dossierId: string;
}

export default function CafTab({ dossierId }: CafTabProps) {
  const { data, status, error } = useCafData(dossierId);
  const { isExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Capacité d'Autofinancement"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {YEAR_KEYS_3.map((yk) => {
            const amount = data.rows.find((r) => r.key === "caf_brute")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`CAF — ${data.yearLabels[yk]}`}
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
        loadingMessage="Calcul de la capacité d'autofinancement…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <CafHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) => (
                <CafRowItem
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
