"use client";

/**
 * Tableau de saisie des rémunérations du dirigeant (TNS ou assimilé salarié) avec DnD + Groupes.
 *
 * Structure : 14 colonnes
 * DragHandle | Act. | Libellé | Hyp. | Détail | N | %Évol | N+1 | %Évol | N+2 | Exo. TNS | Conjoint | % Fixe | Actions
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, UserCog, CalendarDays, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { ModalDetailDirigeant } from "./modal-detail-dirigeant";
import { HYPOTHESES_PERSONNEL, EXONERATIONS_TNS, type LigneDirigeantRow } from "@/lib/schemas/personnel";
import { filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { usePersonnelStore } from "@/stores/personnel-store";
import { saveLignesDirigeants } from "@/app/actions/personnel";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { SectionHeader } from "./section-header";
import {
  Th,
  Td,
  TotauxRow,
  cellInput,
  cellSelect,
  applyEvolution,
  calcEvolution,
} from "./personnel-form-shared";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber } from "@/lib/format";

const tempId = () => `__new__${crypto.randomUUID()}`;

function emptyRow(groupe?: string): LigneDirigeantRow {
  return {
    id: tempId(),
    libelle: "Rémunération gérant",
    actif: true,
    hypothese: "COMMUNE",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    exonerationTNS: "",
    conjointCollaborateur: false,
    tauxFixe: 100,
    groupe: groupe ?? null,
  };
}

const EMPTY_DIRIGEANTS: LigneDirigeantRow[] = [];

const COL_SPAN = 14;
const GROUP_NAME_COL_SPAN = 4;

/**
 * Tableau inline de saisie de la rémunération du dirigeant avec projections N / N+1 / N+2,
 * options TNS (exonération, conjoint collaborateur) et modal de détail mensuel.
 * Supporte le drag-and-drop et les groupes.
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
  const rows = usePersonnelStore(s => s.drafts[dossierId]?.dirigeants ?? EMPTY_DIRIGEANTS);
  const isDirty = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedDirigeants ?? false);
  const setDirigeants = usePersonnelStore(s => s.setDirigeants);
  const setDirigeantsRows = usePersonnelStore(s => s.setDirigeantsRows);
  const markDirigeantsSaved = usePersonnelStore(s => s.markDirigeantsSaved);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  // ── Hydratation initiale ─────────────────────────────────────────────────
  useEffect(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedDirigeants) {
      const serverIds = new Set(initialData?.map((r) => r.id).filter(Boolean));
      const ahead = cur.dirigeants.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setDirigeants(dossierId, initialData ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // ── Bridge setRows → store (dirty=true) ──────────────────────────────────
  const setRows = useCallback(
    (updater: (prev: LigneDirigeantRow[]) => LigneDirigeantRow[]) => {
      const cur = usePersonnelStore.getState().getDraft(dossierId);
      setDirigeantsRows(dossierId, updater(cur.dirigeants));
    },
    [dossierId, setDirigeantsRows],
  );

  // ── DnD ──────────────────────────────────────────────────────────────────
  const dnd = useGroupedDnd({ rows, setRows });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addRow = useCallback(() => setRows((prev) => [...prev, emptyRow()]), [setRows]);

  const addGroupe = useCallback(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const existing = new Set(cur.dirigeants.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyRow(`Groupe ${n}`)]);
  }, [dossierId, setRows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyRow(groupe)]),
    [setRows],
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<LigneDirigeantRow>) =>
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

  const invalidateControleStores = useReloadScenarioData();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = usePersonnelStore.getState().getDraft(dossierId);
        const result = await saveLignesDirigeants(dossierId, d.dirigeants);
        if (result.success) {
          toast.success(result.message);
          if ("ids" in result && result.ids) {
            setDirigeants(
              dossierId,
              d.dirigeants.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })),
            );
          }
          markDirigeantsSaved(dossierId);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, setDirigeants, markDirigeantsSaved, invalidateControleStores]);

  // ── Récapitulatif de groupe ───────────────────────────────────────────────
  const renderGroupSummaryCells = useCallback(
    (groupRows: LigneDirigeantRow[]) => {
      const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif !== false);
      const tN  = actifs.reduce((s, r) => s + r.montantN,  0);
      const tN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
      const tN2 = actifs.reduce((s, r) => s + r.montantN2, 0);
      return (
        <>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN, 0)}</td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN1, 0)}</td>
          <td />
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN2, 0)}</td>
          <td colSpan={3} />
        </>
      );
    },
    [hypotheseActive],
  );

  // ── Rendu d'une ligne ────────────────────────────────────────────────────
  const renderRow = useCallback(
    (row: LigneDirigeantRow & { id: string }, isLastInGroup = false) => {
      const i = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-b last:border-0 hover:bg-muted/20 transition-colors",
            row.groupe && "border-l-2 border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            row.actif === false && "opacity-50",
          )}
        >
          <DragHandleCell />

          <Td className="pl-1">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(i, { actif: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Activer"
            />
          </Td>

          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Rémunération gérant…"
              onChange={(e) => updateRow(i, { libelle: e.target.value })}
            />
          </Td>

          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => updateRow(i, { hypothese: e.target.value as HypotheseType })}
              aria-label="Hypothèse"
            >
              {HYPOTHESES_PERSONNEL.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">
                  {h.label}
                </option>
              ))}
            </select>
          </Td>

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
                updateRow(i, { montantN, montantN1, montantN2 });
              }}
            />
          </Td>

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
                updateRow(i, { evolutionN1, montantN1, montantN2 });
              }}
            />
          </Td>

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
                updateRow(i, { montantN1, evolutionN1, montantN2 });
              }}
            />
          </Td>

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
                updateRow(i, { evolutionN2, montantN2 });
              }}
            />
          </Td>

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
                updateRow(i, { montantN2, evolutionN2 });
              }}
            />
          </Td>

          <Td>
            <select
              className={cellSelect}
              value={row.exonerationTNS ?? ""}
              onChange={(e) => updateRow(i, { exonerationTNS: e.target.value })}
              aria-label="Exonération TNS"
            >
              {EXONERATIONS_TNS.map((ex) => (
                <option key={ex.value} value={ex.value} className="bg-background text-foreground">
                  {ex.label}
                </option>
              ))}
            </select>
          </Td>

          <Td className="text-center">
            <input
              type="checkbox"
              checked={row.conjointCollaborateur}
              onChange={(e) => updateRow(i, { conjointCollaborateur: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Conjoint collaborateur"
            />
          </Td>

          <Td>
            <input
              type="number"
              step="any"
              className={cn(cellInput, "text-right")}
              value={row.tauxFixe === 0 ? "" : row.tauxFixe}
              placeholder="0"
              onChange={(e) => updateRow(i, { tauxFixe: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
            />
          </Td>

          <Td className="text-center px-1">
            <div className="flex items-center justify-center gap-0.5">
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => duplicateRow(i)}
                title="Dupliquer"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => removeRow(i)}
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, updateRow, removeRow, duplicateRow],
  );

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Rémunération du dirigeant"
          description="Rémunération TNS ou assimilé salarié avec projections et options"
          icon={<UserCog className="h-4 w-4" />}
          isDirty={isDirty}
          isSaving={isPending}
          onAdd={addRow}
          onSave={saveAll}
          onAddGroup={addGroupe}
        />

        <GroupedDndTable
          dnd={dnd}
          colSpan={COL_SPAN}
          groupNameColSpan={GROUP_NAME_COL_SPAN}
          renderRow={renderRow}
          renderGroupSummaryCells={renderGroupSummaryCells}
          onAddRowToGroupe={addRowToGroupe}
          emptyMessage="Aucun dirigeant — cliquez sur « Ajouter » pour commencer."
          footer={rows.length > 0 ? <TotauxRow rows={rows} dossierId={dossierId} colSpanBefore={5} /> : undefined}
        >
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-6" />
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
        </GroupedDndTable>
      </section>

      {detailIdx !== null && rows[detailIdx] && (
        <ModalDetailDirigeant
          key={`detail-dir-${detailIdx}-${rows[detailIdx].id ?? detailIdx}`}
          open
          row={rows[detailIdx]}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
          onClose={() => setDetailIdx(null)}
          onApply={(patch: Partial<LigneDirigeantRow>) => {
            updateRow(detailIdx, patch);
            setDetailIdx(null);
          }}
        />
      )}
    </>
  );
}
