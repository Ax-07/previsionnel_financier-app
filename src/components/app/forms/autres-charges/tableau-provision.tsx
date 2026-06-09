import { saveProvisions, fetchProvisions } from "@/app/actions/autres-charges";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber } from "@/lib/format";
import { AutreChargeProvisionRow, NATURES_PROVISION } from "@/lib/schemas/autres-charges";
import { cn, numVal } from "@/lib/utils";
import { useAutresChargesStore, emptyProvision } from "@/stores/autres-charges-store";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { Copy, Trash2 } from "lucide-react";
import { useTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Td, Th } from "../helpers/table-helpers";
import { filterByHypothese } from "../personnel/tableau-salaries";
import { Button } from "@/components/ui/button";

function TotauxProvisionRow({ rows, dossierId }: { rows: AutreChargeProvisionRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Dotations sur provisions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ProvisionsSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: AutreChargeProvisionRow[];
}) {
  const store = useAutresChargesStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.provisions;
  const isDirty = draft.hasUnsavedProvisions;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setProvisions(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: AutreChargeProvisionRow[]) => AutreChargeProvisionRow[]) => {
      store.setProvisions(dossierId, updater(rows));
    },
    [dossierId, rows, store],
  );
  const dnd = useGroupedDnd({ rows, setRows: setRows });

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyProvision(`Groupe ${n}`)]);
  }, [rows, setRows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyProvision(groupe)]),
    [setRows],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveProvisions(dossierId, rows);

      if (result.success) {
        const fresh = await fetchProvisions(dossierId);
        store.markProvisionsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, invalidateControleStores, rows, store]);

  const renderRow = useCallback(
    (row: AutreChargeProvisionRow & { id: string }, _isLastInGroup: boolean) => {
      const i = rows.findIndex((r) => r.id === row.id);

      if (i < 0) return null;

      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("group border-t border-border", !row.actif && "opacity-50")}
        >
          <DragHandleCell />
          <Td className="w-8 px-2">
            <input
              type="checkbox"
              checked={row.actif ?? true}
              onChange={(e) => store.updateProvision(dossierId, i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => store.updateProvision(dossierId, i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => store.updateProvision(dossierId, i, { nature: e.target.value })}
            >
              <option value="" className="bg-background text-foreground">—</option>
              {NATURES_PROVISION.map((n) => (
                <option key={n.value} value={n.value} className="bg-background text-foreground">
                  {n.label}
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
              onChange={(e) => store.updateProvision(dossierId, i, { montantN: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => store.updateProvision(dossierId, i, { montantN1: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => store.updateProvision(dossierId, i, { montantN2: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary"
                onClick={() => store.duplicateProvision(dossierId, i)}
              >
                <Copy className="h-3 w-3" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => store.removeProvision(dossierId, i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },

    [dossierId, rows, store],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Dotations sur provisions"
        description="Dépréciation de créances, provisions pour risques, litiges, garanties…"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addProvision(dossierId)}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />

      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxProvisionRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-40">Nature</Th>
            <Th className="w-28 text-right">N</Th>
            <Th className="w-28 text-right">N+1</Th>
            <Th className="w-28 text-right">N+2</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}