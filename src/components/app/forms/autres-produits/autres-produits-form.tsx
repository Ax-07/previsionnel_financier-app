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
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
import {
  fetchReprises,
  saveReprises,
  fetchProduitsDate,
  saveProduitsDate,
  fetchConstates,
  saveConstates,
} from "@/app/actions/autres-produits";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Styles helpers ───────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number) {
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

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
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-400 text-xs gap-1"
          >
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
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Enregistrer
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>
  );
}

// ── Totaux ───────────────────────────────────────────────────────────────────

function TotauxSimpleRow({
  rows,
}: {
  rows: { actif?: boolean; montantN: number; montantN1: number; montantN2: number }[];
}) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td
          colSpan={3}
          className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground"
        >
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        <td />
      </tr>
    </tfoot>
  );
}

function TotauxDateRow({
  rows,
  showTVA,
}: {
  rows: AutreProduitDateRow[];
  showTVA: boolean;
}) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td
          colSpan={3}
          className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground"
        >
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN1, 0))}
        </td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {fmt(active.reduce((s, r) => s + r.montantN2, 0))}
        </td>
        {showTVA ? <td colSpan={3} /> : <td />}
      </tr>
    </tfoot>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Reprises sur provisions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ReprisesSection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: AutreProduitRepriseRow[];
}) {
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
  }, [dossierId, rows, store]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Reprises sur provisions"
        description="Annulation de provisions antérieures (dépréciation de créances, risques, litiges…)"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addReprise(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">Actif</Th>
              <Th className="min-w-[180px]">Libellé</Th>
              <Th className="min-w-[160px]">Nature</Th>
              <Th className="w-28 text-right">N</Th>
              <Th className="w-28 text-right">N+1</Th>
              <Th className="w-28 text-right">N+2</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Aucune reprise — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "group border-t border-border",
                    !row.actif && "opacity-50"
                  )}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          actif: e.target.checked,
                        })
                      }
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          libelle: e.target.value,
                        })
                      }
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.nature}
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          nature: e.target.value,
                        })
                      }
                    >
                      <option value="">—</option>
                      {NATURES_REPRISE.map((n) => (
                        <option key={n.value} value={n.value}>
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
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          montantN: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          montantN1: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) =>
                        store.updateReprise(dossierId, i, {
                          montantN2: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => store.removeReprise(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxSimpleRow rows={rows} />}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Produits datés (transferts / gestion courante / financiers / exceptionnels)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type CategorieProduitDate =
  | "TRANSFERT"
  | "GESTION_COURANTE"
  | "FINANCIER"
  | "EXCEPTIONNEL";

const SECTION_DATE_META: Record<
  CategorieProduitDate,
  { title: string; description: string; hasTVA: boolean }
> = {
  TRANSFERT: {
    title: "Transferts de charges",
    description: "Reclassements de charges en produits (sans TVA).",
    hasTVA: false,
  },
  GESTION_COURANTE: {
    title: "Autres produits de gestion courante",
    description:
      "Subventions hors module dédié, refacturations, gains divers…",
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
      else if (categorie === "GESTION_COURANTE")
        store.setGestionCourante(dossierId, initialData);
      else if (categorie === "FINANCIER")
        store.setFinanciers(dossierId, initialData);
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
      else if (categorie === "GESTION_COURANTE")
        store.removeGestionCourante(dossierId, i);
      else if (categorie === "FINANCIER") store.removeFinancier(dossierId, i);
      else store.removeExceptionnel(dossierId, i);
    },
    [store, dossierId, categorie]
  );

  const handleUpdate = useCallback(
    (i: number, data: Partial<AutreProduitDateRow>) => {
      if (categorie === "TRANSFERT") store.updateTransfert(dossierId, i, data);
      else if (categorie === "GESTION_COURANTE")
        store.updateGestionCourante(dossierId, i, data);
      else if (categorie === "FINANCIER")
        store.updateFinancier(dossierId, i, data);
      else store.updateExceptionnel(dossierId, i, data);
    },
    [store, dossierId, categorie]
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveProduitsDate(dossierId, categorie, rows);
      if (result.success) {
        const fresh = await fetchProduitsDate(dossierId, categorie);
        if (categorie === "TRANSFERT")
          store.markTransfertsSaved(dossierId, fresh);
        else if (categorie === "GESTION_COURANTE")
          store.markGestionCouranteSaved(dossierId, fresh);
        else if (categorie === "FINANCIER")
          store.markFinanciersSaved(dossierId, fresh);
        else store.markExceptionnelsSaved(dossierId, fresh);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, categorie, rows, store]);

  const { title, description, hasTVA } = SECTION_DATE_META[categorie];

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
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">Actif</Th>
              <Th className="min-w-[160px]">Libellé</Th>
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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={hasTVA ? 11 : 9}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Aucun produit — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "group border-t border-border",
                    !row.actif && "opacity-50"
                  )}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) =>
                        handleUpdate(i, { actif: e.target.checked })
                      }
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) =>
                        handleUpdate(i, { libelle: e.target.value })
                      }
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <input
                      type="month"
                      className={cellInput}
                      value={row.dateN ?? ""}
                      onChange={(e) =>
                        handleUpdate(i, { dateN: e.target.value })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN}
                      min={0}
                      onChange={(e) =>
                        handleUpdate(i, { montantN: numVal(e.target.value) })
                      }
                    />
                  </Td>
                  <Td>
                    <input
                      type="month"
                      className={cellInput}
                      value={row.dateN1 ?? ""}
                      onChange={(e) =>
                        handleUpdate(i, { dateN1: e.target.value })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) =>
                        handleUpdate(i, { montantN1: numVal(e.target.value) })
                      }
                    />
                  </Td>
                  <Td>
                    <input
                      type="month"
                      className={cellInput}
                      value={row.dateN2 ?? ""}
                      onChange={(e) =>
                        handleUpdate(i, { dateN2: e.target.value })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) =>
                        handleUpdate(i, { montantN2: numVal(e.target.value) })
                      }
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
                            typeTVA:
                              numVal(e.target.value) === 0
                                ? null
                                : row.typeTVA ?? "FACTURATION",
                          })
                        }
                      >
                        {TAUX_TVA_AUTRE_PRODUIT.map((t) => (
                          <option key={t.value} value={t.value}>
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
                        <option value="">—</option>
                        {TYPES_TVA_AUTRE_PRODUIT.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Td>
                  )}
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemove(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <TotauxDateRow rows={rows} showTVA={hasTVA} />
          )}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Produits constatés d'avance (PCA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PCASection({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData: AutreProduitConstateRow[];
}) {
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
  }, [dossierId, rows, store]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Produits constatés d'avance (PCA)"
        description="Revenus encaissés rattachés à une période future — soldes de fin d'exercice (passif bilan)."
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addPCA(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">Actif</Th>
              <Th className="min-w-[180px]">Libellé</Th>
              <Th className="min-w-[160px]">Nature</Th>
              <Th className="w-28 text-right">N</Th>
              <Th className="w-28 text-right">N+1</Th>
              <Th className="w-28 text-right">N+2</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Aucun produit constaté — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "group border-t border-border",
                    !row.actif && "opacity-50"
                  )}
                >
                  <Td className="w-8 px-2">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          actif: e.target.checked,
                        })
                      }
                      className="accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          libelle: e.target.value,
                        })
                      }
                      placeholder="Libellé"
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.nature}
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          nature: e.target.value,
                        })
                      }
                    >
                      <option value="">—</option>
                      {NATURES_PCA.map((n) => (
                        <option key={n.value} value={n.value}>
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
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          montantN: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1}
                      min={0}
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          montantN1: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-28">
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2}
                      min={0}
                      onChange={(e) =>
                        store.updatePCA(dossierId, i, {
                          montantN2: numVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td className="w-10 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => store.removePCA(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxSimpleRow rows={rows} />}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    <div className="space-y-10">
      <ProduitDateSection
        dossierId={dossierId}
        categorie="TRANSFERT"
        initialData={transfertsInitial}
      />
      <ReprisesSection
        dossierId={dossierId}
        initialData={reprisesInitial}
      />
      <ProduitDateSection
        dossierId={dossierId}
        categorie="GESTION_COURANTE"
        initialData={gestionCouranteInitial}
      />
      <ProduitDateSection
        dossierId={dossierId}
        categorie="FINANCIER"
        initialData={financiersInitial}
      />
      <ProduitDateSection
        dossierId={dossierId}
        categorie="EXCEPTIONNEL"
        initialData={exceptionnelsInitial}
      />
      <PCASection
        dossierId={dossierId}
        initialData={pcaInitial}
      />
    </div>
  );
}
