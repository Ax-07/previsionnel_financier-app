"use client";

import { useCallback, useTransition, useEffect } from "react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";
import {
  type ActiviteCommissionRow,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
  MODES_CALCUL_COMMISSION,
} from "@/lib/schemas/activite";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { LocalActiviteCommissionRow, useActiviteStore } from "@/stores/activite-store";
import { saveActivitesCommission } from "@/app/actions/activite";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { RowActions } from "../helpers/row-actions";

interface TableauActivitesCommissionsProps {
  dossierId: string;
  initialData: ActiviteCommissionRow[];
}
function TotauxCommissions({ rows, dossierId }: { rows: LocalActiviteCommissionRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(actifs.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(actifs.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(actifs.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td colSpan={6} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryCommissions({ rows, dossierId }: { rows: LocalActiviteCommissionRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return (
    <>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {fmt(actifs.reduce((s, r) => s + r.montantN, 0))}
      </td>
      <td />
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {fmt(actifs.reduce((s, r) => s + r.montantN1, 0))}
      </td>
      <td />
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {fmt(actifs.reduce((s, r) => s + r.montantN2, 0))}
      </td>
      <td colSpan={5} />
    </>
  );
}
/**
 * Tableau inline éditable des activités commissionnées — auto-contenu avec DnD et groupes.
 * N+1 et N+2 sont calculés automatiquement depuis le taux d'évolution.
 */
export function TableauActivitesCommissions({ dossierId, initialData }: TableauActivitesCommissionsProps) {
  const [isPending, startTransition] = useTransition();
  const store = useActiviteStore();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    store.hydrateCommissions(dossierId, initialData.map((r) => ({ ...r, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = store.getDraft(dossierId);
  const rows = draft.activitesCommissionnees;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedCommissionIds?.length ?? 0) > 0;

  const setRows = useCallback(
    (updater: (prev: ActiviteCommissionRow[]) => ActiviteCommissionRow[]) => {
      const d = store.getDraft(dossierId);
      store.setCommissionsRows(dossierId, updater(d.activitesCommissionnees));
    },
    [dossierId, store],
  );
  const dnd = useGroupedDnd({ rows, setRows });

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = store.getDraft(dossierId);
        const result = await saveActivitesCommission(dossierId, d.activitesCommissionnees);
        if (result.success) {
          if (result.idMap && Object.keys(result.idMap).length > 0) {
            const idMap = result.idMap;
            store.setCommissions(dossierId, (prev) =>
              prev.map((r) => ({ ...r, id: r.id && idMap[r.id] ? idMap[r.id] : r.id }))
            );
          }
          store.markCommissionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, store, invalidateControleStores]);

  const renderRow = useCallback(
    (row: LocalActiviteCommissionRow & { id: string }, isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border border-l-2 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
            row.groupe && "border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
            !(row.actif ?? true) && "opacity-50",
          )}
        >
          <DragHandleCell />
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => store.updateActiviteCommissionRow(dossierId, idx, { actif: e.target.checked })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => store.updateActiviteCommissionRow(dossierId, idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) =>
                store.updateActiviteCommissionRow(dossierId, idx, {
                  hypothese: e.target.value as ActiviteCommissionRow["hypothese"],
                })
              }
            >
              {HYPOTHESES_ACTIVITE.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">
                  {h.label}
                </option>
              ))}
            </select>
          </Td>
          <Td>
            <NumericCellInput
              value={row.montantN}
              onChange={(n) => {
                const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                store.updateActiviteCommissionRow(dossierId, idx, { montantN: n, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.evolutionN1}
              onChange={(ev1) => {
                const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                store.updateActiviteCommissionRow(dossierId, idx, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right bg-muted/40")}
              value={row.montantN1 === 0 ? "" : row.montantN1}
              readOnly
              tabIndex={-1}
              placeholder="0"
              title="Calculé automatiquement depuis N × (1 + % Év.)"
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.evolutionN2}
              onChange={(ev2) => {
                const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                store.updateActiviteCommissionRow(dossierId, idx, { evolutionN2: ev2, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right bg-muted/40")}
              value={row.montantN2 === 0 ? "" : row.montantN2}
              readOnly
              tabIndex={-1}
              placeholder="0"
              title="Calculé automatiquement depuis N+1 × (1 + % Év.)"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.calculCommission}
              onChange={(e) =>
                store.updateActiviteCommissionRow(dossierId, idx, {
                  calculCommission: e.target.value as ActiviteCommissionRow["calculCommission"],
                })
              }
            >
              {MODES_CALCUL_COMMISSION.map((m) => (
                <option key={m.value} value={m.value} className="bg-background text-foreground">
                  {m.label}
                </option>
              ))}
            </select>
          </Td>
          <Td>
            <NumericCellInput
              value={row.tauxCommission}
              onChange={(v) => store.updateActiviteCommissionRow(dossierId, idx, { tauxCommission: v })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tvaCommission}
              onChange={(e) => store.updateActiviteCommissionRow(dossierId, idx, { tvaCommission: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">
                  {t.label}
                </option>
              ))}
            </select>
          </Td>
          <Td>
            <NumericCellInput
              value={row.stocks}
              onChange={(v) => store.updateActiviteCommissionRow(dossierId, idx, { stocks: v })}
              step={1}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.reglementFournisseurs}
              onChange={(v) => store.updateActiviteCommissionRow(dossierId, idx, { reglementFournisseurs: v })}
              step={1}
            />
          </Td>
          <Td className="text-center px-1">
              <RowActions
                onDelete={() => store.removeActiviteCommissionRow(dossierId, idx)}
                onDuplicate={() => store.duplicateActiviteCommissionRow(dossierId, idx)}
                isPending={isPending}
                groupe={row.groupe ?? null}
              />
          </Td>
        </SortableTableRow>
      );
    },
    [rows, isPending, store, dossierId],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Activités commissionnées"
        description="Revenus issus de commissions sur ventes ou prestations"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addActiviteCommissionRow(dossierId)}
        onSave={saveAll}
        onAddGroup={() => store.addActiviteCommissionGroup(dossierId)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={15}
        onAddRowToGroupe={(groupe) => store.addActiviteCommissionToGroup(dossierId, groupe)}
        renderRow={renderRow}
        emptyMessage="Aucune activité commissionnée — cliquez sur « Ajouter »"
        footer={<TotauxCommissions rows={rows} dossierId={dossierId} />}
        groupNameColSpan={2}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryCommissions rows={groupRows as LocalActiviteCommissionRow[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-24 text-right">N</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+1</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+2</Th>
            <Th className="w-20">Calc. Comm.</Th>
            <Th className="w-16 text-right">% Comm.</Th>
            <Th className="w-16 text-right">TVA Comm.</Th>
            <Th className="w-14 text-right">Stocks</Th>
            <Th className="w-14 text-right">Règl. fo.</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
