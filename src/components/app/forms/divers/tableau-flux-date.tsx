"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import {
  type DiversFluxDateRow,
} from "@/lib/schemas/divers";
import { HYPOTHESE_TYPE_OPTIONS, filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { fetchFluxDates, saveFluxDates } from "@/app/actions/divers";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

// ── Helpers ───────────────────────────────────────────────────────────────────

const tempId = () => `__new__${crypto.randomUUID()}`;
const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

export function emptyFluxRow(type: DiversFluxDateRow["type"], groupe?: string | null): DiversFluxDateRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

// ── Footer ────────────────────────────────────────────────────────────────────

function TotauxFluxRow({ rows, dossierId }: { rows: DiversFluxDateRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={5} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

// ── Config interface ──────────────────────────────────────────────────────────

export interface FluxSectionConfig {
  type: DiversFluxDateRow["type"];
  title: string;
  description?: string;
  emptyMessage: string;
  // Lecture
  getRows: (dossierId: string) => DiversFluxDateRow[];
  isDirty: (dossierId: string) => boolean;
  // Hydratation (sans dirty) + réordonnancement DnD (avec dirty)
  setRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setRowsDirty: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  // Mutations — codées dans le store, appelées directement
  addRow: (dossierId: string) => void;
  addGroup: (dossierId: string) => void;
  addToGroup: (dossierId: string, groupe: string) => void;
  updateRow: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeRow: (dossierId: string, id: string) => void;
  duplicateRow: (dossierId: string, id: string) => void;
  markSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;
}

// ── Composant générique ───────────────────────────────────────────────────────

export function TableauFluxDate({
  dossierId,
  initialData,
  config,
}: {
  dossierId: string;
  initialData: DiversFluxDateRow[];
  config: FluxSectionConfig;
}) {
  const rows = config.getRows(dossierId);
  const isDirty = config.isDirty(dossierId);
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      config.setRows(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRowsForDnd = useCallback(
    (updater: (prev: DiversFluxDateRow[]) => DiversFluxDateRow[]) =>
      config.setRowsDirty(dossierId, updater(config.getRows(dossierId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId],
  );

  const dnd = useGroupedDnd({ rows, setRows: setRowsForDnd });

  const addRow = useCallback(() => config.addRow(dossierId), [config, dossierId]);
  const addGroupe = useCallback(() => config.addGroup(dossierId), [config, dossierId]);
  const addRowToGroupe = useCallback((groupe: string) => config.addToGroup(dossierId, groupe), [config, dossierId]);
  const updateRow = useCallback((id: string, data: Partial<DiversFluxDateRow>) => config.updateRow(dossierId, id, data), [config, dossierId]);
  const removeRow = useCallback((id: string) => config.removeRow(dossierId, id), [config, dossierId]);
  const duplicateRow = useCallback((id: string) => config.duplicateRow(dossierId, id), [config, dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const currentRows = config.getRows(dossierId);
      const result = await saveFluxDates(dossierId, config.type, currentRows);
      if (result.success) {
        const fresh = await fetchFluxDates(dossierId, config.type);
        config.markSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversFluxDateRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN, 0))}
          </td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
          </td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
          </td>
        </>
      );
    },
    [],
  );

  const renderRow = useCallback(
    (row: DiversFluxDateRow & { id: string }) => (
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
            type="text"
            className={cellInput}
            value={row.dateN ?? ""}
            onChange={(e) => updateRow(row.id, { dateN: e.target.value })}
            placeholder="MM/AAAA"
          />
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
            type="text"
            className={cellInput}
            value={row.dateN1 ?? ""}
            onChange={(e) => updateRow(row.id, { dateN1: e.target.value })}
            placeholder="MM/AAAA"
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
            type="text"
            className={cellInput}
            value={row.dateN2 ?? ""}
            onChange={(e) => updateRow(row.id, { dateN2: e.target.value })}
            placeholder="MM/AAAA"
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
    [updateRow, duplicateRow, removeRow],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title={config.title}
        description={config.description}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={11}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage={config.emptyMessage}
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
        footer={<TotauxFluxRow rows={rows} dossierId={dossierId} />}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-30">Hypothèse</Th>
            <Th className="w-28">Date N</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28">Date N+1</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28">Date N+2</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
