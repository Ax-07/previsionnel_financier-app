"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { type DiversOperationCapitalRow } from "@/lib/schemas/divers";
import { HYPOTHESE_TYPE_OPTIONS, filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { useDiversStore } from "@/stores/divers-store";
import { fetchOperationsCapital, saveOperationsCapital } from "@/app/actions/divers";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

function TotauxCapitalRow({
  rows,
  dossierId,
}: {
  rows: DiversOperationCapitalRow[];
  dossierId: string;
}) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

export function TableauAugmentationCapital({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversOperationCapitalRow[];
}) {
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.augmentationsCapital;
  const isDirty = draft.hasUnsavedAugmentationsCapital;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setAugmentationsCapital(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversOperationCapitalRow[]) => DiversOperationCapitalRow[]) =>
      store.setAugmentationsCapitalRows(
        dossierId,
        updater(store.getDraft(dossierId).augmentationsCapital),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId],
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = () => store.addAugmentationCapital(dossierId);
  const addGroupe = () => store.addAugmentationsCapitalGroup(dossierId);
  const addRowToGroupe = (groupe: string) => store.addAugmentationsCapitalToGroup(dossierId, groupe);
  const updateRow = (id: string, data: Partial<DiversOperationCapitalRow>) => store.updateAugmentationCapital(dossierId, id, data);
  const removeRow = (id: string) => store.removeAugmentationCapital(dossierId, id);
  const duplicateRow = (id: string) => store.duplicateAugmentationCapital(dossierId, id);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveOperationsCapital(dossierId, "AUGMENTATION_INCORPORATION", rows);
      if (result.success) {
        const fresh = await fetchOperationsCapital(dossierId, "AUGMENTATION_INCORPORATION");
        store.markAugmentationsCapitalSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, rows]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversOperationCapitalRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
          </td>
        </>
      );
    },
    [],
  );

  const renderRow = useCallback(
    (row: DiversOperationCapitalRow & { id: string }) => (
      <SortableTableRow
        key={row.id}
        id={row.id}
        className={cn(
          "border-b last:border-0 hover:bg-muted/20 transition-colors",
          row.actif === false && "opacity-50",
        )}
      >
        <DragHandleCell />
        <Td className="pl-1">
          <input
            type="checkbox"
            checked={row.actif !== false}
            onChange={(e) => updateRow(row.id, { actif: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese ?? "COMMUNE"}
            onChange={(e) => updateRow(row.id, { hypothese: e.target.value as HypotheseType })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">
                {h.label}
              </option>
            ))}
          </select>
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN1}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN1: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN2}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN2: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-10 px-1">
          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-primary"
              onClick={() => duplicateRow(row.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive"
              onClick={() => removeRow(row.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </Td>
      </SortableTableRow>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Augmentation de capital par incorporation de réserves"
        description="Transformation des réserves en capital — aucun flux de trésorerie."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune augmentation — cliquez sur « Ajouter » pour commencer."
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
        footer={<TotauxCapitalRow rows={rows} dossierId={dossierId} />}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-30">Hypothèse</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
