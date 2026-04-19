"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { useTvaData } from "@/hooks/controle/use-tva-data";
import type { VATData, VATRow } from "@/hooks/controle/use-tva-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { KpiCard } from "@/components/ui/kpi-card";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Constantes ────────────────────────────────────────────────────────────────


// ── Composant ligne ───────────────────────────────────────────────────────────

interface VATRowItemProps {
  row: VATRow;
  activeYear: YearKey;
  depth?: number;
  checkExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
}

function VATRowItem({ row, activeYear, depth = 0, checkExpanded, onToggle }: VATRowItemProps) {
  const hasChildren = row.children && row.children.length > 0;
  const isExpanded = checkExpanded(row.key);
  const isSection = row.style === "section";
  const isResult = row.style === "result" || row.style === "highlight";
  const val = row.values[activeYear];

  // Masquer si hideIfZero et tout à zéro
  if (row.hideIfZero && val.total === 0 && val.months.every((m) => m === 0)) {
    return null;
  }

  return (
    <>
      <ControlTabTableRow variant={row.style} depth={depth}>
        {/* Colonne libellé */}
        <ControlTabTableCell colType="label" depth={depth}>
          <ControlTabLabelCell
            label={row.label}
            style={row.style}
            depth={depth}
            hasChildren={!!hasChildren}
            isExpanded={isExpanded}
            onToggle={() => onToggle(row.key)}
          />
        </ControlTabTableCell>

        {/* Colonnes mois M1..M12 */}
        {isSection
          ? Array.from({ length: 12 }, (_, i) => (
              <ControlTabTableCell key={i} colType="month" />
            ))
          : val.months.map((mv, i) => (
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

      {/* Lignes enfants (si déplié) */}
      {hasChildren &&
        isExpanded &&
        row.children!.map((child) => (
          <VATRowItem
            key={child.key}
            row={child}
            activeYear={activeYear}
            depth={depth + 1}
            checkExpanded={checkExpanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ── En-tête du tableau ────────────────────────────────────────────────────────

interface VATTableHeaderProps {
  data: VATData;
  activeYear: YearKey;
}

function VATTableHeader({ data, activeYear }: VATTableHeaderProps) {
  const labels = data.monthLabels[activeYear];

  return (
    <ControlTabTableHeader>
      <tr>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {labels.map((label, i) => (
          <ControlTabTableHead key={i} colType="month">{label}</ControlTabTableHead>
        ))}
        <ControlTabTableHead colType="total">Total</ControlTabTableHead>
      </tr>
    </ControlTabTableHeader>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface TVATabProps {
  dossierId: string;
}

export default function TVATab({ dossierId }: TVATabProps) {
  const { data, status, error } = useTvaData(dossierId);

  const [activeYear, setActiveYear] = useState<YearKey>("y1");
  const { isExpanded: checkExpanded, toggle } = useExpandableRows();

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  // Franchise de TVA : contenu spécial (pas de tableau)
  const isFranchise = data?.isFranchise ?? false;
  // hasRows = true aussi en cas de franchise (pour afficher le message spécial en tant qu'enfant)
  const hasRows = !!data && (!isFranchise ? data.rows.length > 0 : true);

  const tvaCollectee = data?.rows.find((r) => r.key === "total-collectee")?.values[activeYear]?.total ?? 0;
  const tvaDeductible = data?.rows.find((r) => r.key === "total-deductible")?.values[activeYear]?.total ?? 0;
  const tvaSolde = tvaCollectee - tvaDeductible;

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Déclaration TVA prévisionnelle"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
        rightContent={
          data && !isFranchise ? (
            <YearSelector
              yearKeys={YEAR_KEYS_3}
              activeYear={activeYear}
              yearLabels={data.yearLabels}
              onSelect={setActiveYear}
            />
          ) : undefined
        }
      >
        {data && (
          <>
            {isFranchise && (
              <Badge
                variant="outline"
                className="text-xs border-amber-300 text-amber-700 dark:text-amber-400"
              >
                Franchise de TVA
              </Badge>
            )}
            {!isFranchise && (
              <Badge variant="outline" className="text-xs">
                {data.periodicite === "trimestriel"
                  ? "Déclaration trimestrielle"
                  : "Déclaration mensuelle"}
              </Badge>
            )}
          </>
        )}
      </ControlTabActionBar>

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && !isFranchise && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          <KpiCard label="TVA collectée" value={tvaCollectee} variant="neutral" />
          <KpiCard label="TVA déductible" value={tvaDeductible} variant="neutral" />
          <KpiCard
            label="Solde TVA à décaisser"
            value={tvaSolde}
            variant={tvaSolde > 0 ? "negative" : tvaSolde < 0 ? "positive" : "neutral"}
          />
        </div>
      )}

      <ControlTabContent
        status={status}
        error={error}
        loadingMessage="Calcul de la TVA prévisionnelle en cours…"
        dataLoaded={!!data}
        hasRows={hasRows}
      >
        {data && (isFranchise ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="font-medium text-sm">Franchise de TVA</p>
            <p className="text-xs">
              Ce régime dispense de la collecte, de la déclaration et du paiement de la TVA.
            </p>
          </div>
        ) : (
          <ControlTabTable
            role="grid"
            aria-label="Déclaration TVA prévisionnelle"
            style={{ minWidth: "calc(var(--ctrl-col-label) + 12 * var(--ctrl-col-month) + var(--ctrl-col-total))" }}
          >
            <VATTableHeader data={data} activeYear={activeYear} />
            <ControlTabTableBody>
              {data.rows.map((row) => (
                <VATRowItem
                  key={row.key}
                  row={row}
                  activeYear={activeYear}
                  checkExpanded={checkExpanded}
                  onToggle={toggle}
                />
              ))}
            </ControlTabTableBody>
          </ControlTabTable>
        ))}
      </ControlTabContent>
    </ControlTabContainer>
  );
}


