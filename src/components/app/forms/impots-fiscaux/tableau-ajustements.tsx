"use client";

import { useCallback } from "react";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { type AjustementFiscalRow } from "@/lib/schemas/impots-fiscaux";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { cellInput } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

export function TableauAjustements({
  dossierId,
  rows,
  isDirty,
  isSaving,
  title,
  icon,
  onAdd,
  onUpdate,
  onRemove,
  onDuplicate,
  onSave,
  setRows,
}: {
  dossierId: string;
  rows: AjustementFiscalRow[];
  isDirty: boolean;
  isSaving: boolean;
  title: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  onUpdate: (index: number, data: Partial<AjustementFiscalRow>) => void;
  onRemove: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onSave: () => void;
  setRows: (updater: (prev: AjustementFiscalRow[]) => AjustementFiscalRow[]) => void;
}) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const totalN = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN, 0);
  const totalN1 = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN2, 0);

  const rowType = rows[0]?.type ?? "REINTEGRATION";
  const setRowsDnd = useCallback(
    (updater: (prev: AjustementFiscalRow[]) => AjustementFiscalRow[]) => setRows(updater),
    [setRows],
  );
  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [
      ...prev,
      {
        id: `__new__${crypto.randomUUID()}`,
        type: rowType as AjustementFiscalRow["type"],
        actif: true,
        hypothese: "COMMUNE" as const,
        libelle: "",
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [rows, rowType, setRows]);
  const addRowToGroupe = useCallback(
    (groupe: string) => {
      setRows((prev) => [
        ...prev,
        {
          id: `__new__${crypto.randomUUID()}`,
          type: rowType as AjustementFiscalRow["type"],
          actif: true,
          hypothese: "COMMUNE" as const,
          libelle: "",
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          groupe,
        },
      ]);
    },
    [rowType, setRows],
  );
  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });

  const renderRow = useCallback(
    (row: AjustementFiscalRow & { id: string }, _isLastInGroup: boolean) => {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i < 0) return null;
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("border-b transition-colors", !row.actif && "opacity-40")}
        >
          <DragHandleCell />
          <Td className="w-8 text-center">
            <input
              type="checkbox"
              checked={row.actif ?? true}
              onChange={(e) => onUpdate(i, { actif: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
          </Td>
          <Td>
            <input
              type="text"
              value={row.libelle}
              onChange={(e) => onUpdate(i, { libelle: e.target.value })}
              placeholder="Libellé…"
              className={cellInput}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN)}
              onChange={(e) => onUpdate(i, { montantN: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN1)}
              onChange={(e) => onUpdate(i, { montantN1: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN2)}
              onChange={(e) => onUpdate(i, { montantN2: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td className="w-8">
            <div className="flex items-center">
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onDuplicate(i)}
                  title="Dupliquer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, onUpdate, onRemove, onDuplicate],
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title={title}
        icon={icon}
        isDirty={isDirty}
        isSaving={isSaving}
        onAdd={onAdd}
        onSave={onSave}
        onAddGroup={addGroupe}
      />

      <GroupedDndTable
        dnd={dnd}
        colSpan={7}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={
          rows.length > 0 ? (
            <tfoot>
              <tr className="border-t bg-muted/30 font-medium">
                <td colSpan={3} className="px-2 py-1.5 text-xs text-muted-foreground">
                  Total
                </td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN1)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN2)}</td>
                <td />
              </tr>
            </tfoot>
          ) : undefined
        }
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <Th className="w-7" />
            <Th className="w-8 text-center">Sél.</Th>
            <Th className="min-w-50">Libellé</Th>
            <Th className="w-36 text-right">N</Th>
            <Th className="w-36 text-right">N+1</Th>
            <Th className="w-36 text-right">N+2</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
