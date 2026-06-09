"use client";

import { useChargesStore, type LocalChargeExploitationRow } from "@/stores/charges-store";
import {
  ChargeExploitationRow,
  DELAIS_REGLEMENT_CHARGE,
  FREQUENCES_CHARGE,
  HYPOTHESES_CHARGE,
  TAUX_TVA_CHARGE,
  TYPES_TVA_CHARGE,
} from "@/lib/schemas/charges";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useExercicesDisplay } from "@/hooks/use-exercices-display";
import { formatNumber, numVal } from "@/lib/format";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { saveFournitures } from "@/app/actions/charges";
import { toast } from "sonner";
import { DragHandleCell, SortableTableRow } from "@/components/ui/sortable-table-row";
import { cn } from "@/lib/utils";
import { NumericCellInput, Td, Th } from "../helpers/table-helpers";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { FileText } from "lucide-react";
import { RowActions } from "../helpers/row-actions";
import { SectionHeader } from "../helpers/section-header";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { DetailChargeDialog } from "./detail-charge-dialog";

// ── Totaux ────────────────────────────────────────────────────────────────────
function TotauxRow({ rows, dossierId }: { rows: ChargeExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const { showN1, showN2 } = useExercicesDisplay(dossierId);
  const activeRows = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);

  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN, 0))}
        </td>
        {showN1 && <td />}
        {showN1 && (
          <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
            {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN1, 0))}
          </td>
        )}
        {showN2 && <td />}
        {showN2 && (
          <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
            {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN2, 0))}
          </td>
        )}
        <td colSpan={showN1 && showN2 ? 6 : showN1 || showN2 ? 4 : 3} />
      </tr>
    </tfoot>
  );
}

function GroupSummaryFournitures({ rows, dossierId }: { rows: ChargeExploitationRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const { showN1, showN2 } = useExercicesDisplay(dossierId);
  const activeRows = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <>
      <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
        {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN, 0))}
      </td>
      {showN1 && <td />}
      {showN1 && (
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN1, 0))}
        </td>
      )}
      {showN2 && <td />}
      {showN2 && (
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(activeRows.reduce((sum, r) => sum + r.montantN2, 0))}
        </td>
      )}
      <td colSpan={5} />
    </>
  );
}

export interface TableauFournituresProps {
  dossierId: string;
  initialData: LocalChargeExploitationRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function TableauFournitures({ dossierId, initialData, dateDebutExerciceN, exercices }: TableauFournituresProps) {
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    getDraft,
    addFournitureRow,
    updateFournitureRow,
    duplicateFournitureRow,
    removeFournitureRow,
    hydrateFournitures,
    setFournitures,
    setFournituresRows,
    markFournituresSaved,
    addFournitureGroup,
    addFournitureToGroup,
  } = useChargesStore();
  const invalidateControleStores = useReloadScenarioData();

