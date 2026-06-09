"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 2 — CESSIONS
// ─────────────────────────────────────────────────────────────────────────────

import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber, numVal } from "@/lib/format";
import { filterByHypothese, HYPOTHESE_TYPE_OPTIONS } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { LocalCession, useInvestissementStore } from "@/stores/investissement-store";
import { useCallback, useEffect, useTransition } from "react";
import { ActiveCheckbox, Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { saveCessions } from "@/app/actions/investissement";
import { toast } from "sonner";
import { CessionRow, NATURES_IMMOBILISATION, TAUX_TVA_OPTIONS } from "@/lib/schemas/investissement";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { DragHandleCell, SortableTableRow } from "@/components/ui/sortable-table-row";
import { calcCession } from "@/lib/calcul/cession";
import { cn } from "@/lib/utils";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";

function TotauxCessions({ rows, dossierId }: { rows: LocalCession[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalVente = actifs.reduce((s, r) => s + (r.prixVente ?? 0), 0);
  const totalAchat = actifs.reduce((s, r) => s + (r.prixAchat ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        {/* drag, #, actif, libellé, hypothèse, nature, date */}
        <td colSpan={7} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalVente)}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalAchat)}</td>
        {/* dejaAmortie, resteAAmortir, plusValue, pvLT, tauxTVA, actions */}
        <td colSpan={6} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryCessions({ rows, dossierId }: { rows: LocalCession[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const vente = actifs.reduce((s, r) => s + (r.prixVente ?? 0), 0);
  const achat = actifs.reduce((s, r) => s + (r.prixAchat ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80 border-r border-border">{formatNumber(vente)}</td>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80 border-r border-border">{formatNumber(achat)}</td>
      <td colSpan={5} />
    </>
  );
}

export function TableauCessions({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: CessionRow[];
  dateDebutExerciceN?: string;
}) {
  const {
    getDraft,
    setCessions,
    hydrateCessions,
    addCessionRow,
    updateCessionRow,
    removeCessionRow,
    duplicateCessionRow,
    addCessionGroup,
    addCessionToGroup,
    setCessionsRows,
    markCessionsSaved,
  } = useInvestissementStore();

  useEffect(() => {
    hydrateCessions(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.cessions;
  // Utilisé uniquement pour le DnD (marque les lignes dirty via setCessionsRows)
  const setRows = useCallback(
    (updater: (prev: LocalCession[]) => LocalCession[]) => {
      const d = useInvestissementStore.getState().getDraft(dossierId);
      setCessionsRows(dossierId, updater(d.cessions));
    },
    [dossierId, setCessionsRows]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedCessionIds?.length ?? 0) > 0;
  const invalidateControleStores = useReloadScenarioData();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const result = await saveCessions(
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
        setCessions(dossierId, (prev) =>
          prev.map((r) => ({
            ...r,
            id: r.id && idMap[r.id] ? idMap[r.id] : r.id,
          }))
        );
      }
      markCessionsSaved(dossierId);
      toast.success("Cessions enregistrées.");
      invalidateControleStores(dossierId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, dossierId, setCessions, markCessionsSaved]);

  const dnd = useGroupedDnd({ rows, setRows });

  const renderRow = useCallback((row: LocalCession & { id: string }, isLastInGroup = false) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const calc = calcCession(row);
    return (
      <SortableTableRow
        key={row.id}
        id={row.id!}
        className={cn(
          "border-t border-border border-l-4 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
          row.groupe && "border-l-primary/50 bg-primary/5 hover:bg-primary/10",
          row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
          row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
          !(row.actif ?? true) && "opacity-50"
        )}
      >
        <DragHandleCell />
        <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
        <Td className="text-center px-1">
          <ActiveCheckbox
            checked={row.actif ?? true}
            onChange={(v) => updateCessionRow(dossierId, row.id, { actif: v })}
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateCessionRow(dossierId, row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese}
            onChange={(e) => updateCessionRow(dossierId, row.id, { hypothese: e.target.value as CessionRow["hypothese"] })}
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
            onChange={(e) => updateCessionRow(dossierId, row.id, { nature: e.target.value as CessionRow["nature"] })}
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
            value={row.dateCession}
            onChange={(e) => updateCessionRow(dossierId, row.id, { dateCession: e.target.value })}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.prixVente}
            onChange={(v) => updateCessionRow(dossierId, row.id, { prixVente: v })}
            min={0}
            step={0.01}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.prixAchat}
            onChange={(v) => updateCessionRow(dossierId, row.id, { prixAchat: v })}
            min={0}
            step={0.01}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.dejaAmortie}
            onChange={(v) => updateCessionRow(dossierId, row.id, { dejaAmortie: v })}
            min={0}
            step={0.01}
          />
        </Td>
        <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20">
          {calc.resteAAmortir.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
        </Td>
        <Td className={cn(
          "text-right px-2 text-xs bg-muted/20",
          calc.plusValue >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {calc.plusValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
        </Td>
        <Td className="text-center text-xs bg-muted/20 text-muted-foreground">
          {calc.pvLT ? "Oui" : "—"}
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.tauxTVA}
            onChange={(e) => updateCessionRow(dossierId, row.id, { tauxTVA: numVal(e.target.value) })}
          >
            {TAUX_TVA_OPTIONS.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
            ))}
          </select>
        </Td>
        <Td className="text-center px-1">
          <RowActions
            onDuplicate={() => duplicateCessionRow(dossierId, row.id)}
            onDelete={() => removeCessionRow(dossierId, row.id)}
            isPending={isPending}
          />
        </Td>
      </SortableTableRow>
    );
  }, [rows, isPending, updateCessionRow, removeCessionRow, duplicateCessionRow, dossierId]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Cessions d'immobilisations"
        description="Ventes d'actifs — plus-value calculée automatiquement"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => addCessionRow(dossierId, dateDebutExerciceN)}
        onSave={saveAll}
        onAddGroup={() => addCessionGroup(dossierId, dateDebutExerciceN)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={15}
        onAddRowToGroupe={(g) => addCessionToGroup(dossierId, g, dateDebutExerciceN)}
        renderRow={renderRow}
        emptyMessage="Aucune cession. Cliquez sur « Ajouter » pour commencer."
        footer={<TotauxCessions rows={rows} dossierId={dossierId} />}
        groupNameColSpan={6}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryCessions rows={groupRows as LocalCession[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7"></Th>
            <Th className="w-8">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Hypothèse</Th>
            <Th className="w-28">Nature</Th>
            <Th className="w-32">Date cession</Th>
            <Th className="w-24">Prix vente</Th>
            <Th className="w-24">Prix achat</Th>
            <Th className="w-28">Déjà amortie</Th>
            <Th className="w-28 italic">Reste à amortir</Th>
            <Th className="w-24 italic">Plus-value</Th>
            <Th className="w-16 italic">PV à LT</Th>
            <Th className="w-20">Taux TVA</Th>
            <Th className="w-8"></Th>
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}