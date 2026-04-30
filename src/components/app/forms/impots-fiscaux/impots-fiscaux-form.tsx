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
import { Trash2, Scale, BadgeDollarSign, FlaskConical, TrendingUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

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
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";

// ── Tableau ajustement (réintégrations ou déductions) ─────────────────────────

function TableauAjustements({
  dossierId,
  rows,
  isDirty,
  isSaving,
  title,
  icon,
  onAdd,
  onUpdate,
  onRemove,
  onDuplicate,
  onSave,
  setRows,
}: {
  dossierId: string;
  rows: AjustementFiscalRow[];
  isDirty: boolean;
  isSaving: boolean;
  title: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  onUpdate: (index: number, data: Partial<AjustementFiscalRow>) => void;
  onRemove: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onSave: () => void;
  setRows: (updater: (prev: AjustementFiscalRow[]) => AjustementFiscalRow[]) => void;
}) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const totalN = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN, 0);
  const totalN1 = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif).reduce((s, r) => s + r.montantN2, 0);

  // ── DnD ────────────────────────────────────────────────────────────────────
  const rowType = rows[0]?.type ?? "REINTEGRATION";
  const setRowsDnd = useCallback(
    (updater: (prev: AjustementFiscalRow[]) => AjustementFiscalRow[]) => setRows(updater),
    [setRows],
  );
  const addGroupe = useCallback(() => {
    const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [
      ...prev,
      {
        id: `__new__${crypto.randomUUID()}`,
        type: rowType as AjustementFiscalRow["type"],
        actif: true,
        hypothese: "COMMUNE" as const,
        libelle: "",
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        groupe: `Groupe ${n}`,
      },
    ]);
  }, [rows, rowType, setRows]);
  const addRowToGroupe = useCallback(
    (groupe: string) => {
      setRows((prev) => [
        ...prev,
        {
          id: `__new__${crypto.randomUUID()}`,
          type: rowType as AjustementFiscalRow["type"],
          actif: true,
          hypothese: "COMMUNE" as const,
          libelle: "",
          montantN: 0,
          montantN1: 0,
          montantN2: 0,
          groupe,
        },
      ]);
    },
    [rowType, setRows],
  );
  const dnd = useGroupedDnd({ rows, setRows: setRowsDnd });
  const renderRow = useCallback(
    (row: AjustementFiscalRow & { id: string }, _isLastInGroup: boolean) => {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i < 0) return null;
      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn("border-b transition-colors", !row.actif && "opacity-40")}
        >
          <DragHandleCell />
          <Td className="w-8 text-center">
            <input
              type="checkbox"
              checked={row.actif ?? true}
              onChange={(e) => onUpdate(i, { actif: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
          </Td>
          <Td>
            <input
              type="text"
              value={row.libelle}
              onChange={(e) => onUpdate(i, { libelle: e.target.value })}
              placeholder="Libellé…"
              className={cellInput}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN)}
              onChange={(e) => onUpdate(i, { montantN: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN1)}
              onChange={(e) => onUpdate(i, { montantN1: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td>
            <input
              type="text"
              value={formatNumber(row.montantN2)}
              onChange={(e) => onUpdate(i, { montantN2: numVal(e.target.value) })}
              className={cn(cellInput, "text-right")}
            />
          </Td>
          <Td className="w-8">
            <div className="flex items-center">
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onDuplicate(i)}
                  title="Dupliquer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, onUpdate, onRemove, onDuplicate],
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title={title}
        icon={icon}
        isDirty={isDirty}
        isSaving={isSaving}
        onAdd={onAdd}
        onSave={onSave}
        onAddGroup={addGroupe}
      />

      <GroupedDndTable
        dnd={dnd}
        colSpan={7}
        onAddRowToGroupe={addRowToGroupe}
        renderRow={renderRow}
        footer={
          rows.length > 0 ? (
            <tfoot>
              <tr className="border-t bg-muted/30 font-medium">
                <td colSpan={3} className="px-2 py-1.5 text-xs text-muted-foreground">
                  Total
                </td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN1)}</td>
                <td className="px-2 py-1.5 text-right text-xs">{formatNumber(totalN2)}</td>
                <td />
              </tr>
            </tfoot>
          ) : undefined
        }
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <Th className="w-7" />
            <Th className="w-8 text-center">Sél.</Th>
            <Th className="min-w-50">Libellé</Th>
            <Th className="w-36 text-right">N</Th>
            <Th className="w-36 text-right">N+1</Th>
            <Th className="w-36 text-right">N+2</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
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
                        value={formatNumber(params[isField(ex.suffix, "tauxReduit")]  as number)}
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
                        value={formatNumber(params[isField(ex.suffix, "plafondReduit")] as number)}
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
                        value={formatNumber(params[isField(ex.suffix, "tauxNormal")] as number)}
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
                        value={formatNumber(params[isField(ex.suffix, "contributionVol")] as number)}
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
                        value={formatNumber(params[isField(ex.suffix, "creditImpot")] as number)}
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
                              value={formatNumber((params[manuelKey] as number | undefined) ?? 0)}
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
                  value={formatNumber(params.plancherDispense)}
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
                      value={formatNumber(params[cirField(ex.suffix, "cirMontant")] as number)}
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
        description=""
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
              value={formatNumber(params.pvltTaux)}
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
  }, [dossierId, draft.reintegrations, store, invalidateControleStores]);

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
  }, [dossierId, draft.deductions, store, invalidateControleStores]);

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
  }, [dossierId, draft.parametresIS, store, invalidateControleStores]);

  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-32">
      {/* ── Réintégrations fiscales ─────────────────────────────────────────── */}
      <TableauAjustements
        dossierId={dossierId}
        title="Réintégrations fiscales"
        icon={<Scale className="h-4 w-4 text-muted-foreground" />}
        rows={draft.reintegrations}
        isDirty={draft.hasUnsavedReintegrations}
        isSaving={isSavingR}
        onAdd={() => store.addReintegration(dossierId)}
        onUpdate={(i, data) => store.updateReintegration(dossierId, i, data)}
        onRemove={(i) => store.removeReintegration(dossierId, i)}
        onDuplicate={(i) => store.duplicateReintegration(dossierId, i)}
        onSave={handleSaveReintegrations}
        setRows={(updater) => store.setReintegrations(dossierId, updater(draft.reintegrations))}
      />

      <Separator />

      {/* ── Déductions fiscales ─────────────────────────────────────────────── */}
      <TableauAjustements
        dossierId={dossierId}
        title="Déductions fiscales"
        icon={<Scale className="h-4 w-4 text-muted-foreground rotate-180" />}
        rows={draft.deductions}
        isDirty={draft.hasUnsavedDeductions}
        isSaving={isSavingD}
        onAdd={() => store.addDeduction(dossierId)}
        onUpdate={(i, data) => store.updateDeduction(dossierId, i, data)}
        onRemove={(i) => store.removeDeduction(dossierId, i)}
        onDuplicate={(i) => store.duplicateDeduction(dossierId, i)}
        onSave={handleSaveDeductions}
        setRows={(updater) => store.setDeductions(dossierId, updater(draft.deductions))}
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

