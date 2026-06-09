"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { FileText } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";
import {
  type ActiviteRow,
  SECTEURS_ACTIVITE,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
} from "@/lib/schemas/activite";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { useActiviteStore, type LocalActiviteRow } from "@/stores/activite-store";
import { saveActivites } from "@/app/actions/activite";
import { useExercicesDisplay } from "@/hooks/use-exercices-display";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { DetailActiviteDialog } from "./detail-activite-dialog";
import { formatNumber } from "@/lib/format";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { RowActions } from "../helpers/row-actions";

function TotauxActivites({ rows, dossierId}: { rows: LocalActiviteRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const { showN1, showN2 } = useExercicesDisplay(dossierId);
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN ?? 0), 0))}
        </td>
        {showN1 && <td />}
        {showN1 && (
          <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
            {formatNumber(actifs.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
          </td>
        )}
        {showN2 && <td />}
        {showN2 && (
          <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
            {formatNumber(actifs.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
          </td>
        )}
        <td colSpan={7} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryActivites({ rows, dossierId}: { rows: LocalActiviteRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const { showN1, showN2 } = useExercicesDisplay(dossierId);
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <>
      <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
        {formatNumber(actifs.reduce((s, r) => s + (r.montantN ?? 0), 0))}
      </td>
      {showN1 && <td />}
      {showN1 && (
        <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN1 ?? 0), 0))}
        </td>
      )}
      {showN2 && <td />}
      {showN2 && (
        <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
          {formatNumber(actifs.reduce((s, r) => s + (r.montantN2 ?? 0), 0))}
        </td>
      )}
      <td colSpan={5} />
    </>
  );
}

