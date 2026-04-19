"use client";

import { useState, useCallback } from "react";
import { cn, formatAmount, formatAmountColored } from "@/lib/utils";
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
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { useTresorerieData } from "@/hooks/controle/use-tresorerie-data";
import type { TresorerieRow } from "@/hooks/controle/use-tresorerie-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { KpiCard } from "@/components/ui/kpi-card";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Constantes ────────────────────────────────────────────────────────────────

const DEFAULT_COLLAPSED = new Set([
  "enc-ca",
  "dec-immo",
  "dec-achats",
  "dec-emprunts",
  "dec-charges-ext",
  "dec-personnel",
  "dec-tva",
]);

// ── En-tête ───────────────────────────────────────────────────────────────────

function TresorerieHeader({ monthLabels }: { monthLabels: string[] }) {
  return (
    <ControlTabTableHeader>
      <tr>
        <ControlTabTableHead sticky colType="label">Libellé</ControlTabTableHead>
        {monthLabels.map((label, i) => (
          <ControlTabTableHead key={i} colType="month">{label}</ControlTabTableHead>
        ))}
        <ControlTabTableHead colType="total">Total</ControlTabTableHead>
      </tr>
    </ControlTabTableHeader>
  );
}


// ── Ligne ─────────────────────────────────────────────────────────────────────

interface TresorerieRowItemProps {
  row: TresorerieRow;
  yearKey: YearKey;
  monthCount: number;
  checkExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
  depth?: number;
}

function TresorerieRowItem({
  row,
  yearKey,
  monthCount,
  checkExpanded,
  onToggle,
  depth = 0,
}: TresorerieRowItemProps) {
  const val = row.values[yearKey];
  const hasChildren = (row.children?.length ?? 0) > 0;
  const isExpanded = hasChildren && checkExpanded(row.key);
  const isSection = row.style === "section";
  const isColored = row.style === "result" || row.style === "highlight";

  const allZero = val.months.every((v) => v === 0);
  if (row.hideIfZero && allZero) return null;

  return (
    <>
      <ControlTabTableRow variant={row.style} depth={depth}>
        {/* Colonne libellé – sticky gauche + fond dupliqué pour scroll horizontal */}
        <ControlTabTableCell
          sticky
          depth={depth}
          colType="label"
        >
          <ControlTabLabelCell
            label={row.label}
            style={row.style}
            depth={depth}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => onToggle(row.key)}
          />
        </ControlTabTableCell>

        {/* Colonnes mensuelles */}
        {Array.from({ length: monthCount }, (_, m) => {
          const v = val.months[m] ?? 0;

          if (isSection) {
            return <ControlTabTableCell key={m} colType="month" />;
          }

          if (isColored) {
            const { text, cls } = formatAmountColored(v);
            return (
              <ControlTabTableCell key={m} colType="month" className={cls}>
                {text}
              </ControlTabTableCell>
            );
          }

          return (
            <ControlTabTableCell key={m} colType="month">
              {formatAmount(v)}
            </ControlTabTableCell>
          );
        })}

        {/* Colonne total */}
        {isSection ? (
          <ControlTabTableCell colType="total" />
        ) : isColored ? (
          <ControlTabTableCell colType="total" className={cn("font-semibold text-sm", formatAmountColored(val.total).cls)}>
            {formatAmountColored(val.total).text}
          </ControlTabTableCell>
        ) : (
          <ControlTabTableCell colType="total" className="font-semibold text-sm">
            {formatAmount(val.total)}
          </ControlTabTableCell>
        )}
      </ControlTabTableRow>

      {/* Enfants dépliés */}
      {hasChildren && isExpanded &&
        row.children!.map((child) => (
          <TresorerieRowItem
            key={child.key}
            row={child}
            yearKey={yearKey}
            monthCount={monthCount}
            checkExpanded={checkExpanded}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface TresorerieTabProps {
  dossierId: string;
}

export function TresorerieTab({ dossierId }: TresorerieTabProps) {
  const { data, status, error } = useTresorerieData(dossierId);
  const [yearKey, setYearKey] = useState<YearKey>("y1");
  const { isExpanded: checkExpanded, toggle } = useExpandableRows({ mode: "collapsed", initialKeys: DEFAULT_COLLAPSED });

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  const handleToggle = toggle;

  const rows = data?.rows ?? [];
  const monthLabels = data?.monthLabels[yearKey] ?? [];

  const findRow = (key: string) => rows.find((r) => r.key === key);
  const encTotal = findRow("enc-total")?.values[yearKey].total ?? 0;
  const decTotal = findRow("dec-total")?.values[yearKey].total ?? 0;
  const soldeFin = findRow("tres-solde-final")?.values[yearKey].total ?? 0;
  const soldeFinalVariant = soldeFin > 0 ? "positive" : soldeFin < 0 ? "negative" : "neutral";

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Tableau de trésorerie"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
        rightContent={
          data ? (
            <YearSelector
              yearKeys={YEAR_KEYS_3}
              activeYear={yearKey}
              yearLabels={data.yearLabels}
              onSelect={setYearKey}
            />
          ) : undefined
        }
      />

      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          <KpiCard label="Total encaissements" value={encTotal} variant="positive" />
          <KpiCard label="Total décaissements" value={decTotal} variant="negative" />
          <KpiCard label="Solde de clôture" value={soldeFin} variant={soldeFinalVariant} />
          <KpiCard
            label="Variation nette"
            value={encTotal - decTotal}
            variant={encTotal - decTotal >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul de la trésorerie en cours…"
        dataLoaded={!!data}
        hasRows={!!data && rows.length > 0}
      >
        {data && (
          <ControlTabTable
            role="grid"
            aria-label="Tableau de trésorerie mensuel"
            style={{
              minWidth: `calc(var(--ctrl-col-label) + ${monthLabels.length} * var(--ctrl-col-month) + var(--ctrl-col-total))`,
            }}
          >
            <TresorerieHeader monthLabels={monthLabels} />
            <ControlTabTableBody>
              {rows.map((row) => (
                <TresorerieRowItem
                  key={row.key}
                  row={row}
                  yearKey={yearKey}
                  monthCount={monthLabels.length}
                  checkExpanded={checkExpanded}
                  onToggle={handleToggle}
                />
              ))}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
