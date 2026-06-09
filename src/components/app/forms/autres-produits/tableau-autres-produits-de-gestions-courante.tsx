"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import {
  TAUX_TVA_AUTRE_PRODUIT,
  TYPES_TVA_AUTRE_PRODUIT,
  type AutreProduitDateRow,
} from "@/lib/schemas/autres-produits";
import { useAutresProduitsStore } from "@/stores/autres-produits-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { fetchProduitsDate, saveProduitsDate } from "@/app/actions/autres-produits";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { GroupedDndTable, GroupSelectorButton } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

const CATEGORIE = "GESTION_COURANTE" as const;

function TotauxDateRow({ rows, dossierId }: { rows: AutreProduitDateRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td colSpan={3} />
      </tr>
    </tfoot>
  );
}

export function TableauGestionCouranteProduits({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: AutreProduitDateRow[];
}) {
  const store = useAutresProduitsStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.gestionCourante;
  const isDirty = draft.hasUnsavedGestionCourante;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setGestionCourante(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveProduitsDate(dossierId, CATEGORIE, rows);
      if (result.success) {
        const fresh = await fetchProduitsDate(dossierId, CATEGORIE);
        store.markGestionCouranteSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  const setRowsDnd = useCallback(
    (updater: (prev: AutreProduitDateRow[]) => AutreProduitDateRow[]) => {
      store.setGestionCourante(dossierId, updater(rows));
    },
    [dossierId, rows, store],
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setGestionCourante(dossierId, [
      ...rows,
      {
        id: `__new__${crypto.randomUUID()}`,
        libelle: "",
        actif: true,
        hypothese: "COMMUNE",
        categorie: CATEGORIE,
        dateN: "",
        montantN: 0,
        dateN1: "",
        montantN1: 0,
        dateN2: "",
        montantN2: 0,
        tauxTVA: 0,
        typeTVA: null,
        ordre: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [dossierId, rows, store]);

  const addRowToGroupe = useCallback(
    (groupe: string) => {
      store.setGestionCourante(dossierId, [
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          actif: true,
          hypothese: "COMMUNE",
          categorie: CATEGORIE,
          dateN: "",
          montantN: 0,
          dateN1: "",
          montantN1: 0,
          dateN2: "",
          montantN2: 0,
          tauxTVA: 0,
          typeTVA: null,
          ordre: 0,
          groupe,
        },
      ]);
    },
    [dossierId, rows, store],
  );

  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });

  const renderRow = useCallback(
    (row: AutreProduitDateRow & { id: string }, _isLastInGroup: boolean) => {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i < 0) return null;
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("group border-t border-border", !row.actif && "opacity-50")}
        >
          <DragHandleCell />
          <Td className="w-8 px-2">
            <input
              type="checkbox"
              checked={row.actif ?? true}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN ?? ""}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { dateN: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN}
              min={0}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN1 ?? ""}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { dateN1: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN2 ?? ""}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { dateN2: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => store.updateGestionCourante(dossierId, i, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-20">
            <select
              className={cn(cellSelect, "text-right")}
              value={row.tauxTVA ?? 0}
              onChange={(e) =>
                store.updateGestionCourante(dossierId, i, {
                  tauxTVA: numVal(e.target.value),
                  typeTVA: numVal(e.target.value) === 0 ? null : (row.typeTVA ?? "FACTURATION"),
                })
              }
            >
              {TAUX_TVA_AUTRE_PRODUIT.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">
                  {t.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="w-36">
            <select
              className={cellSelect}
              value={row.typeTVA ?? ""}
              disabled={!row.tauxTVA}
              onChange={(e) =>
                store.updateGestionCourante(dossierId, i, {
                  typeTVA: e.target.value as AutreProduitDateRow["typeTVA"],
                })
              }
            >
              <option value="" className="bg-background text-foreground">—</option>
              {TYPES_TVA_AUTRE_PRODUIT.map((t) => (
                <option key={t.value} value={t.value} className="bg-background text-foreground">
                  {t.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <GroupSelectorButton currentGroupe={row.groupe ?? null} />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => store.duplicateGestionCourante(dossierId, i)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => store.removeGestionCourante(dossierId, i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [dossierId, rows, store],
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Autres produits de gestion courante"
        description="Subventions hors module dédié, refacturations, gains divers…"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addGestionCourante(dossierId)}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={12}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxDateRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-28">Date N</Th>
            <Th className="w-28 text-right">N</Th>
            <Th className="w-28">Date N+1</Th>
            <Th className="w-28 text-right">N+1</Th>
            <Th className="w-28">Date N+2</Th>
            <Th className="w-28 text-right">N+2</Th>
            <Th className="w-20 text-right">TVA %</Th>
            <Th className="w-36">Type TVA</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}