interface TableauActivitesProps {
  dossierId: string;
  initialData: ActiviteRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function TableauActivites({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: TableauActivitesProps) {
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const store = useActiviteStore();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    store.hydrateActivites(dossierId, initialData.map((r) => ({ ...r, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = store.getDraft(dossierId);
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);
  const rows = draft.activites;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedActiviteIds?.length ?? 0) > 0;

  // Bridge stable : appelle setActivitesRows (dirty=true) en lisant le store courant.
  const setRows = useCallback(
    (updater: (prev: ActiviteRow[]) => ActiviteRow[]) => {
      const d = store.getDraft(dossierId);
      store.setActivitesRows(dossierId, updater(d.activites));
    },
    [dossierId, store]
  );
  const dnd = useGroupedDnd({ rows, setRows });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = store.getDraft(dossierId);
        const result = await saveActivites(dossierId, d.activites);
        if (result.success) {
          if (result.idMap && Object.keys(result.idMap).length > 0) {
            const idMap = result.idMap;
            store.setActivites(dossierId, (prev) =>
              prev.map((r) => ({ ...r, id: r.id && idMap[r.id] ? idMap[r.id] : r.id }))
            );
          }
          store.markActivitesSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, store, invalidateControleStores]);

  // ── Rendu de ligne ────────────────────────────────────────────────────────

    const renderRow = useCallback(
    (row: LocalActiviteRow & { id: string }, isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border border-l-2 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
            row.groupe && "border-l-primary/20 bg-secondary/5 hover:bg-secondary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
            !(row.actif ?? true) && "opacity-50"
          )}
        >
          <DragHandleCell />
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { actif: e.target.checked })}
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cn(cellSelect)}
              value={row.secteur}
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { secteur: e.target.value as ActiviteRow["secteur"] })}
            >
              {SECTEURS_ACTIVITE.map((s) => (
                <option key={s.value} value={s.value} className={cn("bg-background text-foreground")}>{s.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <select
              className={cn(cellSelect)}
              value={row.hypothese}
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { hypothese: e.target.value as ActiviteRow["hypothese"] })}
            >
              {HYPOTHESES_ACTIVITE.map((h) => (
                <option key={h.value} value={h.value} className={cn("bg-background text-foreground")}>{h.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setDetailIdx(idx)}
              title="Détails de l'activité"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </Td>
          <Td>
            <NumericCellInput
              value={row.montantN}
              onChange={(n) => {
                const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                store.updateActiviteRow(dossierId, idx, { montantN: n, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          {showN1 && (
            <Td>
              <NumericCellInput
                value={row.evolutionN1}
                onChange={(ev1) => {
                  const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                  const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                  store.updateActiviteRow(dossierId, idx, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN1 && (
            <Td>
              <NumericCellInput
                value={row.montantN1}
                title="Saisie directe → taux calculé / Taux évol. → montant calculé"
                onChange={(n1) => {
                  const ev1 = row.montantN > 0 ? parseFloat(((n1 / row.montantN - 1) * 100).toFixed(2)) : 0;
                  const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                  store.updateActiviteRow(dossierId, idx, { montantN1: n1, evolutionN1: ev1, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN2 && (
            <Td>
              <NumericCellInput
                value={row.evolutionN2}
                onChange={(ev2) => {
                  const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                  store.updateActiviteRow(dossierId, idx, { evolutionN2: ev2, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN2 && (
            <Td>
              <NumericCellInput
                value={row.montantN2}
                title="Saisie directe → taux calculé / Taux évol. → montant calculé"
                onChange={(n2) => {
                  const ev2 = row.montantN1 > 0 ? parseFloat(((n2 / row.montantN1 - 1) * 100).toFixed(2)) : 0;
                  store.updateActiviteRow(dossierId, idx, { montantN2: n2, evolutionN2: ev2 });
                }}
              />
            </Td>
          )}
          <Td>
            <NumericCellInput
              value={row.tauxMarge}
              onChange={(v) => store.updateActiviteRow(dossierId, idx, { tauxMarge: v })}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.stocks}
              onChange={(v) => store.updateActiviteRow(dossierId, idx, { stocks: v })}
              step={1}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.reglementClients}
              onChange={(v) => store.updateActiviteRow(dossierId, idx, { reglementClients: v })}
              step={1}
            />
          </Td>
          <Td>
            <select
              className={cn(cellSelect)}
              value={row.tvaVentes}
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { tvaVentes: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className={cn("bg-background text-foreground")}>{t.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <NumericCellInput
              value={row.reglementFournisseurs}
              onChange={(v) => store.updateActiviteRow(dossierId, idx, { reglementFournisseurs: v })}
              step={1}
            />
          </Td>
          <Td>
            <select
              className={cn(cellSelect)}
              value={row.tvaAchats}
              onChange={(e) => store.updateActiviteRow(dossierId, idx, { tvaAchats: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className={cn("bg-background text-foreground")}>{t.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <RowActions
              onDelete={() => store.removeActiviteRow(dossierId, idx)}
              onDuplicate={() => store.duplicateActiviteRow(dossierId, idx)}
              isPending={isPending}
              groupe={row.groupe ?? null}
            />
          </Td>
        </SortableTableRow>
      );
    },
    [rows, showN1, showN2, isPending, store, dossierId]
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Chiffre d'affaires"
        description="Projections de chiffre d'affaires sur 3 ans (N, N+1, N+2)"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addActiviteRow(dossierId)}
        onSave={saveAll}
        onAddGroup={() => store.addActiviteGroup(dossierId)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={14 + (showN1 ? 2 : 0) + (showN2 ? 2 : 0)}
        onAddRowToGroupe={(groupe) => store.addActiviteToGroup(dossierId, groupe)}
        renderRow={renderRow}
        emptyMessage="Aucune activité — cliquez sur « Ajouter »"
        footer={rows.length > 0 ? <TotauxActivites rows={rows} dossierId={dossierId} /> : undefined}
        groupNameColSpan={5}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryActivites rows={groupRows as LocalActiviteRow[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Secteur</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-8 text-center">Détail</Th>
            <Th className="w-24 text-center">{y1Label}</Th>
            {showN1 && <Th className="w-14 text-center">% Év.</Th>}
            {showN1 && <Th className="w-24 text-center">{y2Label}</Th>}
            {showN2 && <Th className="w-14 text-center">% Év.</Th>}
            {showN2 && <Th className="w-24 text-center">{y3Label}</Th>}
            <Th className="w-16 text-center">Tx marge</Th>
            <Th className="w-14 text-center">Stocks</Th>
            <Th className="w-14 text-center">Règl. client</Th>
            <Th className="w-16 text-center">TVA ventes</Th>
            <Th className="w-14 text-center">Règl. fourn.</Th>
            <Th className="w-16 text-center">TVA achats</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
      {detailIdx !== null && (
        <DetailActiviteDialog
          open={detailIdx !== null}
          onOpenChange={(open) => { if (!open) setDetailIdx(null); }}
          dossierId={dossierId}
          activiteIndex={detailIdx}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
        />
      )}
    </div>
  );
}
