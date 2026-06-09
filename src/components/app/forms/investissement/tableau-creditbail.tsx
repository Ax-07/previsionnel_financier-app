// ── Lignes de totaux ──────────────────────────────────────────────────────────

"use client";

import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { CreditBailRow, PERIODICITES, TAUX_TVA_OPTIONS } from "@/lib/schemas/investissement";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { LocalCredit, useInvestissementStore } from "@/stores/investissement-store";
import { ActiveCheckbox, Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { saveCreditBails } from "@/app/actions/investissement";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { formatNumber, numVal } from "@/lib/format";
import { filterByHypothese, HYPOTHESE_TYPE_OPTIONS } from "@/lib/schemas/hypothese";
import { cn } from "@/lib/utils";
import { useEffect, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";



// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 3 — CRÉDIT-BAIL
// ─────────────────────────────────────────────────────────────────────────────

function TotauxCreditBail({ rows, dossierId }: { rows: LocalCredit[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalMontant = actifs.reduce((s, r) => s + (r.montantHT ?? 0), 0);
  const totalLoyer = actifs.reduce((s, r) => s + (r.loyerHT ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        {/* drag, #, actif, libellé, hypothèse, date */}
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalMontant)}</td>
        {/* taux, durée, périodicité, dateEcheance, valeurResiduelle, premierLoyer */}
        <td colSpan={6} />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalLoyer)}</td>
        {/* tauxTVA, actions */}
        <td colSpan={2} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryCreditBail({ rows, dossierId }: { rows: LocalCredit[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const montant = actifs.reduce((s, r) => s + (r.montantHT ?? 0), 0);
  const loyer = actifs.reduce((s, r) => s + (r.loyerHT ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80 border-r border-border">{formatNumber(montant)}</td>
      <td colSpan={6} />
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80 border-r border-border">{formatNumber(loyer)}</td>
      <td colSpan={1} />
    </>
  );
}

export function TableauCreditBail({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: CreditBailRow[];
  dateDebutExerciceN?: string;
}) {
  const {
    getDraft,
    setCredits,
    hydrateCredits,
    addCreditRow,
    updateCreditRow,
    removeCreditRow,
    duplicateCreditRow,
    addCreditGroup,
    addCreditToGroup,
    setCreditsRows,
    markCreditsSaved,
  } = useInvestissementStore();

  useEffect(() => {
    hydrateCredits(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const rows = draft.credits;
  // Utilisé uniquement pour le DnD (marque les lignes dirty via setCreditsRows)
  const setRows = useCallback(
    (updater: (prev: LocalCredit[]) => LocalCredit[]) => {
      const d = useInvestissementStore.getState().getDraft(dossierId);
      setCreditsRows(dossierId, updater(d.credits));
    },
    [dossierId, setCreditsRows]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedCreditIds?.length ?? 0) > 0;
  const invalidateControleStores = useReloadScenarioData();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const result = await saveCreditBails(
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
        setCredits(dossierId, (prev) =>
          prev.map((r) => ({
            ...r,
            id: r.id && idMap[r.id] ? idMap[r.id] : r.id,
          }))
        );
      }
      markCreditsSaved(dossierId);
      toast.success("Crédit-baux enregistrés.");
      invalidateControleStores(dossierId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, dossierId, setCredits, markCreditsSaved]);

  const dnd = useGroupedDnd({ rows, setRows });

  const renderRow = useCallback((row: LocalCredit & { id: string }, isLastInGroup = false) => {
    const idx = rows.findIndex((r) => r.id === row.id);
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
            onChange={(v) => updateCreditRow(dossierId, row.id, { actif: v })}
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateCreditRow(dossierId, row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese}
            onChange={(e) => updateCreditRow(dossierId, row.id, { hypothese: e.target.value as CreditBailRow["hypothese"] })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
            ))}
          </select>
        </Td>
        <Td>
          <input
            type="date"
            className={cellInput}
            value={row.dateDebut}
            onChange={(e) => updateCreditRow(dossierId, row.id, { dateDebut: e.target.value })}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.montantHT}
            onChange={(v) => updateCreditRow(dossierId, row.id, { montantHT: v })}
            min={0}
            step={0.01}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.taux}
            onChange={(v) => updateCreditRow(dossierId, row.id, { taux: v })}
            min={0}
            max={100}
            step={0.01}
          />
        </Td>
        <Td>
          <NumericCellInput
            value={row.duree}
            onChange={(v) => updateCreditRow(dossierId, row.id, { duree: v })}
            min={1}
            step={1}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.periodicite}
            onChange={(e) => updateCreditRow(dossierId, row.id, { periodicite: e.target.value as CreditBailRow["periodicite"] })}
          >
            {PERIODICITES.map((p) => (
              <option key={p.value} value={p.value} className="bg-background text-foreground">{p.label}</option>
            ))}
          </select>
        </Td>
        <Td>
          <input
            type="date"
            className={cellInput}
            value={row.dateEcheance ?? ""}
            onChange={(e) => updateCreditRow(dossierId, row.id, { dateEcheance: e.target.value || undefined })}
          />
        </Td>
        <Td>
          <input
            type="number" min={0} step={0.01}
            className={cn(cellInput, "text-right")}
            value={row.valeurResiduelle ?? ""}
            placeholder="0"
            onChange={(e) => updateCreditRow(dossierId, row.id, { valeurResiduelle: e.target.value ? numVal(e.target.value) : undefined })}
          />
        </Td>
        <Td>
          <input
            type="number" min={0} step={0.01}
            className={cn(cellInput, "text-right")}
            value={row.premierLoyer ?? ""}
            placeholder="0"
            onChange={(e) => updateCreditRow(dossierId, row.id, { premierLoyer: e.target.value ? numVal(e.target.value) : undefined })}
          />
        </Td>
        <Td>
          <input
            type="number" min={0} step={0.01}
            className={cn(cellInput, "text-right")}
            value={row.loyerHT ?? ""}
            placeholder="0"
            onChange={(e) => updateCreditRow(dossierId, row.id, { loyerHT: e.target.value ? numVal(e.target.value) : undefined })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.tauxTVA}
            onChange={(e) => updateCreditRow(dossierId, row.id, { tauxTVA: numVal(e.target.value) })}
          >
            {TAUX_TVA_OPTIONS.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
            ))}
          </select>
        </Td>
        <Td className="text-center px-1">
          <RowActions
            onDuplicate={() => duplicateCreditRow(dossierId, row.id)}
            onDelete={() => removeCreditRow(dossierId, row.id)}
            isPending={isPending}
          />
        </Td>
      </SortableTableRow>
    );
  }, [rows, isPending, updateCreditRow, removeCreditRow, duplicateCreditRow, dossierId]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Crédit-bail / Location financière"
        description="Contrats de leasing et locations financières"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => addCreditRow(dossierId, dateDebutExerciceN)}
        onSave={saveAll}
        onAddGroup={() => addCreditGroup(dossierId, dateDebutExerciceN)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={16}
        onAddRowToGroupe={(g) => addCreditToGroup(dossierId, g, dateDebutExerciceN)}
        renderRow={renderRow}
        emptyMessage="Aucun crédit-bail. Cliquez sur « Ajouter » pour commencer."
        footer={<TotauxCreditBail rows={rows} dossierId={dossierId} />}
        groupNameColSpan={5}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryCreditBail rows={groupRows as LocalCredit[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7"></Th>
            <Th className="w-8">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Hypothèse</Th>
            <Th className="w-32">Date début</Th>
            <Th className="w-24">Montant HT</Th>
            <Th className="w-16">Taux %</Th>
            <Th className="w-16">Durée</Th>
            <Th className="w-28">Périodicité</Th>
            <Th className="w-32">Date échéance</Th>
            <Th className="w-24">Val. résid.</Th>
            <Th className="w-24">1er loyer</Th>
            <Th className="w-24">Loyer HT</Th>
            <Th className="w-20">Taux TVA</Th>
            <Th className="w-8"></Th>
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
