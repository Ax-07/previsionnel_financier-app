"use client";

/**
 * Onglet Charges — 3 tableaux éditables inline
 * - Fournitures consommables
 * - Services extérieurs
 * - Impôts et taxes
 */

import { useCallback, useEffect, useRef, useTransition, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2, FileText, Copy } from "lucide-react";
import { DetailChargeDialog } from "./detail-charge-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, numVal } from "@/lib/utils";

import {
  HYPOTHESES_CHARGE,
  FREQUENCES_CHARGE,
  DELAIS_REGLEMENT_CHARGE,
  TAUX_TVA_CHARGE,
  TYPES_TVA_CHARGE,
  type ChargeExploitationRow,
  type ImpotTaxeRow,
} from "@/lib/schemas/charges";

import { useChargesStore } from "@/stores/charges-store";
import { saveFournitures, saveServices, saveImpots, fetchImpots } from "@/app/actions/charges";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";

// ── Helpers ──────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

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

// ── Totaux section ───────────────────────────────────────────────────────────

function TotauxRow({ rows, dossierId }: { rows: ChargeExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const activeRows = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalN = activeRows.reduce((sum, r) => sum + r.montantN, 0);
  const totalN1 = activeRows.reduce((sum, r) => sum + r.montantN1, 0);
  const totalN2 = activeRows.reduce((sum, r) => sum + r.montantN2, 0);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={5} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN2)}</td>
        <td colSpan={6} />
      </tr>
    </tfoot>
  );
}

function TotauxImpotRow({ rows, dossierId }: { rows: ImpotTaxeRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const activeRows = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalN = activeRows.reduce((sum, r) => sum + r.montantN, 0);
  const totalN1 = activeRows.reduce((sum, r) => sum + r.montantN1, 0);
  const totalN2 = activeRows.reduce((sum, r) => sum + r.montantN2, 0);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={5} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN2)}</td>
        <td />
      </tr>
    </tfoot>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU FOURNITURES / SERVICES (structure commune)
// ─────────────────────────────────────────────────────────────────────────────

