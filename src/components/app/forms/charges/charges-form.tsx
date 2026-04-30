"use client";

/**
 * Onglet Charges — 3 tableaux éditables inline
 * - Fournitures consommables
 * - Services extérieurs
 * - Impôts et taxes
 */
import { useCallback, useEffect, useRef, useTransition, useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, FileText, Copy } from "lucide-react";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { DragHandleCell, SortableTableRow } from "@/components/ui/sortable-table-row";
import { DetailChargeDialog } from "./detail-charge-dialog";

import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

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
import { useExercicesDisplay } from "@/hooks/use-exercices-display";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";

// ── Helpers ──────────────────────────────────────────────────────────────────


// ── Composants utilitaires ───────────────────────────────────────────────────




// ── Totaux section ───────────────────────────────────────────────────────────

function TotauxRow({ rows, dossierId }: { rows: ChargeExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const activeRows = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalN = activeRows.reduce((sum, r) => sum + r.montantN, 0);
  const totalN1 = activeRows.reduce((sum, r) => sum + r.montantN1, 0);
  const totalN2 = activeRows.reduce((sum, r) => sum + r.montantN2, 0);
  const { showN1, showN2 } = useExercicesDisplay(dossierId);

  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN)}</td>
        {showN1 && <td />}
        {showN1 && <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN1)}</td>}
        {showN2 && <td />}
        {showN2 && <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN2)}</td>}
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
  const { showN1, showN2 } = useExercicesDisplay(dossierId);

  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN)}</td>
        {showN1 && <td />}
        {showN1 && <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN1)}</td>}
        {showN2 && <td />}
        {showN2 && <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN2)}</td>}
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
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);

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
  }, [saveAction, dossierId, rows, markSaved, invalidateControleStores]);

  // ── DnD ──────────────────────────────────────────────────────────────────
  const setRowsDnd = useCallback(
    (updater: (prev: ChargeExploitationRow[]) => ChargeExploitationRow[]) => {
      setRows(dossierId, updater(rows));
    },
    [rows, setRows, dossierId],
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    const name = `Groupe ${n}`;
    setRows(dossierId, [
      ...rows,
      {
        id: `__new__${crypto.randomUUID()}`,
        libelle: "",
        categorie,
        actif: true,
        hypothese: "COMMUNE",
        montantN: 0,
        evolutionN1: 0,
        montantN1: 0,
        evolutionN2: 0,
        montantN2: 0,
        tauxFixe: 0,
        frequence: "MENSUELLE",
        delaiReglement: 0,
        tauxTVA: 20,
        typeTVA: "FACTURATION",
        groupe: name,
      },
    ]);
  }, [rows, setRows, dossierId, categorie]);

  const addRowToGroupe = useCallback(
    (g: string) => {
      setRows(dossierId, [
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          categorie,
          actif: true,
          hypothese: "COMMUNE",
          montantN: 0,
          evolutionN1: 0,
          montantN1: 0,
          evolutionN2: 0,
          montantN2: 0,
          tauxFixe: 0,
          frequence: "MENSUELLE",
          delaiReglement: 0,
          tauxTVA: 20,
          typeTVA: "FACTURATION",
          groupe: g,
        },
      ]);
    },
    [rows, setRows, dossierId, categorie],
  );

  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });

  const renderRow = useCallback(
    (row: ChargeExploitationRow & { id: string }, isLastInGroup: boolean) => {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i < 0) return null;
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border border-l-2 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
            row.groupe && "border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            !(row.actif ?? true) && "opacity-50",
          )}
        >
          <DragHandleCell />

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
          {showN1 && (
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
          )}

          {/* N+1 (calculé) */}
          {showN1 && (
            <Td className="bg-muted/20">
              <span className="block px-1.5 py-1 text-right text-sm tabular-nums text-muted-foreground">
                {row.montantN1.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </Td>
          )}

          {/* % Évol N+1→N+2 */}
          {showN2 && (
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
          )}

          {/* N+2 (calculé) */}
          {showN2 && (
            <Td className="bg-muted/20">
              <span className="block px-1.5 py-1 text-right text-sm tabular-nums text-muted-foreground">
                {row.montantN2.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </Td>
          )}

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
        </SortableTableRow>
      );
    },
    [rows, handleUpdate, handleRemove, handleDuplicate, setDetailIdx, showN1, showN2],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title={title}
        description={description}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={11 + (showN1 ? 2 : 0) + (showN2 ? 2 : 0)}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune ligne — cliquez sur « Ajouter » pour commencer."
        footer={rows.length > 0 ? <TotauxRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-7">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-36">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-8 text-center">Détail</Th>
            <Th className="w-24 text-right">{y1Label} (€)</Th>
            {showN1 && <Th className="w-16 text-center">% Év.</Th>}
            {showN1 && <Th className="w-24 text-right">{y2Label} (€)</Th>}
            {showN2 && <Th className="w-16 text-center">% Év.</Th>}
            {showN2 && <Th className="w-24 text-right">{y3Label} (€)</Th>}
            <Th className="w-16 text-center">% Fixe</Th>
            <Th className="w-28">Fréquence</Th>
            <Th className="w-24">Règlement</Th>
            <Th className="w-16 text-center">TVA</Th>
            <Th className="w-28">Type TVA</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>

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
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);

  const rows = draft.impots;
  const isDirty = draft.hasUnsavedImpots;

  // ── CFE : toujours présente, stockée comme première ligne isCFE:true ──
  const cfeIdx = rows.findIndex((r) => r.isCFE);
  const cfeRow = cfeIdx >= 0 ? rows[cfeIdx] : null;
  // cfeModeCalc=true → "CALCUL" (base × taux) ; false/undefined → "VALEUR"
  const [cfeMode, setCfeMode] = useState<CfeMode>(cfeRow?.cfeModeCalc ? "CALCUL" : "VALEUR");

  // Lignes "standard" (hors CFE)
  const otherRows = useMemo(() => rows.filter((r) => !r.isCFE), [rows]);

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
  }, [dossierId, rows, store, invalidateControleStores]);

  // ── DnD Impôts ────────────────────────────────────────────────────────
  const setOtherRowsDnd = useCallback(
    (updater: (prev: ImpotTaxeRow[]) => ImpotTaxeRow[]) => {
      const cfe = rows.find((r) => r.isCFE);
      store.setImpots(dossierId, [...(cfe ? [cfe] : []), ...updater(otherRows)]);
    },
    [rows, otherRows, store, dossierId],
  );

  const addGroupeImpot = useCallback(() => {
    const existing = new Set(otherRows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    const name = `Groupe ${n}`;
    const cfe = rows.find((r) => r.isCFE);
    store.setImpots(dossierId, [
      ...(cfe ? [cfe] : []),
      ...otherRows,
      { id: `__new__${crypto.randomUUID()}`, libelle: "", actif: true, hypothese: "COMMUNE", isCFE: false, cfeModeCalc: false, montantN: 0, montantN1: 0, montantN2: 0, groupe: name },
    ]);
  }, [rows, otherRows, store, dossierId]);

  const addRowToGroupeImpot = useCallback(
    (groupe: string) => {
      const cfe = rows.find((r) => r.isCFE);
      store.setImpots(dossierId, [
        ...(cfe ? [cfe] : []),
        ...otherRows,
        { id: `__new__${crypto.randomUUID()}`, libelle: "", actif: true, hypothese: "COMMUNE", isCFE: false, cfeModeCalc: false, montantN: 0, montantN1: 0, montantN2: 0, groupe },
      ]);
    },
    [rows, otherRows, store, dossierId],
  );

  const dndImpots = useGroupedDnd({ rows: otherRows, setRows: setOtherRowsDnd });

  const renderRowImpot = useCallback(
    (row: ImpotTaxeRow & { id: string }, _isLastInGroup: boolean) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx < 0) return null;
      const display = otherRows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border bg-background hover:bg-muted/30 transition-colors",
            !(row.actif ?? true) && "opacity-50",
          )}
        >
          <DragHandleCell />
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
          {showN1 && (
            <Td>
              <input
                type="date"
                className={cellInput}
                value={row.dateN1 ?? ""}
                onChange={(e) => handleUpdate(idx, { dateN1: e.target.value })}
              />
            </Td>
          )}
          {showN1 && (
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
          )}
          {showN2 && (
            <Td>
              <input
                type="date"
                className={cellInput}
                value={row.dateN2 ?? ""}
                onChange={(e) => handleUpdate(idx, { dateN2: e.target.value })}
              />
            </Td>
          )}
          {showN2 && (
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
          )}
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
        </SortableTableRow>
      );
    },
    [rows, otherRows, handleUpdate, handleDuplicate, handleRemove, showN1, showN2],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Impôts et taxes"
        description="CFE, taxes foncières, contributions obligatoires"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
        onAddGroup={addGroupeImpot}
      />

      <GroupedDndTable
        dnd={dndImpots}
        colSpan={8 + (showN1 ? 2 : 0) + (showN2 ? 2 : 0)}
        onAddRowToGroupe={addRowToGroupeImpot}
        renderRow={renderRowImpot}
        footer={rows.length > 0 ? <TotauxImpotRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-7">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-28">Date {y1Label}</Th>
            <Th className="w-24 text-right">{y1Label} (€)</Th>
            {showN1 && <Th className="w-28">Date {y2Label}</Th>}
            {showN1 && <Th className="w-24 text-right">{y2Label} (€)</Th>}
            {showN2 && <Th className="w-28">Date {y3Label}</Th>}
            {showN2 && <Th className="w-24 text-right">{y3Label} (€)</Th>}
            <Th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {/* ── Ligne CFE permanente ──────────────────────────────────── */}
          <tr
            className={cn(
              "border-t border-border bg-blue-50/40 dark:bg-blue-950/20",
              !(cfeRow?.actif ?? true) && "opacity-50",
            )}
          >
            {/* Drag handle placeholder */}
            <td className="w-7" />
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
                onChange={(e) => handleCfeUpdate({ hypothese: e.target.value as ImpotTaxeRow["hypothese"] })}
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
                  {formatNumber(cfeRow?.montantN ?? 0)}
                </span>
              )}
            </Td>

            {/* Date N+1 */}
            {showN1 && (
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
            )}

            {/* N+1 */}
            {showN1 && (
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
                    {formatNumber(cfeRow?.montantN1 ?? 0)}
                  </span>
                )}
              </Td>
            )}

            {/* Date N+2 */}
            {showN2 && (
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
            )}

            {/* N+2 */}
            {showN2 && (
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
                    {formatNumber(cfeRow?.montantN2 ?? 0)}
                  </span>
                )}
              </Td>
            )}

            {/* Pas de bouton supprimer */}
            <Td>{null}</Td>
          </tr>

          {/* ── Sous-ligne CFE en mode CALCUL ─────────────────────────── */}
          {cfeMode === "CALCUL" && (
            <tr className="border-t border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10">
              <td />
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
                      {formatNumber(calcCFE(cfeRow?.baseImposableCFE ?? 0, cfeRow?.tauxCFE ?? 0))} € / an
                    </span>
                    <span className="text-xs text-muted-foreground">(appliqué sur N, N+1 et N+2)</span>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </GroupedDndTable>
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
    <div className="h-full space-y-10 overflow-y-auto py-8 px-32">
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

