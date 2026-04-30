"use client";

import { useCallback, useTransition, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";

import {
  type SubventionExploitationRow,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
} from "@/lib/schemas/activite";
import { useActiviteStore } from "@/stores/activite-store";
import { saveSubventionsExploitation } from "@/app/actions/activite";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { SectionHeader } from "./section-header";
import { cellInput, cellSelect, Th, Td } from "./activite-table-helpers";

const tempId = () => `__new__${crypto.randomUUID()}`;

const TYPES_TVA_SUBVENTION = [
  { value: "RECUPERABLE", label: "Récupérable" },
  { value: "NON_RECUPERABLE", label: "Non récupérable" },
  { value: "EXONEREE", label: "Exonérée" },
] as const;

function emptySubventionRow(groupe?: string): SubventionExploitationRow {
  return {
    id: tempId(),
    libelle: "",
    hypothese: "COMMUNE",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    tva: 20,
    typeTva: "NON_RECUPERABLE",
    actif: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

interface TableauSubventionsProps {
  dossierId: string;
  initialData: SubventionExploitationRow[];
}

/**
 * Tableau inline éditable des subventions d'exploitation — auto-contenu avec DnD et groupes.
 */
export function TableauSubventions({
  dossierId,
  initialData,
}: TableauSubventionsProps) {
  const [isPending, startTransition] = useTransition();
  const { getDraft, setSubventionsExploitation, setSubventionsRows, markSubventionsSaved } = useActiviteStore();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    const cur = useActiviteStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedSubventions) {
      const serverIds = new Set(initialData.map((r) => r.id).filter(Boolean));
      const ahead = cur.subventionsExploitation.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setSubventionsExploitation(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.subventionsExploitation;
  const isDirty = draft.hasUnsavedSubventions;

  const setRows = useCallback(
    (updater: (prev: SubventionExploitationRow[]) => SubventionExploitationRow[]) => {
      const d = useActiviteStore.getState().getDraft(dossierId);
      setSubventionsRows(dossierId, updater(d.subventionsExploitation));
    },
    [dossierId, setSubventionsRows]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptySubventionRow()]),
    [setRows]
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptySubventionRow(`Groupe ${n}`)]);
  }, [setRows, rows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptySubventionRow(groupe)]),
    [setRows]
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<SubventionExploitationRow>) =>
      setRows((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...data }; return n; }),
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx)),
    [setRows]
  );

  const duplicateRow = useCallback(
    (idx: number) =>
      setRows((prev) => {
        const { id: _id, ...rest } = prev[idx];
        return [...prev, { ...rest, id: tempId() }];
      }),
    [setRows]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = useActiviteStore.getState().getDraft(dossierId);
        const result = await saveSubventionsExploitation(dossierId, d.subventionsExploitation);
        if (result.success) {
          markSubventionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, markSubventionsSaved, invalidateControleStores]);

  const renderRow = useCallback(
    (row: SubventionExploitationRow & { id: string }, isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border border-l-2 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
            row.groupe && "border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            !(row.actif ?? true) && "opacity-50"
          )}
        >
          <DragHandleCell />
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => updateRow(idx, { actif: e.target.checked })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateRow(idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as SubventionExploitationRow["hypothese"] })}
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
              onChange={(e) => updateRow(idx, { dateN: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN === 0 ? "" : (row.montantN ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateN1 ?? ""}
              onChange={(e) => updateRow(idx, { dateN1: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1 === 0 ? "" : (row.montantN1 ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateN2 ?? ""}
              onChange={(e) => updateRow(idx, { dateN2: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2 === 0 ? "" : (row.montantN2 ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tva}
              onChange={(e) => updateRow(idx, { tva: numVal(e.target.value) })}
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
              onChange={(e) => updateRow(idx, { typeTva: e.target.value as SubventionExploitationRow["typeTva"] })}
            >
              {TYPES_TVA_SUBVENTION.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <div className="flex items-center justify-center gap-0.5">
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => duplicateRow(idx)}
                title="Dupliquer"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => removeRow(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, updateRow, removeRow, duplicateRow]
  );

  const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  const actifs = rows.filter((r) => r.actif ?? true);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Subventions d'exploitation"
        description="Aides et subventions perçues sur la période prévisionnelle"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={13}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune subvention — cliquez sur « Ajouter »"
        footer={
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                Total (actifs)
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + (r.montantN ?? 0), 0))}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        }
        groupNameColSpan={4}
        renderGroupSummaryCells={(groupRows) => {
          const g = groupRows.filter((r) => r.actif ?? true);
          return (
            <>
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(g.reduce((s, r) => s + (r.montantN ?? 0), 0))}
              </td>
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(g.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
              </td>
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(g.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
              </td>
              <td colSpan={3} />
            </>
          );
        }}
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
