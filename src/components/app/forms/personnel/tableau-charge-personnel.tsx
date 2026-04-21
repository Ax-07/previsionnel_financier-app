"use client";

/**
 * Tableau générique pour les charges de personnel de type :
 * - AUTRE         : autres charges (avec dates, sans calcul auto)
 * - REMBOURSEMENT : remboursements de frais (avec dates, sans calcul auto)
 * - PARTICIPATION : participation des salariés (sans dates, avec calcul auto)
 *
 * La configuration de chaque type est centralisée dans CHARGE_CONFIG.
 */

import { type ReactNode, useCallback, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Package, RotateCcw, UsersRound, Trash2, Copy } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { filterByHypothese, type HypotheseType } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { HYPOTHESES_PERSONNEL, type LigneChargePersonnelRow } from "@/lib/schemas/personnel";
import { usePersonnelStore, type PersonnelDraft } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesChargesPersonnel } from "@/app/actions/personnel";
import { SectionHeader, Th, Td, cellInput, cellSelect, fmt } from "./personnel-form-shared";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES ET CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** Les trois types de charges génériques dans le tableau personnel. */
export type TypeChargePersonnel = "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION";

interface ChargeConfig {
  title: string;
  description: string;
  icon: ReactNode;
  listKey: keyof Pick<PersonnelDraft, "autresCharges" | "remboursements" | "participations">;
  dirtyKey: keyof Pick<PersonnelDraft, "hasUnsavedAutresCharges" | "hasUnsavedRemboursements" | "hasUnsavedParticipations">;
  /** Afficher les colonnes de dates de paiement */
  withDates: boolean;
  /** Afficher la colonne « Calc. auto » (participation = % de la masse salariale) */
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau générique de saisie des charges de personnel.
 * Le comportement (colonnes dates, calcul auto) est déterminé par le `type` fourni.
 */
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
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();

  const rows = draft[config.listKey] as LigneChargePersonnelRow[];
  const isDirty = draft[config.dirtyKey] as boolean;

  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      handleSet(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // ── Dispatch vers les actions du store selon le type ─────────────────────
  const handleAdd = useCallback(() => {
    if (type === "AUTRE")          return store.addAutreCharge(dossierId);
    if (type === "REMBOURSEMENT")  return store.addRemboursement(dossierId);
    if (type === "PARTICIPATION")  return store.addParticipation(dossierId);
  }, [store, dossierId, type]);

  const handleRemove = useCallback((i: number) => {
    if (type === "AUTRE")          return store.removeAutreCharge(dossierId, i);
    if (type === "REMBOURSEMENT")  return store.removeRemboursement(dossierId, i);
    if (type === "PARTICIPATION")  return store.removeParticipation(dossierId, i);
  }, [store, dossierId, type]);

  const handleDuplicate = useCallback((i: number) => {
    if (type === "AUTRE")          return store.duplicateAutreCharge(dossierId, i);
    if (type === "REMBOURSEMENT")  return store.duplicateRemboursement(dossierId, i);
    if (type === "PARTICIPATION")  return store.duplicateParticipation(dossierId, i);
  }, [store, dossierId, type]);

  const handleUpdate = useCallback((i: number, data: Partial<LigneChargePersonnelRow>) => {
    if (type === "AUTRE")          return store.updateAutreCharge(dossierId, i, data);
    if (type === "REMBOURSEMENT")  return store.updateRemboursement(dossierId, i, data);
    if (type === "PARTICIPATION")  return store.updateParticipation(dossierId, i, data);
  }, [store, dossierId, type]);

  const handleSet = useCallback((data: LigneChargePersonnelRow[]) => {
    if (type === "AUTRE")          return store.setAutresCharges(dossierId, data);
    if (type === "REMBOURSEMENT")  return store.setRemboursements(dossierId, data);
    if (type === "PARTICIPATION")  return store.setParticipations(dossierId, data);
  }, [store, dossierId, type]);

  const handleMarkSaved = useCallback(() => {
    if (type === "AUTRE")          return store.markAutresChargesSaved(dossierId);
    if (type === "REMBOURSEMENT")  return store.markRemboursementsSaved(dossierId);
    if (type === "PARTICIPATION")  return store.markParticipationsSaved(dossierId);
  }, [store, dossierId, type]);


  const invalidateControleStores = useInvalidateControleStores();

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

  // ── Nb de colonnes dynamique (pour le colspan de la ligne vide) ──────────
  const colCount = 3 /* Act. + Libellé + Hyp. */
    + (config.withCalcAuto ? 1 /* Calc. */ : 0)
    + (config.withDates ? 6 /* 3× date+montant */ : 3 /* 3× montant */)
    + 1; /* actions */

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? `${type}-${i}`}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
                >
                  <Td className="pl-2">
                    <input type="checkbox" checked={row.actif !== false} onChange={(e) => handleUpdate(i, { actif: e.target.checked })} className="h-3.5 w-3.5 accent-primary" aria-label="Activer" />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.libelle} placeholder="Libellé…" onChange={(e) => handleUpdate(i, { libelle: e.target.value })} />
                  </Td>
                  <Td>
                    <select className={cellSelect} value={row.hypothese} onChange={(e) => handleUpdate(i, { hypothese: e.target.value as HypotheseType })} aria-label="Hypothèse">
                      {HYPOTHESES_PERSONNEL.map((h) => <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>)}
                    </select>
                  </Td>
                  {config.withCalcAuto && (
                    <Td className="text-center">
                      <input
                        type="checkbox"
                        checked={row.calcAuto ?? false}
                        onChange={(e) => handleUpdate(i, { calcAuto: e.target.checked })}
                        className="h-3.5 w-3.5 accent-primary"
                        aria-label="Calcul auto"
                      />
                    </Td>
                  )}
                  {config.withDates ? (
                    <>
                      <Td>
                        <input className={cellInput} value={row.dateN ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N" onChange={(e) => handleUpdate(i, { dateN: e.target.value })} />
                      </Td>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN === 0 ? "" : row.montantN}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                        />
                      </Td>
                      <Td>
                        <input className={cellInput} value={row.dateN1 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+1" onChange={(e) => handleUpdate(i, { dateN1: e.target.value })} />
                      </Td>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN1 === 0 ? "" : row.montantN1}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
                        />
                      </Td>
                      <Td>
                        <input className={cellInput} value={row.dateN2 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+2" onChange={(e) => handleUpdate(i, { dateN2: e.target.value })} />
                      </Td>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN2 === 0 ? "" : row.montantN2}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
                        />
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN === 0 ? "" : row.montantN}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                        />
                      </Td>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN1 === 0 ? "" : row.montantN1}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
                        />
                      </Td>
                      <Td>
                        <input
                          type="text" inputMode="decimal"
                          className={cn(cellInput, "text-right")}
                          value={row.montantN2 === 0 ? "" : row.montantN2}
                          placeholder="0"
                          onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
                        />
                      </Td>
                    </>
                  )}
                  <Td className="text-center px-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        className="flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handleDuplicate(i)}
                        title="Dupliquer"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => handleRemove(i)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td
                  colSpan={3 + (config.withCalcAuto ? 1 : 0) + (config.withDates ? 1 : 0)}
                  className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground"
                >
                  Total (actifs)
                </td>
                {config.withDates ? (
                  <>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}
                    </td>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}
                    </td>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}
                    </td>
                    <td />
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}
                    </td>
                    <td />
                  </>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
