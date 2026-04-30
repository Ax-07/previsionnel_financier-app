"use client";

/**
 * Onglet Divers — 8 tableaux éditables inline
 * - Remboursements en comptes courants
 * - Dividendes distribués
 * - Augmentation de capital par incorporation de réserves
 * - Réduction de capital
 * - Déblocages de la participation des salariés
 * - Prêts inter-entreprises
 * - Encaissements (trésorerie)
 * - Décaissements (trésorerie)
 */

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

import {
  PERIODICITES_PRET,
  calculerEcheancePret,
  type DiversFluxDateRow,
  type DiversOperationCapitalRow,
  type DiversPretRow,
} from "@/lib/schemas/divers";

import { useDiversStore } from "@/stores/divers-store";
import { HYPOTHESE_TYPE_OPTIONS, filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  fetchFluxDates,
  saveFluxDates,
  fetchOperationsCapital,
  saveOperationsCapital,
  fetchPrets,
  savePrets,
} from "@/app/actions/divers";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

// ── Helpers locaux ────────────────────────────────────────────────────────────

const tempId = () => `__new__${crypto.randomUUID()}`;
const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

function emptyFluxRow(type: DiversFluxDateRow["type"], groupe?: string | null): DiversFluxDateRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

function emptyCapitalRow(type: DiversOperationCapitalRow["type"], groupe?: string | null): DiversOperationCapitalRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    date: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

function emptyPretRow(groupe?: string | null): DiversPretRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    dateDebut: "",
    capital: 0,
    taux: 0,
    dureeMois: 12,
    periodicite: "MENSUELLE",
    ordre: 0,
    groupe: groupe ?? null,
  };
}

// ── Totaux ───────────────────────────────────────────────────────────────────

function TotauxFluxRow({ rows, dossierId }: { rows: DiversFluxDateRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={5} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}</td>
        <td />
      </tr>
    </tfoot>
  );
}

