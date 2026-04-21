"use client";

/**
 * Tableau de saisie des taxes assises sur les salaires.
 * (Taxe d'apprentissage, contribution formation, etc.)
 * Inclut le calcul automatique : Masse salariale brute × Taux.
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Percent, Wand2, Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { HYPOTHESES_PERSONNEL, type LigneTaxeSalaireRow } from "@/lib/schemas/personnel";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesTaxesSalaires, fetchDossierDebutExercice } from "@/app/actions/personnel";
import { SectionHeader, Th, Td, cellInput, cellSelect, fmt } from "./personnel-form-shared";

/**
 * Tableau des taxes assises sur les salaires avec calcul automatique
 * (masse salariale × taux) et remplissage automatique des dates de paiement du solde.
 */
export function TableauTaxesSalaires({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneTaxeSalaireRow[];
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();
  const [debutExercice, setDebutExercice] = useState<{ anneeDebut: number; moisDebut: number } | null>(null);

  const rows = draft.taxesSalaires;
  const isDirty = draft.hasUnsavedTaxesSalaires;

  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setTaxesSalaires(dossierId, initialData);
    }
    fetchDossierDebutExercice(dossierId).then(setDebutExercice).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addTaxeSalaire(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeTaxeSalaire(dossierId, i), [store, dossierId]);
  const handleDuplicate = useCallback((i: number) => store.duplicateTaxeSalaire(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneTaxeSalaireRow>) => store.updateTaxeSalaire(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  /**
   * Remplit automatiquement les dates de paiement du solde annuel :
   * Le solde de la taxe d'apprentissage est dû en mai de l'année civile
   * suivant la clôture de l'exercice de référence.
   */
  const handleAutoDateSolde = useCallback(
    (i: number) => {
      if (!debutExercice) return;
      const { anneeDebut } = debutExercice;
      const pad = (y: number) => `${y}-05-01`;
      handleUpdate(i, {
        dateN:  pad(anneeDebut + 1),
        dateN1: pad(anneeDebut + 2),
        dateN2: pad(anneeDebut + 3),
      });
    },
    [debutExercice, handleUpdate],
  );

  // ── Masse salariale brute (somme des salariés actifs) ──────────────────────
  const masseSalarialeN = useMemo(
    () => filterByHypothese(draft.salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN ?? 0), 0),
    [draft.salaries, hypotheseActive],
  );
  const masseSalarialeN1 = useMemo(
    () => filterByHypothese(draft.salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN1 ?? 0), 0),
    [draft.salaries, hypotheseActive],
  );
  const masseSalarialeN2 = useMemo(
    () => filterByHypothese(draft.salaries, hypotheseActive).filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN2 ?? 0), 0),
    [draft.salaries, hypotheseActive],
  );

  // ── Calcul automatique : Taxe = Masse salariale × Taux ─────────────────────
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

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesTaxesSalaires(dossierId, rowsWithAuto);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          store.setTaxesSalaires(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        store.markTaxesSalairesSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rowsWithAuto, store, invalidateControleStores]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Taxes assises sur les salaires"
        description="Taxe d'apprentissage, contribution formation, etc."
        icon={<Percent className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />
      {(masseSalarialeN > 0 || masseSalarialeN1 > 0 || masseSalarialeN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Masse salariale brute (base de calcul auto)</span>
          {masseSalarialeN   > 0 && <span>N : <span className="tabular-nums font-medium">{fmt(masseSalarialeN)} €</span></span>}
          {masseSalarialeN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{fmt(masseSalarialeN1)} €</span></span>}
          {masseSalarialeN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{fmt(masseSalarialeN2)} €</span></span>}
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
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
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rowsWithAuto.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rowsWithAuto.map((row, i) => (
                <tr
                  key={row.id ?? `tax-${i}`}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
                >
                  <Td className="pl-2">
                    <input type="checkbox" checked={row.actif !== false} onChange={(e) => handleUpdate(i, { actif: e.target.checked })} className="h-3.5 w-3.5 accent-primary" aria-label="Activer" />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.libelle} placeholder="Libellé…" onChange={(e) => handleUpdate(i, { libelle: e.target.value })} />
                  </Td>
                  <Td>
                    <select className={cellSelect} value={row.hypothese} onChange={(e) => handleUpdate(i, { hypothese: e.target.value as HypotheseType })} aria-label="Hypothèse">
                      {HYPOTHESES_PERSONNEL.map((h) => <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>)}
                    </select>
                  </Td>
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.calcAuto}
                      onChange={(e) => handleUpdate(i, { calcAuto: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Calcul auto — Masse salariale × Taux"
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.taux === 0 ? "" : row.taux}
                      placeholder="0"
                      onChange={(e) => handleUpdate(i, { taux: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-0.5">
                      <input
                        className={cn(cellInput, "min-w-0")}
                        value={row.dateN ?? ""}
                        placeholder="aaaa-mm-jj"
                        title="Date de paiement en N (ex : solde annuel)"
                        onChange={(e) => handleUpdate(i, { dateN: e.target.value })}
                      />
                      {debutExercice && (
                        <button
                          type="button"
                          className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-muted-foreground/50 hover:text-purple-600 transition-colors"
                          title={`Remplir les 3 dates au 01/05 (solde annuel) : N→${debutExercice.anneeDebut + 1}, N+1→${debutExercice.anneeDebut + 2}, N+2→${debutExercice.anneeDebut + 3}`}
                          onClick={() => handleAutoDateSolde(i)}
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.dateN1 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+1" onChange={(e) => handleUpdate(i, { dateN1: e.target.value })} />
                  </Td>
                  <Td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN1 === 0 ? "" : row.montantN1}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.dateN2 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+2" onChange={(e) => handleUpdate(i, { dateN2: e.target.value })} />
                  </Td>
                  <Td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN2 === 0 ? "" : row.montantN2}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="text-center px-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        className="flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handleDuplicate(i)}
                        title="Dupliquer"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => handleRemove(i)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rowsWithAuto.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}
                </td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}
                </td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
