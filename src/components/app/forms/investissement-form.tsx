"use client";

/**
 * Formulaire investissements — 3 tableaux éditables inline
 * - Tableau des immobilisations
 * - Tableau des cessions d'immobilisations
 * - Tableau de crédit-bail / location financière
 */

import { useCallback, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  NATURES_IMMOBILISATION,
  MODES_AMORTISSEMENT,
  TYPES_TVA,
  TAUX_TVA_OPTIONS,
  PERIODICITES,
  type ImmobilisationRow,
  type CessionRow,
  type CreditBailRow,
  type ImmobilisationWithPlan,
} from "@/lib/schemas/investissement";
import { calcCession } from "@/lib/calcul/cession";

import {
  upsertImmobilisation,
  deleteImmobilisation,
  upsertCession,
  deleteCession,
  upsertCreditBail,
  deleteCreditBail,
} from "@/app/actions/investissement";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

import {
  useInvestissementStore,
  type LocalImmo,
  type LocalCession,
  type LocalCredit,
} from "@/stores/investissement-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function intVal(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function tempId() {
  return `__new__${crypto.randomUUID()}`;
}

// ── Composants utilitaires ────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  isDirty,
  isSaving,
  onAdd,
  onSave,
}: {
  title: string;
  description: string;
  isDirty: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div>
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
            Modifications non enregistrées
          </Badge>
        )}
        {isDirty && (
          <Button
            size="sm"
            variant="default"
            className="h-7 gap-1 text-xs"
            onClick={onSave}
            disabled={isSaving}
          >
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
    <th
      className={cn(
        "border-r border-border last:border-r-0 px-1.5 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-r border-border last:border-r-0 p-0 align-middle", className)}>
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 1 — IMMOBILISATIONS
// ─────────────────────────────────────────────────────────────────────────────

function TableauImmobilisations({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: ImmobilisationWithPlan[];
  dateDebutExerciceN?: string;
}) {
  const _storeRows = useInvestissementStore((s) => s.immos[dossierId]);
  const setImmos = useInvestissementStore((s) => s.setImmos);
  const hydrateImmos = useInvestissementStore((s) => s.hydrateImmos);

  useEffect(() => {
    hydrateImmos(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const rows = _storeRows ?? initialData.map((d) => ({ ...d, _dirty: false }));
  const setRows = useCallback(
    (updater: (prev: LocalImmo[]) => LocalImmo[]) => setImmos(dossierId, updater),
    [dossierId, setImmos]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty);
  const invalidateControleStores = useInvalidateControleStores();

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: tempId(),
        libelle: "",
        nature: "CORPOREL",
        dateAcquisition: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
        montantHT: 0,
        modeAmortissement: "LINEAIRE",
        differe: 0,
        dureeAmortissement: 5,
        tauxTVA: 20,
        typeTva: "RECUPERABLE",
        actif: true,
        ordre: prev.length,
        _dirty: true,
      } satisfies LocalImmo,
    ]);
  }, [setRows, dateDebutExerciceN]);

  const updateRow = useCallback(
    <K extends keyof LocalImmo>(idx: number, key: K, value: LocalImmo[K]) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row) return;
      if (row.id?.startsWith("__new__")) {
        setRows((prev) => prev.filter((_, i) => i !== idx));
        return;
      }
      startTransition(async () => {
        const res = await deleteImmobilisation(row.id!);
        if (res.success) {
          setRows((prev) => prev.filter((_, i) => i !== idx));
          toast.success("Ligne supprimée.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(res.error);
        }
      });
    },
    [rows, setRows]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty);
      const results = await Promise.all(
        dirtyRows.map((row) => {
          const payload: ImmobilisationRow = {
            ...row,
            id: row.id?.startsWith("__new__") ? undefined : row.id,
          };
          return upsertImmobilisation(dossierId, payload).then((res) => ({ res, row }));
        })
      );
      let hasError = false;
      setRows((prev) => {
        const next = [...prev];
        for (const { res, row } of results) {
          if (res.success) {
            const i = next.findIndex((r) => r.id === row.id);
            if (i >= 0) next[i] = { ...next[i], id: res.id ?? next[i].id, _dirty: false };
          } else {
            hasError = true;
            toast.error(`Erreur : ${res.error}`);
          }
        }
        return next;
      });
      if (!hasError) toast.success("Immobilisations enregistrées.");
      if (!hasError) invalidateControleStores(dossierId);
    });
  }, [rows, dossierId, setRows]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Immobilisations"
        description="Actifs corporels, incorporels et financiers"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-45">Libellé</Th>
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
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center text-muted-foreground text-xs py-6">
                  Aucune immobilisation. Cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    checked={row.actif ?? true}
                    onChange={(e) => updateRow(idx, "actif", e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    title={(row.actif ?? true) ? "Désactiver" : "Activer"}
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => updateRow(idx, "libelle", e.target.value)}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.nature}
                    onChange={(e) =>
                      updateRow(idx, "nature", e.target.value as ImmobilisationRow["nature"])
                    }
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
                    onChange={(e) => updateRow(idx, "dateAcquisition", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.montantHT === 0 ? "" : row.montantHT}
                    placeholder="0"
                    onChange={(e) => updateRow(idx, "montantHT", numVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.modeAmortissement}
                    onChange={(e) => {
                      const mode = e.target.value as ImmobilisationRow["modeAmortissement"];
                      setRows((prev) => {
                        const next = [...prev];
                        next[idx] = {
                          ...next[idx],
                          modeAmortissement: mode,
                          ...(mode === "AUCUN" ? { dureeAmortissement: 0, differe: 0 } : {}),
                          _dirty: true,
                        };
                        return next;
                      });
                    }}
                  >
                    {MODES_AMORTISSEMENT.map((m) => (
                      <option key={m.value} value={m.value} className="bg-background text-foreground">{m.label}</option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={1}
                    className={cn(cellInput, "text-right")}
                    value={row.differe ?? ""}
                    placeholder="0"
                    disabled={row.modeAmortissement === "AUCUN"}
                    onChange={(e) => updateRow(idx, "differe", intVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={1} step={1}
                    className={cn(cellInput, "text-right")}
                    value={row.dureeAmortissement ?? ""}
                    placeholder="5"
                    disabled={row.modeAmortissement === "AUCUN"}
                    onChange={(e) => updateRow(idx, "dureeAmortissement", intVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.tauxTVA}
                    onChange={(e) => updateRow(idx, "tauxTVA", numVal(e.target.value))}
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
                    onChange={(e) =>
                      updateRow(idx, "typeTva", e.target.value as ImmobilisationRow["typeTva"])
                    }
                  >
                    {TYPES_TVA.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
                    ))}
                  </select>
                </Td>
                <Td className="text-center">
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => removeRow(idx)}
                    title="Supprimer"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 2 — CESSIONS
// ─────────────────────────────────────────────────────────────────────────────

function TableauCessions({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: CessionRow[];
  dateDebutExerciceN?: string;
}) {
  const _storeRows = useInvestissementStore((s) => s.cessions[dossierId]);
  const setCessions = useInvestissementStore((s) => s.setCessions);
  const hydrateCessions = useInvestissementStore((s) => s.hydrateCessions);

  useEffect(() => {
    hydrateCessions(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const rows = _storeRows ?? initialData.map((d) => ({ ...d, _dirty: false }));
  const setRows = useCallback(
    (updater: (prev: LocalCession[]) => LocalCession[]) => setCessions(dossierId, updater),
    [dossierId, setCessions]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty);
  const invalidateControleStores = useInvalidateControleStores();

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: tempId(),
        libelle: "",
        nature: "CORPOREL",
        dateCession: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
        prixVente: 0,
        prixAchat: 0,
        dejaAmortie: 0,
        tauxTVA: 20,
        actif: true,
        ordre: prev.length,
        _dirty: true,
      } satisfies LocalCession,
    ]);
  }, [setRows, dateDebutExerciceN]);

  const updateRow = useCallback(
    <K extends keyof LocalCession>(idx: number, key: K, value: LocalCession[K]) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row) return;
      if (row.id?.startsWith("__new__")) {
        setRows((prev) => prev.filter((_, i) => i !== idx));
        return;
      }
      startTransition(async () => {
        const res = await deleteCession(row.id!);
        if (res.success) {
          setRows((prev) => prev.filter((_, i) => i !== idx));
          toast.success("Ligne supprimée.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(res.error);
        }
      });
    },
    [rows, setRows]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty);
      const results = await Promise.all(
        dirtyRows.map((row) => {
          const payload: CessionRow = {
            ...row,
            id: row.id?.startsWith("__new__") ? undefined : row.id,
          };
          return upsertCession(dossierId, payload).then((res) => ({ res, row }));
        })
      );
      let hasError = false;
      setRows((prev) => {
        const next = [...prev];
        for (const { res, row } of results) {
          if (res.success) {
            const i = next.findIndex((r) => r.id === row.id);
            if (i >= 0) next[i] = { ...next[i], id: res.id ?? next[i].id, _dirty: false };
          } else {
            hasError = true;
            toast.error(`Erreur : ${res.error}`);
          }
        }
        return next;
      });
      if (!hasError) toast.success("Cessions enregistrées.");
      if (!hasError) invalidateControleStores(dossierId);
    });
  }, [rows, dossierId, setRows]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Cessions d'immobilisations"
        description="Ventes d'actifs — plus-value calculée automatiquement"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-40">Libellé</Th>
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
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center text-muted-foreground text-xs py-6">
                  Aucune cession. Cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => {
              const calc = calcCession(row);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                    row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
                    !(row.actif ?? true) && "opacity-50"
                  )}
                >
                  <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
                  <Td className="text-center px-1">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) => updateRow(idx, "actif", e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                      title={(row.actif ?? true) ? "Désactiver" : "Activer"}
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      placeholder="Libellé"
                      onChange={(e) => updateRow(idx, "libelle", e.target.value)}
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.nature}
                      onChange={(e) =>
                        updateRow(idx, "nature", e.target.value as CessionRow["nature"])
                      }
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
                      onChange={(e) => updateRow(idx, "dateCession", e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} step={0.01}
                      className={cn(cellInput, "text-right")}
                      value={row.prixVente === 0 ? "" : row.prixVente}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "prixVente", numVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} step={0.01}
                      className={cn(cellInput, "text-right")}
                      value={row.prixAchat === 0 ? "" : row.prixAchat}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "prixAchat", numVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} step={0.01}
                      className={cn(cellInput, "text-right")}
                      value={row.dejaAmortie === 0 ? "" : row.dejaAmortie}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "dejaAmortie", numVal(e.target.value))}
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
                      onChange={(e) => updateRow(idx, "tauxTVA", numVal(e.target.value))}
                    >
                      {TAUX_TVA_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
                      ))}
                    </select>
                  </Td>
                  <Td className="text-center">
                    <button
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeRow(idx)}
                      title="Supprimer"
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 3 — CRÉDIT-BAIL
// ─────────────────────────────────────────────────────────────────────────────