  useEffect(() => {
    hydrateFournitures(
      dossierId,
      initialData.map((r) => ({ ...r, _dirty: false })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);
  const rows = draft.fournitures;
  const isDirty = rows.some((r) => r._dirty) || (draft._deletedFournitureIds?.length ?? 0) > 0;

  const setRows = useCallback(
    (updater: (prev: ChargeExploitationRow[]) => ChargeExploitationRow[]) => {
      const d = useChargesStore.getState().getDraft(dossierId);
      setFournituresRows(dossierId, updater(d.fournitures));
    },
    [dossierId, setFournituresRows],
  );

  const dnd = useGroupedDnd({ rows, setRows });

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = useChargesStore.getState().getDraft(dossierId);
        const result = await saveFournitures(dossierId, d.fournitures);
        if (result.success) {
          if (result.idMap && Object.keys(result.idMap).length > 0) {
            const idMap = result.idMap;
            setFournitures(dossierId, (prev) =>
              prev.map((r) => ({ ...r, id: r.id && idMap[r.id] ? idMap[r.id] : r.id })),
            );
          }
          markFournituresSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, invalidateControleStores, markFournituresSaved, setFournitures]);

  const renderRow = useCallback(
    (row: LocalChargeExploitationRow & { id: string }, isLastInGroup: boolean) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx < 0) return null;
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
          <Td className="text-center text-xs text-muted-foreground px-1.5">{idx + 1}</Td>

          {/* Actif */}
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => updateFournitureRow(dossierId, idx, { actif: e.target.checked })}
            />
          </Td>

          {/* Libellé */}
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              placeholder="Ex : Emballages"
              onChange={(e) => updateFournitureRow(dossierId, idx, { libelle: e.target.value })}
            />
          </Td>

          {/* Hypothèse */}
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) =>
                updateFournitureRow(dossierId, idx, { hypothese: e.target.value as ChargeExploitationRow["hypothese"] })
              }
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
              onClick={() => setDetailIdx(idx)}
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
                onChange={(e) => updateFournitureRow(dossierId, idx, { montantN: numVal(e.target.value) })}
              />
            )}
          </Td>

          {/* % Évol N→N+1 */}
          {showN1 && (
            <Td>
              <input
                type="number"
                className={cn(
                  cellInput,
                  "text-center",
                  row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? "bg-muted/20 text-muted-foreground" : "",
                )}
                value={row.evolutionN1 || ""}
                placeholder="0"
                step={0.1}
                disabled={row.detailCalc?.modeCalc === "POURCENTAGE_CA"}
                onChange={(e) => updateFournitureRow(dossierId, idx, { evolutionN1: numVal(e.target.value) })}
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
                className={cn(
                  cellInput,
                  "text-center",
                  row.detailCalc?.modeCalc === "POURCENTAGE_CA" ? "bg-muted/20 text-muted-foreground" : "",
                )}
                value={row.evolutionN2 || ""}
                placeholder="0"
                step={0.1}
                disabled={row.detailCalc?.modeCalc === "POURCENTAGE_CA"}
                onChange={(e) => updateFournitureRow(dossierId, idx, { evolutionN2: numVal(e.target.value) })}
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
              onChange={(e) => updateFournitureRow(dossierId, idx, { tauxFixe: numVal(e.target.value) })}
            />
          </Td>

          {/* Fréquence */}
          <Td>
            <select
              className={cellSelect}
              value={row.frequence}
              onChange={(e) =>
                updateFournitureRow(dossierId, idx, { frequence: e.target.value as ChargeExploitationRow["frequence"] })
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
              onChange={(e) => updateFournitureRow(dossierId, idx, { delaiReglement: parseInt(e.target.value, 10) })}
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
              onChange={(e) => updateFournitureRow(dossierId, idx, { tauxTVA: parseFloat(e.target.value) })}
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
              onChange={(e) =>
                updateFournitureRow(dossierId, idx, { typeTVA: e.target.value as ChargeExploitationRow["typeTVA"] })
              }
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
            <RowActions
              onDelete={() => removeFournitureRow(dossierId, idx)}
              onDuplicate={() => duplicateFournitureRow(dossierId, idx)}
              isPending={isPending}
              groupe={row.groupe ?? null}
            />
          </Td>
        </SortableTableRow>
      );
    },
    [rows, showN1, showN2, isPending, updateFournitureRow, dossierId, removeFournitureRow, duplicateFournitureRow],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Fournitures consommable"
        description=""
        isDirty={isDirty}
        isSaving={isPending}
        onSave={saveAll}
        onAdd={() => addFournitureRow(dossierId)}
        onAddGroup={() => addFournitureGroup(dossierId)}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={2 + (showN1 ? 2 : 0) + (showN2 ? 2 : 0)}
        onAddRowToGroupe={(groupe) => addFournitureToGroup(dossierId, groupe)}
        renderRow={renderRow}
        emptyMessage="Aucune ligne — cliquez sur « Ajouter » pour commencer."
        footer={rows.length > 0 ? <TotauxRow rows={rows} dossierId={dossierId} /> : undefined}
        renderGroupSummaryCells={(groupRows) => (
          <GroupSummaryFournitures rows={groupRows as LocalChargeExploitationRow[]} dossierId={dossierId} />
        )}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-7">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-36">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-8 text-center">Détail</Th>
            <Th className="w-24 text-right">{y1Label}</Th>
            {showN1 && <Th className="w-16 text-center">% Év.</Th>}
            {showN1 && <Th className="w-24 text-right">{y2Label}</Th>}
            {showN2 && <Th className="w-16 text-center">% Év.</Th>}
            {showN2 && <Th className="w-24 text-right">{y3Label}</Th>}
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
        categorie={"FOURNITURE_CONSOMMABLE"}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />
    </div>
  );
}
