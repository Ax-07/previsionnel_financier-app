"use client";

import { Fragment, useCallback } from "react";
import { formatAmount, formatPct } from "@/lib/utils";
import { type SigData, type SigNode } from "@/lib/finance/aggregations/sig";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useSigData } from "@/hooks/controle/use-sig-data";
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

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtSm, ANNUAL_REM.pct);

function isAllZero(node: SigNode): boolean {
  return YEAR_KEYS_3.every((k) => node.values[k].amount === 0);
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface SigRowProps {
  node: SigNode;
  depth: number;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function SigRow({ node, depth, isExpanded, onToggle }: SigRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSection = node.style === "section";

  if (node.hideIfZero && isAllZero(node)) return null;

  return (
    <>
      <ControlTabTableRow variant={node.style}>
        <ControlTabTableCell colType="label" depth={depth}>
          <ControlTabLabelCell
            label={node.label}
            style={isSection ? "section" : undefined}
            hasChildren={hasChildren && !isSection}
            isExpanded={isExpanded(node.key)}
            onToggle={hasChildren && !isSection ? () => onToggle(node.key) : undefined}
          />
        </ControlTabTableCell>
        {YEAR_KEYS_3.map((yk) => {
          const val = node.values[yk];
          const isNeg = val.amount < 0;
          return (
            <Fragment key={`${node.key}_${yk}`}>
              <ControlTabTableCell
                colType="amtSm"
                negative={!isSection && isNeg}
              >
                {isSection ? "" : formatAmount(val.amount)}
              </ControlTabTableCell>
              <ControlTabTableCell colType="pct" className="text-muted-foreground">
                {isSection ? "" : val.pct !== null ? formatPct(val.pct) : ""}
              </ControlTabTableCell>
            </Fragment>
          );
        })}
      </ControlTabTableRow>

      {hasChildren &&
        isExpanded(node.key) &&
        node.children!.map((child) => (
          <SigRow
            key={child.key}
            node={child}
            depth={depth + 1}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function SigHeader({ yearLabels }: { yearLabels: SigData["yearLabels"] }) {
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

// ── Composant principal ───────────────────────────────────────────────────────

interface SigTabProps {
  dossierId: string;
}

export default function SigTab({ dossierId }: SigTabProps) {
  const { data, status, error } = useSigData(dossierId);
  const { isExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  // Calcul des KPIs depuis les totaux des lignes synthèse
  const findRow = (key: string) => data?.nodes.find((r) => r.key === key);
  const ca = findRow("prod_exercice")?.values.y1.amount ?? 0;
  const marge = findRow("marge_prod")?.values.y1.amount ?? 0;
  const va = findRow("va")?.values.y1.amount ?? 0;
  const ebe = findRow("ebe")?.values.y1.amount ?? 0;
  const resExplo = findRow("res_expl")?.values.y1.amount ?? 0;
  const resCourant = findRow("res_courant")?.values.y1.amount ?? 0;
  const resNet = findRow("res_net")?.values.y1.amount ?? 0;
  const caf = findRow("caf")?.values.y1.amount ?? 0;

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Soldes Intermédiaires de Gestion"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
        <KpiCard label="CA" value={ca} variant="neutral" />
        <KpiCard label="Marge brute" value={marge} variant={marge >= 0 ? "positive" : "negative"} />
        <KpiCard label="Valeur ajoutée" value={va} variant={va >= 0 ? "positive" : "negative"} />
        <KpiCard label="EBE" value={ebe} variant={ebe >= 0 ? "positive" : "negative"} />
        <KpiCard label="Résultat d'exploitation" value={resExplo} variant={resExplo >= 0 ? "positive" : "negative"} />
        <KpiCard label="Résultat courant" value={resCourant} variant={resCourant >= 0 ? "positive" : "negative"} />
        <KpiCard label="Résultat net" value={resNet} variant={resNet >= 0 ? "positive" : "negative"} />
        <KpiCard label="CAF" value={caf} variant={caf >= 0 ? "positive" : "negative"} />
      </div>

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul des soldes intermédiaires de gestion…"
        dataLoaded={!!data}
        hasRows={!!data && data.nodes.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <SigHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.nodes.map((node) => (
                <SigRow
                  key={node.key}
                  node={node}
                  depth={0}
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
