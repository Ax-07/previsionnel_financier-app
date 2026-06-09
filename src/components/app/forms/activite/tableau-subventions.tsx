"use client";

import { useCallback, useTransition, useEffect } from "react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";
import {
  type SubventionExploitationRow,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
} from "@/lib/schemas/activite";
import { LocalSubventionExploitationRow, useActiviteStore } from "@/stores/activite-store";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { saveSubventionsExploitation } from "@/app/actions/activite";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { formatNumber } from "@/lib/format";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { RowActions } from "../helpers/row-actions";

const TYPES_TVA_SUBVENTION = [
  { value: "RECUPERABLE", label: "Récupérable" },
  { value: "NON_RECUPERABLE", label: "Non récupérable" },
  { value: "EXONEREE", label: "Exonérée" },
] as const;

interface TableauSubventionsProps {
  dossierId: string;
  initialData: SubventionExploitationRow[];
}

function TotauxSubventions({ rows, dossierId }: { rows: LocalSubventionExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN ?? 0), 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
        </td>
        <td colSpan={3} />
      </tr>
    </tfoot>
  );
}

function GroupSummarySubventions({ rows, dossierId }: { rows: LocalSubventionExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const g = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {formatNumber(g.reduce((s, r) => s + (r.montantN ?? 0), 0))}
      </td>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {formatNumber(g.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
      </td>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {formatNumber(g.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
      </td>
      <td colSpan={4} />
    </>
  );
}

/**
 * Tableau inline éditable des subventions d'exploitation — auto-contenu avec DnD et groupes.
 */
export function TableauSubventions({
  dossierId,
  initialData,
}: TableauSubventionsProps) {
  const [isPending, startTransition] = useTransition();
  const store = useActiviteStore();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    store.hydrateSubventions(dossierId, initialData.map((r) => ({ ...r, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = store.getDraft(dossierId);
  const rows = draft.subventionsExploitation;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedSubventionIds?.length ?? 0) > 0;

  const setRows = useCallback(
    (updater: (prev: SubventionExploitationRow[]) => SubventionExploitationRow[]) => {
      const d = store.getDraft(dossierId);
      store.setSubventionsRows(dossierId, updater(d.subventionsExploitation));
    },
    [dossierId, store]
  );
  const dnd = useGroupedDnd({ rows, setRows });

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = store.getDraft(dossierId);
        const result = await saveSubventionsExploitation(dossierId, d.subventionsExploitation);
        if (result.success) {
          if (result.idMap && Object.keys(result.idMap).length > 0) {
            const idMap = result.idMap;
            store.setSubventions(dossierId, (prev) =>
              prev.map((r) => ({ ...r, id: r.id && idMap[r.id] ? idMap[r.id] : r.id }))
            );
          }
          store.markSubventionsSaved(dossierId);
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
    (row: LocalSubventionExploitationRow & { id: string }, isLastInGroup = false) => {
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
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { actif: e.target.checked })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { hypothese: e.target.value as SubventionExploitationRow["hypothese"] })}
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
              value={row.dateN ?? ""}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { dateN: e.target.value })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montantN}
              onChange={(v) => store.updateSubventionExploitationRow(dossierId, idx, { montantN: v })}
            />
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateN1 ?? ""}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { dateN1: e.target.value })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montantN1}
              onChange={(v) => store.updateSubventionExploitationRow(dossierId, idx, { montantN1: v })}
            />
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateN2 ?? ""}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { dateN2: e.target.value })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montantN2}
              onChange={(v) => store.updateSubventionExploitationRow(dossierId, idx, { montantN2: v })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tva}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { tva: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.typeTva}
              onChange={(e) => store.updateSubventionExploitationRow(dossierId, idx, { typeTva: e.target.value as SubventionExploitationRow["typeTva"] })}
            >
              {TYPES_TVA_SUBVENTION.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <RowActions
              onDuplicate={() => store.duplicateSubventionExploitationRow(dossierId, idx)}
              onDelete={() => store.removeSubventionExploitationRow(dossierId, idx)}
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
        title="Subventions d'exploitation"
        description="Aides et subventions perçues sur la période prévisionnelle"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addSubventionExploitationRow(dossierId)}
        onSave={saveAll}
        onAddGroup={() => store.addSubventionExploitationGroup(dossierId)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={13}
        onAddRowToGroupe={(groupe) => store.addSubventionExploitationToGroup(dossierId, groupe)}
        renderRow={renderRow}
        emptyMessage="Aucune subvention — cliquez sur « Ajouter »"
        footer={<TotauxSubventions rows={rows} dossierId={dossierId} />}
        groupNameColSpan={3}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummarySubventions rows={groupRows as LocalSubventionExploitationRow[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-28">Date N</Th>
            <Th className="w-24 text-right">N</Th>
            <Th className="w-28">Date N+1</Th>
            <Th className="w-24 text-right">N+1</Th>
            <Th className="w-28">Date N+2</Th>
            <Th className="w-24 text-right">N+2</Th>
            <Th className="w-16 text-right">TVA</Th>
            <Th className="w-28">Type TVA</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
