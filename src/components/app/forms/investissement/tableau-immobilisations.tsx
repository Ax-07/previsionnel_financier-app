"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 1 — IMMOBILISATIONS
// ─────────────────────────────────────────────────────────────────────────────

import { saveImmobilisations } from "@/app/actions/investissement";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { numVal, formatNumber } from "@/lib/format";
import { HYPOTHESE_TYPE_OPTIONS } from "@/lib/schemas/hypothese";
import { ImmobilisationRow, ImmobilisationWithPlan, MODES_AMORTISSEMENT, NATURES_IMMOBILISATION, TAUX_TVA_OPTIONS, TYPES_TVA } from "@/lib/schemas/investissement";
import { cn } from "@/lib/utils";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { useInvestissementStore, LocalImmo } from "@/stores/investissement-store";
import { useEffect, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { filterByHypothese } from "@/lib/schemas/hypothese";

function TotauxImmos({ rows, dossierId }: { rows: LocalImmo[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montantHT ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr className="w-full">
        {/* drag, #, actif, libellé, hypothèse, nature, date */}
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total Montant HT (actifs)
        </td>
        <td className="px-2 py-1.5 pr-4.5 text-[13px] font-semibold text-right tabular-nums">
          {formatNumber(total)}
        </td>
        {/* amortissement, différé, durée, tauxTVA, typeTva, actions */}
        <td colSpan={6} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryImmos({ rows, dossierId }: { rows: LocalImmo[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montantHT ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80">{formatNumber(total)}</td>
      <td colSpan={4} />
    </>
  );
}

interface TableauImmobilisationsProps {
  dossierId: string;
  initialData: ImmobilisationWithPlan[];
  dateDebutExerciceN?: string;
}

export function TableauImmobilisations({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: TableauImmobilisationsProps) {
  const {
    getDraft,
    setImmos,
    hydrateImmos,
    addImmoRow,
    updateImmoRow,
    removeImmoRow,
    duplicateImmoRow,
    addImmoGroup,
    addImmoToGroup,
    setImmosRows,
    markImmosSaved,
  } = useInvestissementStore();

  useEffect(() => {
    hydrateImmos(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.immos;
  // Utilisé uniquement pour le DnD (marque les lignes dirty via setImmosRows)
  const setRows = useCallback(
    (updater: (prev: LocalImmo[]) => LocalImmo[]) => {
      const d = useInvestissementStore.getState().getDraft(dossierId);
      setImmosRows(dossierId, updater(d.immos));
    },
    [dossierId, setImmosRows]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedImmoIds?.length ?? 0) > 0;
  const invalidateControleStores = useReloadScenarioData();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const result = await saveImmobilisations(
        dossierId,
        rows.map((r) => ({
          ...r,
          id: r.id?.startsWith("__new__") ? undefined : r.id,
        }))
      );
      if (!result.success) {
        toast.error(`Erreur : ${result.error}`);
        return;
      }
      if (result.idMap && Object.keys(result.idMap).length > 0) {
        const idMap = result.idMap;
        setImmos(dossierId, (prev) =>
          prev.map((r) => ({
            ...r,
            id: r.id && idMap[r.id] ? idMap[r.id] : r.id,
          }))
        );
      }
      markImmosSaved(dossierId);
      toast.success("Immobilisations enregistrées.");
      invalidateControleStores(dossierId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, dossierId, setImmos, markImmosSaved]);

  const dnd = useGroupedDnd({ rows, setRows });

  const renderRow = useCallback((row: LocalImmo & { id: string }, isLastInGroup = false) => {
    return (
      <SortableTableRow
        key={row.id}
        id={row.id!}
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
            checked={row.actif ?? true}
            onChange={(e) => updateImmoRow(dossierId, row.id, { actif: e.target.checked })}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
            title={(row.actif ?? true) ? "Désactiver" : "Activer"}
          />
        </Td>
        <Td>
          <div className="flex items-center gap-1">
            {row.groupe && (
              <span className="text-muted-foreground/50 text-xs shrink-0 select-none ml-2">
                {isLastInGroup ? "└──" : "├──"}
              </span>
            )}
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateImmoRow(dossierId, row.id, { libelle: e.target.value })}
            />
          </div>
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese}
            onChange={(e) => updateImmoRow(dossierId, row.id, { hypothese: e.target.value as ImmobilisationRow["hypothese"] })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
            ))}
          </select>
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.nature}
            onChange={(e) => updateImmoRow(dossierId, row.id, { nature: e.target.value as ImmobilisationRow["nature"] })}
          >
            {NATURES_IMMOBILISATION.map((n) => (
              <option key={n.value} value={n.value} className="bg-background text-foreground">{n.label}</option>
            ))}
          </select>
        </Td>
        <Td>
          <input
            type="date"
            className={cellInput}
            value={row.dateAcquisition}
            onChange={(e) => updateImmoRow(dossierId, row.id, { dateAcquisition: e.target.value })}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.montantHT}
            onChange={(v) => updateImmoRow(dossierId, row.id, { montantHT: v })}
            min={0}
            step={0.01}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.modeAmortissement}
            onChange={(e) => {
              const mode = e.target.value as ImmobilisationRow["modeAmortissement"];
              updateImmoRow(dossierId, row.id, {
                modeAmortissement: mode,
                ...(mode === "AUCUN" ? { dureeAmortissement: 0, differe: 0 } : {}),
              });
            }}
          >
            {MODES_AMORTISSEMENT.map((m) => (
              <option key={m.value} value={m.value} className="bg-background text-foreground">{m.label}</option>
            ))}
          </select>
        </Td>
        <Td>
          <NumericCellInput
            value={row.differe}
            onChange={(v) => updateImmoRow(dossierId, row.id, { differe: v })}
            min={0}
            step={1}
            disabled={row.modeAmortissement === "AUCUN"}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.dureeAmortissement}
            onChange={(v) => updateImmoRow(dossierId, row.id, { dureeAmortissement: v })}
            min={1}
            step={1}
            disabled={row.modeAmortissement === "AUCUN"}
            placeholder="5"
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.tauxTVA}
            onChange={(e) => updateImmoRow(dossierId, row.id, { tauxTVA: numVal(e.target.value) })}
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
            onChange={(e) => updateImmoRow(dossierId, row.id, { typeTva: e.target.value as ImmobilisationRow["typeTva"] })}
          >
            {TYPES_TVA.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
            ))}
          </select>
        </Td>
        <Td className="text-center px-1">
          <RowActions
            onDuplicate={() => duplicateImmoRow(dossierId, row.id)}
            onDelete={() => removeImmoRow(dossierId, row.id)}
            isPending={isPending}
            groupe={row.groupe ?? null}
          />
        </Td>
      </SortableTableRow>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, isPending, updateImmoRow, removeImmoRow, duplicateImmoRow, dossierId, dateDebutExerciceN]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Immobilisations"
        description="Actifs corporels, incorporels et financiers"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => addImmoRow(dossierId, dateDebutExerciceN)}
        onSave={saveAll}
        onAddGroup={() => addImmoGroup(dossierId, dateDebutExerciceN)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={13}
        onAddRowToGroupe={(g) => addImmoToGroup(dossierId, g, dateDebutExerciceN)}
        renderRow={renderRow}
        emptyMessage="Aucune immobilisation. Cliquez sur « Ajouter » pour commencer."
        footer={<TotauxImmos rows={rows} dossierId={dossierId} />}
        groupNameColSpan={5}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryImmos rows={groupRows as LocalImmo[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="w-28">Hypothèse</Th>
            <Th className="w-28">Nature</Th>
            <Th className="w-32">Date acquisition</Th>
            <Th className="w-24">Montant HT</Th>
            <Th className="w-28">Amortissement</Th>
            <Th className="w-16">Différé</Th>
            <Th className="w-16">Durée</Th>
            <Th className="w-20">Taux TVA</Th>
            <Th className="w-32">Type TVA</Th>
            <Th className="w-8"></Th>
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}