"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Package, RotateCcw, UsersRound, Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { HYPOTHESES_PERSONNEL, type LigneChargePersonnelRow } from "@/lib/schemas/personnel";
import { usePersonnelStore, type PersonnelDraft } from "@/stores/personnel-store";
import { saveLignesChargesPersonnel } from "@/app/actions/personnel";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { formatNumber } from "@/lib/format";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { Td, Th } from "../helpers/table-helpers";
import { SectionHeader } from "../helpers/section-header";

export type TypeChargePersonnel = "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION";

interface ChargeConfig {
  title: string;
  description: string;
  icon: ReactNode;
  listKey: keyof Pick<PersonnelDraft, "autresCharges" | "remboursements" | "participations">;
  dirtyKey: keyof Pick<
    PersonnelDraft,
    "hasUnsavedAutresCharges" | "hasUnsavedRemboursements" | "hasUnsavedParticipations"
  >;
  withDates: boolean;
  withCalcAuto: boolean;
}

const CHARGE_CONFIG: Record<TypeChargePersonnel, ChargeConfig> = {
  AUTRE: {
    title: "Autres charges de personnel",
    description: "Primes, indemnités, avantages en nature et toute autre charge liée au personnel",
    icon: <Package className="h-4 w-4" />,
    listKey: "autresCharges",
    dirtyKey: "hasUnsavedAutresCharges",
    withDates: true,
    withCalcAuto: false,
  },
  REMBOURSEMENT: {
    title: "Remboursements de frais",
    description: "Remboursements de frais de déplacement, repas, téléphone, etc.",
    icon: <RotateCcw className="h-4 w-4" />,
    listKey: "remboursements",
    dirtyKey: "hasUnsavedRemboursements",
    withDates: true,
    withCalcAuto: false,
  },
  PARTICIPATION: {
    title: "Participation des salariés",
    description: "Participation aux résultats, intéressement, plan d'épargne entreprise",
    icon: <UsersRound className="h-4 w-4" />,
    listKey: "participations",
    dirtyKey: "hasUnsavedParticipations",
    withDates: false,
    withCalcAuto: true,
  },
};

const EMPTY_CHARGE_ROWS: LigneChargePersonnelRow[] = [];

const tempId = () => "__new__" + crypto.randomUUID();

function emptyRow(type: TypeChargePersonnel, groupe?: string): LigneChargePersonnelRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    calcAuto: false,
    dateN: "",
    dateN1: "",
    dateN2: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

