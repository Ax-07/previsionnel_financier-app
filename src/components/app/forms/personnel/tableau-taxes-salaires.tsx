"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Percent, Wand2, Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { HYPOTHESES_PERSONNEL, type LigneTaxeSalaireRow } from "@/lib/schemas/personnel";
import { usePersonnelStore } from "@/stores/personnel-store";
import { saveLignesTaxesSalaires, fetchDossierDebutExercice } from "@/app/actions/personnel";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber } from "@/lib/format";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { Td, tempId, Th } from "../helpers/table-helpers";
import { SectionHeader } from "../helpers/section-header";

const EMPTY_TAXES: LigneTaxeSalaireRow[] = [];
const EMPTY_SALARIES_FOR_TAXES: import("@/lib/schemas/personnel").LigneSalarieRow[] = [];

const COL_SPAN = 13;
const GROUP_NAME_COL_SPAN = 5; // Act. | Libelle | Hyp. | Calc. | Taux %

function emptyRow(groupe?: string): LigneTaxeSalaireRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    calcAuto: false,
    taux: 0,
    dateN: "",
    dateN1: "",
    dateN2: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

export function TableauTaxesSalaires({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneTaxeSalaireRow[];
}) {
  const rows = usePersonnelStore(s => s.drafts[dossierId]?.taxesSalaires ?? EMPTY_TAXES);
  const isDirty = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedTaxesSalaires ?? false);
  const salaries = usePersonnelStore(s => s.drafts[dossierId]?.salaries ?? EMPTY_SALARIES_FOR_TAXES);
  const setTaxesSalaires = usePersonnelStore(s => s.setTaxesSalaires);
  const setTaxesSalairesRows = usePersonnelStore(s => s.setTaxesSalairesRows);
  const markTaxesSalairesSaved = usePersonnelStore(s => s.markTaxesSalairesSaved);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();
  const [debutExercice, setDebutExercice] = useState<{ anneeDebut: number; moisDebut: number } | null>(null);

  useEffect(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedTaxesSalaires) {
      setTaxesSalaires(dossierId, initialData ?? []);
    }
    fetchDossierDebutExercice(dossierId).then(setDebutExercice).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: LigneTaxeSalaireRow[]) => LigneTaxeSalaireRow[]) => {
      const cur = usePersonnelStore.getState().getDraft(dossierId);
      setTaxesSalairesRows(dossierId, updater(cur.taxesSalaires));
    },
    [dossierId, setTaxesSalairesRows],
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptyRow()]),
    [setRows],
  );

  const addGroupe = useCallback(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const existing = new Set(cur.taxesSalaires.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has("Groupe " + n)) n++;
    setRows((prev) => [...prev, emptyRow("Groupe " + n)]);
  }, [dossierId, setRows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyRow(groupe)]),
    [setRows],
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<LigneTaxeSalaireRow>) =>
      setRows((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...data }; return n; }),
    [setRows],
  );

  const removeRow = useCallback(
    (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx)),
    [setRows],
  );

  const duplicateRow = useCallback(
    (idx: number) =>
      setRows((prev) => {
        const { id: _id, ...rest } = prev[idx];
        return [...prev, { ...rest, id: tempId() }];
      }),
    [setRows],
  );

  const masseSalarialeN = useMemo(
    () => filterByHypothese(salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN ?? 0), 0),
    [salaries, hypotheseActive],
  );
  const masseSalarialeN1 = useMemo(
    () => filterByHypothese(salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN1 ?? 0), 0),
    [salaries, hypotheseActive],
  );
  const masseSalarialeN2 = useMemo(
    () => filterByHypothese(salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN2 ?? 0), 0),
    [salaries, hypotheseActive],
  );

  /**
   * Si calcAuto est coché, le montant de la taxe est calculé automatiquement depuis la masse salariale et le taux.
   */
  const rowsWithAuto = useMemo(
    () =>
      rows.map((row) => {
        if (!row.calcAuto || row.taux === 0) return row;
        const rate = row.taux / 100;
        return {
          ...row,
          montantN:  Math.round(masseSalarialeN  * rate * 100) / 100,
          montantN1: Math.round(masseSalarialeN1 * rate * 100) / 100,
          montantN2: Math.round(masseSalarialeN2 * rate * 100) / 100,
        };
      }),
    [rows, masseSalarialeN, masseSalarialeN1, masseSalarialeN2],
  );

  const handleAutoDateSolde = useCallback(
    (idx: number) => {
      if (!debutExercice) return;
      const { anneeDebut } = debutExercice;
      const pad = (y: number) => `${y}-05-01`;
      updateRow(idx, {
        dateN:  pad(anneeDebut + 1),
        dateN1: pad(anneeDebut + 2),
        dateN2: pad(anneeDebut + 3),
      });
    },
    [debutExercice, updateRow],
  );

  const invalidateControleStores = useReloadScenarioData();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesTaxesSalaires(dossierId, rowsWithAuto);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          setTaxesSalaires(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        markTaxesSalairesSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rowsWithAuto, setTaxesSalaires, markTaxesSalairesSaved, invalidateControleStores]);

  const renderRow = useCallback(
    (row: LigneTaxeSalaireRow & { id: string }, _isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      const computedRow = rowsWithAuto[idx] ?? row;
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
        >
          <DragHandleCell />
          <Td className="pl-2">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(idx, { actif: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Activer"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé…"
              onChange={(e) => updateRow(idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as HypotheseType })}
              aria-label="Hypothèse"
            >
              {HYPOTHESES_PERSONNEL.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center">
            <input
              type="checkbox"
              checked={row.calcAuto ?? false}
              onChange={(e) => updateRow(idx, { calcAuto: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Calcul auto"
            />
          </Td>
          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", row.calcAuto && "opacity-50 pointer-events-none")}
              value={row.taux === 0 ? "" : row.taux}
              placeholder="0"
              readOnly={!!row.calcAuto}
              onChange={(e) => updateRow(idx, { taux: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.dateN ?? ""}
              placeholder="aaaa-mm-jj"
              title="Date de paiement en N"
              onChange={(e) => updateRow(idx, { dateN: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", computedRow.calcAuto && "text-blue-600 dark:text-blue-400")}
              value={computedRow.montantN === 0 ? "" : computedRow.montantN}
              placeholder="0"
              readOnly={!!computedRow.calcAuto}
              onChange={(e) => updateRow(idx, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.dateN1 ?? ""}
              placeholder="aaaa-mm-jj"
              title="Date de paiement en N+1"
              onChange={(e) => updateRow(idx, { dateN1: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", computedRow.calcAuto && "text-blue-600 dark:text-blue-400")}
              value={computedRow.montantN1 === 0 ? "" : computedRow.montantN1}
              placeholder="0"
              readOnly={!!computedRow.calcAuto}
              onChange={(e) => updateRow(idx, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.dateN2 ?? ""}
              placeholder="aaaa-mm-jj"
              title="Date de paiement en N+2"
              onChange={(e) => updateRow(idx, { dateN2: e.target.value })}
            />
          </Td>
          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", computedRow.calcAuto && "text-blue-600 dark:text-blue-400")}
              value={computedRow.montantN2 === 0 ? "" : computedRow.montantN2}
              placeholder="0"
              readOnly={!!computedRow.calcAuto}
              onChange={(e) => updateRow(idx, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          <Td className="text-center px-1">
            <div className="flex items-center justify-center gap-0.5">
              {row.calcAuto && (
                <button
                  className="flex items-center justify-center h-6 w-6 rounded hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                  onClick={() => handleAutoDateSolde(idx)}
                  title="Remplir les dates de solde (mai N+1, N+2, N+3)"
                >
                  <Wand2 className="h-3 w-3" />
                </button>
              )}
              <button
                className="flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => duplicateRow(idx)}
                title="Dupliquer"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => removeRow(idx)}
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, rowsWithAuto, updateRow, duplicateRow, removeRow, handleAutoDateSolde],
  );

  const renderGroupSummaryCells = useCallback(
    (groupRows: LigneTaxeSalaireRow[]) => {
      const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif !== false);
      const totalN  = actifs.reduce((s, r) => s + r.montantN,  0);
      const totalN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
      const totalN2 = actifs.reduce((s, r) => s + r.montantN2, 0);
      return (
        <>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(totalN,0)}</td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(totalN1,0)}</td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(totalN2,0)}</td>
        </>
      );
    },
    [hypotheseActive],
  );

  const tfoot = rowsWithAuto.length > 0 ? (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={7} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0),0)}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0),0)}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0),0)}
        </td>
        <td />
      </tr>
    </tfoot>
  ) : undefined;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Taxes assises sur les salaires"
        description="Taxe d'apprentissage, contribution formation, etc."
        icon={<Percent className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      {(masseSalarialeN > 0 || masseSalarialeN1 > 0 || masseSalarialeN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Masse salariale brute (base de calcul auto)</span>
          {masseSalarialeN   > 0 && <span>N : <span className="tabular-nums font-medium">{formatNumber(masseSalarialeN,0)} €</span></span>}
          {masseSalarialeN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{formatNumber(masseSalarialeN1,0)} €</span></span>}
          {masseSalarialeN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{formatNumber(masseSalarialeN2,0)} €</span></span>}
        </div>
      )}
      <GroupedDndTable
        dnd={dnd}
        colSpan={COL_SPAN}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={GROUP_NAME_COL_SPAN}
        footer={tfoot}
        emptyMessage="Aucune ligne — cliquez sur « Ajouter » pour commencer."
      >
        <thead className="bg-muted/40 border-b">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Act.</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-16 text-center">Calc.</Th>
            <Th className="w-16 text-right">Taux %</Th>
            <Th className="w-24">Date N</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-24">Date N+1</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-24">Date N+2</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-20" />
          </tr>
        </thead>
      </GroupedDndTable>
    </section>
  );
}
