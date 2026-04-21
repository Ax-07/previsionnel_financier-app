"use client";

/**
 * Tableau de saisie des rémunérations du dirigeant (TNS ou assimilé salarié).
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, UserCog, CalendarDays, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { ModalDetailDirigeant } from "./modal-detail-dirigeant";
import { HYPOTHESES_PERSONNEL, EXONERATIONS_TNS, type LigneDirigeantRow } from "@/lib/schemas/personnel";
import { type HypotheseType } from "@/lib/schemas/hypothese";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesDirigeants } from "@/app/actions/personnel";
import {
  SectionHeader,
  Th,
  Td,
  TotauxRow,
  cellInput,
  cellSelect,
  applyEvolution,
  calcEvolution,
} from "./personnel-form-shared";

/**
 * Tableau inline de saisie de la rémunération du dirigeant avec projections N / N+1 / N+2,
 * options TNS (exonération, conjoint collaborateur) et modal de détail mensuel.
 */
export function TableauDirigeant({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  initialData?: LigneDirigeantRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  const rows = draft.dirigeants;
  const isDirty = draft.hasUnsavedDirigeants;

  // Hydratation initiale
  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setDirigeants(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addDirigeant(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeDirigeant(dossierId, i), [store, dossierId]);
  const handleDuplicate = useCallback((i: number) => store.duplicateDirigeant(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneDirigeantRow>) => store.updateDirigeant(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesDirigeants(dossierId, rows);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          const updated = rows.map((r, idx) => ({
            ...r,
            id: result.ids![idx] ?? r.id,
          }));
          store.setDirigeants(dossierId, updated);
        }
        store.markDirigeantsSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Rémunération du dirigeant"
        description="Rémunération TNS ou assimilé salarié avec projections et options"
        icon={<UserCog className="h-4 w-4" />}
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
              <Th className="w-28">Hypothèse</Th>
              <Th className="w-16 text-center">Détail</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
              <Th className="w-28">Exonération TNS</Th>
              <Th className="w-24 text-center">Conjoint</Th>
              <Th className="w-16 text-right">% Fixe</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? `dir-${i}`}
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
                      placeholder="Rémunération gérant…"
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
                      className="h-6 w-6"
                      onClick={() => setDetailIdx(i)}
                      aria-label="Détail mensuel"
                    >
                      <CalendarDays className="h-3 w-3" />
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

                  {/* Exonération TNS */}
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.exonerationTNS ?? ""}
                      onChange={(e) => handleUpdate(i, { exonerationTNS: e.target.value })}
                      aria-label="Exonération TNS"
                    >
                      {EXONERATIONS_TNS.map((ex) => (
                        <option key={ex.value} value={ex.value} className="bg-background text-foreground">
                          {ex.label}
                        </option>
                      ))}
                    </select>
                  </Td>

                  {/* Conjoint collaborateur */}
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.conjointCollaborateur}
                      onChange={(e) => handleUpdate(i, { conjointCollaborateur: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Conjoint collaborateur"
                    />
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
          {rows.length > 0 && <TotauxRow rows={rows} dossierId={dossierId} />}
        </table>
      </div>

      {detailIdx !== null && rows[detailIdx] && (
        <ModalDetailDirigeant
          key={`detail-dir-${detailIdx}-${rows[detailIdx].id ?? detailIdx}`}
          open
          row={rows[detailIdx]}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
          onClose={() => setDetailIdx(null)}
          onApply={(patch: Partial<LigneDirigeantRow>) => {
            handleUpdate(detailIdx, patch);
            setDetailIdx(null);
          }}
        />
      )}
    </section>
  );
}
