"use client";

import { useCallback, useTransition, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";

import {
  type ActiviteCommissionRow,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
  MODES_CALCUL_COMMISSION,
} from "@/lib/schemas/activite";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { useActiviteStore } from "@/stores/activite-store";
import { saveActivitesCommission } from "@/app/actions/activite";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { SectionHeader } from "./section-header";
import { cellInput, cellSelect, intVal, Th, Td } from "./activite-table-helpers";

const tempId = () => `__new__${crypto.randomUUID()}`;

function emptyCommissionRow(groupe?: string): ActiviteCommissionRow {
  return {
    id: tempId(),
    libelle: "",
    hypothese: "COMMUNE",
    montantN: 0, evolutionN1: 0, montantN1: 0, evolutionN2: 0, montantN2: 0,
    calculCommission: "HT",
    tauxCommission: 0,
    tvaCommission: 20,
    stocks: 0,
    reglementFournisseurs: 30,
    actif: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

interface TableauActivitesCommissionsProps {
  dossierId: string;
  initialData: ActiviteCommissionRow[];
}

/**
 * Tableau inline éditable des activités commissionnées — auto-contenu avec DnD et groupes.
 * N+1 et N+2 sont calculés automatiquement depuis le taux d'évolution.
 */
export function TableauActivitesCommissions({
  dossierId,
  initialData,
}: TableauActivitesCommissionsProps) {
  const [isPending, startTransition] = useTransition();
  const { getDraft, setActivitesCommissionnees, setCommissionsRows, markCommissionsSaved } = useActiviteStore();
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    const cur = useActiviteStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedCommissions) {
      const serverIds = new Set(initialData.map((r) => r.id).filter(Boolean));
      const ahead = cur.activitesCommissionnees.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setActivitesCommissionnees(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.activitesCommissionnees;
  const isDirty = draft.hasUnsavedCommissions;

  const setRows = useCallback(
    (updater: (prev: ActiviteCommissionRow[]) => ActiviteCommissionRow[]) => {
      const d = useActiviteStore.getState().getDraft(dossierId);
      setCommissionsRows(dossierId, updater(d.activitesCommissionnees));
    },
    [dossierId, setCommissionsRows]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptyCommissionRow()]),
    [setRows]
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyCommissionRow(`Groupe ${n}`)]);
  }, [setRows, rows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyCommissionRow(groupe)]),
    [setRows]
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<ActiviteCommissionRow>) =>
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
        const result = await saveActivitesCommission(dossierId, d.activitesCommissionnees);
        if (result.success) {
          markCommissionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, markCommissionsSaved, invalidateControleStores]);

  const renderRow = useCallback(
    (row: ActiviteCommissionRow & { id: string }, isLastInGroup = false) => {
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
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as ActiviteCommissionRow["hypothese"] })}
            >
              {HYPOTHESES_ACTIVITE.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN === 0 ? "" : row.montantN}
              placeholder="0"
              onChange={(e) => {
                const n = numVal(e.target.value);
                const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                updateRow(idx, { montantN: n, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
              placeholder="0"
              onChange={(e) => {
                const ev1 = numVal(e.target.value);
                const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                updateRow(idx, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right bg-muted/40")}
              value={row.montantN1 === 0 ? "" : row.montantN1}
              readOnly
              tabIndex={-1}
              placeholder="0"
              title="Calculé automatiquement depuis N × (1 + % Év.)"
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
              placeholder="0"
              onChange={(e) => {
                const ev2 = numVal(e.target.value);
                const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                updateRow(idx, { evolutionN2: ev2, montantN2: n2 });
              }}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right bg-muted/40")}
              value={row.montantN2 === 0 ? "" : row.montantN2}
              readOnly
              tabIndex={-1}
              placeholder="0"
              title="Calculé automatiquement depuis N+1 × (1 + % Év.)"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.calculCommission}
              onChange={(e) => updateRow(idx, { calculCommission: e.target.value as ActiviteCommissionRow["calculCommission"] })}
            >
              {MODES_CALCUL_COMMISSION.map((m) => (
                <option key={m.value} value={m.value} className="bg-background text-foreground">{m.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.tauxCommission === 0 ? "" : row.tauxCommission}
              placeholder="0"
              onChange={(e) => updateRow(idx, { tauxCommission: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tvaCommission}
              onChange={(e) => updateRow(idx, { tvaCommission: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.stocks === 0 ? "" : (row.stocks ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { stocks: intVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.reglementFournisseurs === 0 ? "" : (row.reglementFournisseurs ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { reglementFournisseurs: intVal(e.target.value) })}
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
    [rows, updateRow, removeRow, duplicateRow]
  );

  const filteredActifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif ?? true);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Activités commissionnées"
        description="Revenus issus de commissions sur ventes ou prestations"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={15}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune activité commissionnée — cliquez sur « Ajouter »"
        footer={
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                Total (actifs)
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filteredActifs.reduce((s, r) => s + r.montantN, 0))}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filteredActifs.reduce((s, r) => s + r.montantN1, 0))}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filteredActifs.reduce((s, r) => s + r.montantN2, 0))}
              </td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        }
        groupNameColSpan={4}
        renderGroupSummaryCells={(groupRows) => {
          const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif ?? true);
          return (
            <>
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + r.montantN, 0))}
              </td>
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + r.montantN1, 0))}
              </td>
              <td />
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + r.montantN2, 0))}
              </td>
              <td colSpan={6} />
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
            <Th className="w-24 text-right">N</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+1</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+2</Th>
            <Th className="w-20">Calc. Comm.</Th>
            <Th className="w-16 text-right">% Comm.</Th>
            <Th className="w-16 text-right">TVA Comm.</Th>
            <Th className="w-14 text-right">Stocks</Th>
            <Th className="w-14 text-right">Règl. fo.</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
