"use client";

import { useCallback, useTransition, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";

import {
  type ProductionImmobiliseeRow,
  HYPOTHESES_ACTIVITE,
} from "@/lib/schemas/activite";
import { useActiviteStore } from "@/stores/activite-store";
import { saveProductionsImmobilisees } from "@/app/actions/activite";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { SectionHeader } from "./section-header";
import { cellInput, cellSelect, intVal, Th, Td } from "./activite-table-helpers";

const tempId = () => `__new__${crypto.randomUUID()}`;

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

function emptyProductionRow(
  groupe?: string,
  dateDebutExerciceN?: string
): ProductionImmobiliseeRow {
  return {
    id: tempId(),
    libelle: "",
    hypothese: "COMMUNE",
    nature: "CORPOREL",
    date: dateDebutExerciceN ?? "",
    montant: 0,
    amortissement: "LINEAIRE",
    differe: 0,
    duree: 5,
    actif: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

interface TableauProductionsImmobiliseesProps {
  dossierId: string;
  initialData: ProductionImmobiliseeRow[];
  dateDebutExerciceN?: string;
}

/**
 * Tableau inline éditable des productions immobilisées — auto-contenu avec DnD et groupes.
 */
export function TableauProductionsImmobilisees({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: TableauProductionsImmobiliseesProps) {
  const [isPending, startTransition] = useTransition();
  const { getDraft, setProductionsImmobilisees, setProductionsRows, markProductionsSaved } = useActiviteStore();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    const cur = useActiviteStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedProductions) {
      const serverIds = new Set(initialData.map((r) => r.id).filter(Boolean));
      const ahead = cur.productionsImmobilisees.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setProductionsImmobilisees(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.productionsImmobilisees;
  const isDirty = draft.hasUnsavedProductions;

  const setRows = useCallback(
    (updater: (prev: ProductionImmobiliseeRow[]) => ProductionImmobiliseeRow[]) => {
      const d = useActiviteStore.getState().getDraft(dossierId);
      setProductionsRows(dossierId, updater(d.productionsImmobilisees));
    },
    [dossierId, setProductionsRows]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptyProductionRow(undefined, dateDebutExerciceN)]),
    [setRows, dateDebutExerciceN]
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyProductionRow(`Groupe ${n}`, dateDebutExerciceN)]);
  }, [setRows, rows, dateDebutExerciceN]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyProductionRow(groupe, dateDebutExerciceN)]),
    [setRows, dateDebutExerciceN]
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<ProductionImmobiliseeRow>) =>
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
        const result = await saveProductionsImmobilisees(dossierId, d.productionsImmobilisees);
        if (result.success) {
          markProductionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, markProductionsSaved, invalidateControleStores]);

  const renderRow = useCallback(
    (row: ProductionImmobiliseeRow & { id: string }, isLastInGroup = false) => {
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
              value={row.nature}
              onChange={(e) => updateRow(idx, { nature: e.target.value as ProductionImmobiliseeRow["nature"] })}
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
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as ProductionImmobiliseeRow["hypothese"] })}
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
              onChange={(e) => updateRow(idx, { date: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montant === 0 ? "" : row.montant}
              placeholder="0"
              onChange={(e) => updateRow(idx, { montant: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.amortissement}
              onChange={(e) => updateRow(idx, { amortissement: e.target.value as ProductionImmobiliseeRow["amortissement"] })}
            >
              {MODES_AMORTISSEMENT.map((a) => (
                <option key={a.value} value={a.value} className="bg-background text-foreground">{a.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.differe === 0 ? "" : (row.differe ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { differe: intVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.duree === 0 ? "" : (row.duree ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { duree: intVal(e.target.value) })}
            />
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
  const totalMontant = rows.filter((r) => r.actif ?? true).reduce((s, r) => s + (r.montant ?? 0), 0);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Productions immobilisées"
        description="Immobilisations produites par l'entreprise pour elle-même"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={11}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune production immobilisée — cliquez sur « Ajouter »"
        footer={
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                Total (actifs)
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(totalMontant)}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        }
        groupNameColSpan={6}
        renderGroupSummaryCells={(groupRows) => {
          const total = groupRows.filter((r) => r.actif ?? true).reduce((s, r) => s + (r.montant ?? 0), 0);
          return (
            <>
              <td />
              <td />
              <td />
              <td />
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(total)}
              </td>
              <td colSpan={4} />
            </>
          );
        }}
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