export function TableauChargePersonnel({
  dossierId,
  type,
  initialData,
}: {
  dossierId: string;
  type: TypeChargePersonnel;
  initialData?: LigneChargePersonnelRow[];
}) {
  const config = CHARGE_CONFIG[type];
  const setAutresCharges = usePersonnelStore(s => s.setAutresCharges);
  const setAutresChargesRows = usePersonnelStore(s => s.setAutresChargesRows);
  const markAutresChargesSaved = usePersonnelStore(s => s.markAutresChargesSaved);
  const setRemboursements = usePersonnelStore(s => s.setRemboursements);
  const setRemboursementsRows = usePersonnelStore(s => s.setRemboursementsRows);
  const markRemboursementsSaved = usePersonnelStore(s => s.markRemboursementsSaved);
  const setParticipations = usePersonnelStore(s => s.setParticipations);
  const setParticipationsRows = usePersonnelStore(s => s.setParticipationsRows);
  const markParticipationsSaved = usePersonnelStore(s => s.markParticipationsSaved);
  const autresCharges = usePersonnelStore(s => s.drafts[dossierId]?.autresCharges ?? EMPTY_CHARGE_ROWS);
  const remboursements = usePersonnelStore(s => s.drafts[dossierId]?.remboursements ?? EMPTY_CHARGE_ROWS);
  const participations = usePersonnelStore(s => s.drafts[dossierId]?.participations ?? EMPTY_CHARGE_ROWS);
  const hasUnsavedAutres = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedAutresCharges ?? false);
  const hasUnsavedRemb = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedRemboursements ?? false);
  const hasUnsavedPartic = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedParticipations ?? false);
  const rows = type === "AUTRE" ? autresCharges : type === "REMBOURSEMENT" ? remboursements : participations;
  const isDirty = type === "AUTRE" ? hasUnsavedAutres : type === "REMBOURSEMENT" ? hasUnsavedRemb : hasUnsavedPartic;
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();

  const handleSet = useCallback(
    (data: LigneChargePersonnelRow[]) => {
      if (type === "AUTRE") setAutresCharges(dossierId, data);
      else if (type === "REMBOURSEMENT") setRemboursements(dossierId, data);
      else setParticipations(dossierId, data);
    },
    [dossierId, type, setAutresCharges, setRemboursements, setParticipations],
  );

  const handleMarkSaved = useCallback(() => {
    if (type === "AUTRE") markAutresChargesSaved(dossierId);
    else if (type === "REMBOURSEMENT") markRemboursementsSaved(dossierId);
    else markParticipationsSaved(dossierId);
  }, [dossierId, type, markAutresChargesSaved, markRemboursementsSaved, markParticipationsSaved]);

  useEffect(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const dirty = cur[config.dirtyKey] as boolean;
    if (!dirty) handleSet(initialData ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRowsDirty = useCallback(
    (data: LigneChargePersonnelRow[]) => {
      if (type === "AUTRE") setAutresChargesRows(dossierId, data);
      else if (type === "REMBOURSEMENT") setRemboursementsRows(dossierId, data);
      else setParticipationsRows(dossierId, data);
    },
    [dossierId, type, setAutresChargesRows, setRemboursementsRows, setParticipationsRows],
  );

  const setRows = useCallback(
    (updater: (prev: LigneChargePersonnelRow[]) => LigneChargePersonnelRow[]) => {
      const cur = usePersonnelStore.getState().getDraft(dossierId);
      const prev = cur[config.listKey] as LigneChargePersonnelRow[];
      setRowsDirty(updater(prev));
    },
    [dossierId, config.listKey, setRowsDirty],
  );

  const dnd = useGroupedDnd<LigneChargePersonnelRow>({ rows, setRows });

  const addRow = useCallback(() => setRows((prev) => [...prev, emptyRow(type)]), [setRows, type]);

  const addGroupe = useCallback(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const curRows = cur[config.listKey] as LigneChargePersonnelRow[];
    const existing = new Set(curRows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has("Groupe " + n)) n++;

    setRows((prev) => [...prev, emptyRow(type, "Groupe " + n)]);
  }, [dossierId, config.listKey, setRows, type]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyRow(type, groupe)]),
    [setRows, type],
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<LigneChargePersonnelRow>) =>
      setRows((prev) => {
        const n = [...prev];
        n[idx] = { ...n[idx], ...data };
        return n;
      }),
    [setRows],
  );

  const removeRow = useCallback((idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx)), [setRows]);

  const duplicateRow = useCallback(
    (idx: number) =>
      setRows((prev) => {
        const { id: _id, ...rest } = prev[idx];
        return [...prev, { ...rest, id: tempId() }];
      }),
    [setRows],
  );

  const invalidateControleStores = useReloadScenarioData();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesChargesPersonnel(dossierId, type, rows);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          handleSet(rows.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        handleMarkSaved();
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, type, rows, handleSet, handleMarkSaved, invalidateControleStores]);

  // COL_SPAN : DragHandle + Act + Libellé + Hyp + (Calc ou DateN) + N + (DateN+1 + N+1 + DateN+2 + N+2) + Actions
  const COL_SPAN = 4 + (config.withCalcAuto ? 1 : 0) + (config.withDates ? 6 : 3) + 1;
  // GROUP_NAME_COL_SPAN = 4 : Act | Libellé | Hyp | (CalcAuto ou DateN)
  const GROUP_NAME_COL_SPAN = 4;
  // footerLabelColSpan = DragHandle + Act + Libellé + Hyp + (optional Calc or DateN)
  const footerLabelColSpan = 4 + (config.withCalcAuto ? 1 : 0) + (config.withDates ? 1 : 0);

  /**
   * Rendu d'une ligne du tableau, avec les bonnes cellules selon la configuration.
   * (parameter) row: {
    libelle: string;
    actif: boolean;
    hypothese: "COMMUNE" | "PESSIMISTE" | "REALISTE" | "OPTIMISTE";
    type: "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION";
    calcAuto: boolean;
    dateN: string;
    montantN: number;
    dateN1: string;
    montantN1: number;
    dateN2: string;
    montantN2: number;
    id?: string | undefined;
    ordre?: number | undefined;
    groupe?: string | null | undefined;
} & {
    id: string;
}
   */
  const renderRow = useCallback(
    (row: LigneChargePersonnelRow & { id: string }, _isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-b last:border-0 hover:bg-muted/20 transition-colors",
            row.actif === false && "opacity-50",
          )}
        >
          <DragHandleCell />
          <Td className="pl-2">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(idx, { actif: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Activer"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateRow(idx, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as LigneChargePersonnelRow["hypothese"] })}
              aria-label="Hypothèse"
            >
              {HYPOTHESES_PERSONNEL.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">
                  {h.label}
                </option>
              ))}
            </select>
          </Td>
          {config.withCalcAuto && (
            <Td className="text-center">
              <input
                type="checkbox"
                checked={row.calcAuto ?? false}
                onChange={(e) => updateRow(idx, { calcAuto: e.target.checked })}
                className="h-3.5 w-3.5 accent-primary"
                aria-label="Calcul auto"
              />
            </Td>
          )}
          {config.withDates ? (
            <>
              <Td>
                <input
                  className={cellInput}
                  value={row.dateN ?? ""}
                  placeholder="aaaa-mm-jj"
                  title="Date de paiement en N"
                  onChange={(e) => updateRow(idx, { dateN: e.target.value })}
                />
              </Td>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN === 0 ? "" : row.montantN}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN: numVal(e.target.value) })}
                />
              </Td>
              <Td>
                <input
                  className={cellInput}
                  value={row.dateN1 ?? ""}
                  placeholder="aaaa-mm-jj"
                  title="Date de paiement en N+1"
                  onChange={(e) => updateRow(idx, { dateN1: e.target.value })}
                />
              </Td>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN1 === 0 ? "" : row.montantN1}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN1: numVal(e.target.value) })}
                />
              </Td>
              <Td>
                <input
                  className={cellInput}
                  value={row.dateN2 ?? ""}
                  placeholder="aaaa-mm-jj"
                  title="Date de paiement en N+2"
                  onChange={(e) => updateRow(idx, { dateN2: e.target.value })}
                />
              </Td>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN2 === 0 ? "" : row.montantN2}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN2: numVal(e.target.value) })}
                />
              </Td>
            </>
          ) : (
            <>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN === 0 ? "" : row.montantN}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN: numVal(e.target.value) })}
                />
              </Td>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN1 === 0 ? "" : row.montantN1}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN1: numVal(e.target.value) })}
                />
              </Td>
              <Td>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(cellInput, "text-right")}
                  value={row.montantN2 === 0 ? "" : row.montantN2}
                  placeholder="0"
                  onChange={(e) => updateRow(idx, { montantN2: numVal(e.target.value) })}
                />
              </Td>
            </>
          )}
          <Td className="text-center px-1">
            <div className="flex items-center justify-center gap-0.5">
              <button
                className="flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => duplicateRow(idx)}
                title="Dupliquer"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => removeRow(idx)}
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, config.withCalcAuto, config.withDates, updateRow, duplicateRow, removeRow],
  );

  const tfoot = useMemo(() => {
    if (rows.length === 0) return null;
    const actifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
    const totalN = actifs.reduce((s, r) => s + r.montantN, 0);
    const totalN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
    const totalN2 = actifs.reduce((s, r) => s + r.montantN2, 0);
    const cls = "px-2 py-1.5 text-xs font-semibold text-right tabular-nums";
    return (
      <tfoot className="border-t-2 border-border bg-muted/30">
        <tr>
          <td
            colSpan={footerLabelColSpan}
            className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground"
          >
            Total (actifs)
          </td>
          {config.withDates ? (
            <>
              <td className={cls}>{formatNumber(totalN,0)}</td>
              <td />
              <td className={cls}>{formatNumber(totalN1,0)}</td>
              <td />
              <td className={cls}>{formatNumber(totalN2,0)}</td>
              <td />
            </>
          ) : (
            <>
              <td className={cls}>{formatNumber(totalN,0)}</td>
              <td className={cls}>{formatNumber(totalN1,0)}</td>
              <td className={cls}>{formatNumber(totalN2,0)}</td>
              <td />
            </>
          )}
        </tr>
      </tfoot>
    );
  }, [rows, hypotheseActive, config.withDates, footerLabelColSpan]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: LigneChargePersonnelRow[]) => {
      const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif !== false);
      const totalN = actifs.reduce((s, r) => s + r.montantN, 0);
      const totalN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
      const totalN2 = actifs.reduce((s, r) => s + r.montantN2, 0);
      const cls = "px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground";
      if (config.withDates) {
        return (
          <>
            <td />
            <td className={cls}>{formatNumber(totalN,0)}</td>
            <td />
            <td className={cls}>{formatNumber(totalN1,0)}</td>
            <td />
            <td className={cls}>{formatNumber(totalN2,0)}</td>
            <td />
          </>
        );
      }
      return (
        <>
          {config.withCalcAuto && <td />}
          <td className={cls}>{formatNumber(totalN,0)}</td>
          <td className={cls}>{formatNumber(totalN1,0)}</td>
          <td className={cls}>{formatNumber(totalN2,0)}</td>
          <td />
        </>
      );
    },
    [hypotheseActive, config.withDates, config.withCalcAuto],
  );

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={COL_SPAN}
        groupNameColSpan={GROUP_NAME_COL_SPAN}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        renderGroupSummaryCells={renderGroupSummaryCells}
        emptyMessage="Aucune ligne — cliquez sur « Ajouter » pour commencer."
        footer={tfoot}
      >
        <thead className="bg-muted/40 border-b">
          <tr>
            <Th className="w-6" />
            <Th className="w-8">Act.</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            {config.withCalcAuto && <Th className="w-16 text-center">Calc.</Th>}
            {config.withDates ? (
              <>
                <Th className="w-24">Date N</Th>
                <Th className="w-28 text-right">N (€)</Th>
                <Th className="w-24">Date N+1</Th>
                <Th className="w-28 text-right">N+1 (€)</Th>
                <Th className="w-24">Date N+2</Th>
                <Th className="w-28 text-right">N+2 (€)</Th>
              </>
            ) : (
              <>
                <Th className="w-28 text-right">N (€)</Th>
                <Th className="w-28 text-right">N+1 (€)</Th>
                <Th className="w-28 text-right">N+2 (€)</Th>
              </>
            )}
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </section>
  );
}