function TableauChargeExploitation({
  dossierId,
  categorie,
  title,
  description,
  initialData,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  categorie: "FOURNITURE_CONSOMMABLE" | "SERVICE_EXTERIEUR";
  title: string;
  description: string;
  initialData: ChargeExploitationRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const store = useChargesStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  const rows = categorie === "FOURNITURE_CONSOMMABLE" ? draft.fournitures : draft.services;
  const isDirty = categorie === "FOURNITURE_CONSOMMABLE" ? draft.hasUnsavedFournitures : draft.hasUnsavedServices;
  const setRows = categorie === "FOURNITURE_CONSOMMABLE" ? store.setFournitures : store.setServices;
  const addRow = categorie === "FOURNITURE_CONSOMMABLE" ? store.addFourniture : store.addService;
  const updateRow = categorie === "FOURNITURE_CONSOMMABLE" ? store.updateFourniture : store.updateService;
  const removeRow = categorie === "FOURNITURE_CONSOMMABLE" ? store.removeFourniture : store.removeService;
  const duplicateRow = categorie === "FOURNITURE_CONSOMMABLE" ? store.duplicateFourniture : store.duplicateService;
  const markSaved = categorie === "FOURNITURE_CONSOMMABLE" ? store.markFournituresSaved : store.markServicesSaved;
  const saveAction = categorie === "FOURNITURE_CONSOMMABLE" ? saveFournitures : saveServices;
  const invalidateControleStores = useInvalidateControleStores();

  // Hydratation initiale (guard anti-écrasement)
  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      setRows(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => addRow(dossierId), [addRow, dossierId]);
  const handleRemove = useCallback((i: number) => removeRow(dossierId, i), [removeRow, dossierId]);
  const handleDuplicate = useCallback((i: number) => duplicateRow(dossierId, i), [duplicateRow, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<ChargeExploitationRow>) => updateRow(dossierId, i, data),
    [updateRow, dossierId],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveAction(dossierId, rows);
      if (result.success) {
        toast.success(result.message);
        markSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [saveAction, dossierId, rows, markSaved]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title={title}
        description={description}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-7">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-36">Libellé</Th>
              <Th className="w-24">Hypothèse</Th>
              <Th className="w-8 text-center">Détail</Th>
              <Th className="w-24 text-right">N (€)</Th>
              <Th className="w-16 text-center">% Év.</Th>
              <Th className="w-24 text-right">N+1 (€)</Th>
              <Th className="w-16 text-center">% Év.</Th>
              <Th className="w-24 text-right">N+2 (€)</Th>
              <Th className="w-16 text-center">% Fixe</Th>
              <Th className="w-28">Fréquence</Th>
              <Th className="w-24">Règlement</Th>
              <Th className="w-16 text-center">TVA</Th>
              <Th className="w-28">Type TVA</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="text-center text-muted-foreground text-xs py-6">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  !(row.actif ?? true) && "opacity-50",
                )}
              >
                {/* # */}
                <Td className="text-center text-xs text-muted-foreground px-1.5">{i + 1}</Td>

                {/* Actif */}
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    checked={row.actif ?? true}
                    onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                  />
                </Td>

                {/* Libellé */}
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Ex : Emballages"
                    onChange={(e) => handleUpdate(i, { libelle: e.target.value })}
                  />
                </Td>

                {/* Hypothèse */}
                <Td>
                  <select
                    className={cellSelect}
                    value={row.hypothese}
                    onChange={(e) => handleUpdate(i, { hypothese: e.target.value as ChargeExploitationRow["hypothese"] })}
                  >
                    {HYPOTHESES_CHARGE.map((h) => (
                      <option key={h.value} value={h.value} className="bg-background text-foreground">
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Td>

                {/* Détail */}
                <Td className="text-center px-1">
                  <button
                    className={cn(
                      "relative flex items-center justify-center h-6 w-6 rounded transition-colors mx-auto",
                      row.detailCalc?.modeCalc === "POURCENTAGE_CA"
                        ? "text-amber-500 hover:bg-amber-500/10"
                        : "hover:bg-primary/10 hover:text-primary",
                    )}
                    onClick={() => setDetailIdx(i)}
                    title={
                      row.detailCalc?.modeCalc === "POURCENTAGE_CA"
                        ? "Calculé sur % du CA — cliquer pour modifier"
                        : "Voir le détail"
                    }
                  >
                    <FileText className="h-3 w-3" />
                    {row.detailCalc?.modeCalc === "POURCENTAGE_CA" && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white leading-none pointer-events-none">
                        %
                      </span>
                    )}
                  </button>
                </Td>

                {/* N */}
                <Td className={cn(row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? "bg-muted/20 text-muted-foreground" : "")}>
                  {row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? (
                    <span className="block px-1.5 py-1 text-right text-sm tabular-nums text-muted-foreground">
                      {row.montantN.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  ) : (
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN || ""}
                      placeholder="0"
                      min={0}
                      step={0.01}
                      onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                    />
                  )}
                </Td>

                {/* % Évol N→N+1 */}
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-center", row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? "bg-muted/20 text-muted-foreground" : "")}
                    value={row.evolutionN1 || ""}
                    placeholder="0"
                    step={0.1}
                    disabled={row.detailCalc?.modeCalc === "POURCENTAGE_CA"}
                    onChange={(e) => handleUpdate(i, { evolutionN1: numVal(e.target.value) })}
                  />
                </Td>

                {/* N+1 (calculé) */}
                <Td className="bg-muted/20">
                  <span className="block px-1.5 py-1 text-right text-sm tabular-nums text-muted-foreground">
                    {row.montantN1.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </Td>

                {/* % Évol N+1→N+2 */}
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-center", row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? "bg-muted/20 text-muted-foreground" : "")}
                    value={row.evolutionN2 || ""}
                    placeholder="0"
                    step={0.1}
                    disabled={row.detailCalc?.modeCalc === "POURCENTAGE_CA"}
                    onChange={(e) => handleUpdate(i, { evolutionN2: numVal(e.target.value) })}
                  />
                </Td>

                {/* N+2 (calculé) */}
                <Td className="bg-muted/20">
                  <span className="block px-1.5 py-1 text-right text-sm tabular-nums text-muted-foreground">
                    {row.montantN2.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </Td>

                {/* % Fixe */}
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-center")}
                    value={row.tauxFixe || ""}
                    placeholder="0"
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleUpdate(i, { tauxFixe: numVal(e.target.value) })}
                  />
                </Td>

                {/* Fréquence */}
                <Td>
                  <select
                    className={cellSelect}
                    value={row.frequence}
                    onChange={(e) =>
                      handleUpdate(i, { frequence: e.target.value as ChargeExploitationRow["frequence"] })
                    }
                  >
                    {FREQUENCES_CHARGE.map((f) => (
                      <option key={f.value} value={f.value} className="bg-background text-foreground">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Td>

                {/* Règlement */}
                <Td>
                  <select
                    className={cellSelect}
                    value={row.delaiReglement}
                    onChange={(e) => handleUpdate(i, { delaiReglement: parseInt(e.target.value, 10) })}
                  >
                    {DELAIS_REGLEMENT_CHARGE.map((d) => (
                      <option key={d.value} value={d.value} className="bg-background text-foreground">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Td>

                {/* TVA */}
                <Td>
                  <select
                    className={cellSelect}
                    value={row.tauxTVA}
                    onChange={(e) => handleUpdate(i, { tauxTVA: parseFloat(e.target.value) })}
                  >
                    {TAUX_TVA_CHARGE.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>

                {/* Type TVA */}
                <Td>
                  <select
                    className={cellSelect}
                    value={row.typeTVA}
                    onChange={(e) => handleUpdate(i, { typeTVA: e.target.value as ChargeExploitationRow["typeTVA"] })}
                  >
                    {TYPES_TVA_CHARGE.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>

                {/* Actions */}
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
            ))}

            {/* Ligne totaux */}
          </tbody>
          {rows.length > 0 && <TotauxRow rows={rows} dossierId={dossierId} />}
        </table>
      </div>

      {/* Dialog Détail */}
      <DetailChargeDialog
        open={detailIdx !== null}
        onOpenChange={(o) => {
          if (!o) setDetailIdx(null);
        }}
        dossierId={dossierId}
        chargeIndex={detailIdx ?? 0}
        categorie={categorie}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU IMPÔTS ET TAXES
// ─────────────────────────────────────────────────────────────────────────────

function calcCFE(base: number, taux: number) {
  return +((base * taux) / 100).toFixed(2);
}

type CfeMode = "VALEUR" | "CALCUL";

function TableauImpotsTaxes({ dossierId, initialData }: { dossierId: string; initialData: ImpotTaxeRow[] }) {
  const store = useChargesStore();
  const draft = store.getDraft(dossierId);
  const hasHydrated = useChargesStore((s) => s._hasHydrated);
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  const rows = draft.impots;
  const isDirty = draft.hasUnsavedImpots;

  // ── CFE : toujours présente, stockée comme première ligne isCFE:true ──
  const cfeIdx = rows.findIndex((r) => r.isCFE);
  const cfeRow = cfeIdx >= 0 ? rows[cfeIdx] : null;
  // cfeModeCalc=true → "CALCUL" (base × taux) ; false/undefined → "VALEUR"
  const [cfeMode, setCfeMode] = useState<CfeMode>(cfeRow?.cfeModeCalc ? "CALCUL" : "VALEUR");

  // Lignes "standard" (hors CFE)
  const otherRows = rows.map((r, i) => ({ row: r, idx: i })).filter(({ row }) => !row.isCFE);

  // Hydratation initiale + création de la ligne CFE si absente
  useEffect(() => {
    // Attendre que persist ait réhydraté le store depuis localStorage.
    // Sans cette garde, le store semble vide (hasUnsaved=false, impots=[]) et
    // setImpots écrase les données non-sauvegardées avec les données DB initiales.
    if (!hasHydrated) return;

    const current = store.getDraft(dossierId);
    // Sync depuis le serveur si le store est vide ou propre (sans modifications locales)
    if (!current.hasUnsavedImpots && initialData.length > 0) {
      store.setImpots(dossierId, initialData);
    } else if (current.impots.length === 0 && initialData.length > 0) {
      store.setImpots(dossierId, initialData);
    }
    // Crée la ligne CFE si elle n'existe pas encore
    const afterSync = store.getDraft(dossierId);
    const hasCfe = afterSync.impots.some((r) => r.isCFE);
    if (!hasCfe) {
      // on insère en tête
      store.setImpots(dossierId, [
        {
          libelle: "CFE",
          actif: true,
          hypothese: "COMMUNE",
          isCFE: true,
          cfeModeCalc: false,
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
        },
        ...afterSync.impots,
      ]);
      // Marquer dirty : la CFE créée localement doit être persistée en base
      store.updateImpot(dossierId, 0, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, hasHydrated]);

  // Init cfeMode depuis la ligne persistée (une seule fois, après réhydratation)
  const cfeInitRef = useRef(false);
  useEffect(() => {
    if (cfeRow && !cfeInitRef.current) {
      cfeInitRef.current = true;
      setCfeMode(cfeRow.cfeModeCalc ? "CALCUL" : "VALEUR");
    }
  }, [cfeRow]);

  const handleAdd = useCallback(() => store.addImpot(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeImpot(dossierId, i), [store, dossierId]);
  const handleDuplicate = useCallback((i: number) => store.duplicateImpot(dossierId, i), [store, dossierId]);

  const handleUpdate = useCallback(
    (i: number, data: Partial<ImpotTaxeRow>) => store.updateImpot(dossierId, i, data),
    [store, dossierId],
  );

  // Mise à jour CFE avec recalcul automatique en mode CALCUL
  const handleCfeUpdate = useCallback(
    (data: Partial<ImpotTaxeRow>) => {
      if (cfeIdx < 0) return;
      const merged = { ...cfeRow!, ...data };
      const isCalc = cfeMode === "CALCUL";
      if (isCalc) {
        const base = merged.baseImposableCFE ?? 0;
        const taux = merged.tauxCFE ?? 0;
        const montant = calcCFE(base, taux);
        data = { ...data, montantN: montant, montantN1: montant, montantN2: montant };
      }
      store.updateImpot(dossierId, cfeIdx, data);
    },
    [store, dossierId, cfeIdx, cfeRow, cfeMode],
  );

  // Quand on change de mode → persiste dans le store + recalcule si CALCUL
  const handleCfeMode = (mode: CfeMode) => {
    setCfeMode(mode);
    const isCalc = mode === "CALCUL";
    if (isCalc && cfeRow) {
      const base = cfeRow.baseImposableCFE ?? 0;
      const taux = cfeRow.tauxCFE ?? 0;
      const montant = calcCFE(base, taux);
      store.updateImpot(dossierId, cfeIdx, {
        cfeModeCalc: true,
        montantN: montant,
        montantN1: montant,
        montantN2: montant,
      });
    } else if (cfeIdx >= 0) {
      // VALEUR : on persiste le mode, les montants restent inchangés
      store.updateImpot(dossierId, cfeIdx, { cfeModeCalc: false });
    }
  };

  const handleSave = useCallback(() => {
    startTransition(async () => {
      // Filtrer les lignes vides (hors CFE) qui n'ont pas encore été renseignées
      // et normaliser la ligne CFE (libelle toujours "CFE" pour éviter l'erreur de validation)
      const rowsToSave = rows
        .filter((r) => r.isCFE || r.libelle.trim() !== "")
        .map((r) => (r.isCFE ? { ...r, libelle: r.libelle.trim() || "CFE" } : r));
      const result = await saveImpots(dossierId, rowsToSave);
      if (result.success) {
        toast.success(result.message);
        // Rafraîchir le store avec les IDs assignés par la DB
        try {
          const fresh = await fetchImpots(dossierId);
          if (fresh.length > 0) {
            store.setImpots(dossierId, fresh);
          } else {
            store.markImpotsSaved(dossierId);
          }
        } catch {
          store.markImpotsSaved(dossierId);
        }
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store]);

  const fmt = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Impôts et taxes"
        description="CFE, taxes foncières, contributions obligatoires"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-7">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-24">Hypothèse</Th>
              <Th className="w-28">Date N</Th>
              <Th className="w-24 text-right">N (€)</Th>
              <Th className="w-28">Date N+1</Th>
              <Th className="w-24 text-right">N+1 (€)</Th>
              <Th className="w-28">Date N+2</Th>
              <Th className="w-24 text-right">N+2 (€)</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {/* ── Ligne CFE permanente ───────────────────────────────── */}
            <tr
              className={cn(
                "border-t border-border bg-blue-50/40 dark:bg-blue-950/20",
                !(cfeRow?.actif ?? true) && "opacity-50",
              )}
            >
              {/* # */}
              <Td className="text-center text-xs text-muted-foreground px-1.5">—</Td>

              {/* Actif */}
              <Td className="text-center px-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  checked={cfeRow?.actif ?? true}
                  onChange={(e) => handleCfeUpdate({ actif: e.target.checked })}
                />
              </Td>

              {/* Libellé + mode toggle */}
              <Td>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">CFE</span>
                  {/* Mini toggle */}
                  <div className="flex items-center gap-0.5 p-0.5 rounded bg-background/80 border border-blue-200 dark:border-blue-800">
                    <button
                      type="button"
                      onClick={() => handleCfeMode("VALEUR")}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                        cfeMode === "VALEUR" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Valeur
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCfeMode("CALCUL")}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                        cfeMode === "CALCUL" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Base × taux
                    </button>
                  </div>
                </div>
              </Td>

              {/* Hypothèse */}
              <Td>
                <select
                  className={cellSelect}
                  value={cfeRow?.hypothese ?? "COMMUNE"}
                  onChange={(e) => handleCfeUpdate({ hypothese: e.target.value as ImpotTaxeRow["hypothese"] }) }
                >
                  {HYPOTHESES_CHARGE.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </Td>

              {/* Date N */}
              <Td>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="date"
                    className={cellInput}
                    value={cfeRow?.dateN || ""}
                    onChange={(e) => handleCfeUpdate({ dateN: e.target.value })}
                  />
                ) : (
                  <span className="block px-1.5 text-xs text-muted-foreground/50 italic">auto</span>
                )}
              </Td>

              {/* N */}
              <Td className={cfeMode === "CALCUL" ? "bg-blue-100/50 dark:bg-blue-900/20" : undefined}>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={cfeRow?.montantN || ""}
                    placeholder="0"
                    min={0}
                    step={1}
                    onChange={(e) => handleCfeUpdate({ montantN: numVal(e.target.value) })}
                  />
                ) : (
                  <span className="block px-1.5 py-1 text-right text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                    {fmt(cfeRow?.montantN ?? 0)}
                  </span>
                )}
              </Td>

              {/* Date N+1 */}
              <Td>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="date"
                    className={cellInput}
                    value={cfeRow?.dateN1 || ""}
                    onChange={(e) => handleCfeUpdate({ dateN1: e.target.value })}
                  />
                ) : (
                  <span className="block px-1.5 text-xs text-muted-foreground/50 italic">auto</span>
                )}
              </Td>

              {/* N+1 */}
              <Td className={cfeMode === "CALCUL" ? "bg-blue-100/50 dark:bg-blue-900/20" : undefined}>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={cfeRow?.montantN1 || ""}
                    placeholder="0"
                    min={0}
                    step={1}
                    onChange={(e) => handleCfeUpdate({ montantN1: numVal(e.target.value) })}
                  />
                ) : (
                  <span className="block px-1.5 py-1 text-right text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                    {fmt(cfeRow?.montantN1 ?? 0)}
                  </span>
                )}
              </Td>

              {/* Date N+2 */}
              <Td>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="date"
                    className={cellInput}
                    value={cfeRow?.dateN2 || ""}
                    onChange={(e) => handleCfeUpdate({ dateN2: e.target.value })}
                  />
                ) : (
                  <span className="block px-1.5 text-xs text-muted-foreground/50 italic">auto</span>
                )}
              </Td>

              {/* N+2 */}
              <Td className={cfeMode === "CALCUL" ? "bg-blue-100/50 dark:bg-blue-900/20" : undefined}>
                {cfeMode === "VALEUR" ? (
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={cfeRow?.montantN2 || ""}
                    placeholder="0"
                    min={0}
                    step={1}
                    onChange={(e) => handleCfeUpdate({ montantN2: numVal(e.target.value) })}
                  />
                ) : (
                  <span className="block px-1.5 py-1 text-right text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                    {fmt(cfeRow?.montantN2 ?? 0)}
                  </span>
                )}
              </Td>

              {/* Pas de bouton supprimer */}
              <Td>{null}</Td>
            </tr>

            {/* ── Sous-ligne CFE en mode CALCUL ─────────────────────── */}
            {cfeMode === "CALCUL" && (
              <tr className="border-t border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10">
                <td colSpan={4} className="px-2 py-2">
                  <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
                    Paramètres CFE
                  </span>
                </td>
                <td colSpan={7} className="px-2 py-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Base imposable (€)</label>
                      <input
                        type="number"
                        className="h-7 w-32 rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={cfeRow?.baseImposableCFE || ""}
                        placeholder="0"
                        min={0}
                        step={1}
                        onChange={(e) => handleCfeUpdate({ baseImposableCFE: numVal(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Taux communal (%)</label>
                      <input
                        type="number"
                        className="h-7 w-20 rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={cfeRow?.tauxCFE || ""}
                        placeholder="0"
                        min={0}
                        max={100}
                        step={0.01}
                        onChange={(e) => handleCfeUpdate({ tauxCFE: numVal(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-sm">=</span>
                      <span className="text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                        {fmt(calcCFE(cfeRow?.baseImposableCFE ?? 0, cfeRow?.tauxCFE ?? 0))} € / an
                      </span>
                      <span className="text-xs text-muted-foreground">(appliqué sur N, N+1 et N+2)</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Lignes standard (hors CFE) ─────────────────────────── */}
            {otherRows.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center text-muted-foreground text-xs py-5">
                  Aucune autre ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {otherRows.map(({ row, idx }, display) => (
              <tr
                key={idx}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  !(row.actif ?? true) && "opacity-50",
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1.5">{display + 1}</Td>

                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    checked={row.actif ?? true}
                    onChange={(e) => handleUpdate(idx, { actif: e.target.checked })}
                  />
                </Td>

                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Ex : Taxe foncière"
                    onChange={(e) => handleUpdate(idx, { libelle: e.target.value })}
                  />
                </Td>

                <Td>
                  <select
                    className={cellSelect}
                    value={row.hypothese}
                    onChange={(e) => handleUpdate(idx, { hypothese: e.target.value as ImpotTaxeRow["hypothese"] })}
                  >
                    {HYPOTHESES_CHARGE.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Td>

                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN ?? ""}
                    onChange={(e) => handleUpdate(idx, { dateN: e.target.value })}
                  />
                </Td>

                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN || ""}
                    placeholder="0"
                    min={0}
                    step={0.01}
                    onChange={(e) => handleUpdate(idx, { montantN: numVal(e.target.value) })}
                  />
                </Td>

                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN1 ?? ""}
                    onChange={(e) => handleUpdate(idx, { dateN1: e.target.value })}
                  />
                </Td>

                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN1 || ""}
                    placeholder="0"
                    min={0}
                    step={0.01}
                    onChange={(e) => handleUpdate(idx, { montantN1: numVal(e.target.value) })}
                  />
                </Td>

                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN2 ?? ""}
                    onChange={(e) => handleUpdate(idx, { dateN2: e.target.value })}
                  />
                </Td>

                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN2 || ""}
                    placeholder="0"
                    min={0}
                    step={0.01}
                    onChange={(e) => handleUpdate(idx, { montantN2: numVal(e.target.value) })}
                  />
                </Td>

                <Td className="text-center px-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleDuplicate(idx)}
                      title="Dupliquer"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleRemove(idx)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && <TotauxImpotRow rows={rows} dossierId={dossierId} />}
        </table>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

interface ChargesFormProps {
  dossierId: string;
  fournitures?: ChargeExploitationRow[];
  services?: ChargeExploitationRow[];
  impots?: ImpotTaxeRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function ChargesForm({
  dossierId,
  fournitures = [],
  services = [],
  impots = [],
  dateDebutExerciceN,
  exercices,
}: ChargesFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto">
      {/* Section 1 — Fournitures consommables */}
      <TableauChargeExploitation
        dossierId={dossierId}
        categorie="FOURNITURE_CONSOMMABLE"
        title="Fournitures consommables"
        description="Emballages, électricité, eau, petit équipement, produits d'entretien, fournitures de bureau…"
        initialData={fournitures}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />

      {/* Section 2 — Services extérieurs */}
      <TableauChargeExploitation
        dossierId={dossierId}
        categorie="SERVICE_EXTERIEUR"
        title="Services extérieurs"
        description="Location, télécommunications, assurances, honoraires, publicité, services bancaires…"
        initialData={services}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />

      {/* Section 3 — Impôts et taxes */}
      <TableauImpotsTaxes dossierId={dossierId} initialData={impots} />
    </div>
  );
}
