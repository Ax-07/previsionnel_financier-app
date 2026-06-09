"use client";

/**
 * Tableau de saisie des rémunérations des salariés avec DnD + Groupes.
 * Inclut le simulateur de paie (drawer) et la modal de détail mensuel.
 *
 * Structure : 14 colonnes
 * DragHandle | Act. | Libellé | Hyp. | Détail | N | %Évol | N+1 | %Évol | N+2 | CotSal | CotPat | %Fixe | Actions
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
import { useHypotheseStore } from "@/stores/hypothese-store";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesSalaries } from "@/app/actions/personnel";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import {
  TotauxSalariesRow,
  applyEvolution,
  calcEvolution,
} from "./personnel-form-shared";
import { formatNumber } from "@/lib/format";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { Td, Th } from "../helpers/table-helpers";
import { SectionHeader } from "../helpers/section-header";

const tempId = () => `__new__${crypto.randomUUID()}`;

/** Ligne vide avec les valeurs par défaut. */
function emptyRow(groupe?: string): LigneSalarieRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    tauxCotSal: 22,
    tauxCotPat: 42,
    tauxFixe: 100,
    hasCommission: false,
    hasPrime: false,
    cotisationConges: false,
    groupe: groupe ?? null,
  };
}

const EMPTY_SALARIES: LigneSalarieRow[] = [];
const EMPTY_INJECTED_IDS: string[] = [];

const COL_SPAN = 14;
const GROUP_NAME_COL_SPAN = 4; // DragHandle interne GroupHeader + Act. + Libellé + Hyp.

