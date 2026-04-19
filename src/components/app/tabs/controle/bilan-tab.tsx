"use client";

import { useCallback } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatAmount } from "@/lib/utils";
import { type BilanData, type BilanRow } from "@/lib/finance/aggregations/bilan";
import { YEAR_KEYS_3 } from "@/lib/finance/utils";
import { useBilanData } from "@/hooks/controle/use-bilan-data";
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
  SectionBannerRow,
  ANNUAL_REM,
  annualTableMinWidth,
} from "./shared/control-tab-table";
import { ControlTabContainer } from "./shared/control-tab-container";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABLE_MIN_WIDTH = annualTableMinWidth(3, ANNUAL_REM.amtLg);
// 1 label + 3 montants = 4 colonnes
const COL_COUNT = 4;

// ── En-tête ───────────────────────────────────────────────────────────────────

function BilanHeader({ yearLabels }: { yearLabels: BilanData["yearLabels"] }) {
  return (
    <ControlTabTableHeader>
      <ControlTabTableRow>
        <ControlTabTableHead colType="label">Désignation</ControlTabTableHead>
        {YEAR_KEYS_3.map((yk) => (
          <ControlTabTableHead key={yk} colType="amtLg">
            {yearLabels[yk]}
          </ControlTabTableHead>
        ))}
      </ControlTabTableRow>
    </ControlTabTableHeader>
  );
}

// ── Ligne de données ──────────────────────────────────────────────────────────

function BilanRowItem({ row }: { row: BilanRow }) {
  if (
    row.hideIfZero &&
    YEAR_KEYS_3.every((yk) => row.values[yk].amount === 0)
  ) {
    return null;
  }

  const isIndent = row.style === "indent";

  return (
    <ControlTabTableRow variant={row.style}>
      <ControlTabTableCell colType="label" depth={isIndent ? 1 : 0}>
        {row.label}
      </ControlTabTableCell>
      {YEAR_KEYS_3.map((yk) => {
        const val = row.values[yk];
        return (
          <ControlTabTableCell
            key={`${row.key}_${yk}`}
            colType="amtLg"
            className={cn(
              val.amount < 0 && row.style !== "highlight" && "text-destructive",
              isIndent && "text-muted-foreground",
            )}
          >
            {formatAmount(val.amount)}
          </ControlTabTableCell>
        );
      })}
    </ControlTabTableRow>
  );
}

// ── Alerte d'équilibre ────────────────────────────────────────────────────────

function EquilibreAlert({
  equilibre,
  yearLabels,
}: {
  equilibre: BilanData["equilibre"];
  yearLabels: BilanData["yearLabels"];
}) {
  const desequilibres = YEAR_KEYS_3.filter((yk) => !equilibre[yk]);
  if (desequilibres.length === 0) return null;

  return (
    <div className="m-4 flex items-start gap-3 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <div>
        <span className="font-semibold">Déséquilibre détecté</span> — Le total
        actif ≠ total passif pour{" "}
        {desequilibres.map((yk) => yearLabels[yk]).join(", ")}.{" "}
        Vérifiez les données de saisie.
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BilanTabProps {
  dossierId: string;
}

export default function BilanTab({ dossierId }: BilanTabProps) {
  const { data, status, error } = useBilanData(dossierId);

  const handleRefresh = useCallback(() => {
    useScenarioDataStore.getState().reload(dossierId);
  }, [dossierId]);

  return (
    <ControlTabContainer>
      <ControlTabActionBar
        title="Bilan prévisionnel"
        hasData={!!data}
        isPending={status === "loading"}
        onRefresh={handleRefresh}
      >
        {data && YEAR_KEYS_3.every((yk) => data.equilibre[yk]) && (
          <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-600/50">
            Actif = Passif
          </Badge>
        )}
      </ControlTabActionBar>

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      {data && (
        <div className="shrink-0 flex gap-3 flex-wrap mx-auto">
          {YEAR_KEYS_3.map((yk) => {
            const amount = data.rows.find((r) => r.key === "capitaux_propres")?.values[yk]?.amount ?? 0;
            return (
              <KpiCard
                key={yk}
                label={`Capitaux propres — ${data.yearLabels[yk]}`}
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
        loadingMessage="Calcul du bilan prévisionnel…"
        dataLoaded={!!data}
        hasRows={!!data && data.rows.length > 0}
        prependContent={
          data && (
            <EquilibreAlert equilibre={data.equilibre} yearLabels={data.yearLabels} />
          )
        }
      >
        {data && (
          <ControlTabTable style={{ minWidth: TABLE_MIN_WIDTH }}>
            <BilanHeader yearLabels={data.yearLabels} />
            <ControlTabTableBody>
              {data.rows.map((row) =>
                row.style === "section" ? (
                  <SectionBannerRow key={row.key} label={row.label} colSpan={COL_COUNT} />
                ) : (
                  <BilanRowItem key={row.key} row={row} />
                ),
              )}
            </ControlTabTableBody>
          </ControlTabTable>
        )}
      </ControlTabContent>
    </ControlTabContainer>
  );
}
