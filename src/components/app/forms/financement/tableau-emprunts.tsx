"use client";

import { useEffect, useCallback, useTransition, useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { formatNumber, formatDate } from "@/lib/format";
import { HYPOTHESE_TYPE_OPTIONS, filterByHypothese } from "@/lib/schemas/hypothese";
import {
  PERIODICITES_EMPRUNT,
  calculerLoyerMensuel,
  nbPeriodesFromMois,
  type EmpruntRow,
  type EmpruntWithEcheancier,
} from "@/lib/schemas/financement";
import { resumeEmprunt } from "@/lib/calcul/echeancier";
import { cn } from "@/lib/utils";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  useFinancementStore,
  type LocalEmprunt,
} from "@/stores/financement-store";
import { saveEmprunts } from "@/app/actions/financement";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";
import { Td, Th, NumericCellInput } from "../helpers/table-helpers";
import { ModalDetailsEmprunt } from "./modal-details-emprunt";

const fmtDate = (dateStr: string) => (dateStr ? formatDate(dateStr) : "—");

// ── Totaux footer ─────────────────────────────────────────────────────────────

function TotauxEmprunts({ rows, dossierId }: { rows: LocalEmprunt[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        {/* drag, actif, libellé, hypothèse, détail, date */}
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total emprunts (actifs)
        </td>
        <td className="px-2 py-1.5 pr-4.5 text-[13px] font-semibold text-right tabular-nums">
          {formatNumber(total)}
        </td>
        {/* durée, taux, différé, périodicité, échéance, 1er rembt., loyer, actions */}
        <td colSpan={8} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryEmprunts({ rows, dossierId }: { rows: LocalEmprunt[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const total = actifs.reduce((s, r) => s + (r.montant ?? 0), 0);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums text-muted-foreground/80">
        {formatNumber(total)}
      </td>
      <td colSpan={7} />
    </>
  );
}

// ── Tableau ───────────────────────────────────────────────────────────────────

export interface TableauEmpruntsProps {
  dossierId: string;
  initialData: EmpruntWithEcheancier[];
  dateDebutExerciceN?: string;
}

export function TableauEmprunts({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: TableauEmpruntsProps) {
  const {
    getDraft,
    hydrateEmprunts,
    addEmpruntRow,
    updateEmpruntRow,
    updateEmpruntFull,
    removeEmpruntRow,
    duplicateEmpruntRow,
    addEmpruntGroup,
    addEmpruntToGroup,
    setEmpruntsRows,
    markEmpruntsSaved,
    setEmprunts,
  } = useFinancementStore();

  useEffect(() => {
    hydrateEmprunts(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = useFinancementStore((s) => s.getDraft(dossierId));
  const rows  = draft.emprunts;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedEmpruntIds?.length ?? 0) > 0;

  const [isPending, startTransition] = useTransition();
  const [modalEmprunt, setModalEmprunt] = useState<EmpruntRow | null>(null);
  const reloadScenario = useReloadScenarioData();

  const setRows = useCallback(
    (updater: (prev: LocalEmprunt[]) => LocalEmprunt[]) => setEmprunts(dossierId, updater),
    [dossierId, setEmprunts]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty) as EmpruntRow[];
      const deletedIds = draft._deletedEmpruntIds ?? [];
      const res = await saveEmprunts(dossierId, dirtyRows, deletedIds);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      if (res.idMap) {
        const map = res.idMap;
        setEmprunts(dossierId, (prev) =>
          prev.map((r) => (r.id && map[r.id] ? { ...r, id: map[r.id] } : r))
        );
      }
      markEmpruntsSaved(dossierId);
      toast.success("Emprunts enregistrés.");
      reloadScenario(dossierId);
    });
  }, [rows, draft._deletedEmpruntIds, dossierId, setEmprunts, markEmpruntsSaved, reloadScenario]);

  const dnd = useGroupedDnd({ rows, setRows });

  const renderRow = useCallback(
    (row: LocalEmprunt & { id: string }, isLastInGroup = false) => {
      const loyer = calculerLoyerMensuel(row);
      const { echeanceMoyenne, premierRembourement } = resumeEmprunt({ ...row, fraisDossier: row.fraisDossier });
      const nbPeriodes = nbPeriodesFromMois(row.dureeEnMois, row.periodicite);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
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
              onChange={(e) => updateEmpruntRow(dossierId, row.id, { actif: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateEmpruntRow(dossierId, row.id, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) =>
                updateEmpruntRow(dossierId, row.id, {
                  hypothese: e.target.value as EmpruntRow["hypothese"],
                })
              }
            >
              {HYPOTHESE_TYPE_OPTIONS.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">
                  {h.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <button
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              title="Voir les détails"
              onClick={() => setModalEmprunt(row)}
              disabled={isPending}
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </Td>
          <Td>
            <input
              type="date"
              className={cellInput}
              value={row.dateDéblocage}
              onChange={(e) =>
                updateEmpruntRow(dossierId, row.id, { dateDéblocage: e.target.value })
              }
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.montant}
              onChange={(v) => updateEmpruntRow(dossierId, row.id, { montant: v })}
              min={0}
              step={0.01}
              placeholder="0"
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.dureeEnMois}
              onChange={(v) => updateEmpruntRow(dossierId, row.id, { dureeEnMois: Math.round(v) })}
              min={1}
              step={1}
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.tauxAnnuel}
              onChange={(v) => updateEmpruntRow(dossierId, row.id, { tauxAnnuel: v })}
              min={0}
              max={100}
              step={0.01}
              placeholder="0"
            />
          </Td>
          <Td>
            <NumericCellInput
              value={row.dureeDiffereEnMois}
              onChange={(v) =>
                updateEmpruntRow(dossierId, row.id, { dureeDiffereEnMois: Math.round(v) })
              }
              min={0}
              step={1}
              placeholder="0"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.periodicite}
              onChange={(e) =>
                updateEmpruntRow(dossierId, row.id, {
                  periodicite: e.target.value as EmpruntRow["periodicite"],
                })
              }
            >
              {PERIODICITES_EMPRUNT.map((p) => (
                <option key={p.value} value={p.value} className="bg-background text-foreground">
                  {p.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums italic">
            {echeanceMoyenne > 0
              ? echeanceMoyenne.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </Td>
          <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums italic">
            {fmtDate(premierRembourement)}
          </Td>
          <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums italic">
            {loyer > 0 && nbPeriodes > 0
              ? loyer.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </Td>
          <Td className="text-center">
            <RowActions
              onDuplicate={() => duplicateEmpruntRow(dossierId, row.id)}
              onDelete={() => removeEmpruntRow(dossierId, row.id)}
              isPending={isPending}
              groupe={row.groupe ?? null}
            />
          </Td>
        </SortableTableRow>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, isPending, dossierId]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Emprunts"
        description="Emprunts bancaires et financements externes — échéancier généré automatiquement"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => addEmpruntRow(dossierId, dateDebutExerciceN)}
        onSave={saveAll}
        onAddGroup={() => addEmpruntGroup(dossierId, dateDebutExerciceN)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={15}
        groupNameColSpan={4}
        onAddRowToGroupe={(g) => addEmpruntToGroup(dossierId, g, dateDebutExerciceN)}
        renderRow={renderRow}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryEmprunts
            rows={groupRows as LocalEmprunt[]}
            dossierId={dossierId}
          />
        )}
        emptyMessage="Aucun emprunt. Cliquez sur « Ajouter » pour commencer."
        footer={rows.length > 0 ? <TotauxEmprunts rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Hypothèse</Th>
            <Th className="w-8 text-center">Détail</Th>
            <Th className="w-32">Date déblocage</Th>
            <Th className="w-28">Montant (€)</Th>
            <Th className="w-20">Durée (mois)</Th>
            <Th className="w-16">Taux %</Th>
            <Th className="w-24">Différé (mois)</Th>
            <Th className="w-28">Périodicité</Th>
            <Th className="w-28 italic">Échéance (€)</Th>
            <Th className="w-32 italic">1er rembt.</Th>
            <Th className="w-28 italic">Loyer (€)</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>

      <ModalDetailsEmprunt
        key={modalEmprunt?.id ?? "closed"}
        emprunt={modalEmprunt}
        open={!!modalEmprunt}
        onClose={() => setModalEmprunt(null)}
        onApply={(updated) => updateEmpruntFull(dossierId, updated)}
      />
    </div>
  );
}