function TotauxCapitalRow({ rows, dossierId }: { rows: DiversOperationCapitalRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}</td>
        <td />
      </tr>
    </tfoot>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section générique — Flux daté (remboursements C/C, dividendes, déblocages, encaissements, décaissements)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface FluxSectionConfig {
  type: DiversFluxDateRow["type"];
  title: string;
  description?: string;
  emptyMessage: string;
  getRows: (dossierId: string) => DiversFluxDateRow[];
  isDirty: (dossierId: string) => boolean;
  /** Hydratation sans dirty flag */
  setRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  /** Mutation DnD/édition avec dirty=true */
  setRowsDirty: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  markSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;
}

function FluxDateeSection({
  dossierId,
  initialData,
  config,
}: {
  dossierId: string;
  initialData: DiversFluxDateRow[];
  config: FluxSectionConfig;
}) {
  const rows = config.getRows(dossierId);
  const isDirty = config.isDirty(dossierId);
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      config.setRows(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversFluxDateRow[]) => DiversFluxDateRow[]) =>
      config.setRowsDirty(dossierId, updater(config.getRows(dossierId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => config.setRowsDirty(dossierId, [...config.getRows(dossierId), emptyFluxRow(config.type)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(config.getRows(dossierId).filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    config.setRowsDirty(dossierId, [
      ...config.getRows(dossierId),
      emptyFluxRow(config.type, `Groupe ${n}`),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const addRowToGroupe = useCallback(
    (groupe: string) =>
      config.setRowsDirty(dossierId, [...config.getRows(dossierId), emptyFluxRow(config.type, groupe)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const updateRow = useCallback(
    (id: string, data: Partial<DiversFluxDateRow>) =>
      config.setRowsDirty(dossierId, config.getRows(dossierId).map((r) => (r.id === id ? { ...r, ...data } : r))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const removeRow = useCallback(
    (id: string) =>
      config.setRowsDirty(dossierId, config.getRows(dossierId).filter((r) => r.id !== id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const duplicateRow = useCallback(
    (id: string) => {
      const current = config.getRows(dossierId);
      const idx = current.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const { id: _id, ...rest } = current[idx];
      const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
      const next = [...current];
      next.splice(idx + 1, 0, copy);
      config.setRowsDirty(dossierId, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const currentRows = config.getRows(dossierId);
      const result = await saveFluxDates(dossierId, config.type, currentRows);
      if (result.success) {
        const fresh = await fetchFluxDates(dossierId, config.type);
        config.markSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversFluxDateRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td />{/* DateN */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN, 0))}
          </td>
          <td />{/* DateN+1 */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
          </td>
          <td />{/* DateN+2 */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
          </td>
        </>
      );
    },
    []
  );

  const renderRow = useCallback(
    (row: DiversFluxDateRow & { id: string }) => (
      <SortableTableRow
        key={row.id}
        id={row.id}
        className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
      >
        <DragHandleCell />
        <Td className="pl-1">
          <input
            type="checkbox"
            checked={row.actif !== false}
            onChange={(e) => updateRow(row.id, { actif: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese ?? "COMMUNE"}
            onChange={(e) => updateRow(row.id, { hypothese: e.target.value as HypotheseType })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
            ))}
          </select>
        </Td>
        <Td className="w-28">
          <input
            type="text"
            className={cellInput}
            value={row.dateN ?? ""}
            onChange={(e) => updateRow(row.id, { dateN: e.target.value })}
            placeholder="MM/AAAA"
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="text"
            className={cellInput}
            value={row.dateN1 ?? ""}
            onChange={(e) => updateRow(row.id, { dateN1: e.target.value })}
            placeholder="MM/AAAA"
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN1}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN1: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="text"
            className={cellInput}
            value={row.dateN2 ?? ""}
            onChange={(e) => updateRow(row.id, { dateN2: e.target.value })}
            placeholder="MM/AAAA"
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN2}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN2: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-10 px-1">
          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => duplicateRow(row.id)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeRow(row.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </Td>
      </SortableTableRow>
    ),
    [updateRow, duplicateRow, removeRow]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title={config.title}
        description={config.description}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={11}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage={config.emptyMessage}
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
        footer={<TotauxFluxRow rows={rows} dossierId={dossierId} />}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />{/* DragHandle */}
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-30">Hypothèse</Th>
            <Th className="w-28">Date N</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28">Date N+1</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28">Date N+2</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Augmentation de capital par incorporation de réserves
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function AugmentationCapitalSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: DiversOperationCapitalRow[];
}) {
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.augmentationsCapital;
  const isDirty = draft.hasUnsavedAugmentationsCapital;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setAugmentationsCapital(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversOperationCapitalRow[]) => DiversOperationCapitalRow[]) =>
      store.setAugmentationsCapitalRows(dossierId, updater(store.getDraft(dossierId).augmentationsCapital)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => store.setAugmentationsCapitalRows(dossierId, [...store.getDraft(dossierId).augmentationsCapital, emptyCapitalRow("AUGMENTATION_INCORPORATION")]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const addGroupe = useCallback(() => {
    const current = store.getDraft(dossierId).augmentationsCapital;
    const existing = new Set(current.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setAugmentationsCapitalRows(dossierId, [
      ...current,
      emptyCapitalRow("AUGMENTATION_INCORPORATION", `Groupe ${n}`),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const addRowToGroupe = useCallback(
    (groupe: string) =>
      store.setAugmentationsCapitalRows(dossierId, [
        ...store.getDraft(dossierId).augmentationsCapital,
        emptyCapitalRow("AUGMENTATION_INCORPORATION", groupe),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const updateRow = useCallback(
    (id: string, data: Partial<DiversOperationCapitalRow>) =>
      store.setAugmentationsCapitalRows(
        dossierId,
        store.getDraft(dossierId).augmentationsCapital.map((r) => (r.id === id ? { ...r, ...data } : r))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const removeRow = useCallback(
    (id: string) =>
      store.setAugmentationsCapitalRows(
        dossierId,
        store.getDraft(dossierId).augmentationsCapital.filter((r) => r.id !== id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const duplicateRow = useCallback(
    (id: string) => {
      const current = store.getDraft(dossierId).augmentationsCapital;
      const idx = current.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const { id: _id, ...rest } = current[idx];
      const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
      const next = [...current];
      next.splice(idx + 1, 0, copy);
      store.setAugmentationsCapitalRows(dossierId, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveOperationsCapital(dossierId, "AUGMENTATION_INCORPORATION", rows);
      if (result.success) {
        const fresh = await fetchOperationsCapital(dossierId, "AUGMENTATION_INCORPORATION");
        store.markAugmentationsCapitalSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, rows]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversOperationCapitalRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
          </td>
        </>
      );
    },
    []
  );

  const renderRow = useCallback(
    (row: DiversOperationCapitalRow & { id: string }) => (
      <SortableTableRow
        key={row.id}
        id={row.id}
        className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
      >
        <DragHandleCell />
        <Td className="pl-1">
          <input
            type="checkbox"
            checked={row.actif !== false}
            onChange={(e) => updateRow(row.id, { actif: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese ?? "COMMUNE"}
            onChange={(e) => updateRow(row.id, { hypothese: e.target.value as HypotheseType })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
            ))}
          </select>
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN1}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN1: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN2}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN2: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-10 px-1">
          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => duplicateRow(row.id)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeRow(row.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </Td>
      </SortableTableRow>
    ),
    [updateRow, duplicateRow, removeRow]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Augmentation de capital par incorporation de réserves"
        description="Transformation des réserves en capital — aucun flux de trésorerie."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune augmentation — cliquez sur « Ajouter » pour commencer."
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
        footer={<TotauxCapitalRow rows={rows} dossierId={dossierId} />}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />{/* DragHandle */}
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-30">Hypothèse</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Réduction de capital
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ReductionCapitalSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: DiversOperationCapitalRow[];
}) {
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.reductionsCapital;
  const isDirty = draft.hasUnsavedReductionsCapital;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setReductionsCapital(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversOperationCapitalRow[]) => DiversOperationCapitalRow[]) =>
      store.setReductionsCapitalRows(dossierId, updater(store.getDraft(dossierId).reductionsCapital)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => store.setReductionsCapitalRows(dossierId, [...store.getDraft(dossierId).reductionsCapital, emptyCapitalRow("REDUCTION")]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const addGroupe = useCallback(() => {
    const current = store.getDraft(dossierId).reductionsCapital;
    const existing = new Set(current.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setReductionsCapitalRows(dossierId, [
      ...current,
      emptyCapitalRow("REDUCTION", `Groupe ${n}`),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const addRowToGroupe = useCallback(
    (groupe: string) =>
      store.setReductionsCapitalRows(dossierId, [
        ...store.getDraft(dossierId).reductionsCapital,
        emptyCapitalRow("REDUCTION", groupe),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const updateRow = useCallback(
    (id: string, data: Partial<DiversOperationCapitalRow>) =>
      store.setReductionsCapitalRows(
        dossierId,
        store.getDraft(dossierId).reductionsCapital.map((r) => (r.id === id ? { ...r, ...data } : r))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const removeRow = useCallback(
    (id: string) =>
      store.setReductionsCapitalRows(
        dossierId,
        store.getDraft(dossierId).reductionsCapital.filter((r) => r.id !== id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const duplicateRow = useCallback(
    (id: string) => {
      const current = store.getDraft(dossierId).reductionsCapital;
      const idx = current.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const { id: _id, ...rest } = current[idx];
      const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
      const next = [...current];
      next.splice(idx + 1, 0, copy);
      store.setReductionsCapitalRows(dossierId, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveOperationsCapital(dossierId, "REDUCTION", rows);
      if (result.success) {
        const fresh = await fetchOperationsCapital(dossierId, "REDUCTION");
        store.markReductionsCapitalSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, rows]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversOperationCapitalRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td />{/* Date */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
          </td>
        </>
      );
    },
    []
  );

  const renderRow = useCallback(
    (row: DiversOperationCapitalRow & { id: string }) => (
      <SortableTableRow
        key={row.id}
        id={row.id}
        className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
      >
        <DragHandleCell />
        <Td className="pl-1">
          <input
            type="checkbox"
            checked={row.actif !== false}
            onChange={(e) => updateRow(row.id, { actif: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
        </Td>
        <Td>
          <input
            className={cellInput}
            value={row.libelle}
            placeholder="Libellé"
            onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
          />
        </Td>
        <Td>
          <select
            className={cellSelect}
            value={row.hypothese ?? "COMMUNE"}
            onChange={(e) => updateRow(row.id, { hypothese: e.target.value as HypotheseType })}
          >
            {HYPOTHESE_TYPE_OPTIONS.map((h) => (
              <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
            ))}
          </select>
        </Td>
        <Td className="w-28">
          <input
            type="text"
            className={cellInput}
            value={row.date ?? ""}
            onChange={(e) => updateRow(row.id, { date: e.target.value })}
            placeholder="MM/AAAA"
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN1}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN1: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-28">
          <input
            type="number"
            className={cn(cellInput, "text-right")}
            value={row.montantN2}
            min={0}
            onChange={(e) => updateRow(row.id, { montantN2: numVal(e.target.value) })}
          />
        </Td>
        <Td className="w-10 px-1">
          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => duplicateRow(row.id)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeRow(row.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </Td>
      </SortableTableRow>
    ),
    [updateRow, duplicateRow, removeRow]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Réduction de capital"
        description="Réduction du capital social (avec ou sans remboursement aux associés)."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={9}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune réduction — cliquez sur « Ajouter » pour commencer."
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
        footer={<TotauxCapitalRow rows={rows} dossierId={dossierId} />}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />{/* DragHandle */}
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-30">Hypothèse</Th>
            <Th className="w-28">Date</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Prêts inter-entreprises
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PretsSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: DiversPretRow[];
}) {
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.prets;
  const isDirty = draft.hasUnsavedPrets;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setPrets(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const setRows = useCallback(
    (updater: (prev: DiversPretRow[]) => DiversPretRow[]) =>
      store.setPretsRows(dossierId, updater(store.getDraft(dossierId).prets)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const addRow = useCallback(
    () => store.setPretsRows(dossierId, [...store.getDraft(dossierId).prets, emptyPretRow()]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const addGroupe = useCallback(() => {
    const current = store.getDraft(dossierId).prets;
    const existing = new Set(current.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setPretsRows(dossierId, [...current, emptyPretRow(`Groupe ${n}`)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const addRowToGroupe = useCallback(
    (groupe: string) =>
      store.setPretsRows(dossierId, [...store.getDraft(dossierId).prets, emptyPretRow(groupe)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const updateRow = useCallback(
    (id: string, data: Partial<DiversPretRow>) =>
      store.setPretsRows(
        dossierId,
        store.getDraft(dossierId).prets.map((r) => (r.id === id ? { ...r, ...data } : r))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const removeRow = useCallback(
    (id: string) =>
      store.setPretsRows(dossierId, store.getDraft(dossierId).prets.filter((r) => r.id !== id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const duplicateRow = useCallback(
    (id: string) => {
      const current = store.getDraft(dossierId).prets;
      const idx = current.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const { id: _id, ...rest } = current[idx];
      const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
      const next = [...current];
      next.splice(idx + 1, 0, copy);
      store.setPretsRows(dossierId, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossierId]
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await savePrets(dossierId, rows);
      if (result.success) {
        const fresh = await fetchPrets(dossierId);
        store.markPretsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, rows]);

  const renderGroupSummaryCells = useCallback(
    (groupRows: DiversPretRow[]) => {
      const active = groupRows.filter((r) => r.actif !== false);
      return (
        <>
          <td />{/* DateDébut */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + r.capital, 0))}
          </td>
          <td />{/* Taux */}
          <td />{/* Durée */}
          <td />{/* Périodicité */}
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + calculerEcheancePret(r.capital, r.taux, r.dureeMois, r.periodicite).echeance, 0))}
          </td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">
            {fmt(active.reduce((s, r) => s + calculerEcheancePret(r.capital, r.taux, r.dureeMois, r.periodicite).coutTotal, 0))}
          </td>
        </>
      );
    },
    []
  );

  const renderRow = useCallback(
    (row: DiversPretRow & { id: string }) => {
      const { echeance, coutTotal } = calculerEcheancePret(row.capital, row.taux, row.dureeMois, row.periodicite);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
        >
          <DragHandleCell />
          <Td className="pl-1">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(row.id, { actif: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Libellé"
              onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese ?? "COMMUNE"}
              onChange={(e) => updateRow(row.id, { hypothese: e.target.value as HypotheseType })}
            >
              {HYPOTHESE_TYPE_OPTIONS.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
              ))}
            </select>
          </Td>
          <Td className="w-28">
            <input
              type="text"
              className={cellInput}
              value={row.dateDebut ?? ""}
              onChange={(e) => updateRow(row.id, { dateDebut: e.target.value })}
              placeholder="MM/AAAA"
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.capital}
              min={0}
              onChange={(e) => updateRow(row.id, { capital: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-20">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.taux}
              min={0}
              max={100}
              step={0.01}
              onChange={(e) => updateRow(row.id, { taux: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-20">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.dureeMois}
              min={1}
              onChange={(e) => updateRow(row.id, { dureeMois: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </Td>
          <Td className="w-28">
            <select
              className={cellSelect}
              value={row.periodicite}
              onChange={(e) => updateRow(row.id, { periodicite: e.target.value as DiversPretRow["periodicite"] })}
            >
              {PERIODICITES_PRET.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Td>
          <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
            {formatNumber(echeance)}
          </Td>
          <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
            {formatNumber(coutTotal)}
          </Td>
          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => duplicateRow(row.id)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeRow(row.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [updateRow, duplicateRow, removeRow]
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Prêts inter-entreprises"
        description="Prêts accordés ou reçus entre entreprises liées — échéance calculée automatiquement."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onAddGroup={addGroupe}
        onSave={handleSave}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={12}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucun prêt inter-entreprises — cliquez sur « Ajouter » pour commencer."
        renderGroupSummaryCells={renderGroupSummaryCells}
        groupNameColSpan={3}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />{/* DragHandle */}
            <Th className="w-8">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="min-w-25">Hypothèse</Th>
            <Th className="w-28">Date début</Th>
            <Th className="w-28 text-right">Capital (€)</Th>
            <Th className="w-20 text-right">Taux (%)</Th>
            <Th className="w-20 text-right">Durée (mois)</Th>
            <Th className="w-28">Périodicité</Th>
            <Th className="w-28 text-right">Échéance (€)</Th>
            <Th className="w-28 text-right">Coût total (€)</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Composant principal — DiversForm
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DiversFormProps {
  dossierId: string;
  remboursementsCCInitial?: DiversFluxDateRow[];
  dividendesInitial?: DiversFluxDateRow[];
  augmentationsCapitalInitial?: DiversOperationCapitalRow[];
  reductionsCapitalInitial?: DiversOperationCapitalRow[];
  deblocagesParticipationInitial?: DiversFluxDateRow[];
  pretsInitial?: DiversPretRow[];
  encaissementsInitial?: DiversFluxDateRow[];
  decaissementsInitial?: DiversFluxDateRow[];
}

export function DiversForm({
  dossierId,
  remboursementsCCInitial = [],
  dividendesInitial = [],
  augmentationsCapitalInitial = [],
  reductionsCapitalInitial = [],
  deblocagesParticipationInitial = [],
  pretsInitial = [],
  encaissementsInitial = [],
  decaissementsInitial = [],
}: DiversFormProps) {
  const store = useDiversStore();

  // ── Config sections flux datés ──────────────────────────────────────────────

  const remboursementsCCConfig: FluxSectionConfig = {
    type: "REMBOURSEMENT_CC",
    title: "Remboursements en comptes courants",
    description: "Remboursements de comptes courants d'associés — ↓ Trésorerie, ↓ Dettes.",
    emptyMessage: "Aucun remboursement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).remboursementsCC,
    isDirty: (id) => store.getDraft(id).hasUnsavedRemboursementsCC,
    setRows: (id, rows) => store.setRemboursementsCC(id, rows),
    setRowsDirty: (id, rows) => store.setRemboursementsCCRows(id, rows),
    markSaved: (id, rows) => store.markRemboursementsCCSaved(id, rows),
  };

  const dividendesConfig: FluxSectionConfig = {
    type: "DIVIDENDE",
    title: "Dividendes distribués",
    description: "Distribution de dividendes — ↓ Trésorerie, ↓ Réserves.",
    emptyMessage: "Aucun dividende — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).dividendes,
    isDirty: (id) => store.getDraft(id).hasUnsavedDividendes,
    setRows: (id, rows) => store.setDividendes(id, rows),
    setRowsDirty: (id, rows) => store.setDividendesRows(id, rows),
    markSaved: (id, rows) => store.markDividendesSaved(id, rows),
  };

  const deblocagesConfig: FluxSectionConfig = {
    type: "DEBLOCAGE_PARTICIPATION",
    title: "Déblocages de la participation des salariés",
    description: "Simulation du déblocage de participation salariale — ↓ Trésorerie.",
    emptyMessage: "Aucun déblocage — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).deblocagesParticipation,
    isDirty: (id) => store.getDraft(id).hasUnsavedDeblocagesParticipation,
    setRows: (id, rows) => store.setDeblocagesParticipation(id, rows),
    setRowsDirty: (id, rows) => store.setDeblocagesParticipationRows(id, rows),
    markSaved: (id, rows) => store.markDeblocagesParticipationSaved(id, rows),
  };

  const encaissementsConfig: FluxSectionConfig = {
    type: "ENCAISSEMENT",
    title: "Encaissements exceptionnels",
    description: "Encaissements de trésorerie hors activité courante — ↑ Trésorerie.",
    emptyMessage: "Aucun encaissement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).encaissements,
    isDirty: (id) => store.getDraft(id).hasUnsavedEncaissements,
    setRows: (id, rows) => store.setEncaissements(id, rows),
    setRowsDirty: (id, rows) => store.setEncaissementsRows(id, rows),
    markSaved: (id, rows) => store.markEncaissementsSaved(id, rows),
  };

  const decaissementsConfig: FluxSectionConfig = {
    type: "DECAISSEMENT",
    title: "Décaissements exceptionnels",
    description: "Décaissements de trésorerie hors activité courante — ↓ Trésorerie.",
    emptyMessage: "Aucun décaissement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).decaissements,
    isDirty: (id) => store.getDraft(id).hasUnsavedDecaissements,
    setRows: (id, rows) => store.setDecaissements(id, rows),
    setRowsDirty: (id, rows) => store.setDecaissementsRows(id, rows),
    markSaved: (id, rows) => store.markDecaissementsSaved(id, rows),
  };

  return (
    <div className="space-y-10 py-8 px-32">
      <div>
        <h2 className="text-2xl font-bold leading-tight">Divers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opérations financières et patrimoniales hors activité courante : comptes courants, dividendes, capital, prêts inter-entreprises, flux de trésorerie exceptionnels.
        </p>
      </div>

      {/* Remboursements en comptes courants */}
      <FluxDateeSection
        dossierId={dossierId}
        initialData={remboursementsCCInitial}
        config={remboursementsCCConfig}
      />

      {/* Dividendes distribués */}
      <FluxDateeSection
        dossierId={dossierId}
        initialData={dividendesInitial}
        config={dividendesConfig}
      />

      {/* Augmentation de capital */}
      <AugmentationCapitalSection
        dossierId={dossierId}
        initialData={augmentationsCapitalInitial}
      />

      {/* Réduction de capital */}
      <ReductionCapitalSection
        dossierId={dossierId}
        initialData={reductionsCapitalInitial}
      />

      {/* Déblocages de participation */}
      <FluxDateeSection
        dossierId={dossierId}
        initialData={deblocagesParticipationInitial}
        config={deblocagesConfig}
      />

      {/* Prêts inter-entreprises */}
      <PretsSection dossierId={dossierId} initialData={pretsInitial} />

      {/* Encaissements */}
      <FluxDateeSection
        dossierId={dossierId}
        initialData={encaissementsInitial}
        config={encaissementsConfig}
      />

      {/* Décaissements */}
      <FluxDateeSection
        dossierId={dossierId}
        initialData={decaissementsInitial}
        config={decaissementsConfig}
      />
    </div>
  );
}

