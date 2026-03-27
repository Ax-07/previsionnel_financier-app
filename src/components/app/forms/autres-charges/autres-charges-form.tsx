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
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, numVal } from "@/lib/utils";

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
import {
  fetchProvisions,
  saveProvisions,
  fetchChargesDatees,
  saveChargesDatees,
  fetchChargesBilan,
  saveChargesBilan,
} from "@/app/actions/autres-charges";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Styles helpers ───────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function fmt(v: number) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

// ── Totaux ───────────────────────────────────────────────────────────────────

function TotauxProvisionRow({ rows }: { rows: AutreChargeProvisionRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN2, 0))}</td>
        <td />
      </tr>
    </tfoot>
  );
}

function TotauxDateeRow({ rows }: { rows: AutreChargeDateeRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN2, 0))}</td>
        <td colSpan={3} />
      </tr>
    </tfoot>
  );
}

function TotauxBilanRow({ rows }: { rows: AutreChargeBilanRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN1, 0))}</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(active.reduce((s, r) => s + r.montantN2, 0))}</td>
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

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Dotations sur provisions"
        description="Dépréciation de créances, provisions pour risques, litiges, garanties…"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={() => store.addProvision(dossierId)}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">Actif</Th>
              <Th className="min-w-45">Libellé</Th>
              <Th className="min-w-40">Nature</Th>
              <Th className="w-28 text-right">N</Th>
              <Th className="w-28 text-right">N+1</Th>
              <Th className="w-28 text-right">N+2</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune dotation — cliquez sur « Ajouter » pour commencer.
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
                      <option value="">—</option>
                      {NATURES_PROVISION.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => store.removeProvision(dossierId, i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxProvisionRow rows={rows} />}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Charges datées (gestion courante / financières / exceptionnelles)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  const handleRemove = useCallback((i: number) => {
    if (categorie === "GESTION_COURANTE") store.removeGestionCourante(dossierId, i);
    else if (categorie === "FINANCIERE") store.removeFinanciere(dossierId, i);
    else store.removeExceptionnelle(dossierId, i);
  }, [store, dossierId, categorie]);

  const handleUpdate = useCallback((i: number, data: Partial<AutreChargeDateeRow>) => {
    if (categorie === "GESTION_COURANTE") store.updateGestionCourante(dossierId, i, data);
    else if (categorie === "FINANCIERE") store.updateFinanciere(dossierId, i, data);
    else store.updateExceptionnelle(dossierId, i, data);
  }, [store, dossierId, categorie]);

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
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showTVA ? 11 : 9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune charge — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn("group border-t border-border", !row.actif && "opacity-50")}
                >
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
                          <option key={t.value} value={t.value}>{t.label}</option>
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
                            typeTVA: e.target.value
                              ? (e.target.value as AutreChargeDateeRow["typeTVA"])
                              : null,
                          })
                        }
                      >
                        <option value="">—</option>
                        {TYPES_TVA_AUTRE_CHARGE.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
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
          {rows.length > 0 && <TotauxDateeRow rows={rows} />}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Section — Charges bilan (CCA / CAP)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  const handleRemove = useCallback((i: number) => {
    if (type === "CHARGE_CONSTATEE_AVANCE") store.removeCCA(dossierId, i);
    else store.removeCAP(dossierId, i);
  }, [store, dossierId, type]);

  const handleUpdate = useCallback((i: number, data: Partial<AutreChargeBilanRow>) => {
    if (type === "CHARGE_CONSTATEE_AVANCE") store.updateCCA(dossierId, i, data);
    else store.updateCAP(dossierId, i, data);
  }, [store, dossierId, type]);

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
              <Th className="min-w-45">Libellé</Th>
              <Th className="min-w-37.5">Nature</Th>
              <Th className="w-28 text-right">N</Th>
              <Th className="w-28 text-right">N+1</Th>
              <Th className="w-28 text-right">N+2</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn("group border-t border-border", !row.actif && "opacity-50")}
                >
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
                      <option value="">—</option>
                      {natures.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
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
          {rows.length > 0 && <TotauxBilanRow rows={rows} />}
        </table>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    <div className="space-y-10">
      <ProvisionsSection
        dossierId={dossierId}
        initialData={provisionsInitial}
      />

      <ChargeDateeSection
        dossierId={dossierId}
        categorie="GESTION_COURANTE"
        initialData={gestionCouranteInitial}
      />

      <ChargeDateeSection
        dossierId={dossierId}
        categorie="FINANCIERE"
        initialData={financieresInitial}
      />

      <ChargeDateeSection
        dossierId={dossierId}
        categorie="EXCEPTIONNELLE"
        initialData={exceptionnellesInitial}
      />

      <ChargeBilanSection
        dossierId={dossierId}
        type="CHARGE_CONSTATEE_AVANCE"
        initialData={ccaInitial}
      />

      <ChargeBilanSection
        dossierId={dossierId}
        type="CHARGE_A_PAYER"
        initialData={capInitial}
      />
    </div>
  );
}
