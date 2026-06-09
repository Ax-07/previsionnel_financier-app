"use client";

import { useCallback, useEffect, useRef, useTransition, useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { DragHandleCell, SortableTableRow } from "@/components/ui/sortable-table-row";

import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

import { HYPOTHESES_CHARGE, type ImpotTaxeRow } from "@/lib/schemas/charges";

import { useChargesStore } from "@/stores/charges-store";
import type { LocalImpotTaxeRow } from "@/stores/charges-store";
import { saveImpots } from "@/app/actions/charges";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { useExercicesDisplay } from "@/hooks/use-exercices-display";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td, tempId } from "../helpers/table-helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcCFE(base: number, taux: number) {
  return +((base * taux) / 100).toFixed(2);
}

type CfeMode = "VALEUR" | "CALCUL";

// ── Totaux ────────────────────────────────────────────────────────────────────

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
// TABLEAU IMPÔTS ET TAXES
// ─────────────────────────────────────────────────────────────────────────────

export interface TableauImpotsTaxesProps {
  dossierId: string;
  initialData: LocalImpotTaxeRow[];
}

export function TableauImpotsTaxes({ dossierId, initialData }: TableauImpotsTaxesProps) {
  const store = useChargesStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const reloadScenarioData = useReloadScenarioData();
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);

  const rows = draft.impots;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedImpotIds?.length ?? 0) > 0;

  // ── CFE : toujours présente, stockée comme première ligne isCFE:true ──
  const cfeIdx = rows.findIndex((r) => r.isCFE);
  const cfeRow = cfeIdx >= 0 ? rows[cfeIdx] : null;
  // cfeModeCalc=true → "CALCUL" (base × taux) ; false/undefined → "VALEUR"
  const [cfeMode, setCfeMode] = useState<CfeMode>(cfeRow?.cfeModeCalc ? "CALCUL" : "VALEUR");

  // Lignes "standard" (hors CFE)
  const otherRows = useMemo(() => rows.filter((r) => !r.isCFE), [rows]);

  // Hydratation initiale + création de la ligne CFE si absente
  useEffect(() => {
    store.hydrateImpots(dossierId, initialData);
    // Créer la ligne CFE si absente après hydratation
    const postHydrate = store.getDraft(dossierId);
    if (!postHydrate.impots.some((r) => r.isCFE) && !initialData.some((r) => r.isCFE)) {
      store.setImpots(dossierId, (prev) => [
        {
          id: tempId(),
          libelle: "CFE",
          actif: true,
          hypothese: "COMMUNE",
          isCFE: true,
          cfeModeCalc: false,
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          _dirty: true,
        } as LocalImpotTaxeRow,
        ...prev,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // Init cfeMode depuis la ligne persistée (une seule fois, après réhydratation)
  const cfeInitRef = useRef(false);
  useEffect(() => {
    if (cfeRow && !cfeInitRef.current) {
      cfeInitRef.current = true;
      setCfeMode(cfeRow.cfeModeCalc ? "CALCUL" : "VALEUR");
    }
  }, [cfeRow]);

  const handleAdd = useCallback(() => store.addImpotRow(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeImpotRow(dossierId, i), [store, dossierId]);
  const handleDuplicate = useCallback((i: number) => store.duplicateImpotRow(dossierId, i), [store, dossierId]);

  const handleUpdate = useCallback(
    (i: number, data: Partial<ImpotTaxeRow>) => store.updateImpotRow(dossierId, i, data),
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
      store.updateImpotRow(dossierId, cfeIdx, data);
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
      store.updateImpotRow(dossierId, cfeIdx, {
        cfeModeCalc: true,
        montantN: montant,
        montantN1: montant,
        montantN2: montant,
      });
    } else if (cfeIdx >= 0) {
      // VALEUR : on persiste le mode, les montants restent inchangés
      store.updateImpotRow(dossierId, cfeIdx, { cfeModeCalc: false });
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
        if (result.idMap && Object.keys(result.idMap).length > 0) {
          store.setImpots(dossierId, (prev) =>
            prev.map((r) => ({ ...r, id: result.idMap![r.id!] ?? r.id }))
          );
        }
        store.markImpotsSaved(dossierId);
        reloadScenarioData(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, reloadScenarioData]);

  // ── DnD Impôts ────────────────────────────────────────────────────────
  const setOtherRowsDnd = useCallback(
    (updater: (prev: LocalImpotTaxeRow[]) => LocalImpotTaxeRow[]) => {
      const cfe = rows.find((r) => r.isCFE);
      store.setImpotsRows(dossierId, [...(cfe ? [cfe] : []), ...updater(otherRows)]);
    },
    [rows, otherRows, store, dossierId],
  );

  const addGroupeImpot = useCallback(
    () => store.addImpotGroup(dossierId),
    [store, dossierId],
  );

  const addRowToGroupeImpot = useCallback(
    (groupe: string) => store.addImpotToGroup(dossierId, groupe),
    [store, dossierId],
  );

  const dndImpots = useGroupedDnd({ rows: otherRows, setRows: setOtherRowsDnd });

  const renderRowImpot = useCallback(
    (row: LocalImpotTaxeRow & { id: string }, _isLastInGroup: boolean) => {
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
