"use client";

import { Fragment, useCallback } from "react";
import { formatAmount, formatPct } from "@/lib/utils";
import { type CompteResultatData, type CRNode } from "@/lib/finance/aggregations/compte-resultat";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useCompteResultatData } from "@/hooks/controle/use-compte-resultat-data";
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

function isAllZero(node: CRNode): boolean {
  return YEAR_KEYS_3.every((k) => node.values[k].amount === 0);
}

// ── Composant ligne ───────────────────────────────────────────────────────────

interface CRRowProps {
  node: CRNode;
  depth: number;
  checkExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function CRRow({ node, depth, checkExpanded, onToggle }: CRRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = hasChildren && checkExpanded(node.key);
  const isSection = node.style === "section";

  // Masquer les lignes vides avec hideIfZero
  if (node.hideIfZero && isAllZero(node)) return null;

  return (
    <>
      <ControlTabTableRow variant={node.style}>
        {/* Colonne libellé — largeur flexible */}
        <ControlTabTableCell colType="label" depth={depth}>
          <ControlTabLabelCell
            label={node.label}
            style={node.style as "section" | undefined}
            hasChildren={hasChildren && !isSection}
            isExpanded={isExpanded}
            onToggle={() => onToggle(node.key)}
          />
        </ControlTabTableCell>

        {/* Colonnes années N / N+1 / N+2 */}
        {YEAR_KEYS_3.map((yk) => {
          const val = node.values[yk];
          return (
            <Fragment key={`${node.key}_${yk}`}>
              <ControlTabTableCell
                colType="amtSm"
                negative={val.amount < 0 && !isSection}
              >
                {isSection ? "" : formatAmount(val.amount)}
              </ControlTabTableCell>
              <ControlTabTableCell colType="pct" className="text-muted-foreground">
                {isSection ? "" : formatPct(val.pct)}
              </ControlTabTableCell>
            </Fragment>
          );
        })}
      </ControlTabTableRow>

      {/* Lignes enfants (si déplié) */}
      {hasChildren && isExpanded && node.children!.map((child) => (
        <CRRow
          key={child.key}
          node={child}
          depth={depth + 1}
          checkExpanded={checkExpanded}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Composant en-tête ─────────────────────────────────────────────────────────

interface CRHeaderProps {
  yearLabels: CompteResultatData["yearLabels"];
}

function CRHeader({ yearLabels }: CRHeaderProps) {
  return (
    <ControlTabTableHeader>
      <tr>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <Fragment key={yk}>
            <ControlTabTableHead colType="amtSm" className="text-right text-white">
              {yearLabels[yk]}
            </ControlTabTableHead>
            <ControlTabTableHead colType="pct" className="text-right text-xs text-white/70">
              %
            </ControlTabTableHead>
          </Fragment>
        ))}
      </tr>
    </ControlTabTableHeader>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface CompteResultatTabProps {
  dossierId: string;
}

export default function CompteResultatTab({ dossierId }: CompteResultatTabProps) {
  const { data, status, error } = useCompteResultatData(dossierId);
  const { isExpanded: checkExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  // ── KPI ─────────────────────────────────────────────────────────────────────
  const findNode = (key: string) => data?.nodes.find((n) => n.key === key);
  const ca = findNode("ca")?.values.y1.amount ?? 0;
  const chargeExternes = findNode("charges_ext")?.values.y1.amount ?? 0;
  const chargesPersonnel = findNode("charges_personnel")?.values.y1.amount ?? 0;
  const totalChargesExpl = findNode("total_charges_expl")?.values.y1.amount ?? 0;
  const resExpl = findNode("res_expl")?.values.y1.amount ?? 0;
  const resFin = findNode("res_fin")?.values.y1.amount ?? 0;
  const resCourant = findNode("res_courant")?.values.y1.amount ?? 0;
  const isNode = findNode("is");
  const isAmount = isNode?.values.y1.amount ?? 0;
  const resNet = findNode("res_net")?.values.y1.amount ?? 0;

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Compte de résultat prévisionnel"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
        <KpiCard label="CA" value={ca} variant="neutral" />
        <KpiCard label="Charges externes" value={chargeExternes} variant="negative" />
        <KpiCard label="Charges de personnel" value={chargesPersonnel} variant="negative" />
        <KpiCard label="Total charges d'exploitation" value={totalChargesExpl} variant="negative" />
        <KpiCard label="Résultat d'exploitation" value={resExpl} variant={resExpl >= 0 ? "positive" : "negative"} />
        <KpiCard label="Résultat financier" value={resFin} variant={resFin >= 0 ? "positive" : "negative"} />
        <KpiCard label="Résultat courant" value={resCourant} variant={resCourant >= 0 ? "positive" : "negative"} />
        {isNode && <KpiCard label="IS" value={isAmount} variant="negative" />}
        <KpiCard label="Résultat net" value={resNet} variant={resNet >= 0 ? "positive" : "negative"} />
      </div>

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul du compte de résultat en cours…"
        dataLoaded={!!data}
        hasRows={!!data && data.nodes.length > 0}
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH } as React.CSSProperties}>
            <CRHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.nodes.map((node) => (
                <CRRow
                  key={node.key}
                  node={node}
                  depth={0}
                  checkExpanded={checkExpanded}
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
