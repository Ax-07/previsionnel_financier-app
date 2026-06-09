"use client";

import { useCallback, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type ProductionImmobiliseeRow, HYPOTHESES_ACTIVITE } from "@/lib/schemas/activite";
import { LocalProductionImmobiliseeRow, useActiviteStore } from "@/stores/activite-store";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { saveProductionsImmobilisees } from "@/app/actions/activite";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { formatNumber } from "@/lib/format";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { RowActions } from "../helpers/row-actions";

const NATURES_PRODUCTION = [
  { value: "CORPOREL", label: "Corporel" },
  { value: "INCORPOREL", label: "Incorporel" },
  { value: "FINANCIER", label: "Financier" },
] as const;

const MODES_AMORTISSEMENT = [
  { value: "AUCUN", label: "Aucun" },
  { value: "LINEAIRE", label: "Linéaire" },
  { value: "DEGRESSIF", label: "Dégressif" },
] as const;

interface TableauProductionsImmobiliseesProps {
  dossierId: string;
  initialData: ProductionImmobiliseeRow[];
  dateDebutExerciceN?: string;
}

function TotauxProductions({ rows, dossierId }: { rows: LocalProductionImmobiliseeRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const total = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(total, 0)}
        </td>
        <td colSpan={4} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryProductions({ rows, dossierId }: { rows: LocalProductionImmobiliseeRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const total = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {formatNumber(total, 0)}
      </td>
      <td colSpan={2} />
    </>
  );
}

/**
 * Tableau inline éditable des productions immobilisées — auto-contenu avec DnD et groupes.
 */
export function TableauProductionsImmobilisees({
  dossierId,
  initialData,
}: TableauProductionsImmobiliseesProps) {
  const [isPending, startTransition] = useTransition();
  const store = useActiviteStore();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    store.hydrateProductions(dossierId, initialData.map((r) => ({ ...r, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = store.getDraft(dossierId);
  const rows = draft.productionsImmobilisees;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedProductionIds?.length ?? 0) > 0;

  const setRows = useCallback(
    (updater: (prev: ProductionImmobiliseeRow[]) => ProductionImmobiliseeRow[]) => {
      const d = store.getDraft(dossierId);
      store.setProductionsRows(dossierId, updater(d.productionsImmobilisees));
    },
    [dossierId, store]
  );
  const dnd = useGroupedDnd({ rows, setRows });

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = store.getDraft(dossierId);
        const result = await saveProductionsImmobilisees(dossierId, d.productionsImmobilisees);
        if (result.success) {
          if (result.idMap && Object.keys(result.idMap).length > 0) {
            const idMap = result.idMap;
            store.setProductions(dossierId, (prev) =>
              prev.map((r) => ({ ...r, id: r.id && idMap[r.id] ? idMap[r.id] : r.id }))
            );
          }
          store.markProductionsSaved(dossierId);
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
    (row: LocalProductionImmobiliseeRow & { id: string }, isLastInGroup = false) => {
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
            !(row.actif ?? true) && "opacity-50"
          )}
        >
          <DragHandleCell />
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { actif: e.target.checked })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { nature: e.target.value as ProductionImmobiliseeRow["nature"] })}
            >
              {NATURES_PRODUCTION.map((n) => (
                <option key={n.value} value={n.value} className="bg-background text-foreground">{n.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { hypothese: e.target.value as ProductionImmobiliseeRow["hypothese"] })}
            >
              {HYPOTHESES_ACTIVITE.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.date ?? ""}
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { date: e.target.value })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montant}
              onChange={(v) => store.updateProductionImmobiliseeRow(dossierId, idx, { montant: v })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.amortissement}
              onChange={(e) => store.updateProductionImmobiliseeRow(dossierId, idx, { amortissement: e.target.value as ProductionImmobiliseeRow["amortissement"] })}
            >
              {MODES_AMORTISSEMENT.map((a) => (
                <option key={a.value} value={a.value} className="bg-background text-foreground">{a.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <NumericCellInput
              value={row.differe}
              onChange={(v) => store.updateProductionImmobiliseeRow(dossierId, idx, { differe: v })}
              step={1}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.duree}
              onChange={(v) => store.updateProductionImmobiliseeRow(dossierId, idx, { duree: v })}
              step={1}
            />
          </Td>
          <Td className="text-center px-1">
            <RowActions
              onDelete={() => store.removeProductionImmobiliseeRow(dossierId, idx)}
              onDuplicate={() => store.duplicateProductionImmobiliseeRow(dossierId, idx)}
              isPending={isPending}
              groupe={row.groupe ?? null}
            />
          </Td>
        </SortableTableRow>
      );
    },
    [rows, isPending, store, dossierId]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Productions immobilisées"
        description="Immobilisations produites par l'entreprise pour elle-même"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addProductionImmobiliseeRow(dossierId)}
        onSave={saveAll}
        onAddGroup={() => store.addProductionImmobiliseeGroup(dossierId)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={11}
        onAddRowToGroupe={(groupe) => store.addProductionImmobiliseeToGroup(dossierId, groupe)}
        renderRow={renderRow}
        emptyMessage="Aucune production immobilisée — cliquez sur « Ajouter »"
        footer={<TotauxProductions rows={rows} dossierId={dossierId} />}
        groupNameColSpan={5}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryProductions rows={groupRows as LocalProductionImmobiliseeRow[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Nature</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-28">Date</Th>
            <Th className="w-24 text-right">Montant</Th>
            <Th className="w-24">Amort.</Th>
            <Th className="w-16 text-right">Différé</Th>
            <Th className="w-16 text-right">Durée</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
