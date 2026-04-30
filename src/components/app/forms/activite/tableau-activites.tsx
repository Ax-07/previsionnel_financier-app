"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Trash2, Copy, FileText } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { toast } from "sonner";

import {
  type ActiviteRow,
  SECTEURS_ACTIVITE,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
} from "@/lib/schemas/activite";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { useActiviteStore } from "@/stores/activite-store";
import { saveActivites } from "@/app/actions/activite";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { useExercicesDisplay } from "@/hooks/use-exercices-display";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { SectionHeader } from "./section-header";
import { DetailActiviteDialog } from "./detail-activite-dialog";
import { cellInput, cellSelect, intVal, Th, Td } from "./activite-table-helpers";

const tempId = () => `__new__${crypto.randomUUID()}`;

/** Ligne vide avec valeurs par défaut (miroir de createEmptyActivite du store). */
function emptyActiviteRow(groupe?: string): ActiviteRow {
  return {
    id: tempId(),
    libelle: "",
    secteur: "PRODUCTION",
    hypothese: "COMMUNE",
    montantN: 0, evolutionN1: 0, montantN1: 0, evolutionN2: 0, montantN2: 0,
    tauxMarge: 0, stocks: 0,
    reglementClients: 30, tvaVentes: 20,
    reglementFournisseurs: 30, tvaAchats: 20,
    actif: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

interface TableauActivitesProps {
  dossierId: string;
  initialData: ActiviteRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

/**
 * Tableau inline éditable du chiffre d'affaires — auto-contenu avec DnD et groupes.
 * Gère sa propre hydration, ses mutations, et la sauvegarde.
 */
export function TableauActivites({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: TableauActivitesProps) {
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const { getDraft, setActivites, setActivitesRows, markActivitesSaved } = useActiviteStore();
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const invalidateControleStores = useInvalidateControleStores();

  // Hydration unique : n'écrase le store que si aucune modif non sauvegardée
  // et que le store n'est pas en avance sur les données serveur (stale RSC).
  useEffect(() => {
    const cur = useActiviteStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedActivites) {
      const serverIds = new Set(initialData.map((r) => r.id).filter(Boolean));
      const ahead = cur.activites.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) setActivites(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const { y1Label, y2Label, y3Label, showN1, showN2 } = useExercicesDisplay(dossierId);
  const rows = draft.activites;
  const isDirty = draft.hasUnsavedActivites;

  // Bridge stable : appelle setActivitesRows (dirty=true) en lisant le store courant.
  const setRows = useCallback(
    (updater: (prev: ActiviteRow[]) => ActiviteRow[]) => {
      const d = useActiviteStore.getState().getDraft(dossierId);
      setActivitesRows(dossierId, updater(d.activites));
    },
    [dossierId, setActivitesRows]
  );

  const dnd = useGroupedDnd({ rows, setRows });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addRow = useCallback(
    () => setRows((prev) => [...prev, emptyActiviteRow()]),
    [setRows]
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyActiviteRow(`Groupe ${n}`)]);
  }, [setRows, rows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyActiviteRow(groupe)]),
    [setRows]
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<ActiviteRow>) =>
      setRows((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...data }; return n; }),
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx)),
    [setRows]
  );

  const duplicateRow = useCallback(
    (idx: number) =>
      setRows((prev) => {
        const { id: _id, ...rest } = prev[idx];
        return [...prev, { ...rest, id: tempId() }];
      }),
    [setRows]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const d = useActiviteStore.getState().getDraft(dossierId);
        const result = await saveActivites(dossierId, d.activites);
        if (result.success) {
          markActivitesSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, markActivitesSaved, invalidateControleStores]);

  // ── Rendu de ligne ────────────────────────────────────────────────────────

    const renderRow = useCallback(
    (row: ActiviteRow & { id: string }, isLastInGroup = false) => {
      const idx = rows.findIndex((r) => r.id === row.id);
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-t border-border border-l-2 border-l-transparent bg-background hover:bg-muted/30 transition-colors",
            row.groupe && "border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            !(row.actif ?? true) && "opacity-50"
          )}
        >
          <DragHandleCell />
          <Td className="text-center px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
              checked={row.actif ?? true}
              onChange={(e) => updateRow(idx, { actif: e.target.checked })}
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
              value={row.secteur}
              onChange={(e) => updateRow(idx, { secteur: e.target.value as ActiviteRow["secteur"] })}
            >
              {SECTEURS_ACTIVITE.map((s) => (
                <option key={s.value} value={s.value} className="bg-background text-foreground">{s.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.hypothese}
              onChange={(e) => updateRow(idx, { hypothese: e.target.value as ActiviteRow["hypothese"] })}
            >
              {HYPOTHESES_ACTIVITE.map((h) => (
                <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setDetailIdx(idx)}
              title="Détails de l'activité"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN === 0 ? "" : row.montantN}
              placeholder="0"
              onChange={(e) => {
                const n = numVal(e.target.value);
                const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                updateRow(idx, { montantN: n, montantN1: n1, montantN2: n2 });
              }}
            />
          </Td>
          {showN1 && (
            <Td>
              <input
                type="number"
                className={cn(cellInput, "text-right")}
                value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                placeholder="0"
                onChange={(e) => {
                  const ev1 = numVal(e.target.value);
                  const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                  const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                  updateRow(idx, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN1 && (
            <Td>
              <input
                type="number"
                className={cn(cellInput, "text-right")}
                value={row.montantN1 === 0 ? "" : row.montantN1}
                placeholder="0"
                title="Saisie directe → taux calculé / Taux évol. → montant calculé"
                onChange={(e) => {
                  const n1 = numVal(e.target.value);
                  const ev1 = row.montantN > 0 ? parseFloat(((n1 / row.montantN - 1) * 100).toFixed(2)) : 0;
                  const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                  updateRow(idx, { montantN1: n1, evolutionN1: ev1, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN2 && (
            <Td>
              <input
                type="number"
                className={cn(cellInput, "text-right")}
                value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                placeholder="0"
                onChange={(e) => {
                  const ev2 = numVal(e.target.value);
                  const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                  updateRow(idx, { evolutionN2: ev2, montantN2: n2 });
                }}
              />
            </Td>
          )}
          {showN2 && (
            <Td>
              <input
                type="number"
                className={cn(cellInput, "text-right")}
                value={row.montantN2 === 0 ? "" : row.montantN2}
                placeholder="0"
                title="Saisie directe → taux calculé / Taux évol. → montant calculé"
                onChange={(e) => {
                  const n2 = numVal(e.target.value);
                  const ev2 = row.montantN1 > 0 ? parseFloat(((n2 / row.montantN1 - 1) * 100).toFixed(2)) : 0;
                  updateRow(idx, { montantN2: n2, evolutionN2: ev2 });
                }}
              />
            </Td>
          )}
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.tauxMarge === 0 ? "" : row.tauxMarge}
              placeholder="0"
              onChange={(e) => updateRow(idx, { tauxMarge: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.stocks === 0 ? "" : (row.stocks ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { stocks: intVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.reglementClients === 0 ? "" : (row.reglementClients ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { reglementClients: intVal(e.target.value) })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tvaVentes}
              onChange={(e) => updateRow(idx, { tvaVentes: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td>
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.reglementFournisseurs === 0 ? "" : (row.reglementFournisseurs ?? "")}
              placeholder="0"
              onChange={(e) => updateRow(idx, { reglementFournisseurs: intVal(e.target.value) })}
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.tvaAchats}
              onChange={(e) => updateRow(idx, { tvaAchats: numVal(e.target.value) })}
            >
              {TAUX_TVA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
              ))}
            </select>
          </Td>
          <Td className="text-center px-1">
            <div className="flex items-center justify-center gap-0.5">
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => duplicateRow(idx)}
                title="Dupliquer"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => removeRow(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, updateRow, removeRow, duplicateRow, showN1, showN2]
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const filteredActifs = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif ?? true);
  const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Chiffre d'affaires"
        description="Projections de chiffre d'affaires sur 3 ans (N, N+1, N+2)"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={14 + (showN1 ? 2 : 0) + (showN2 ? 2 : 0)}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        emptyMessage="Aucune activité — cliquez sur « Ajouter »"
        footer={
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                Total (actifs)
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filteredActifs.reduce((s, r) => s + r.montantN, 0))}
              </td>
              {showN1 && <td />}
              {showN1 && (
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {fmt(filteredActifs.reduce((s, r) => s + r.montantN1, 0))}
                </td>
              )}
              {showN2 && <td />}
              {showN2 && (
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {fmt(filteredActifs.reduce((s, r) => s + r.montantN2, 0))}
                </td>
              )}
              <td colSpan={7} />
            </tr>
          </tfoot>
        }
        groupNameColSpan={6}
        renderGroupSummaryCells={(groupRows) => {
          const actifs = filterByHypothese(groupRows, hypotheseActive).filter((r) => r.actif ?? true);
          return (
            <>
              <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                {fmt(actifs.reduce((s, r) => s + r.montantN, 0))}
              </td>
              {showN1 && <td />}
              {showN1 && (
                <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                  {fmt(actifs.reduce((s, r) => s + r.montantN1, 0))}
                </td>
              )}
              {showN2 && <td />}
              {showN2 && (
                <td className="px-2 py-1 text-xs font-medium text-right tabular-nums">
                  {fmt(actifs.reduce((s, r) => s + r.montantN2, 0))}
                </td>
              )}
              <td colSpan={7} />
            </>
          );
        }}
      >
        <thead className="bg-muted/50 border-b-2 border-primary/20">
          <tr>
            <Th className="w-7" />
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Secteur</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-8 text-center">Détail</Th>
            <Th className="w-24 text-center">{y1Label}</Th>
            {showN1 && <Th className="w-14 text-center">% Év.</Th>}
            {showN1 && <Th className="w-24 text-center">{y2Label}</Th>}
            {showN2 && <Th className="w-14 text-center">% Év.</Th>}
            {showN2 && <Th className="w-24 text-center">{y3Label}</Th>}
            <Th className="w-16 text-center">Tx marge</Th>
            <Th className="w-14 text-center">Stocks</Th>
            <Th className="w-14 text-center">Règl. client</Th>
            <Th className="w-16 text-center">TVA ventes</Th>
            <Th className="w-14 text-center">Règl. fournisseur</Th>
            <Th className="w-16 text-center">TVA achats</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
      {detailIdx !== null && (
        <DetailActiviteDialog
          open={detailIdx !== null}
          onOpenChange={(open) => { if (!open) setDetailIdx(null); }}
          dossierId={dossierId}
          activiteIndex={detailIdx}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
        />
      )}
    </div>
  );
}
