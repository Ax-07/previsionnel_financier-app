"use client";

/**
 * Tableau de saisie des rémunérations des salariés.
 * Inclut le simulateur de paie (drawer) pour calculer les taux de cotisations.
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { SimulateurDrawer } from "@/components/app/forms/personnel/simulateur-drawer";
import { Trash2, Users, FileText, Calculator, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { ModalDetailSalarie } from "./modal-detail-salarie";
import { HYPOTHESES_PERSONNEL, type LigneSalarieRow } from "@/lib/schemas/personnel";
import { filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesSalaries } from "@/app/actions/personnel";
import {
  SectionHeader,
  Th,
  Td,
  TotauxSalariesRow,
  cellInput,
  cellSelect,
  applyEvolution,
  calcEvolution,
} from "./personnel-form-shared";

/**
 * Tableau inline de saisie des salariés avec projections N / N+1 / N+2,
 * taux de cotisations, simulateur de paie et modal de détail mensuel.
 */
export function TableauSalaries({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  initialData?: LigneSalarieRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  /**
   * Configuration du drawer — conservée même quand le drawer est fermé pour
   * éviter l'unmount du composant et préserver les résultats de simulation.
   */
  const [drawerConfig, setDrawerConfig] = useState<{
    salarieId: string;
    salarieIdx: number;
    libelle: string;
    brutMensuel: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Conversion de la prop dateDebutExerciceN (string ISO) en Date pour le drawer */
  const debutExerciceDate = dateDebutExerciceN ? new Date(dateDebutExerciceN) : null;

  const rows = draft.salaries;
  const isDirty = draft.hasUnsavedSalaries;
  const injectedIds = draft.simulateurInjectedIds ?? [];

  // Hydratation initiale
  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setSalaries(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addSalarie(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeSalarie(dossierId, i), [store, dossierId]);
  const handleDuplicate = useCallback((i: number) => store.duplicateSalarie(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneSalarieRow>) => store.updateSalarie(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesSalaries(dossierId, rows);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          const updated = rows.map((r, idx) => ({
            ...r,
            id: result.ids![idx] ?? r.id,
          }));
          store.setSalaries(dossierId, updated);
        }
        store.markSalariesSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Rémunération des salariés"
          description="Saisie du brut annuel par type de salarié avec projections N / N+1 / N+2"
          icon={<Users className="h-4 w-4" />}
          isDirty={isDirty}
          isSaving={isPending}
          onAdd={handleAdd}
          onSave={handleSave}
        />

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <Th className="w-8">Act.</Th>
                <Th className="min-w-40">Libellé</Th>
                <Th className="w-24">Hypothèse</Th>
                <Th className="w-16 text-center">Détail</Th>
                <Th className="w-28 text-right">N (€)</Th>
                <Th className="w-20 text-right">% Évol.</Th>
                <Th className="w-28 text-right">N+1 (€)</Th>
                <Th className="w-20 text-right">% Évol.</Th>
                <Th className="w-28 text-right">N+2 (€)</Th>
                <Th className="w-20 text-right">Cot. Sal. %</Th>
                <Th className="w-20 text-right">Cot. Pat. %</Th>
                <Th className="w-16 text-right">% Fixe</Th>
                <Th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-6 text-center text-xs text-muted-foreground">
                    Aucune ligne — cliquez sur « Ajouter » pour commencer.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id ?? `row-${i}`}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/20 transition-colors",
                      row.actif === false && "opacity-50",
                    )}
                  >
                    {/* Actif */}
                    <Td className="pl-2">
                      <input
                        type="checkbox"
                        checked={row.actif !== false}
                        onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                        className="h-3.5 w-3.5 accent-primary"
                        aria-label="Activer"
                      />
                    </Td>

                    {/* Libellé */}
                    <Td>
                      <input
                        className={cellInput}
                        value={row.libelle}
                        placeholder="Saisir un libellé…"
                        onChange={(e) => handleUpdate(i, { libelle: e.target.value })}
                      />
                    </Td>

                    {/* Hypothèse */}
                    <Td>
                      <select
                        className={cellSelect}
                        value={row.hypothese}
                        onChange={(e) => handleUpdate(i, { hypothese: e.target.value as HypotheseType })}
                        aria-label="Hypothèse"
                      >
                        {HYPOTHESES_PERSONNEL.map((h) => (
                          <option key={h.value} value={h.value} className="bg-background text-foreground">
                            {h.label}
                          </option>
                        ))}
                      </select>
                    </Td>

                    {/* Détail */}
                    <Td className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setDetailIdx(i)}
                        aria-label="Ouvrir le détail"
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                    </Td>

                    {/* N */}
                    <Td>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(cellInput, "text-right")}
                        value={row.montantN === 0 ? "" : row.montantN}
                        placeholder="0"
                        onChange={(e) => {
                          const montantN = numVal(e.target.value);
                          const montantN1 = applyEvolution(montantN, row.evolutionN1);
                          const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                          handleUpdate(i, { montantN, montantN1, montantN2 });
                        }}
                      />
                    </Td>

                    {/* % Évol N→N+1 */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                        placeholder="0"
                        onChange={(e) => {
                          const evolutionN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                          const montantN1 = applyEvolution(row.montantN, evolutionN1);
                          const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                          handleUpdate(i, { evolutionN1, montantN1, montantN2 });
                        }}
                      />
                    </Td>

                    {/* N+1 */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.montantN1 === 0 ? "" : row.montantN1}
                        placeholder="0"
                        onChange={(e) => {
                          const montantN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                          const evolutionN1 = calcEvolution(row.montantN, montantN1);
                          const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                          handleUpdate(i, { montantN1, evolutionN1, montantN2 });
                        }}
                      />
                    </Td>

                    {/* % Évol N+1→N+2 */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                        placeholder="0"
                        onChange={(e) => {
                          const evolutionN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                          const montantN2 = applyEvolution(row.montantN1, evolutionN2);
                          handleUpdate(i, { evolutionN2, montantN2 });
                        }}
                      />
                    </Td>

                    {/* N+2 */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.montantN2 === 0 ? "" : row.montantN2}
                        placeholder="0"
                        onChange={(e) => {
                          const montantN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                          const evolutionN2 = calcEvolution(row.montantN1, montantN2);
                          handleUpdate(i, { montantN2, evolutionN2 });
                        }}
                      />
                    </Td>

                    {/* Taux cotisations salariales */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.tauxCotSal === 0 ? "" : row.tauxCotSal}
                        placeholder="0"
                        onChange={(e) => handleUpdate(i, { tauxCotSal: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                      />
                    </Td>

                    {/* Taux cotisations patronales + bouton simulateur */}
                    <Td>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          step="any"
                          className={cn(cellInput, "text-right flex-1 min-w-0")}
                          value={row.tauxCotPat === 0 ? "" : row.tauxCotPat}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { tauxCotPat: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                        />
                        <button
                          type="button"
                          title={`Simuler les charges pour « ${row.libelle || "ce salarié"} »`}
                          onClick={() => {
                            const brutMensuel = row.montantN > 0 ? Math.round((row.montantN / 12) * 100) / 100 : 2000;
                            setDrawerConfig({
                              salarieId: row.id ?? "",
                              salarieIdx: i,
                              libelle: row.libelle,
                              brutMensuel,
                            });
                            setDrawerOpen(true);
                          }}
                          className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Simuler les charges"
                        >
                          <Calculator className="h-3 w-3" />
                        </button>
                        {row.id && injectedIds.includes(row.id) && (
                          <span title="Taux calculé par le simulateur" className="text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* % Fixe */}
                    <Td>
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right")}
                        value={row.tauxFixe === 0 ? "" : row.tauxFixe}
                        placeholder="0"
                        onChange={(e) => handleUpdate(i, { tauxFixe: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                      />
                    </Td>

                    {/* Dupliquer / Supprimer */}
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
            {rows.length > 0 && <TotauxSalariesRow rows={rows} dossierId={dossierId} />}
          </table>
        </div>
      </section>

      {/* Modal Détail Salarié */}
      {detailIdx !== null && rows[detailIdx] && (
        <ModalDetailSalarie
          key={`detail-${detailIdx}-${rows[detailIdx].id ?? detailIdx}`}
          open
          row={rows[detailIdx]}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
          onClose={() => setDetailIdx(null)}
          onApply={(patch) => {
            handleUpdate(detailIdx!, patch);
            setDetailIdx(null);
          }}
        />
      )}

      {/* Simulateur de paie (drawer inline) — toujours monté pour préserver l'état */}
      {drawerConfig !== null && (
        <SimulateurDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          dossierId={dossierId}
          salarieId={drawerConfig.salarieId}
          salarieIdx={drawerConfig.salarieIdx}
          libelle={drawerConfig.libelle}
          brutMensuel={drawerConfig.brutMensuel}
          debutExercice={debutExerciceDate}
          onInjected={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}

// Export du filtre pour usage dans d'autres composants du même dossier
export { filterByHypothese };