function TableauCreditBail({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: CreditBailRow[];
  dateDebutExerciceN?: string;
}) {
  const _storeRows = useInvestissementStore((s) => s.credits[dossierId]);
  const setCredits = useInvestissementStore((s) => s.setCredits);
  const hydrateCredits = useInvestissementStore((s) => s.hydrateCredits);

  useEffect(() => {
    hydrateCredits(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const rows = _storeRows ?? initialData.map((d) => ({ ...d, _dirty: false }));
  const setRows = useCallback(
    (updater: (prev: LocalCredit[]) => LocalCredit[]) => setCredits(dossierId, updater),
    [dossierId, setCredits]
  );
  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty);
  const invalidateControleStores = useInvalidateControleStores();

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: tempId(),
        libelle: "",
        dateDebut: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
        montantHT: 0,
        taux: 0,
        duree: 36,
        periodicite: "MENSUEL",
        tauxTVA: 20,
        actif: true,
        ordre: prev.length,
        _dirty: true,
      } satisfies LocalCredit,
    ]);
  }, [setRows, dateDebutExerciceN]);

  const updateRow = useCallback(
    <K extends keyof LocalCredit>(idx: number, key: K, value: LocalCredit[K]) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row) return;
      if (row.id?.startsWith("__new__")) {
        setRows((prev) => prev.filter((_, i) => i !== idx));
        return;
      }
      startTransition(async () => {
        const res = await deleteCreditBail(row.id!);
        if (res.success) {
          setRows((prev) => prev.filter((_, i) => i !== idx));
          toast.success("Ligne supprimée.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(res.error);
        }
      });
    },
    [rows, setRows]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty);
      const results = await Promise.all(
        dirtyRows.map((row) => {
          const payload: CreditBailRow = {
            ...row,
            id: row.id?.startsWith("__new__") ? undefined : row.id,
          };
          return upsertCreditBail(dossierId, payload).then((res) => ({ res, row }));
        })
      );
      let hasError = false;
      setRows((prev) => {
        const next = [...prev];
        for (const { res, row } of results) {
          if (res.success) {
            const i = next.findIndex((r) => r.id === row.id);
            if (i >= 0) next[i] = { ...next[i], id: res.id ?? next[i].id, _dirty: false };
          } else {
            hasError = true;
            toast.error(`Erreur : ${res.error}`);
          }
        }
        return next;
      });
      if (!hasError) toast.success("Crédit-baux enregistrés.");
      if (!hasError) invalidateControleStores(dossierId);
    });
  }, [rows, dossierId, setRows]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Crédit-bail / Location financière"
        description="Contrats de leasing et locations financières"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-40">Libellé</Th>
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
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center text-muted-foreground text-xs py-6">
                  Aucun crédit-bail. Cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    checked={row.actif ?? true}
                    onChange={(e) => updateRow(idx, "actif", e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    title={(row.actif ?? true) ? "Désactiver" : "Activer"}
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => updateRow(idx, "libelle", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateDebut}
                    onChange={(e) => updateRow(idx, "dateDebut", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.montantHT === 0 ? "" : row.montantHT}
                    placeholder="0"
                    onChange={(e) => updateRow(idx, "montantHT", numVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} max={100} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.taux === 0 ? "" : row.taux}
                    placeholder="0"
                    onChange={(e) => updateRow(idx, "taux", numVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={1} step={1}
                    className={cn(cellInput, "text-right")}
                    value={row.duree}
                    onChange={(e) => updateRow(idx, "duree", intVal(e.target.value))}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.periodicite}
                    onChange={(e) =>
                      updateRow(idx, "periodicite", e.target.value as CreditBailRow["periodicite"])
                    }
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
                    onChange={(e) =>
                      updateRow(idx, "dateEcheance", e.target.value || undefined)
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.valeurResiduelle ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateRow(idx, "valeurResiduelle", e.target.value ? numVal(e.target.value) : undefined)
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.premierLoyer ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateRow(idx, "premierLoyer", e.target.value ? numVal(e.target.value) : undefined)
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.loyerHT ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateRow(idx, "loyerHT", e.target.value ? numVal(e.target.value) : undefined)
                    }
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.tauxTVA}
                    onChange={(e) => updateRow(idx, "tauxTVA", numVal(e.target.value))}
                  >
                    {TAUX_TVA_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
                    ))}
                  </select>
                </Td>
                <Td className="text-center">
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => removeRow(idx)}
                    title="Supprimer"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export interface InvestissementFormProps {
  dossierId: string;
  immobilisations?: ImmobilisationWithPlan[];
  cessions?: CessionRow[];
  creditsBaux?: CreditBailRow[];
  dateDebutExerciceN?: string;
}

export function InvestissementForm({
  dossierId,
  immobilisations = [],
  cessions = [],
  creditsBaux = [],
  dateDebutExerciceN,
}: InvestissementFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto">
      <TableauImmobilisations dossierId={dossierId} initialData={immobilisations} dateDebutExerciceN={dateDebutExerciceN} />
      <TableauCessions dossierId={dossierId} initialData={cessions} dateDebutExerciceN={dateDebutExerciceN} />
      <TableauCreditBail dossierId={dossierId} initialData={creditsBaux} dateDebutExerciceN={dateDebutExerciceN} />
    </div>
  );
}