"use client";

/**
 * Onglet Autres charges — 6 tableaux éditables inline
 * - Dotations sur provisions
 * - Autres charges de gestion courante
 * - Charges financières
 * - Charges exceptionnelles
 * - Charges constatées d'avance (CCA)
 * - Charges à payer (CAP)
 */

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

import {
  NATURES_PROVISION,
  TAUX_TVA_AUTRE_CHARGE,
  TYPES_TVA_AUTRE_CHARGE,
  NATURES_CHARGE_BILAN_CCA,
  NATURES_CHARGE_BILAN_CAP,
  type AutreChargeProvisionRow,
  type AutreChargeDateeRow,
  type AutreChargeBilanRow,
} from "@/lib/schemas/autres-charges";

import { useAutresChargesStore } from "@/stores/autres-charges-store";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  fetchProvisions,
  saveProvisions,
  fetchChargesDatees,
  saveChargesDatees,
  fetchChargesBilan,
  saveChargesBilan,
} from "@/app/actions/autres-charges";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

// ── Totaux ───────────────────────────────────────────────────────────────────

function TotauxProvisionRow({ rows, dossierId }: { rows: AutreChargeProvisionRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
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

function TotauxDateeRow({ rows, dossierId }: { rows: AutreChargeDateeRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
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

function TotauxBilanRow({ rows, dossierId }: { rows: AutreChargeBilanRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Dotations sur provisions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ProvisionsSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: AutreChargeProvisionRow[];
}) {
  const store = useAutresChargesStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.provisions;
  const isDirty = draft.hasUnsavedProvisions;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setProvisions(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveProvisions(dossierId, rows);

      if (result.success) {
        const fresh = await fetchProvisions(dossierId);
        store.markProvisionsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store]);

  // -- DnD --

  const setRowsDnd = useCallback(
    (updater: (prev: AutreChargeProvisionRow[]) => AutreChargeProvisionRow[]) => {
      store.setProvisions(dossierId, updater(rows));
    },
    [dossierId, rows, store],
  );

  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;

    while (existing.has(`Groupe ${n}`)) n++;

    store.setProvisions(dossierId, [
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
      store.setProvisions(dossierId, [
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
    (row: AutreChargeProvisionRow & { id: string }, _isLastInGroup: boolean) => {
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
              onChange={(e) => store.updateProvision(dossierId, i, { actif: e.target.checked })}
              className="accent-primary"
            />
          </Td>
          <Td>
            <input
              className={cellInput}
              value={row.libelle}
              onChange={(e) => store.updateProvision(dossierId, i, { libelle: e.target.value })}
              placeholder="Libellé"
            />
          </Td>
          <Td>
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => store.updateProvision(dossierId, i, { nature: e.target.value })}
            >
              <option value="" className="bg-background text-foreground">—</option>
              {NATURES_PROVISION.map((n) => (
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
              onChange={(e) => store.updateProvision(dossierId, i, { montantN: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN1}
              min={0}
              onChange={(e) => store.updateProvision(dossierId, i, { montantN1: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => store.updateProvision(dossierId, i, { montantN2: numVal(e.target.value) })}
            />
          </Td>

          <Td className="w-10 px-1">
            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary"
                onClick={() => store.duplicateProvision(dossierId, i)}
              >
                <Copy className="h-3 w-3" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => store.removeProvision(dossierId, i)}
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
        title="Dotations sur provisions"
        description="Dépréciation de créances, provisions pour risques, litiges, garanties…"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addProvision(dossierId)}
        onSave={handleSave}
        onAddGroup={addGroupe}
      />

      <GroupedDndTable
        dnd={dnd}
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxProvisionRow rows={rows} dossierId={dossierId} /> : undefined}
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

type CategorieChargeDatee = "GESTION_COURANTE" | "FINANCIERE" | "EXCEPTIONNELLE";

const SECTION_DATEE_LABELS: Record<CategorieChargeDatee, { title: string; description: string }> = {
  GESTION_COURANTE: {
    title: "Autres charges de gestion courante",
    description: "Pénalités, dons, pertes diverses, charges d'exploitation non récurrentes…",
  },
  FINANCIERE: {
    title: "Charges financières",
    description: "Agios, frais financiers divers, commissions hors intérêts d'emprunt…",
  },
  EXCEPTIONNELLE: {
    title: "Charges exceptionnelles",
    description: "Sinistres, pénalités exceptionnelles, pertes non récurrentes…",
  },
};

function ChargeDateeSection({
  dossierId,
  categorie,
  initialData,
}: {
  dossierId: string;
  categorie: CategorieChargeDatee;
  initialData: AutreChargeDateeRow[];
}) {
  const store = useAutresChargesStore();
  const draft = store.getDraft(dossierId);
  const rows =
    categorie === "GESTION_COURANTE"
      ? draft.gestionCourante
      : categorie === "FINANCIERE"
        ? draft.financieres
        : draft.exceptionnelles;

  const isDirty =
    categorie === "GESTION_COURANTE"
      ? draft.hasUnsavedGestionCourante
      : categorie === "FINANCIERE"
        ? draft.hasUnsavedFinancieres
        : draft.hasUnsavedExceptionnelles;

  const [isPending, startTransition] = useTransition();

  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      if (categorie === "GESTION_COURANTE") store.setGestionCourante(dossierId, initialData);
      else if (categorie === "FINANCIERE") store.setFinancieres(dossierId, initialData);
      else store.setExceptionnelles(dossierId, initialData);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => {
    if (categorie === "GESTION_COURANTE") store.addGestionCourante(dossierId);
    else if (categorie === "FINANCIERE") store.addFinanciere(dossierId);
    else store.addExceptionnelle(dossierId);
  }, [store, dossierId, categorie]);

  const handleRemove = useCallback(
    (i: number) => {
      if (categorie === "GESTION_COURANTE") store.removeGestionCourante(dossierId, i);
      else if (categorie === "FINANCIERE") store.removeFinanciere(dossierId, i);
      else store.removeExceptionnelle(dossierId, i);
    },
    [store, dossierId, categorie],
  );

  const handleDuplicate = useCallback(
    (i: number) => {
      if (categorie === "GESTION_COURANTE") store.duplicateGestionCourante(dossierId, i);
      else if (categorie === "FINANCIERE") store.duplicateFinanciere(dossierId, i);
      else store.duplicateExceptionnelle(dossierId, i);
    },
    [store, dossierId, categorie],
  );

  const handleUpdate = useCallback(
    (i: number, data: Partial<AutreChargeDateeRow>) => {
      if (categorie === "GESTION_COURANTE") store.updateGestionCourante(dossierId, i, data);
      else if (categorie === "FINANCIERE") store.updateFinanciere(dossierId, i, data);
      else store.updateExceptionnelle(dossierId, i, data);
    },
    [store, dossierId, categorie],
  );

  const setRowsStore = useCallback(
    (rows: AutreChargeDateeRow[]) => {
      if (categorie === "GESTION_COURANTE") store.setGestionCourante(dossierId, rows);
      else if (categorie === "FINANCIERE") store.setFinancieres(dossierId, rows);
      else store.setExceptionnelles(dossierId, rows);
    },

    [dossierId, categorie, store],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveChargesDatees(dossierId, categorie, rows);

      if (result.success) {
        const fresh = await fetchChargesDatees(dossierId, categorie);

        if (categorie === "GESTION_COURANTE") store.markGestionCouranteSaved(dossierId, fresh);
        else if (categorie === "FINANCIERE") store.markFinancieresSaved(dossierId, fresh);
        else store.markExceptionnellesSaved(dossierId, fresh);

        toast.success(result.message);

        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, categorie, rows, store]);

  const { title, description } = SECTION_DATEE_LABELS[categorie];

  const showTVA = categorie !== "FINANCIERE";

  const colSpan = showTVA ? 12 : 10;

  // -- DnD --

  const setRowsDnd = useCallback(
    (updater: (prev: AutreChargeDateeRow[]) => AutreChargeDateeRow[]) => {
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
    (row: AutreChargeDateeRow & { id: string }, _isLastInGroup: boolean) => {
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
          {showTVA && (
            <Td className="w-20">
              <select
                className={cn(cellSelect, "text-right")}
                value={row.tauxTVA}
                onChange={(e) => handleUpdate(i, { tauxTVA: numVal(e.target.value) })}
              >
                {TAUX_TVA_AUTRE_CHARGE.map((t) => (
                  <option key={t.value} value={t.value} className="bg-background text-foreground">
                    {t.label}
                  </option>
                ))}
              </select>
            </Td>
          )}
          {showTVA && (
            <Td className="w-36">
              <select
                className={cellSelect}
                value={row.typeTVA ?? ""}
                onChange={(e) =>
                  handleUpdate(i, {
                    typeTVA: e.target.value ? (e.target.value as AutreChargeDateeRow["typeTVA"]) : null,
                  })
                }
              >
                <option value="" className="bg-background text-foreground">—</option>
                {TYPES_TVA_AUTRE_CHARGE.map((t) => (
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

    [rows, showTVA, handleUpdate, handleRemove, handleDuplicate],
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
        footer={rows.length > 0 ? <TotauxDateeRow rows={rows} dossierId={dossierId} /> : undefined}
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
            {showTVA && <Th className="w-20 text-right">TVA %</Th>}
            {showTVA && <Th className="w-36">Type TVA</Th>}
            <Th className="w-10" />
          </tr>
        </thead>
      </GroupedDndTable>
    </div>
  );
}

type TypeChargeBilan = "CHARGE_CONSTATEE_AVANCE" | "CHARGE_A_PAYER";

const SECTION_BILAN_LABELS: Record<TypeChargeBilan, { title: string; description: string }> = {
  CHARGE_CONSTATEE_AVANCE: {
    title: "Charges constatées d'avance (CCA)",
    description: "Charges payées d'avance : assurance, loyer… — soldes de fin d'exercice.",
  },
  CHARGE_A_PAYER: {
    title: "Charges à payer (CAP)",
    description: "Factures non parvenues, charges sociales, charges diverses — soldes de fin d'exercice.",
  },
};

function ChargeBilanSection({
  dossierId,

  type,

  initialData,
}: {
  dossierId: string;

  type: TypeChargeBilan;

  initialData: AutreChargeBilanRow[];
}) {
  const store = useAutresChargesStore();

  const draft = store.getDraft(dossierId);

  const rows = type === "CHARGE_CONSTATEE_AVANCE" ? draft.cca : draft.cap;

  const isDirty = type === "CHARGE_CONSTATEE_AVANCE" ? draft.hasUnsavedCCA : draft.hasUnsavedCAP;

  const natures = type === "CHARGE_CONSTATEE_AVANCE" ? NATURES_CHARGE_BILAN_CCA : NATURES_CHARGE_BILAN_CAP;

  const [isPending, startTransition] = useTransition();

  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      if (type === "CHARGE_CONSTATEE_AVANCE") store.setCCA(dossierId, initialData);
      else store.setCAP(dossierId, initialData);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => {
    if (type === "CHARGE_CONSTATEE_AVANCE") store.addCCA(dossierId);
    else store.addCAP(dossierId);
  }, [store, dossierId, type]);

  const handleRemove = useCallback(
    (i: number) => {
      if (type === "CHARGE_CONSTATEE_AVANCE") store.removeCCA(dossierId, i);
      else store.removeCAP(dossierId, i);
    },
    [store, dossierId, type],
  );

  const handleDuplicate = useCallback(
    (i: number) => {
      if (type === "CHARGE_CONSTATEE_AVANCE") store.duplicateCCA(dossierId, i);
      else store.duplicateCAP(dossierId, i);
    },
    [store, dossierId, type],
  );

  const handleUpdate = useCallback(
    (i: number, data: Partial<AutreChargeBilanRow>) => {
      if (type === "CHARGE_CONSTATEE_AVANCE") store.updateCCA(dossierId, i, data);
      else store.updateCAP(dossierId, i, data);
    },
    [store, dossierId, type],
  );

  const setRowsStore = useCallback(
    (newRows: AutreChargeBilanRow[]) => {
      if (type === "CHARGE_CONSTATEE_AVANCE") store.setCCA(dossierId, newRows);
      else store.setCAP(dossierId, newRows);
    },

    [dossierId, type, store],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveChargesBilan(dossierId, type, rows);

      if (result.success) {
        const fresh = await fetchChargesBilan(dossierId, type);

        if (type === "CHARGE_CONSTATEE_AVANCE") store.markCCASaved(dossierId, fresh);
        else store.markCAPSaved(dossierId, fresh);

        toast.success(result.message);

        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, type, rows, store]);

  const { title, description } = SECTION_BILAN_LABELS[type];

  // -- DnD --

  const setRowsDnd = useCallback(
    (updater: (prev: AutreChargeBilanRow[]) => AutreChargeBilanRow[]) => {
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
        type,
        nature: "",
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [rows, type, setRowsStore]);

  const addRowToGroupe = useCallback(
    (groupe: string) => {
      setRowsStore([
        ...rows,
        {
          id: `__new__${crypto.randomUUID()}`,
          libelle: "",
          actif: true,
          hypothese: "COMMUNE",
          type,
          nature: "",
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          ordre: 0,
          groupe,
        },
      ]);
    },

    [rows, type, setRowsStore],
  );

  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });
  const renderRow = useCallback(
    (row: AutreChargeBilanRow & { id: string }, _isLastInGroup: boolean) => {
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
            <select
              className={cellSelect}
              value={row.nature}
              onChange={(e) => handleUpdate(i, { nature: e.target.value })}
            >
              <option value="" className="bg-background text-foreground">—</option>

              {natures.map((n) => (
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
              onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
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
          <Td className="w-28">
            <input
              type="number"
              className={cn(cellInput, "text-right")}
              value={row.montantN2}
              min={0}
              onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
            />
          </Td>
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

    [dossierId, rows, natures, handleUpdate, handleRemove, handleDuplicate],
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
        colSpan={8}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={rows.length > 0 ? <TotauxBilanRow rows={rows} dossierId={dossierId} /> : undefined}
      >
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-7" />
            <Th className="w-8">Actif</Th>
            <Th className="min-w-45">Libellé</Th>
            <Th className="min-w-37.5">Nature</Th>
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

interface AutresChargesFormProps {
  dossierId: string;
  provisionsInitial?: AutreChargeProvisionRow[];
  gestionCouranteInitial?: AutreChargeDateeRow[];
  financieresInitial?: AutreChargeDateeRow[];
  exceptionnellesInitial?: AutreChargeDateeRow[];
  ccaInitial?: AutreChargeBilanRow[];
  capInitial?: AutreChargeBilanRow[];
}

export function AutresChargesForm({
  dossierId,
  provisionsInitial = [],
  gestionCouranteInitial = [],
  financieresInitial = [],
  exceptionnellesInitial = [],
  ccaInitial = [],
  capInitial = [],
}: AutresChargesFormProps) {
  return (
    <div className="space-y-10 py-8 px-32">
      <ProvisionsSection dossierId={dossierId} initialData={provisionsInitial} />
      <ChargeDateeSection dossierId={dossierId} categorie="GESTION_COURANTE" initialData={gestionCouranteInitial} />
      <ChargeDateeSection dossierId={dossierId} categorie="FINANCIERE" initialData={financieresInitial} />
      <ChargeDateeSection dossierId={dossierId} categorie="EXCEPTIONNELLE" initialData={exceptionnellesInitial} />
      <ChargeBilanSection dossierId={dossierId} type="CHARGE_CONSTATEE_AVANCE" initialData={ccaInitial} />
      <ChargeBilanSection dossierId={dossierId} type="CHARGE_A_PAYER" initialData={capInitial} />
    </div>
  );
}
