"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatAmount } from "@/lib/utils";
import { ControlTabActionBar } from "./shared/control-tab-action-bar";
import { ControlTabContent } from "./shared/control-tab-content";
import {
  ControlTabTable,
  ControlTabTableHeader,
  ControlTabTableBody,
  ControlTabTableRow,
  ControlTabTableHead,
  ControlTabTableCell,
  useExpandableRows,
  ControlTabLabelCell,
} from "./shared/control-tab-table";
import { YearSelector } from "./shared/year-selector";
import { YEAR_KEYS_3, type YearKey } from "@/lib/finance/utils";
import { useBudgetData } from "@/hooks/controle/use-budget-data";
import type { BudgetData, BudgetNode } from "@/hooks/controle/use-budget-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { KpiCard } from "@/components/ui/kpi-card";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAllZeroNode(node: BudgetNode): boolean {
  return YEAR_KEYS_3.every((k) => node.values[k].total === 0);
}


// ── Composant ligne ───────────────────────────────────────────────────────────

interface BudgetRowProps {
  node: BudgetNode;
  depth: number;
  checkExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
  activeYear: YearKey;
}

function BudgetRow({
  node,
  depth,
  checkExpanded,
  onToggle,
  activeYear,
}: BudgetRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = checkExpanded(node.key);
  const isSection = node.style === "section";
  const isResult = node.style === "result" || node.style === "highlight";

  if (node.hideIfZero && isAllZeroNode(node)) return null;

  const val = node.values[activeYear];
  const monthVals = val.months; 

  return (
    <>
      <ControlTabTableRow variant={node.style} depth={depth}>
        {/* Colonne libellé – sticky gauche */}
        <ControlTabTableCell sticky colType="label" depth={depth}>
          <ControlTabLabelCell
            label={node.label}
            style={node.style}
            depth={depth}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => onToggle(node.key)}
          />
        </ControlTabTableCell>

        {/* Colonnes mois M1..M12 */}
        {isSection
          ? Array.from({ length: 12 }, (_, i) => (
              <ControlTabTableCell key={i} colType="month" />
            ))
          : monthVals.map((mv, i) => (
              <ControlTabTableCell
                key={i}
                colType="month"
                className={cn(mv < 0 && !isResult && "text-destructive")}
              >
                {formatAmount(mv)}
              </ControlTabTableCell>
            ))}

        {/* Colonne Total */}
        {isSection ? (
          <ControlTabTableCell colType="total" />
        ) : (
          <ControlTabTableCell
            colType="total"
            className={cn("font-semibold text-sm", val.total < 0 && !isResult && "text-destructive")}
          >
            {formatAmount(val.total)}
          </ControlTabTableCell>
        )}
      </ControlTabTableRow>

      {/* Enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <BudgetRow
            key={child.key}
            node={child}
            depth={depth + 1}
            checkExpanded={checkExpanded}
            onToggle={onToggle}
            activeYear={activeYear}
          />
        ))}
    </>
  );
}

// ── En-tête ───────────────────────────────────────────────────────────────────

interface BudgetHeaderProps {
  data: BudgetData;
  activeYear: YearKey;
}

function BudgetHeader({ data, activeYear }: BudgetHeaderProps) {
  const labels = data.monthLabels[activeYear];

  return (
    <ControlTabTableHeader>
      <tr>
        <ControlTabTableHead sticky colType="label">Désignation</ControlTabTableHead>
        {labels.map((label, i) => (
          <ControlTabTableHead key={i} colType="month">{label}</ControlTabTableHead>
        ))}
        <ControlTabTableHead colType="total">Total</ControlTabTableHead>
      </tr>
    </ControlTabTableHeader>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BudgetTabProps {
  dossierId: string;
}

export default function BudgetTab({ dossierId }: BudgetTabProps) {
  const { data, status, error } = useBudgetData(dossierId);
  const [activeYear, setActiveYear] = useState<YearKey>("y1");
  const { isExpanded: checkExpanded, toggle, expandAll, collapseAll } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  const handleToggle = toggle;

  const handleExpandAll = useCallback(() => {
    if (!data) return;
    const keys = new Set<string>();
    function collectKeys(nodes: BudgetNode[]) {
      for (const node of nodes) {
        if (node.children?.length) {
          keys.add(node.key);
          collectKeys(node.children);
        }
      }
    }
    collectKeys(data.nodes);
    expandAll(keys);
  }, [data, expandAll]);

  const handleCollapseAll = collapseAll;
  const caTotal = data?.nodes.find((n) => n.key === "ca_total")?.values[activeYear]?.total ?? 0;
  const resultatNet = data?.nodes.find((n) => n.key === "resultat_net")?.values[activeYear]?.total ?? 0;
  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Budget prévisionnel mensuel"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
        rightContent={
          data ? (
            <>
              <YearSelector
                yearKeys={YEAR_KEYS_3}
                activeYear={activeYear}
                yearLabels={data.yearLabels}
                onSelect={setActiveYear}
              />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandAll}
                  className="h-7 px-2 text-xs"
                >
                  Tout déplier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapseAll}
                  className="h-7 px-2 text-xs"
                >
                  Tout replier
                </Button>
              </div>
            </>
          ) : undefined
        }
      />

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          <KpiCard label="Chiffre d'affaires" value={caTotal} variant="neutral" />
          <KpiCard
            label="Résultat net"
            value={resultatNet}
            variant={resultatNet >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul du budget mensuel en cours…"
        dataLoaded={!!data}
        hasRows={!!data && data.nodes.length > 0}
      >
        {data && (
          <ControlTabTable
            role="grid"
            aria-label="Budget prévisionnel mensuel"
            style={{
              minWidth: "calc(var(--ctrl-col-label) + 12 * var(--ctrl-col-month) + var(--ctrl-col-total))",
            }}
          >
            <BudgetHeader data={data} activeYear={activeYear} />
            <ControlTabTableBody>
              {data.nodes.map((node) => (
                <BudgetRow
                  key={node.key}
                  node={node}
                  depth={0}
                  checkExpanded={checkExpanded}
                  onToggle={handleToggle}
                  activeYear={activeYear}
                />
              ))}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}

