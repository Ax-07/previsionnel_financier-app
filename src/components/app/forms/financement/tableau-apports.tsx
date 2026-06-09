"use client";

import { useEffect, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber } from "@/lib/format";
import { HYPOTHESE_TYPE_OPTIONS, filterByHypothese } from "@/lib/schemas/hypothese";
import {
  TYPES_APPORT,
  type ApportRow,
  type EmpruntWithEcheancier,
} from "@/lib/schemas/financement";
import { cn } from "@/lib/utils";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  useFinancementStore,
  type LocalApport,
} from "@/stores/financement-store";
import { saveApports } from "@/app/actions/financement";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";

// ── Totaux footer ─────────────────────────────────────────────────────────────

function TotauxApports({ rows, dossierId }: { rows: LocalApport[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        {/* drag, actif, libellé, hypothèse, type, date */}
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total apports (actifs)
        </td>
        <td className="px-2 py-1.5 pr-4.5 text-[13px] font-semibold text-right tabular-nums">
          {formatNumber(total)}
        </td>
        {/* remboursable, actions */}
        <td colSpan={2} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryApports({ rows, dossierId }: { rows: LocalApport[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80">
        {formatNumber(total)}
      </td>
      <td />
    </>
  );
}

// ── Tableau ───────────────────────────────────────────────────────────────────

export interface TableauApportsProps {
  dossierId: string;
  initialData: ApportRow[];
  dateDebutExerciceN?: string;
}

export function TableauApports({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: TableauApportsProps) {
  const {
    getDraft,
    hydrateApports,
    addApportRow,
    updateApportRow,
    removeApportRow,
    duplicateApportRow,
    addApportGroup,
    addApportToGroup,
    setApportsRows,
    markApportsSaved,
    setApports,
  } = useFinancementStore();

  useEffect(() => {
    hydrateApports(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = useFinancementStore((s) => s.getDraft(dossierId));
  const rows  = draft.apports;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedApportIds?.length ?? 0) > 0;

  const [isPending, startTransition] = useTransition();
  const reloadScenario = useReloadScenarioData();

  const setRows = useCallback(
    (updater: (prev: LocalApport[]) => LocalApport[]) => setApports(dossierId, updater),
    [dossierId, setApports]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty) as ApportRow[];
      const deletedIds = draft._deletedApportIds ?? [];
      const res = await saveApports(dossierId, dirtyRows, deletedIds);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      // Patch IDs temp → réels
      if (res.idMap) {
        const map = res.idMap;
        setApports(dossierId, (prev) =>
          prev.map((r) => (r.id && map[r.id] ? { ...r, id: map[r.id] } : r))
        );
      }
      markApportsSaved(dossierId);
      toast.success("Apports enregistrés.");
      reloadScenario(dossierId);
    });
  }, [rows, draft._deletedApportIds, dossierId, setApports, markApportsSaved, reloadScenario]);

  const dnd = useGroupedDnd({ rows, setRows });

  const renderRow = useCallback(
    (row: LocalApport & { id: string }, isLastInGroup = false) => {
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
              checked={row.actif ?? true}
              onChange={(e) => updateApportRow(dossierId, row.id, { actif: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateApportRow(dossierId, row.id, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) =>
                updateApportRow(dossierId, row.id, { hypothese: e.target.value as ApportRow["hypothese"] })
              }
            >
              {HYPOTHESE_TYPE_OPTIONS.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">
                  {h.label}
                </option>
              ))}
            </select>
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.type}
              onChange={(e) =>
                updateApportRow(dossierId, row.id, { type: e.target.value as ApportRow["type"] })
              }
            >
              {TYPES_APPORT.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">
                  {t.label}
                </option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateApport}
              onChange={(e) => updateApportRow(dossierId, row.id, { dateApport: e.target.value })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montant}
              onChange={(v) => updateApportRow(dossierId, row.id, { montant: v })}
              min={0}
              step={0.01}
              placeholder="0"
            />
          </Td>
          <Td className="text-center px-1">
            <input
              type="checkbox"
              checked={row.remboursable ?? false}
              disabled={row.type !== "COMPTE_COURANT"}
              onChange={(e) =>
                updateApportRow(dossierId, row.id, { remboursable: e.target.checked })
              }
              className="h-3.5 w-3.5 cursor-pointer accent-primary disabled:opacity-30"
              title={
                row.type !== "COMPTE_COURANT"
                  ? "Option disponible uniquement pour les CCA"
                  : ""
              }
            />
          </Td>
          <Td className="text-center">
            <RowActions
              onDuplicate={() => duplicateApportRow(dossierId, row.id)}
              onDelete={() => removeApportRow(dossierId, row.id)}
              isPending={isPending}
              groupe={row.groupe ?? null}
            />
          </Td>
        </SortableTableRow>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, isPending, dossierId]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Apports en capital"
        description="Capital social, comptes courants d'associés, apports en nature"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => addApportRow(dossierId, dateDebutExerciceN)}
        onSave={saveAll}
        onAddGroup={() => addApportGroup(dossierId, dateDebutExerciceN)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={9}
        groupNameColSpan={4}
        onAddRowToGroupe={(g) => addApportToGroup(dossierId, g, dateDebutExerciceN)}
        renderRow={renderRow}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryApports
            rows={groupRows as LocalApport[]}
            dossierId={dossierId}
          />
        )}
        emptyMessage="Aucun apport. Cliquez sur « Ajouter » pour commencer."
        footer={rows.length > 0 ? <TotauxApports rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-48">Libellé</Th>
            <Th className="w-28">Hypothèse</Th>
            <Th className="w-40">Type</Th>
            <Th className="w-32">Date</Th>
            <Th className="w-28">Montant (€)</Th>
            <Th className="w-28 text-center">Remboursable</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
