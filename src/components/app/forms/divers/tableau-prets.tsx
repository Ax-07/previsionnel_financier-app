"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import {
  PERIODICITES_PRET,
  calculerEcheancePret,
  type DiversPretRow,
} from "@/lib/schemas/divers";
import { HYPOTHESE_TYPE_OPTIONS, type HypotheseType } from "@/lib/schemas/hypothese";
import { useDiversStore } from "@/stores/divers-store";
import { fetchPrets, savePrets } from "@/app/actions/divers";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

export function TableauPrets({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversPretRow[];
}) {
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.prets;
  const isDirty = draft.hasUnsavedPrets;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setPrets(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversPretRow[]) => DiversPretRow[]) =>
      store.setPretsRows(dossierId, updater(store.getDraft(dossierId).prets)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId],
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = () => store.addPret(dossierId);
  const addGroupe = () => store.addPretsGroup(dossierId);
  const addRowToGroupe = (groupe: string) => store.addPretsToGroup(dossierId, groupe);
  const updateRow = (id: string, data: Partial<DiversPretRow>) => store.updatePret(dossierId, id, data);
  const removeRow = (id: string) => store.removePret(dossierId, id);
  const duplicateRow = (id: string) => store.duplicatePret(dossierId, id);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await savePrets(dossierId, rows);
      if (result.success) {
        const fresh = await fetchPrets(dossierId);
        store.markPretsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, rows]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversPretRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.capital, 0))}
          </td>
          <td />
          <td />
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(
              active.reduce(
                (s, r) =>
                  s + calculerEcheancePret(r.capital, r.taux, r.dureeMois, r.periodicite).echeance,
                0,
              ),
            )}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(
              active.reduce(
                (s, r) =>
                  s +
                  calculerEcheancePret(r.capital, r.taux, r.dureeMois, r.periodicite).coutTotal,
                0,
              ),
            )}
          </td>
        </>
      );
    },
    [],
  );

  const renderRow = useCallback(
    (row: DiversPretRow & { id: string }) => {
      const { echeance, coutTotal } = calculerEcheancePret(
        row.capital,
        row.taux,
        row.dureeMois,
        row.periodicite,
      );
      return (
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
              value={row.dateDebut ?? ""}
              onChange={(e) => updateRow(row.id, { dateDebut: e.target.value })}
              placeholder="MM/AAAA"
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.capital}
              min={0}
              onChange={(e) => updateRow(row.id, { capital: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-20">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.taux}
              min={0}
              max={100}
              step={0.01}
              onChange={(e) => updateRow(row.id, { taux: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-20">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.dureeMois}
              min={1}
              onChange={(e) =>
                updateRow(row.id, { dureeMois: Math.max(1, parseInt(e.target.value) || 1) })
              }
            />
          </Td>
          <Td className="w-28">
            <select
              className={cellSelect}
              value={row.periodicite}
              onChange={(e) =>
                updateRow(row.id, { periodicite: e.target.value as DiversPretRow["periodicite"] })
              }
            >
              {PERIODICITES_PRET.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
            {formatNumber(echeance)}
          </Td>
          <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
            {formatNumber(coutTotal)}
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
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Prêts inter-entreprises"
        description="Prêts accordés ou reçus entre entreprises liées — échéance calculée automatiquement."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={12}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucun prêt inter-entreprises — cliquez sur « Ajouter » pour commencer."
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="min-w-25">Hypothèse</Th>
            <Th className="w-28">Date début</Th>
            <Th className="w-28 text-right">Capital (€)</Th>
            <Th className="w-20 text-right">Taux (%)</Th>
            <Th className="w-20 text-right">Durée (mois)</Th>
            <Th className="w-28">Périodicité</Th>
            <Th className="w-28 text-right">Échéance (€)</Th>
            <Th className="w-28 text-right">Coût total (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
