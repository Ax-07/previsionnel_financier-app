"use client";

/**
 * Onglet Autres produits — 6 tableaux éditables inline
 * - Transferts de charges
 * - Reprises sur provisions
 * - Autres produits de gestion courante
 * - Produits financiers
 * - Produits exceptionnels
 * - Produits constatés d'avance (PCA)
 */

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

import {
  NATURES_REPRISE,
  TAUX_TVA_AUTRE_PRODUIT,
  TYPES_TVA_AUTRE_PRODUIT,
  NATURES_PCA,
  type AutreProduitRepriseRow,
  type AutreProduitDateRow,
  type AutreProduitConstateRow,
} from "@/lib/schemas/autres-produits";

import { useAutresProduitsStore } from "@/stores/autres-produits-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  fetchReprises,
  saveReprises,
  fetchProduitsDate,
  saveProduitsDate,
  fetchConstates,
  saveConstates,
} from "@/app/actions/autres-produits";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

// --------------------------------------------------------------------------

function TotauxSimpleRow({
  rows,
  dossierId,
}: {
  rows: { actif?: boolean; hypothese?: string; montantN: number; montantN1: number; montantN2: number }[];
  dossierId: string;
}) {
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
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

function TotauxDateRow({
  rows,
  showTVA,
  dossierId,
}: {
  rows: AutreProduitDateRow[];
  showTVA: boolean;
  dossierId: string;
}) {
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
        {showTVA ? <td colSpan={3} /> : <td />}
      </tr>
    </tfoot>
  );
}

// --------------------------------------------------------------------------
// Section Reprises sur provisions
// --------------------------------------------------------------------------