/**
 * Tableau inline de saisie des salariés avec projections N / N+1 / N+2,
 * taux de cotisations, simulateur de paie et modal de détail mensuel.
 * Supporte le drag-and-drop et les groupes.
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
  const rows = usePersonnelStore(s => s.drafts[dossierId]?.salaries ?? EMPTY_SALARIES);
  const isDirty = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedSalaries ?? false);
  const injectedIds = usePersonnelStore(s => s.drafts[dossierId]?.simulateurInjectedIds ?? EMPTY_INJECTED_IDS);
  const setSalaries = usePersonnelStore(s => s.setSalaries);
  const setSalariesRows = usePersonnelStore(s => s.setSalariesRows);
  const markSalariesSaved = usePersonnelStore(s => s.markSalariesSaved);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  // Drawer simulateur de paie
  const [drawerConfig, setDrawerConfig] = useState<{
    salarieId: string;
    salarieIdx: number;
    libelle: string;
    brutMensuel: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debutExerciceDate = dateDebutExerciceN ? new Date(dateDebutExerciceN) : null;

  // ── Hydratation initiale ─────────────────────────────────────────────────
  useEffect(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedSalaries) {
      const serverIds = new Set(initialData?.map((r) => r.id).filter(Boolean));
      const ahead = cur.salaries.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setSalaries(dossierId, initialData ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // ── Bridge setRows → store (dirty=true) ──────────────────────────────────
  const setRows = useCallback(
    (updater: (prev: LigneSalarieRow[]) => LigneSalarieRow[]) => {
      const cur = usePersonnelStore.getState().getDraft(dossierId);
      setSalariesRows(dossierId, updater(cur.salaries));
    },
    [dossierId, setSalariesRows],
  );

  // ── DnD ──────────────────────────────────────────────────────────────────
  const dnd = useGroupedDnd({ rows, setRows });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptyRow()]),
    [setRows],
  );

  const addGroupe = useCallback(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const existing = new Set(cur.salaries.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyRow(`Groupe ${n}`)]);
  }, [dossierId, setRows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyRow(groupe)]),
    [setRows],
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<LigneSalarieRow>) =>
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

  const invalidateControleStores = useInvalidateControleStores();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = usePersonnelStore.getState().getDraft(dossierId);
        const result = await saveLignesSalaries(dossierId, d.salaries);
        if (result.success) {
          toast.success(result.message);
          if ("ids" in result && result.ids) {
            setSalaries(
              dossierId,
              d.salaries.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })),
            );
          }
          markSalariesSaved(dossierId);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, setSalaries, markSalariesSaved, invalidateControleStores]);

  // ── Récapitulatif de groupe ───────────────────────────────────────────────
  const renderGroupSummaryCells = useCallback(
    (groupRows: LigneSalarieRow[]) => {
      const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif !== false);
      const tN  = actifs.reduce((s, r) => s + r.montantN,  0);
      const tN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
      const tN2 = actifs.reduce((s, r) => s + r.montantN2, 0);

      return (
        <>
          {/* Détail col (5) */}
          <td />
          {/* N (6) */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN, 0)}</td>
          {/* %Évol (7) */}
          <td />
          {/* N+1 (8) */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN1, 0)}</td>
          {/* %Évol (9) */}
          <td />
          {/* N+2 (10) */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN2, 0)}</td>
          {/* CotSal + CotPat + %Fixe (11-13) */}
          <td colSpan={3} />
        </>
      );
    },
    [hypotheseActive],
  );

  // ── Rendu d'une ligne ────────────────────────────────────────────────────
  const renderRow = useCallback(
    (row: LigneSalarieRow & { id: string }, isLastInGroup = false) => {
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
          {/* DragHandle */}
          <DragHandleCell />

          {/* Actif */}
          <Td className="pl-1">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(i, { actif: e.target.checked })}
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
              onChange={(e) => updateRow(i, { libelle: e.target.value })}
            />
          </Td>

          {/* Hypothèse */}
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
                updateRow(i, { montantN, montantN1, montantN2 });
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
                updateRow(i, { evolutionN1, montantN1, montantN2 });
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
                updateRow(i, { montantN1, evolutionN1, montantN2 });
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
                updateRow(i, { evolutionN2, montantN2 });
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
                updateRow(i, { montantN2, evolutionN2 });
              }}
            />
          </Td>

          {/* Cot. Sal. % */}
          <Td>
            <input
              type="number"
              step="any"
              className={cn(cellInput, "text-right")}
              value={row.tauxCotSal === 0 ? "" : row.tauxCotSal}
              placeholder="0"
              onChange={(e) => updateRow(i, { tauxCotSal: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
            />
          </Td>

          {/* Cot. Pat. % + bouton simulateur */}
          <Td>
            <div className="flex items-center gap-0.5">
              <input
                type="number"
                step="any"
                className={cn(cellInput, "text-right flex-1 min-w-0")}
                value={row.tauxCotPat === 0 ? "" : row.tauxCotPat}
                placeholder="0"
                onChange={(e) => updateRow(i, { tauxCotPat: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
              />
              <button
                type="button"
                title={`Simuler les charges pour « ${row.libelle || "ce salarié"} »`}
                onClick={() => {
                  const brutMensuel = row.montantN > 0 ? Math.round((row.montantN / 12) * 100) / 100 : 2000;
                  setDrawerConfig({ salarieId: row.id, salarieIdx: i, libelle: row.libelle, brutMensuel });
                  setDrawerOpen(true);
                }}
                className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Simuler les charges"
              >
                <Calculator className="h-3 w-3" />
              </button>
              {injectedIds.includes(row.id) && (
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
              onChange={(e) => updateRow(i, { tauxFixe: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
            />
          </Td>

          {/* Dupliquer / Supprimer */}
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
    [rows, updateRow, removeRow, duplicateRow, injectedIds],
  );

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Rémunération des salariés"
          description="Saisie du brut annuel par type de salarié avec projections N / N+1 / N+2"
          icon={<Users className="h-4 w-4" />}
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
          emptyMessage="Aucun salarié — cliquez sur « Ajouter » pour commencer."
          footer={rows.length > 0 ? <TotauxSalariesRow rows={rows} dossierId={dossierId} /> : undefined}
        >
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-6" />
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
        </GroupedDndTable>
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
            updateRow(detailIdx, patch);
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

