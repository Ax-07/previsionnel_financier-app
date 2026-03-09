"use client";

/**
 * Onglet Impôts (fiscaux) — 4 sections
 * - Réintégrations fiscales
 * - Déductions fiscales
 * - Impôt société (IS) + Règlement
 * - CIR + PVLT
 */

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2, Scale, BadgeDollarSign, FlaskConical, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  MODALITES_ACOMPTES,
  MODALITES_CIR,
  type AjustementFiscalRow,
  type ParametresISData,
} from "@/lib/schemas/impots-fiscaux";

import { useImpotsFiscauxStore } from "@/stores/impots-fiscaux-store";
import {
  fetchReintegrations,
  saveReintegrations,
  fetchDeductions,
  saveDeductions,
  fetchParametresIS,
  saveParametresIS,
} from "@/app/actions/impots-fiscaux";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Helpers ───────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Petits composants utilitaires ────────────────────────────────────────────

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

function SectionHeader({
  title,
  icon,
  isDirty,
  isSaving,
  onAdd,
  onSave,
  hideAdd = false,
}: {
  title: string;
  icon?: React.ReactNode;
  isDirty: boolean;
  isSaving: boolean;
  onAdd?: () => void;
  onSave: () => void;
  hideAdd?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
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
        {!hideAdd && onAdd && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd}>
            <Plus className="h-3 w-3" />
            Ajouter
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Tableau ajustement (réintégrations ou déductions) ─────────────────────────

function TableauAjustements({
  rows,
  isDirty,
  isSaving,
  title,
  icon,
  onAdd,
  onUpdate,
  onRemove,
  onSave,
}: {
  rows: AjustementFiscalRow[];
  isDirty: boolean;
  isSaving: boolean;
  title: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  onUpdate: (index: number, data: Partial<AjustementFiscalRow>) => void;
  onRemove: (index: number) => void;
  onSave: () => void;
}) {
  const totalN = rows.filter((r) => r.actif).reduce((s, r) => s + r.montantN, 0);
  const totalN1 = rows.filter((r) => r.actif).reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = rows.filter((r) => r.actif).reduce((s, r) => s + r.montantN2, 0);

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title={title}
        icon={icon}
        isDirty={isDirty}
        isSaving={isSaving}
        onAdd={onAdd}
        onSave={onSave}
      />

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <Th className="w-8 text-center">Sél.</Th>
              <Th className="min-w-50">Libellé</Th>
              <Th className="w-36 text-right">N</Th>
              <Th className="w-36 text-right">N+1</Th>
              <Th className="w-36 text-right">N+2</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id ?? `new-${i}`}
                className={cn(
                  "border-b transition-colors",
                  !row.actif && "opacity-40"
                )}
              >
                {/* Actif */}
                <Td className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={row.actif ?? true}
                    onChange={(e) => onUpdate(i, { actif: e.target.checked })}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                </Td>

                {/* Libellé */}
                <Td>
                  <input
                    type="text"
                    value={row.libelle}
                    onChange={(e) => onUpdate(i, { libelle: e.target.value })}
                    placeholder="Libellé…"
                    className={cellInput}
                  />
                </Td>

                {/* Montant N */}
                <Td>
                  <input
                    type="text"
                    value={fmt(row.montantN)}
                    onChange={(e) => onUpdate(i, { montantN: numVal(e.target.value) })}
                    className={cn(cellInput, "text-right")}
                  />
                </Td>

                {/* Montant N+1 */}
                <Td>
                  <input
                    type="text"
                    value={fmt(row.montantN1)}
                    onChange={(e) => onUpdate(i, { montantN1: numVal(e.target.value) })}
                    className={cn(cellInput, "text-right")}
                  />
                </Td>

                {/* Montant N+2 */}
                <Td>
                  <input
                    type="text"
                    value={fmt(row.montantN2)}
                    onChange={(e) => onUpdate(i, { montantN2: numVal(e.target.value) })}
                    className={cn(cellInput, "text-right")}
                  />
                </Td>

                {/* Supprimer */}
                <Td className="w-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/30 font-medium">
                <td colSpan={2} className="px-2 py-1.5 text-xs text-muted-foreground">
                  Total
                </td>
                <td className="px-2 py-1.5 text-right text-xs">{fmt(totalN)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{fmt(totalN1)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{fmt(totalN2)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Section IS ─────────────────────────────────────────────────────────────────

function SectionIS({
  params,
  isDirty,
  isSaving,
  onChange,
  onSave,
}: {
  params: ParametresISData;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (data: Partial<ParametresISData>) => void;
  onSave: () => void;
}) {
  const exercices: Array<{ label: string; suffix: "N" | "N1" | "N2" }> = [
    { label: "N",   suffix: "N"  },
    { label: "N+1", suffix: "N1" },
    { label: "N+2", suffix: "N2" },
  ];

  const isField = <T extends keyof ParametresISData>(
    suffix: "N" | "N1" | "N2",
    base: string
  ) => `${base}${suffix}` as T;

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Impôt société (IS)"
        icon={<BadgeDollarSign className="h-4 w-4 text-muted-foreground" />}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        hideAdd
      />

      {/* Activation globale */}
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.isEnabled}
          onChange={(e) => onChange({ isEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Calcul de l&apos;impôt actif
      </label>

      {params.isEnabled && (
        <>
          {/* Grille IS par exercice */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <Th className="min-w-55">Paramètre</Th>
                  {exercices.map((ex) => (
                    <Th key={ex.suffix} className="w-40 text-right">{ex.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Taux réduit */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Taux réduit (%)</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={fmt(params[isField(ex.suffix, "tauxReduit")]  as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "tauxReduit")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                {/* Plafond taux réduit */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Plafond taux réduit</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={fmt(params[isField(ex.suffix, "plafondReduit")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "plafondReduit")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                {/* Taux normal */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Taux normal (%)</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={fmt(params[isField(ex.suffix, "tauxNormal")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "tauxNormal")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                {/* Contribution volontaire */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Contribution volontaire</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={fmt(params[isField(ex.suffix, "contributionVol")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "contributionVol")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                {/* Crédit d'impôt */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Crédit d&apos;impôt</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={fmt(params[isField(ex.suffix, "creditImpot")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "creditImpot")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                {/* Modalité acomptes */}
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Modalité acomptes</span></Td>
                  {exercices.map((ex) => (
                    <Td key={ex.suffix}>
                      <select
                        value={params[isField(ex.suffix, "modaliteAcomptes")] as string}
                        onChange={(e) => onChange({ [isField(ex.suffix, "modaliteAcomptes")]: e.target.value as "CALCUL" | "MANUEL" | "AUCUN" })}
                        className={cellSelect}
                      >
                        {MODALITES_ACOMPTES.map((m) => (
                          <option key={m.value} value={m.value} className="bg-background text-foreground">{m.label}</option>
                        ))}
                      </select>
                    </Td>
                  ))}
                </tr>

                {/* Montant acomptes (si Manuel) */}
                {(params.modaliteAcomptesN === "MANUEL" || params.modaliteAcomptesN1 === "MANUEL" || params.modaliteAcomptesN2 === "MANUEL") && (
                  <tr className="border-b bg-muted/10">
                    <Td><span className="px-2 text-xs text-muted-foreground italic">Montant acomptes (manuel)</span></Td>
                    {exercices.map((ex) => {
                      const modaliteKey = isField<keyof ParametresISData>(ex.suffix, "modaliteAcomptes");
                      const manuelKey = isField<keyof ParametresISData>(ex.suffix, "montantAcomptesManuel");
                      const isManuel = params[modaliteKey] === "MANUEL";
                      return (
                        <Td key={ex.suffix}>
                          {isManuel ? (
                            <input
                              type="text"
                              value={fmt((params[manuelKey] as number | undefined) ?? 0)}
                              onChange={(e) => onChange({ [manuelKey]: numVal(e.target.value) })}
                              className={cn(cellInput, "text-right")}
                            />
                          ) : (
                            <span className="block px-2 text-xs text-muted-foreground text-right">—</span>
                          )}
                        </Td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Règlement */}
          <div className="rounded-md border p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Règlement</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Plancher de dispense (€)</span>
                <input
                  type="text"
                  value={fmt(params.plancherDispense)}
                  onChange={(e) => onChange({ plancherDispense: numVal(e.target.value) })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Délai du solde après clôture (jours)</span>
                <input
                  type="text"
                  value={params.delaiSoldeJours}
                  onChange={(e) => onChange({ delaiSoldeJours: parseInt(e.target.value) || 0 })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Délai remboursement crédit (mois)</span>
                <input
                  type="text"
                  value={params.delaiRemboursementMois}
                  onChange={(e) => onChange({ delaiRemboursementMois: parseInt(e.target.value) || 0 })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Section CIR ───────────────────────────────────────────────────────────────

function SectionCIR({
  params,
  isDirty,
  isSaving,
  onChange,
  onSave,
}: {
  params: ParametresISData;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (data: Partial<ParametresISData>) => void;
  onSave: () => void;
}) {
  const exercices: Array<{ label: string; suffix: "N" | "N1" | "N2" }> = [
    { label: "N",   suffix: "N"  },
    { label: "N+1", suffix: "N1" },
    { label: "N+2", suffix: "N2" },
  ];

  const cirField = <T extends keyof ParametresISData>(suffix: "N" | "N1" | "N2", base: string) =>
    `${base}${suffix}` as T;

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="CIR — Crédit d'Impôt Recherche"
        icon={<FlaskConical className="h-4 w-4 text-muted-foreground" />}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        hideAdd
      />

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.cirEnabled}
          onChange={(e) => onChange({ cirEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Activer l&apos;impact CIR
      </label>

      {params.cirEnabled && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <Th className="min-w-45">Paramètre</Th>
                {exercices.map((ex) => (
                  <Th key={ex.suffix} className="w-40 text-right">{ex.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <Td><span className="px-2 text-xs text-muted-foreground">Montant du crédit (€)</span></Td>
                {exercices.map((ex) => (
                  <Td key={ex.suffix}>
                    <input
                      type="text"
                      value={fmt(params[cirField(ex.suffix, "cirMontant")] as number)}
                      onChange={(e) => onChange({ [cirField(ex.suffix, "cirMontant")]: numVal(e.target.value) })}
                      className={cn(cellInput, "text-right")}
                    />
                  </Td>
                ))}
              </tr>
              <tr className="border-b">
                <Td><span className="px-2 text-xs text-muted-foreground">Modalité</span></Td>
                {exercices.map((ex) => (
                  <Td key={ex.suffix}>
                    <select
                      value={params[cirField(ex.suffix, "cirModalite")] as string}
                      onChange={(e) => onChange({ [cirField(ex.suffix, "cirModalite")]: e.target.value as "REPORT" | "REMBOURSEMENT" | "MIXTE" })}
                      className={cellSelect}
                    >
                      {MODALITES_CIR.map((m) => (
                        <option key={m.value} value={m.value} className="bg-background text-foreground">{m.label}</option>
                      ))}
                    </select>
                  </Td>
                ))}
              </tr>
              <tr>
                <Td><span className="px-2 text-xs text-muted-foreground">Délai remboursement (mois)</span></Td>
                {exercices.map((ex) => (
                  <Td key={ex.suffix}>
                    <input
                      type="text"
                      value={params[cirField(ex.suffix, "cirDelai")] as number}
                      onChange={(e) => onChange({ [cirField(ex.suffix, "cirDelai")]: parseInt(e.target.value) || 0 })}
                      className={cn(cellInput, "text-right")}
                    />
                  </Td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Section PVLT ──────────────────────────────────────────────────────────────

function SectionPVLT({
  params,
  isDirty,
  isSaving,
  onChange,
  onSave,
}: {
  params: ParametresISData;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (data: Partial<ParametresISData>) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Impôt sur les plus-values à long terme (PVLT)"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        hideAdd
      />

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.pvltEnabled}
          onChange={(e) => onChange({ pvltEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Calcul de l&apos;impôt PVLT actif
      </label>

      {params.pvltEnabled && (
        <div className="flex items-center gap-3">
          <label className="flex flex-col gap-1 w-48">
            <span className="text-xs text-muted-foreground">Taux d&apos;impôt sur P.V. (%)</span>
            <input
              type="text"
              value={fmt(params.pvltTaux)}
              onChange={(e) => onChange({ pvltTaux: numVal(e.target.value) })}
              className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface ImpotsFiscauxFormProps {
  dossierId: string;
  reintegrationsInitial?: AjustementFiscalRow[];
  deductionsInitial?: AjustementFiscalRow[];
  parametresISInitial?: ParametresISData;
}

export function ImpotsFiscauxForm({
  dossierId,
  reintegrationsInitial = [],
  deductionsInitial = [],
  parametresISInitial,
}: ImpotsFiscauxFormProps) {
  const store = useImpotsFiscauxStore();
  const draft = store.getDraft(dossierId);

  const [isSavingR, startSavingR] = useTransition();
  const [isSavingD, startSavingD] = useTransition();
  const [isSavingIS, startSavingIS] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  // ── Hydratation initiale ────────────────────────────────────────────────────
  useEffect(() => {
    if (!store.drafts[dossierId]) {
      store.setReintegrations(dossierId, reintegrationsInitial);
      store.setDeductions(dossierId, deductionsInitial);
      if (parametresISInitial) {
        store.setParametresIS(dossierId, parametresISInitial);
      }
    } else {
      // Mise à jour des lignes without unsaved changes
      if (!draft.hasUnsavedReintegrations) {
        store.setReintegrations(dossierId, reintegrationsInitial);
      }
      if (!draft.hasUnsavedDeductions) {
        store.setDeductions(dossierId, deductionsInitial);
      }
      if (!draft.hasUnsavedParametresIS && parametresISInitial) {
        store.setParametresIS(dossierId, parametresISInitial);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // ── Save réintégrations ─────────────────────────────────────────────────────
  const handleSaveReintegrations = useCallback(() => {
    startSavingR(async () => {
      const result = await saveReintegrations(dossierId, draft.reintegrations);
      if (result.success) {
        // Refetch pour obtenir les IDs générés
        const fresh = await fetchReintegrations(dossierId);
        store.setReintegrations(dossierId, fresh);
        store.markReintegrationsSaved(dossierId);
        invalidateControleStores(dossierId);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, draft.reintegrations, store]);

  // ── Save déductions ─────────────────────────────────────────────────────────
  const handleSaveDeductions = useCallback(() => {
    startSavingD(async () => {
      const result = await saveDeductions(dossierId, draft.deductions);
      if (result.success) {
        const fresh = await fetchDeductions(dossierId);
        store.setDeductions(dossierId, fresh);
        store.markDeductionsSaved(dossierId);
        invalidateControleStores(dossierId);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, draft.deductions, store]);

  // ── Save paramètres IS ──────────────────────────────────────────────────────
  const handleSaveIS = useCallback(() => {
    startSavingIS(async () => {
      const result = await saveParametresIS(dossierId, draft.parametresIS);
      if (result.success) {
        const fresh = await fetchParametresIS(dossierId);
        store.setParametresIS(dossierId, fresh);
        store.markParametresISSaved(dossierId);
        invalidateControleStores(dossierId);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, draft.parametresIS, store]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Réintégrations fiscales ─────────────────────────────────────────── */}
      <TableauAjustements
        title="Réintégrations fiscales"
        icon={<Scale className="h-4 w-4 text-muted-foreground" />}
        rows={draft.reintegrations}
        isDirty={draft.hasUnsavedReintegrations}
        isSaving={isSavingR}
        onAdd={() => store.addReintegration(dossierId)}
        onUpdate={(i, data) => store.updateReintegration(dossierId, i, data)}
        onRemove={(i) => store.removeReintegration(dossierId, i)}
        onSave={handleSaveReintegrations}
      />

      <Separator />

      {/* ── Déductions fiscales ─────────────────────────────────────────────── */}
      <TableauAjustements
        title="Déductions fiscales"
        icon={<Scale className="h-4 w-4 text-muted-foreground rotate-180" />}
        rows={draft.deductions}
        isDirty={draft.hasUnsavedDeductions}
        isSaving={isSavingD}
        onAdd={() => store.addDeduction(dossierId)}
        onUpdate={(i, data) => store.updateDeduction(dossierId, i, data)}
        onRemove={(i) => store.removeDeduction(dossierId, i)}
        onSave={handleSaveDeductions}
      />

      <Separator />

      {/* ── Impôt société ───────────────────────────────────────────────────── */}
      <SectionIS
        params={draft.parametresIS}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isSavingIS}
        onChange={(data) => store.updateParametresIS(dossierId, data)}
        onSave={handleSaveIS}
      />

      <Separator />

      {/* ── CIR ─────────────────────────────────────────────────────────────── */}
      <SectionCIR
        params={draft.parametresIS}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isSavingIS}
        onChange={(data) => store.updateParametresIS(dossierId, data)}
        onSave={handleSaveIS}
      />

      <Separator />

      {/* ── PVLT ────────────────────────────────────────────────────────────── */}
      <SectionPVLT
        params={draft.parametresIS}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isSavingIS}
        onChange={(data) => store.updateParametresIS(dossierId, data)}
        onSave={handleSaveIS}
      />
    </div>
  );
}