function ReprisesSection({ dossierId, initialData }: { dossierId: string; initialData: AutreProduitRepriseRow[] }) {
  const store = useAutresProduitsStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.reprises;
  const isDirty = draft.hasUnsavedReprises;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setReprises(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveReprises(dossierId, rows);
      if (result.success) {
        const fresh = await fetchReprises(dossierId);
        store.markReprisesSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  // -- DnD --
  const setRowsDnd = useCallback(
    (updater: (prev: AutreProduitRepriseRow[]) => AutreProduitRepriseRow[]) => {
      store.setReprises(dossierId, updater(rows));
    },
    [dossierId, rows, store],
  );
  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setReprises(dossierId, [
      ...rows,
      {
        id: `__new__${crypto.randomUUID()}`,
        libelle: "",
        actif: true,
        hypothese: "COMMUNE",
        nature: "",
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [dossierId, rows, store]);
  const addRowToGroupe = useCallback(
    (groupe: string) => {
      store.setReprises(dossierId, [
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          actif: true,
          hypothese: "COMMUNE",
          nature: "",
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          ordre: 0,
          groupe,
        },
      ]);
    },
    [dossierId, rows, store],
  );
  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });
  const renderRow = useCallback(
    (row: AutreProduitRepriseRow & { id: string }, _isLastInGroup: boolean) => {
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
              onChange={(e) => store.updateReprise(dossierId, i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => store.updateReprise(dossierId, i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => store.updateReprise(dossierId, i, { nature: e.target.value })}
            >
              <option value="" className="bg-background text-foreground">—</option>
              {NATURES_REPRISE.map((n) => (
                <option key={n.value} value={n.value} className="bg-background text-foreground">
                  {n.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN}
              min={0}
              onChange={(e) => store.updateReprise(dossierId, i, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => store.updateReprise(dossierId, i, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => store.updateReprise(dossierId, i, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary"
                onClick={() => store.duplicateReprise(dossierId, i)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => store.removeReprise(dossierId, i)}
              >
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
        title="Reprises sur provisions"
        description="Annulation de provisions antérieures (dépréciation de créances, risques, litiges…)"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addReprise(dossierId)}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxSimpleRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-40">Nature</Th>
            <Th className="w-28 text-right">N</Th>
            <Th className="w-28 text-right">N+1</Th>
            <Th className="w-28 text-right">N+2</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// --------------------------------------------------------------------------
// Section — Produits datés (transferts / gestion courante / financiers / exceptionnels)
// --------------------------------------------------------------------------

type CategorieProduitDate = "TRANSFERT" | "GESTION_COURANTE" | "FINANCIER" | "EXCEPTIONNEL";

const SECTION_DATE_META: Record<CategorieProduitDate, { title: string; description: string; hasTVA: boolean }> = {
  TRANSFERT: {
    title: "Transferts de charges",
    description: "Reclassements de charges en produits (sans TVA).",
    hasTVA: false,
  },
  GESTION_COURANTE: {
    title: "Autres produits de gestion courante",
    description: "Subventions hors module dédié, refacturations, gains divers…",
    hasTVA: true,
  },
  FINANCIER: {
    title: "Produits financiers",
    description: "Intérêts perçus, produits de placements, escomptes obtenus…",
    hasTVA: false,
  },
  EXCEPTIONNEL: {
    title: "Produits exceptionnels",
    description: "Indemnités, gains non récurrents…",
    hasTVA: true,
  },
};

function ProduitDateSection({
  dossierId,
  categorie,
  initialData,
}: {
  dossierId: string;
  categorie: CategorieProduitDate;
  initialData: AutreProduitDateRow[];
}) {
  const store = useAutresProduitsStore();
  const draft = store.getDraft(dossierId);

  const rows =
    categorie === "TRANSFERT"
      ? draft.transferts
      : categorie === "GESTION_COURANTE"
        ? draft.gestionCourante
        : categorie === "FINANCIER"
          ? draft.financiers
          : draft.exceptionnels;

  const isDirty =
    categorie === "TRANSFERT"
      ? draft.hasUnsavedTransferts
      : categorie === "GESTION_COURANTE"
        ? draft.hasUnsavedGestionCourante
        : categorie === "FINANCIER"
          ? draft.hasUnsavedFinanciers
          : draft.hasUnsavedExceptionnels;

  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      if (categorie === "TRANSFERT") store.setTransferts(dossierId, initialData);
      else if (categorie === "GESTION_COURANTE") store.setGestionCourante(dossierId, initialData);
      else if (categorie === "FINANCIER") store.setFinanciers(dossierId, initialData);
      else store.setExceptionnels(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => {
    if (categorie === "TRANSFERT") store.addTransfert(dossierId);
    else if (categorie === "GESTION_COURANTE") store.addGestionCourante(dossierId);
    else if (categorie === "FINANCIER") store.addFinancier(dossierId);
    else store.addExceptionnel(dossierId);
  }, [store, dossierId, categorie]);

  const handleRemove = useCallback(
    (i: number) => {
      if (categorie === "TRANSFERT") store.removeTransfert(dossierId, i);
      else if (categorie === "GESTION_COURANTE") store.removeGestionCourante(dossierId, i);
      else if (categorie === "FINANCIER") store.removeFinancier(dossierId, i);
      else store.removeExceptionnel(dossierId, i);
    },
    [store, dossierId, categorie],
  );

  const handleDuplicate = useCallback(
    (i: number) => {
      if (categorie === "TRANSFERT") store.duplicateTransfert(dossierId, i);
      else if (categorie === "GESTION_COURANTE") store.duplicateGestionCourante(dossierId, i);
      else if (categorie === "FINANCIER") store.duplicateFinancier(dossierId, i);
      else store.duplicateExceptionnel(dossierId, i);
    },
    [store, dossierId, categorie],
  );

  const handleUpdate = useCallback(
    (i: number, data: Partial<AutreProduitDateRow>) => {
      if (categorie === "TRANSFERT") store.updateTransfert(dossierId, i, data);
      else if (categorie === "GESTION_COURANTE") store.updateGestionCourante(dossierId, i, data);
      else if (categorie === "FINANCIER") store.updateFinancier(dossierId, i, data);
      else store.updateExceptionnel(dossierId, i, data);
    },
    [store, dossierId, categorie],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveProduitsDate(dossierId, categorie, rows);
      if (result.success) {
        const fresh = await fetchProduitsDate(dossierId, categorie);
        if (categorie === "TRANSFERT") store.markTransfertsSaved(dossierId, fresh);
        else if (categorie === "GESTION_COURANTE") store.markGestionCouranteSaved(dossierId, fresh);
        else if (categorie === "FINANCIER") store.markFinanciersSaved(dossierId, fresh);
        else store.markExceptionnelsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, categorie, rows, store, invalidateControleStores]);

  const { title, description, hasTVA } = SECTION_DATE_META[categorie];
  const colSpan = hasTVA ? 12 : 10;

  // -- DnD --
  const setRowsStore = useCallback(
    (newRows: AutreProduitDateRow[]) => {
      if (categorie === "TRANSFERT") store.setTransferts(dossierId, newRows);
      else if (categorie === "GESTION_COURANTE") store.setGestionCourante(dossierId, newRows);
      else if (categorie === "FINANCIER") store.setFinanciers(dossierId, newRows);
      else store.setExceptionnels(dossierId, newRows);
    },
    [dossierId, categorie, store],
  );
  const setRowsDnd = useCallback(
    (updater: (prev: AutreProduitDateRow[]) => AutreProduitDateRow[]) => {
      setRowsStore(updater(rows));
    },
    [rows, setRowsStore],
  );
  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRowsStore([
      ...rows,
      {
        id: `__new__${crypto.randomUUID()}`,
        libelle: "",
        actif: true,
        hypothese: "COMMUNE",
        categorie,
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
  }, [rows, categorie, setRowsStore]);
  const addRowToGroupe = useCallback(
    (groupe: string) => {
      setRowsStore([
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          actif: true,
          hypothese: "COMMUNE",
          categorie,
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
    [rows, categorie, setRowsStore],
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
              onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => handleUpdate(i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN ?? ""}
              onChange={(e) => handleUpdate(i, { dateN: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN}
              min={0}
              onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN1 ?? ""}
              onChange={(e) => handleUpdate(i, { dateN1: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td>
            <input
              type="month"
              className={cellInput}
              value={row.dateN2 ?? ""}
              onChange={(e) => handleUpdate(i, { dateN2: e.target.value })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          {hasTVA && (
            <Td className="w-20">
              <select
                className={cn(cellSelect, "text-right")}
                value={row.tauxTVA ?? 0}
                onChange={(e) =>
                  handleUpdate(i, {
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
          )}
          {hasTVA && (
            <Td className="w-36">
              <select
                className={cellSelect}
                value={row.typeTVA ?? ""}
                disabled={!row.tauxTVA}
                onChange={(e) =>
                  handleUpdate(i, {
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
          )}
          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => handleDuplicate(i)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemove(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, hasTVA, handleUpdate, handleRemove, handleDuplicate],
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
        colSpan={colSpan}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxDateRow rows={rows} showTVA={hasTVA} dossierId={dossierId} /> : undefined}
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
            {hasTVA && <Th className="w-20 text-right">TVA %</Th>}
            {hasTVA && <Th className="w-36">Type TVA</Th>}
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// --------------------------------------------------------------------------
// Section — Produits constatés d'avance (PCA)
// --------------------------------------------------------------------------

function PCASection({ dossierId, initialData }: { dossierId: string; initialData: AutreProduitConstateRow[] }) {
  const store = useAutresProduitsStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.pca;
  const isDirty = draft.hasUnsavedPCA;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setPCA(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveConstates(dossierId, rows);
      if (result.success) {
        const fresh = await fetchConstates(dossierId);
        store.markPCASaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  // -- DnD --
  const setRowsDnd = useCallback(
    (updater: (prev: AutreProduitConstateRow[]) => AutreProduitConstateRow[]) => {
      store.setPCA(dossierId, updater(rows));
    },
    [dossierId, rows, store],
  );
  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    store.setPCA(dossierId, [
      ...rows,
      {
        id: `__new__${crypto.randomUUID()}`,
        libelle: "",
        actif: true,
        hypothese: "COMMUNE",
        nature: "",
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [dossierId, rows, store]);
  const addRowToGroupe = useCallback(
    (groupe: string) => {
      store.setPCA(dossierId, [
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          actif: true,
          hypothese: "COMMUNE",
          nature: "",
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          ordre: 0,
          groupe,
        },
      ]);
    },
    [dossierId, rows, store],
  );
  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });
  const renderRow = useCallback(
    (row: AutreProduitConstateRow & { id: string }, _isLastInGroup: boolean) => {
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
              onChange={(e) => store.updatePCA(dossierId, i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => store.updatePCA(dossierId, i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => store.updatePCA(dossierId, i, { nature: e.target.value })}
            >
              <option value="" className="bg-background text-foreground">—</option>
              {NATURES_PCA.map((n) => (
                <option key={n.value} value={n.value} className="bg-background text-foreground">
                  {n.label}
                </option>
              ))}
            </select>
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN}
              min={0}
              onChange={(e) => store.updatePCA(dossierId, i, { montantN: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => store.updatePCA(dossierId, i, { montantN1: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => store.updatePCA(dossierId, i, { montantN2: numVal(e.target.value) })}
            />
          </Td>
          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary"
                onClick={() => store.duplicatePCA(dossierId, i)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => store.removePCA(dossierId, i)}
              >
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
        title="Produits constatés d'avance (PCA)"
        description="Revenus encaissés rattachés à une période future — soldes de fin d'exercice (passif bilan)."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addPCA(dossierId)}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />
      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxSimpleRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-40">Nature</Th>
            <Th className="w-28 text-right">N</Th>
            <Th className="w-28 text-right">N+1</Th>
            <Th className="w-28 text-right">N+2</Th>
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

// Composant principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AutresProduitsFormProps {
  dossierId: string;
  reprisesInitial?: AutreProduitRepriseRow[];
  transfertsInitial?: AutreProduitDateRow[];
  gestionCouranteInitial?: AutreProduitDateRow[];
  financiersInitial?: AutreProduitDateRow[];
  exceptionnelsInitial?: AutreProduitDateRow[];
  pcaInitial?: AutreProduitConstateRow[];
}

export function AutresProduitsForm({
  dossierId,
  reprisesInitial = [],
  transfertsInitial = [],
  gestionCouranteInitial = [],
  financiersInitial = [],
  exceptionnelsInitial = [],
  pcaInitial = [],
}: AutresProduitsFormProps) {
  return (
    <div className="space-y-10 py-8 px-32">
      <ProduitDateSection dossierId={dossierId} categorie="TRANSFERT" initialData={transfertsInitial} />
      <ReprisesSection dossierId={dossierId} initialData={reprisesInitial} />
      <ProduitDateSection dossierId={dossierId} categorie="GESTION_COURANTE" initialData={gestionCouranteInitial} />
      <ProduitDateSection dossierId={dossierId} categorie="FINANCIER" initialData={financiersInitial} />
      <ProduitDateSection dossierId={dossierId} categorie="EXCEPTIONNEL" initialData={exceptionnelsInitial} />
      <PCASection dossierId={dossierId} initialData={pcaInitial} />
    </div>
  );
}
