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
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  PERIODICITES_PRET,
  calculerEcheancePret,
  type DiversFluxDateRow,
  type DiversOperationCapitalRow,
  type DiversPretRow,
} from "@/lib/schemas/divers";

import { useDiversStore } from "@/stores/divers-store";
import {
  fetchFluxDates,
  saveFluxDates,
  fetchOperationsCapital,
  saveOperationsCapital,
  fetchPrets,
  savePrets,
} from "@/app/actions/divers";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Styles helpers ───────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Composants utilitaires ───────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  isDirty,
  isSaving,
  onAdd,
  onSave,
}: {
  title: string;
  description?: string;
  isDirty: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div>
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
            Modifications non enregistrées
          </Badge>
        )}
        {isDirty && (
          <Button size="sm" variant="default" className="h-7 gap-1 text-xs" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Enregistrer
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>;
}

// ── Totaux ───────────────────────────────────────────────────────────────────

function TotauxFluxRow({ rows }: { rows: DiversFluxDateRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN2, 0))}</td>
        <td />
      </tr>
    </tfoot>
  );
}

function TotauxCapitalRow({ rows }: { rows: DiversOperationCapitalRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN2, 0))}</td>
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
  setRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addRow: (dossierId: string) => void;
  updateRow: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeRow: (dossierId: string, index: number) => void;
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
  const store = useDiversStore();
  const draft = store.getDraft(dossierId);
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
  }, [dossierId, draft]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title={config.title}
        description={config.description}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => config.addRow(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {config.emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn("group border-t border-border", !row.actif && "opacity-50")}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) => config.updateRow(dossierId, i, { actif: e.target.checked })}
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) => config.updateRow(dossierId, i, { libelle: e.target.value })}
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.hypothese ?? ""}
                      onChange={(e) => config.updateRow(dossierId, i, { hypothese: e.target.value })}
                      placeholder="Hypothèse"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="text"
                      className={cellInput}
                      value={row.dateN ?? ""}
                      onChange={(e) => config.updateRow(dossierId, i, { dateN: e.target.value })}
                      placeholder="MM/AAAA"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN}
                      min={0}
                      onChange={(e) => config.updateRow(dossierId, i, { montantN: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="text"
                      className={cellInput}
                      value={row.dateN1 ?? ""}
                      onChange={(e) => config.updateRow(dossierId, i, { dateN1: e.target.value })}
                      placeholder="MM/AAAA"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) => config.updateRow(dossierId, i, { montantN1: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="text"
                      className={cellInput}
                      value={row.dateN2 ?? ""}
                      onChange={(e) => config.updateRow(dossierId, i, { dateN2: e.target.value })}
                      placeholder="MM/AAAA"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) => config.updateRow(dossierId, i, { montantN2: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => config.removeRow(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxFluxRow rows={rows} />}
        </table>
      </div>
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
  }, [dossierId, rows, store]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Augmentation de capital par incorporation de réserves"
        description="Transformation des réserves en capital — aucun flux de trésorerie."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addAugmentationCapital(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">Actif</Th>
              <Th className="min-w-45">Libellé</Th>
              <Th className="min-w-30">Hypothèse</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune augmentation — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn("group border-t border-border", !row.actif && "opacity-50")}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { actif: e.target.checked })}
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { libelle: e.target.value })}
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.hypothese ?? ""}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { hypothese: e.target.value })}
                      placeholder="Hypothèse"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN}
                      min={0}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { montantN: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { montantN1: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) => store.updateAugmentationCapital(dossierId, i, { montantN2: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => store.removeAugmentationCapital(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxCapitalRow rows={rows} />}
        </table>
      </div>
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
  }, [dossierId, rows, store]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Réduction de capital"
        description="Réduction du capital social (avec ou sans remboursement aux associés)."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addReductionCapital(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune réduction — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn("group border-t border-border", !row.actif && "opacity-50")}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { actif: e.target.checked })}
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { libelle: e.target.value })}
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.hypothese ?? ""}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { hypothese: e.target.value })}
                      placeholder="Hypothèse"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="text"
                      className={cellInput}
                      value={row.date ?? ""}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { date: e.target.value })}
                      placeholder="MM/AAAA"
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN}
                      min={0}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { montantN: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { montantN1: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) => store.updateReductionCapital(dossierId, i, { montantN2: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => store.removeReductionCapital(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxCapitalRow rows={rows} />}
        </table>
      </div>
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
  }, [dossierId, rows, store]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Prêts inter-entreprises"
        description="Prêts accordés ou reçus entre entreprises liées — échéance calculée automatiquement."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addPret(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucun prêt inter-entreprises — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const { echeance, coutTotal } = calculerEcheancePret(
                  row.capital,
                  row.taux,
                  row.dureeMois,
                  row.periodicite
                );
                return (
                  <tr
                    key={i}
                    className={cn("group border-t border-border", !row.actif && "opacity-50")}
                  >
                    <Td className="w-8 px-2">
                      <input
                        type="checkbox"
                        checked={row.actif ?? true}
                        onChange={(e) => store.updatePret(dossierId, i, { actif: e.target.checked })}
                        className="accent-primary"
                      />
                    </Td>
                    <Td>
                      <input
                        className={cellInput}
                        value={row.libelle}
                        onChange={(e) => store.updatePret(dossierId, i, { libelle: e.target.value })}
                        placeholder="Libellé"
                      />
                    </Td>
                    <Td>
                      <input
                        className={cellInput}
                        value={row.hypothese ?? ""}
                        onChange={(e) => store.updatePret(dossierId, i, { hypothese: e.target.value })}
                        placeholder="Hypothèse"
                      />
                    </Td>
                    <Td className="w-28">
                      <input
                        type="text"
                        className={cellInput}
                        value={row.dateDebut ?? ""}
                        onChange={(e) => store.updatePret(dossierId, i, { dateDebut: e.target.value })}
                        placeholder="MM/AAAA"
                      />
                    </Td>
                    <Td className="w-28">
                      <input
                        type="number"
                        className={cn(cellInput, "text-right")}
                        value={row.capital}
                        min={0}
                        onChange={(e) => store.updatePret(dossierId, i, { capital: numVal(e.target.value) })}
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
                        onChange={(e) => store.updatePret(dossierId, i, { taux: numVal(e.target.value) })}
                      />
                    </Td>
                    <Td className="w-20">
                      <input
                        type="number"
                        className={cn(cellInput, "text-right")}
                        value={row.dureeMois}
                        min={1}
                        onChange={(e) => store.updatePret(dossierId, i, { dureeMois: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </Td>
                    <Td className="w-28">
                      <select
                        className={cellSelect}
                        value={row.periodicite}
                        onChange={(e) =>
                          store.updatePret(dossierId, i, {
                            periodicite: e.target.value as DiversPretRow["periodicite"],
                          })
                        }
                      >
                        {PERIODICITES_PRET.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </Td>
                    <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
                      {fmt(echeance)}
                    </Td>
                    <Td className="w-28 px-2 text-right tabular-nums text-sm text-muted-foreground">
                      {fmt(coutTotal)}
                    </Td>
                    <Td className="w-10 px-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => store.removePret(dossierId, i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
    addRow: (id) => store.addRemboursementCC(id),
    updateRow: (id, i, data) => store.updateRemboursementCC(id, i, data),
    removeRow: (id, i) => store.removeRemboursementCC(id, i),
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
    addRow: (id) => store.addDividende(id),
    updateRow: (id, i, data) => store.updateDividende(id, i, data),
    removeRow: (id, i) => store.removeDividende(id, i),
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
    addRow: (id) => store.addDeblocageParticipation(id),
    updateRow: (id, i, data) => store.updateDeblocageParticipation(id, i, data),
    removeRow: (id, i) => store.removeDeblocageParticipation(id, i),
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
    addRow: (id) => store.addEncaissement(id),
    updateRow: (id, i, data) => store.updateEncaissement(id, i, data),
    removeRow: (id, i) => store.removeEncaissement(id, i),
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
    addRow: (id) => store.addDecaissement(id),
    updateRow: (id, i, data) => store.updateDecaissement(id, i, data),
    removeRow: (id, i) => store.removeDecaissement(id, i),
    markSaved: (id, rows) => store.markDecaissementsSaved(id, rows),
  };

  return (
    <div className="space-y-10">
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
