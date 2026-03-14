"use client";

/**
 * Onglet Personnel — 2 tableaux éditables inline
 * - Rémunération des salariés
 * - Rémunération du dirigeant
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2, Users, UserCog, Activity, Percent, Package, RotateCcw, UsersRound, FileText, Settings2, CalendarDays, Info, Wand2, Calculator, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ModalDetailSalarie } from "./modal-detail-salarie";

import {
  HYPOTHESES_PERSONNEL,
  EXONERATIONS_TNS,
  MOIS_PAIEMENT_OPTIONS,
  REGIME_SOCIAL_OPTIONS,
  MODE_CALCUL_TNS_OPTIONS,
  COTISATIONS_TNS_DEFAUT,
  type LigneSalarieRow,
  type LigneDirigeantRow,
  type LigneCotisationTNSRow,
  type LigneTaxeSalaireRow,
  type LigneChargePersonnelRow,
  type ParamsGlobauxSalaries,
  type ParamsGlobauxTNS,
} from "@/lib/schemas/personnel";

import { usePersonnelStore } from "@/stores/personnel-store";
import {
  saveLignesSalaries,
  saveLignesDirigeants,
  saveLignesCotisationsTNS,
  saveLignesTaxesSalaires,
  saveLignesChargesPersonnel,
  fetchDossierDebutExercice,
  fetchMoisPaiementSalaires,
  saveMoisPaiementSalaires,
  fetchParamsGlobauxTNS,
  saveParamsGlobauxTNS,
} from "@/app/actions/personnel";
import { ModalDetailDirigeant } from "./modal-detail-dirigeant";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { calculerMontantsTNS, trouverBrutPourNet, detecterACRE, remuTNSBase, type ModeCalculTNS, simulerTresorerieUrssafSur3Ans } from "@/lib/calcul/taux-tns";

// ── Mapping libellé → index dans MontantsTNSLigne[] (calculerMontantsTNSDepuisNet) ──
// Nouveaux libellés (réforme 2026) + anciens pour rétrocompatibilité BDD.
const AUTO_IDX_BY_LABEL: Record<string, number> = {
  // ── Libellés courants (réforme 2026) ──────────────────────────────────────
  "Allocations familiales":                     0,
  "Maladie-maternité":                          1,
  "Indemnités journalières (IJ)":               2,
  "Retraite (base + compl) + invalidité-décès": 3,
  "CSG/CRDS":                                   4,
  "CFP (forfait PASS)":                         5,
  // ── Anciens libellés (rétrocompatibilité enregistrements BDD) ─────────────
  "Allocation familiale":                       0,
  "Maladie, maternité":                         1,
  "Maladie 1, maladie 2":                       1,
  "Retraite, invalidité / décès":               3,
  "CSG déductible, CFP":                        4,
  "CSG/CRDS non déductible":                    5,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0 [appearance:textfield]";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Input décimal contrôlé localement pour éviter le bug « impossible de saisir 0.xx »
 * (le store stocke un number ; convertir "0." en 0 immédiatement efface la virgule).
 */
// Calcule N+1 et N+2 depuis N et les taux d'évolution
function applyEvolution(montant: number, evol: number): number {
  return Math.round((montant * (1 + evol / 100)) * 100) / 100;
}

// Calcule le % d'évolution entre deux montants (retourne 0 si base = 0)
function calcEvolution(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 10000) / 100;
}

// ── Composants utilitaires ───────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  icon,
  isDirty,
  isSaving,
  onAdd,
  onSave,
  hideAdd = false,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isDirty: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
  hideAdd?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <div>
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
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
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Enregistrer
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd} style={hideAdd ? { display: "none" } : undefined}>
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>;
}

// ── Totaux communs ────────────────────────────────────────────────────────────

function TotauxRow({
  rows,
  colSpanBefore = 4,
}: {
  rows: Array<{ actif?: boolean; montantN: number; montantN1: number; montantN2: number }>;
  colSpanBefore?: number;
}) {
  const active = rows.filter((r) => r.actif !== false);
  const totalN = active.reduce((s, r) => s + r.montantN, 0);
  const totalN1 = active.reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = active.reduce((s, r) => s + r.montantN2, 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={colSpanBefore} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN2)}</td>
        <td colSpan={4} />
      </tr>
    </tfoot>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTAUX SALARIÉS (brut + charges patronales calculées)
// ─────────────────────────────────────────────────────────────────────────────

function TotauxSalariesRow({ rows }: { rows: LigneSalarieRow[] }) {
  const active = rows.filter((r) => r.actif !== false);
  const totalN  = active.reduce((s, r) => s + r.montantN,  0);
  const totalN1 = active.reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = active.reduce((s, r) => s + r.montantN2, 0);
  const patN  = active.reduce((s, r) => s + r.montantN  * (r.tauxCotPat / 100), 0);
  const patN1 = active.reduce((s, r) => s + r.montantN1 * (r.tauxCotPat / 100), 0);
  const patN2 = active.reduce((s, r) => s + r.montantN2 * (r.tauxCotPat / 100), 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={5} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total brut (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(totalN2)}</td>
        <td colSpan={4} />
      </tr>
      <tr className="border-t border-dashed border-border/50">
        <td colSpan={5} className="px-2 py-1.5 text-xs font-medium text-right text-muted-foreground">
          Charges patronales (calc.)
        </td>
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{fmt(patN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{fmt(patN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{fmt(patN2)}</td>
        <td colSpan={4} />
      </tr>
      <tr className="border-t border-border bg-muted/50">
        <td colSpan={5} className="px-2 py-1.5 text-xs font-bold text-right text-muted-foreground">
          Coût total employeur
        </td>
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(totalN + patN)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(totalN1 + patN1)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(totalN2 + patN2)}</td>
        <td colSpan={4} />
      </tr>
    </tfoot>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES GLOBAUX
// ─────────────────────────────────────────────────────────────────────────────

function ParamsGlobauxSection({
  dossierId,
}: {
  dossierId: string;
}) {
  const store = usePersonnelStore();
  const params: ParamsGlobauxSalaries = store.getDraft(dossierId).paramsGlobaux;
  const invalidateControleStores = useInvalidateControleStores();

  // Initialisation depuis la DB au montage
  useEffect(() => {
    fetchMoisPaiementSalaires(dossierId).then((v) => {
      store.updateParamsGlobaux(dossierId, { moisPaiement: v });
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const set = (data: Partial<ParamsGlobauxSalaries>) => {
    store.updateParamsGlobaux(dossierId, data);
    // Auto-save du moisPaiement en DB et invalidation du cache trésorerie
    if (data.moisPaiement !== undefined) {
      saveMoisPaiementSalaires(dossierId, data.moisPaiement).then((res) => {
        if (res.success) invalidateControleStores(dossierId);
      }).catch(() => null);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold leading-snug">Paramètres globaux</h3>
          <p className="text-xs text-muted-foreground">Options de paiement et taux applicables à l’ensemble des salariés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Mois de paiement */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="moisPaiement">
            Paiement des salaires
          </label>
          <select
            id="moisPaiement"
            className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={params.moisPaiement}
            onChange={(e) => set({ moisPaiement: Number(e.target.value) })}
          >
            {MOIS_PAIEMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* % Trimestre */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pctTrimestre">
            Paiement au trimestre (%)
          </label>
          <div className="flex items-center gap-1 h-8 rounded-md border bg-background px-2">
            <input
              id="pctTrimestre"
              type="text"
              inputMode="decimal"
              className="flex-1 bg-transparent text-sm text-right focus:outline-none"
              value={params.pctTrimestre === 0 ? "" : params.pctTrimestre}
              placeholder="0"
              onChange={(e) => set({ pctTrimestre: numVal(e.target.value) })}
            />
            <span className="text-xs text-muted-foreground shrink-0">%</span>
          </div>
        </div>

        {/* % Mensuel */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pctMensuel">
            Paiement mensuel (%)
          </label>
          <div className="flex items-center gap-1 h-8 rounded-md border bg-background px-2">
            <input
              id="pctMensuel"
              type="text"
              inputMode="decimal"
              className="flex-1 bg-transparent text-sm text-right focus:outline-none"
              value={params.pctMensuel === 0 ? "" : params.pctMensuel}
              placeholder="0"
              onChange={(e) => set({ pctMensuel: numVal(e.target.value) })}
            />
            <span className="text-xs text-muted-foreground shrink-0">%</span>
          </div>
        </div>

        {/* Taux cotisations patronales global */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="tauxCotPatGlobal">
            Tx cot. patronales (défaut)
          </label>
          <div className="flex items-center gap-1 h-8 rounded-md border bg-background px-2">
            <input
              id="tauxCotPatGlobal"
              type="number"
              step="any"
              className="flex-1 bg-transparent text-sm text-right focus:outline-none [appearance:textfield]"
              value={params.tauxCotPatGlobal === 0 ? "" : params.tauxCotPatGlobal}
              placeholder="0"
              onChange={(e) => set({ tauxCotPatGlobal: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
            />
            <span className="text-xs text-muted-foreground shrink-0">%</span>
          </div>
        </div>

        {/* Saisonnalité congés */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Saisonnalité congés</span>
          <label
            htmlFor="saisonnaliteConges"
            className="flex items-center gap-2 h-8 cursor-pointer select-none"
          >
            <input
              id="saisonnaliteConges"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={params.saisonnaliteConges}
              onChange={(e) => set({ saisonnaliteConges: e.target.checked })}
            />
            <span className="text-sm">Activer la saisonnalité</span>
          </label>
        </div>
      </div>

      <Separator />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU SALARIÉS
// ─────────────────────────────────────────────────────────────────────────────

function TableauSalaries({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  initialData?: LigneSalarieRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  const rows = draft.salaries;
  const isDirty = draft.hasUnsavedSalaries;
  const injectedIds = draft.simulateurInjectedIds ?? [];

  // Hydratation initiale
  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setSalaries(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addSalarie(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeSalarie(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneSalarieRow>) => store.updateSalarie(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesSalaries(dossierId, rows);
      if (result.success) {
        toast.success(result.message);
        // Rafraîchissement des IDs pour les nouvelles lignes
        if ("ids" in result && result.ids) {
          const updated = rows.map((r, idx) => ({
            ...r,
            id: result.ids![idx] ?? r.id,
          }));
          store.setSalaries(dossierId, updated);
        }
        store.markSalariesSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store]);

  return (
    <>
      <section className="flex flex-col gap-4">
      <SectionHeader
        title="Rémunération des salariés"
        description="Saisie du brut annuel par type de salarié avec projections N / N+1 / N+2"
        icon={<Users className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-24">Hypothèse</Th>
              <Th className="w-16 text-center">Détail</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
              <Th className="w-20 text-right">Cot. Sal. %</Th>
              <Th className="w-20 text-right">Cot. Pat. %</Th>
              <Th className="w-16 text-right">% Fixe</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? `row-${i}`}
                  className={cn(
                    "border-b last:border-0 hover:bg-muted/20 transition-colors",
                    row.actif === false && "opacity-50",
                  )}
                >
                  {/* Actif */}
                  <Td className="pl-2">
                    <input
                      type="checkbox"
                      checked={row.actif !== false}
                      onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Activer"
                    />
                  </Td>

                  {/* Libellé */}
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      placeholder="Saisir un libellé…"
                      onChange={(e) => handleUpdate(i, { libelle: e.target.value })}
                    />
                  </Td>

                  {/* Hypothèse */}
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.hypothese}
                      onChange={(e) => handleUpdate(i, { hypothese: e.target.value })}
                      aria-label="Hypothèse"
                    >
                      {HYPOTHESES_PERSONNEL.map((h) => (
                        <option key={h.value} value={h.value} className="bg-background text-foreground">
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </Td>

                  {/* Détail */}
                  <Td className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => setDetailIdx(i)}
                      aria-label="Ouvrir le détail"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  </Td>

                  {/* N */}
                  <Td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN = numVal(e.target.value);
                        const montantN1 = applyEvolution(montantN, row.evolutionN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { montantN, montantN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* % Évol N→N+1 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                      placeholder="0"
                      onChange={(e) => {
                        const evolutionN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const montantN1 = applyEvolution(row.montantN, evolutionN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { evolutionN1, montantN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* N+1 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1 === 0 ? "" : row.montantN1}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const evolutionN1 = calcEvolution(row.montantN, montantN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { montantN1, evolutionN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* % Évol N+1→N+2 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                      placeholder="0"
                      onChange={(e) => {
                        const evolutionN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const montantN2 = applyEvolution(row.montantN1, evolutionN2);
                        handleUpdate(i, { evolutionN2, montantN2 });
                      }}
                    />
                  </Td>

                  {/* N+2 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2 === 0 ? "" : row.montantN2}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const evolutionN2 = calcEvolution(row.montantN1, montantN2);
                        handleUpdate(i, { montantN2, evolutionN2 });
                      }}
                    />
                  </Td>

                  {/* Taux cotisations salariales */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.tauxCotSal === 0 ? "" : row.tauxCotSal}
                      placeholder="0"
                      onChange={(e) => handleUpdate(i, { tauxCotSal: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                    />
                  </Td>

                  {/* Taux cotisations patronales */}
                  <Td>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        step="any"
                        className={cn(cellInput, "text-right flex-1 min-w-0")}
                        value={row.tauxCotPat === 0 ? "" : row.tauxCotPat}
                        placeholder="0"
                        onChange={(e) => handleUpdate(i, { tauxCotPat: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                      />
                      <button
                        type="button"
                        title={`Simuler les charges pour « ${row.libelle || "ce salarié"} »`}
                        onClick={() => {
                          const brutMensuel = row.montantN > 0 ? Math.round((row.montantN / 12) * 100) / 100 : 2000;
                          const qs = new URLSearchParams();
                          qs.set("dossierId", dossierId);
                          if (row.id) qs.set("salarieId", row.id);
                          if (row.libelle) qs.set("libelle", row.libelle);
                          qs.set("brutMensuel", String(brutMensuel));
                          qs.set("returnUrl", `/app/dossier/${dossierId}`);
                          router.push(`/simulateur-paie?${qs.toString()}`);
                        }}
                        className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Simuler les charges"
                      >
                        <Calculator className="h-3 w-3" />
                      </button>
                      {row.id && injectedIds.includes(row.id) && (
                        <span title="Taux calculé par le simulateur" className="text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* % Fixe */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.tauxFixe === 0 ? "" : row.tauxFixe}
                      placeholder="0"
                      onChange={(e) => handleUpdate(i, { tauxFixe: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                    />
                  </Td>

                  {/* Supprimer */}
                <Td className="text-center px-1">
                  <button
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto"
                    onClick={() => handleRemove(i)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxSalariesRow rows={rows} />}
        </table>
      </div>
    </section>

    {/* Modal Détail Salarié */}
    {detailIdx !== null && rows[detailIdx] && (
      <ModalDetailSalarie
        key={`detail-${detailIdx}-${rows[detailIdx].id ?? detailIdx}`}
        open
        row={rows[detailIdx]}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
        onClose={() => setDetailIdx(null)}
        onApply={(patch) => {
          handleUpdate(detailIdx!, patch);
          setDetailIdx(null);
        }}
      />
    )}
  </>);
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU DIRIGEANT
// ─────────────────────────────────────────────────────────────────────────────

function TableauDirigeant({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  initialData?: LigneDirigeantRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  const rows = draft.dirigeants;
  const isDirty = draft.hasUnsavedDirigeants;

  // Hydratation initiale
  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setDirigeants(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addDirigeant(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeDirigeant(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneDirigeantRow>) => store.updateDirigeant(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesDirigeants(dossierId, rows);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          const updated = rows.map((r, idx) => ({
            ...r,
            id: result.ids![idx] ?? r.id,
          }));
          store.setDirigeants(dossierId, updated);
        }
        store.markDirigeantsSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Rémunération du dirigeant"
        description="Rémunération TNS ou assimilé salarié avec projections et options"
        icon={<UserCog className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-28">Hypothèse</Th>
              <Th className="w-16 text-center">Détail</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-20 text-right">% Évol.</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
              <Th className="w-28">Exonération TNS</Th>
              <Th className="w-24 text-center">Conjoint</Th>
              <Th className="w-16 text-right">% Fixe</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? `dir-${i}`}
                  className={cn(
                    "border-b last:border-0 hover:bg-muted/20 transition-colors",
                    row.actif === false && "opacity-50",
                  )}
                >
                  {/* Actif */}
                  <Td className="pl-2">
                    <input
                      type="checkbox"
                      checked={row.actif !== false}
                      onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Activer"
                    />
                  </Td>

                  {/* Libellé */}
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      placeholder="Rémunération gérant…"
                      onChange={(e) => handleUpdate(i, { libelle: e.target.value })}
                    />
                  </Td>

                  {/* Hypothèse */}
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.hypothese}
                      onChange={(e) => handleUpdate(i, { hypothese: e.target.value })}
                      aria-label="Hypothèse"
                    >
                      {HYPOTHESES_PERSONNEL.map((h) => (
                        <option key={h.value} value={h.value} className="bg-background text-foreground">
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </Td>

                  {/* Détail */}
                  <Td className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setDetailIdx(i)}
                      aria-label="Détail mensuel"
                    >
                      <CalendarDays className="h-3 w-3" />
                    </Button>
                  </Td>

                  {/* N */}
                  <Td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN = numVal(e.target.value);
                        const montantN1 = applyEvolution(montantN, row.evolutionN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { montantN, montantN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* % Évol N→N+1 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                      placeholder="0"
                      onChange={(e) => {
                        const evolutionN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const montantN1 = applyEvolution(row.montantN, evolutionN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { evolutionN1, montantN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* N+1 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1 === 0 ? "" : row.montantN1}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN1 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const evolutionN1 = calcEvolution(row.montantN, montantN1);
                        const montantN2 = applyEvolution(montantN1, row.evolutionN2);
                        handleUpdate(i, { montantN1, evolutionN1, montantN2 });
                      }}
                    />
                  </Td>

                  {/* % Évol N+1→N+2 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                      placeholder="0"
                      onChange={(e) => {
                        const evolutionN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const montantN2 = applyEvolution(row.montantN1, evolutionN2);
                        handleUpdate(i, { evolutionN2, montantN2 });
                      }}
                    />
                  </Td>

                  {/* N+2 */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2 === 0 ? "" : row.montantN2}
                      placeholder="0"
                      onChange={(e) => {
                        const montantN2 = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                        const evolutionN2 = calcEvolution(row.montantN1, montantN2);
                        handleUpdate(i, { montantN2, evolutionN2 });
                      }}
                    />
                  </Td>

                  {/* Exonération TNS */}
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.exonerationTNS ?? ""}
                      onChange={(e) => handleUpdate(i, { exonerationTNS: e.target.value })}
                      aria-label="Exonération TNS"
                    >
                      {EXONERATIONS_TNS.map((ex) => (
                        <option key={ex.value} value={ex.value} className="bg-background text-foreground">
                          {ex.label}
                        </option>
                      ))}
                    </select>
                  </Td>

                  {/* Conjoint collaborateur */}
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.conjointCollaborateur}
                      onChange={(e) => handleUpdate(i, { conjointCollaborateur: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Conjoint collaborateur"
                    />
                  </Td>

                  {/* % Fixe */}
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.tauxFixe === 0 ? "" : row.tauxFixe}
                      placeholder="0"
                      onChange={(e) => handleUpdate(i, { tauxFixe: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                    />
                  </Td>

                  {/* Supprimer */}
                <Td className="text-center px-1">
                  <button
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto"
                    onClick={() => handleRemove(i)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && <TotauxRow rows={rows} />}
        </table>
      </div>

      {detailIdx !== null && rows[detailIdx] && (
        <ModalDetailDirigeant
          key={`detail-dir-${detailIdx}-${rows[detailIdx].id ?? detailIdx}`}
          open
          row={rows[detailIdx]}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
          onClose={() => setDetailIdx(null)}
          onApply={(patch: Partial<LigneDirigeantRow>) => {
            handleUpdate(detailIdx, patch);
            setDetailIdx(null);
          }}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU COTISATIONS TNS
// ─────────────────────────────────────────────────────────────────────────────

function ParamsTNSSection({ dossierId }: { dossierId: string }) {
  const store = usePersonnelStore();
  const params: ParamsGlobauxTNS = store.getDraft(dossierId).paramsGlobauxTNS;
  const invalidateControleStores = useInvalidateControleStores();

  // Chargement depuis la BDD au montage (priorité BDD > localStorage)
  useEffect(() => {
    fetchParamsGlobauxTNS(dossierId).then((dbParams) => {
      store.updateParamsGlobauxTNS(dossierId, dbParams);
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const set = (data: Partial<ParamsGlobauxTNS>) => {
    store.updateParamsGlobauxTNS(dossierId, data);
    // Auto-save en BDD dès le changement (comme moisPaiement)
    const updated = { ...params, ...data };
    saveParamsGlobauxTNS(dossierId, {
      regimeSocial: updated.regimeSocial,
      modeCalculTNS: updated.modeCalculTNS,
      decalerEcheancierN2: updated.decalerEcheancierN2,
    }).then((res) => {
      if (res.success) invalidateControleStores(dossierId);
    }).catch(() => null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-md bg-muted/30 border">
      {/* Régime social */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="regimeSocial">
          Régime social
        </label>
        <select
          id="regimeSocial"
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={params.regimeSocial}
          onChange={(e) => set({ regimeSocial: e.target.value as ParamsGlobauxTNS["regimeSocial"] })}
        >
          {REGIME_SOCIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Mode de calcul TNS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="modeCalculTNS">
          Mode de calcul cotisations
        </label>
        <select
          id="modeCalculTNS"
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={params.modeCalculTNS}
          onChange={(e) => set({ modeCalculTNS: e.target.value as ModeCalculTNS })}
        >
          {MODE_CALCUL_TNS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Décaler échéancier N+2 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Décaler échéancier en N+2</span>
        <label htmlFor="decalerEcheancierN2" className="flex items-center gap-2 h-8 cursor-pointer select-none">
          <input
            id="decalerEcheancierN2"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={params.decalerEcheancierN2}
            onChange={(e) => set({ decalerEcheancierN2: e.target.checked })}
          />
          <span className="text-sm">Activer le décalage</span>
        </label>
      </div>

      {/* Note explicative — pleine largeur */}
      <div className="col-span-full flex gap-2 rounded-md border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {params.modeCalculTNS === "DEFINITIF" ? (
          <span>
            <span className="font-semibold">Mode définitif :</span>{" "}
            Les cotisations sont calculées sur le revenu réel (assiette unique = revenu − abattement 26 %, borné entre 1,76 % et 130 % du PASS).
            Les montants affichés correspondent à ce qui est réellement dû chaque année, sans décalage de trésorerie.
          </span>
        ) : (
          <span>
            <span className="font-semibold">Mode début d&apos;activité (trésorerie URSSAF) :</span>{" "}
            Les deux premières années, l&apos;URSSAF appelle des cotisations <span className="font-medium">provisionnelles</span> sur des bases forfaitaires
            (≈ 19 % du PASS pour le général, 40 % du PASS pour les IJ), faute de revenu réel connu.
            L&apos;année suivante, une <span className="font-medium">régularisation</span> est appliquée (différence entre le dû réel et le forfait).
            {" "}En N+2, les appels sont basés sur le revenu N+1.{" "}
            {params.decalerEcheancierN2 && (
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Décalage actif : la régularisation N est reportée en N+2 (impact positif sur la trésorerie N+1).
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function TableauCotisationsTNS({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneCotisationTNSRow[];
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();

  const rows = draft.cotisationsTNS;
  const isDirty = draft.hasUnsavedCotisationsTNS;

  // Calcul auto depuis NET : dichotomie net→brut puis 6 cotisations sur 3 exercices.
  // Si au moins un dirigeant actif a l'ACRE, réduction dégressive (max 25%) sur l'exercice N.

// ...

const {
  cotisations: montantsAuto,
  bruts: brutsCalcules,
  tresorieTNS,
} = useMemo(() => {
  const { remuN, remuN1, remuN2 } = remuTNSBase(draft.dirigeants);
  const acreN = detecterACRE(draft.dirigeants);
  const regime = draft.paramsGlobauxTNS.regimeSocial;
  const mode = draft.paramsGlobauxTNS.modeCalculTNS;

  // Bruts sur le revenu réel (DEFINITIF) — référence stable quel que soit le mode
  const simN  = trouverBrutPourNet(remuN,  regime, acreN,  { mode: "DEFINITIF" });
  const simN1 = trouverBrutPourNet(remuN1, regime, false,  { mode: "DEFINITIF" });
  const simN2 = trouverBrutPourNet(remuN2, regime, false,  { mode: "DEFINITIF" });

  const bruts = { brutN: simN.brut, brutN1: simN1.brut, brutN2: simN2.brut };

  // Les 6 lignes sauvegardées en BDD = TOUJOURS DEFINITIF (charges comptables du CR/bilan).
  // Le mode "début d'activité" n'affecte que la trésorerie, pas la charge de l'exercice.
  const cotisations = calculerMontantsTNS(
    bruts.brutN, bruts.brutN1, bruts.brutN2,
    regime, acreN, 360, 360, 360, "DEFINITIF",
  );

  // En mode "Début d'activité forfait" : calendrier URSSAF informatif (jamais sauvegardé en BDD)
  if (mode === "DEBUT_ACTIVITE_FORFAIT") {
    const treso = simulerTresorerieUrssafSur3Ans({
      brutN: bruts.brutN, brutN1: bruts.brutN1, brutN2: bruts.brutN2,
      regime, acreN, joursN: 360, joursN1: 360, joursN2: 360,
    });
    return {
      cotisations,
      bruts,
      tresorieTNS: {
        forfaitN:    treso[0].totalPaye,
        forfaitN1:   treso[1].totalPaye - treso[1].regularisation,
        forfaitN2:   treso[2].totalPaye - treso[2].regularisation,
        regN1:       treso[1].regularisation,
        regN2:       treso[2].regularisation,
        totalPayeN:  treso[0].totalPaye,
        totalPayeN1: treso[1].totalPaye,
        totalPayeN2: treso[2].totalPaye,
      },
    };
  }

  return { cotisations, bruts, tresorieTNS: null as null | {
    forfaitN: number; forfaitN1: number; forfaitN2: number;
    regN1: number; regN2: number;
    totalPayeN: number; totalPayeN1: number; totalPayeN2: number;
  } };
}, [draft.dirigeants, draft.paramsGlobauxTNS.regimeSocial, draft.paramsGlobauxTNS.modeCalculTNS]);

  // Rows avec montants calculés injectés + flags ACRE pour l'affichage.
  // Mapping par libellé (robuste aux anciens schémas BDD) plutôt que séquentiel.
  const { rowsWithAuto, acreFlags } = useMemo(() => {
    const flags: boolean[] = [];
    const rows2 = rows.map((row) => {
      if (!row.calcAuto) { flags.push(false); return row; }
      const idx = AUTO_IDX_BY_LABEL[row.libelle];
      if (idx === undefined) { flags.push(false); return row; }
      const auto = montantsAuto[idx];
      if (!auto) { flags.push(false); return row; }
      flags.push(auto.acreApplique);
      return { ...row, montantN: auto.montantN, montantN1: auto.montantN1, montantN2: auto.montantN2 };
    });
    return { rowsWithAuto: rows2, acreFlags: flags };
  }, [rows, montantsAuto]);

  // Initialisation : priorité aux données BDD, sinon lignes prédéfinies
  useEffect(() => {
    if (rows.length === 0) {
      store.setCotisationsTNS(
        dossierId,
        initialData && initialData.length > 0 ? initialData : COTISATIONS_TNS_DEFAUT,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneCotisationTNSRow>) => store.updateCotisationTNS(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      // rowsWithAuto contient toujours les montants DEFINITIFS (charges comptables).
      // La ligne "Régularisation URSSAF" n'est jamais persistée en BDD (trésorerie uniquement).
      const result = await saveLignesCotisationsTNS(dossierId, rowsWithAuto, {
        regimeSocial: draft.paramsGlobauxTNS.regimeSocial,
        modeCalculTNS: "DEFINITIF",
      });
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          store.setCotisationsTNS(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        store.markCotisationsTNSSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rowsWithAuto, draft.paramsGlobauxTNS.regimeSocial, store, invalidateControleStores]);

  
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Cotisations TNS"
        description="Cotisations sociales du travailleur non salarié — lignes prédéfinies, calcul automatique ou saisie manuelle"
        icon={<Activity className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        hideAdd
        onAdd={() => void 0}
        onSave={handleSave}
      />
      <ParamsTNSSection dossierId={dossierId} />
      {(brutsCalcules.brutN > 0 || brutsCalcules.brutN1 > 0 || brutsCalcules.brutN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Brut calculé (net → brut)</span>
          {brutsCalcules.brutN   > 0 && <span>N : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN)} €</span></span>}
          {brutsCalcules.brutN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN1)} €</span></span>}
          {brutsCalcules.brutN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN2)} €</span></span>}
        </div>
      )}
      {acreFlags.some(Boolean) && (
        <div className="flex items-center gap-2 rounded-md border border-green-400/40 bg-green-50/60 dark:bg-green-950/30 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <span className="font-semibold">ACRE actif</span>
          <span className="text-green-600 dark:text-green-500">— réduction jusqu&apos;à 25 % max (hors CSG/CFP/retraite comp.), dégressive de 75 % à 100 % du PASS, sur l&apos;exercice N uniquement.</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-48">Libellé</Th>
              <Th className="w-24 text-center">Calc. auto</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
            </tr>
          </thead>
          <tbody>
            {rowsWithAuto.map((row, i) => {
              const autoIdx = AUTO_IDX_BY_LABEL[row.libelle];
              const autoCapable = autoIdx !== undefined;
              const effectiveCalcAuto = row.calcAuto && autoCapable;

              return (
              <tr
                key={row.id ?? `tns-${i}`}
                className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
              >
                <Td className="pl-2">
                  <input
                    type="checkbox"
                    checked={row.actif !== false}
                    onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                    className="h-3.5 w-3.5 accent-primary"
                    aria-label="Activer"
                  />
                </Td>
                <Td>
                  <span className="px-2 text-sm">{row.libelle}</span>
                  {row.libelle === "Indemnités journalières (IJ)" && draft.paramsGlobauxTNS.regimeSocial === "liberal" && (
                    <span className="ml-1 text-[10px] text-muted-foreground italic">(non applicable PL)</span>
                  )}
                </Td>
                <Td className="text-center">
                  <input
                    type="checkbox"
                    checked={row.calcAuto}
                    disabled={!autoCapable && !row.calcAuto}
                    onChange={(e) => {
                      const next = e.target.checked;
                      if (next && !autoCapable) return;
                      handleUpdate(i, { calcAuto: next });
                    }}
                    className="h-3.5 w-3.5 accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Calcul auto"
                  />
                </Td>
                <Td>
                  <div className="flex items-center">
                    <input
                      type="text" inputMode="decimal"
                      className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder={effectiveCalcAuto ? "auto" : "0"}
                      readOnly={effectiveCalcAuto}
                      tabIndex={effectiveCalcAuto ? -1 : undefined}
                      title={acreFlags[i] ? "Réduit ACRE (max −25 %, dégressif 75−100 % PASS)" : undefined}
                      onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                    />
                    {acreFlags[i] && (
                      <span className="shrink-0 mr-1 rounded px-1 py-0.5 text-[10px] font-semibold leading-none bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        ACRE
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <input
                    type="text" inputMode="decimal"
                    className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
                    value={row.montantN1 === 0 ? "" : row.montantN1}
                    placeholder={effectiveCalcAuto ? "auto" : "0"}
                    readOnly={effectiveCalcAuto}
                    tabIndex={effectiveCalcAuto ? -1 : undefined}
                    onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
                  />
                </Td>
                <Td>
                  <input
                    type="text" inputMode="decimal"
                    className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
                    value={row.montantN2 === 0 ? "" : row.montantN2}
                    placeholder={effectiveCalcAuto ? "auto" : "0"}
                    readOnly={effectiveCalcAuto}
                    tabIndex={effectiveCalcAuto ? -1 : undefined}
                    onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
                  />
                </Td>
              </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}</td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}</td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}</td>
            </tr>
            {tresorieTNS && (
              <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
                  Appels URSSAF provisionnels
                </td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN1)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN2)}</td>
              </tr>
            )}
            {tresorieTNS && (
              <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
                  + Régularisation URSSAF
                </td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(0)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.regN1)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.regN2)}</td>
              </tr>
            )}
            {tresorieTNS && (
              <tr className="border-t border-border bg-muted/50">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-bold text-right text-muted-foreground">= Total décaissé URSSAF</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN)}</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN1)}</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN2)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU TAXES ASSISES SUR LES SALAIRES
// ─────────────────────────────────────────────────────────────────────────────

function TableauTaxesSalaires({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneTaxeSalaireRow[];
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();
  const [debutExercice, setDebutExercice] = useState<{ anneeDebut: number; moisDebut: number } | null>(null);

  const rows = draft.taxesSalaires;
  const isDirty = draft.hasUnsavedTaxesSalaires;

  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      store.setTaxesSalaires(dossierId, initialData);
    }
    fetchDossierDebutExercice(dossierId).then(setDebutExercice).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => store.addTaxeSalaire(dossierId), [store, dossierId]);
  const handleRemove = useCallback((i: number) => store.removeTaxeSalaire(dossierId, i), [store, dossierId]);
  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneTaxeSalaireRow>) => store.updateTaxeSalaire(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  /**
   * Remplit automatiquement les dates de paiement du solde annuel :
   * - dateN  = mai de l'année N+1  (paiement du solde sur l'exercice N)
   * - dateN1 = mai de l'année N+2
   * - dateN2 = mai de l'année N+3
   * Logique : le solde de la taxe d'apprentissage est toujours dû en mai
   * de l'année civile suivant la clôture de l'exercice de référence.
   */
  const handleAutoDateSolde = useCallback(
    (i: number) => {
      if (!debutExercice) return;
      const { anneeDebut } = debutExercice;
      const pad = (y: number) => `${y}-05-01`;
      handleUpdate(i, {
        dateN:  pad(anneeDebut + 1),
        dateN1: pad(anneeDebut + 2),
        dateN2: pad(anneeDebut + 3),
      });
    },
    [debutExercice, handleUpdate],
  );

  // ── Masse salariale brute (somme des salariés actifs) ──────────────────────
  const masseSalarialeN = useMemo(
    () => draft.salaries.filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN ?? 0), 0),
    [draft.salaries],
  );
  const masseSalarialeN1 = useMemo(
    () => draft.salaries.filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN1 ?? 0), 0),
    [draft.salaries],
  );
  const masseSalarialeN2 = useMemo(
    () => draft.salaries.filter((s) => s.actif !== false).reduce((sum, s) => sum + (s.montantN2 ?? 0), 0),
    [draft.salaries],
  );

  // ── Calcul automatique : Taxe = Masse salariale × Taux ─────────────────────
  const rowsWithAuto = useMemo(
    () =>
      rows.map((row) => {
        if (!row.calcAuto || row.taux === 0) return row;
        const rate = row.taux / 100;
        return {
          ...row,
          montantN:  Math.round(masseSalarialeN  * rate * 100) / 100,
          montantN1: Math.round(masseSalarialeN1 * rate * 100) / 100,
          montantN2: Math.round(masseSalarialeN2 * rate * 100) / 100,
        };
      }),
    [rows, masseSalarialeN, masseSalarialeN1, masseSalarialeN2],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesTaxesSalaires(dossierId, rowsWithAuto);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          store.setTaxesSalaires(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        store.markTaxesSalairesSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rowsWithAuto, store, invalidateControleStores]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Taxes assises sur les salaires"
        description="Taxe d'apprentissage, contribution formation, etc."
        icon={<Percent className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />
      {(masseSalarialeN > 0 || masseSalarialeN1 > 0 || masseSalarialeN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Masse salariale brute (base de calcul auto)</span>
          {masseSalarialeN   > 0 && <span>N : <span className="tabular-nums font-medium">{fmt(masseSalarialeN)} €</span></span>}
          {masseSalarialeN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{fmt(masseSalarialeN1)} €</span></span>}
          {masseSalarialeN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{fmt(masseSalarialeN2)} €</span></span>}
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-24">Hypothèse</Th>
              <Th className="w-16 text-center">Calc.</Th>
              <Th className="w-16 text-right">Taux %</Th>
              <Th className="w-24">Date N</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-24">Date N+1</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-24">Date N+2</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rowsWithAuto.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rowsWithAuto.map((row, i) => (
                <tr
                  key={row.id ?? `tax-${i}`}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
                >
                  <Td className="pl-2">
                    <input type="checkbox" checked={row.actif !== false} onChange={(e) => handleUpdate(i, { actif: e.target.checked })} className="h-3.5 w-3.5 accent-primary" aria-label="Activer" />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.libelle} placeholder="Libellé…" onChange={(e) => handleUpdate(i, { libelle: e.target.value })} />
                  </Td>
                  <Td>
                    <select className={cellSelect} value={row.hypothese} onChange={(e) => handleUpdate(i, { hypothese: e.target.value })} aria-label="Hypothèse">
                      {HYPOTHESES_PERSONNEL.map((h) => <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>)}
                    </select>
                  </Td>
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.calcAuto}
                      onChange={(e) => handleUpdate(i, { calcAuto: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Calcul auto — Masse salariale × Taux"
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={row.taux === 0 ? "" : row.taux}
                      placeholder="0"
                      onChange={(e) => handleUpdate(i, { taux: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-0.5">
                      <input
                        className={cn(cellInput, "min-w-0")}
                        value={row.dateN ?? ""}
                        placeholder="aaaa-mm-jj"
                        title="Date de paiement en N (ex : solde annuel)"
                        onChange={(e) => handleUpdate(i, { dateN: e.target.value })}
                      />
                      {debutExercice && (
                        <button
                          type="button"
                          className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-muted-foreground/50 hover:text-purple-600 transition-colors"
                          title={`Remplir les 3 dates au 01/05 (solde annuel) : N→${debutExercice.anneeDebut + 1}, N+1→${debutExercice.anneeDebut + 2}, N+2→${debutExercice.anneeDebut + 3}`}
                          onClick={() => handleAutoDateSolde(i)}
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <input
                      type="text" inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.dateN1 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+1" onChange={(e) => handleUpdate(i, { dateN1: e.target.value })} />
                  </Td>
                  <Td>
                    <input
                      type="text" inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN1 === 0 ? "" : row.montantN1}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.dateN2 ?? ""} placeholder="aaaa-mm-jj" title="Date de paiement en N+2" onChange={(e) => handleUpdate(i, { dateN2: e.target.value })} />
                  </Td>
                  <Td>
                    <input
                      type="text" inputMode="decimal"
                      className={cn(cellInput, "text-right", row.calcAuto && "text-muted-foreground italic")}
                      value={row.montantN2 === 0 ? "" : row.montantN2}
                      placeholder={row.calcAuto ? "auto" : "0"}
                      readOnly={row.calcAuto}
                      tabIndex={row.calcAuto ? -1 : undefined}
                      onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })}
                    />
                  </Td>
                  <Td className="text-center px-1">
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto"
                      onClick={() => handleRemove(i)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rowsWithAuto.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}</td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}</td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rowsWithAuto.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU GÉNÉRIQUE : Autres charges / Remboursements / Participation
// ─────────────────────────────────────────────────────────────────────────────

type TypeChargePersonnel = "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION";

const CHARGE_CONFIG: Record<
  TypeChargePersonnel,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    listKey: "autresCharges" | "remboursements" | "participations";
    dirtyKey: "hasUnsavedAutresCharges" | "hasUnsavedRemboursements" | "hasUnsavedParticipations";
    withDates: boolean;
    withCalcAuto: boolean;
  }
> = {
  AUTRE: {
    title: "Autres charges de personnel",
    description: "Médecine du travail, formation, tickets restaurant, etc.",
    icon: <Package className="h-4 w-4" />,
    listKey: "autresCharges",
    dirtyKey: "hasUnsavedAutresCharges",
    withDates: true,
    withCalcAuto: false,
  },
  REMBOURSEMENT: {
    title: "Remboursements de charges de personnel",
    description: "Remboursements reçus (OPCO, aides à l'emploi, etc.)",
    icon: <RotateCcw className="h-4 w-4" />,
    listKey: "remboursements",
    dirtyKey: "hasUnsavedRemboursements",
    withDates: true,
    withCalcAuto: false,
  },
  PARTICIPATION: {
    title: "Participation des salariés (réserves)",
    description: "Participation légale ou volontaire aux résultats",
    icon: <UsersRound className="h-4 w-4" />,
    listKey: "participations",
    dirtyKey: "hasUnsavedParticipations",
    withDates: false,
    withCalcAuto: true,
  },
};

function TableauChargePersonnel({
  dossierId,
  type,
  initialData,
}: {
  dossierId: string;
  type: TypeChargePersonnel;
  initialData?: LigneChargePersonnelRow[];
}) {
  const config = CHARGE_CONFIG[type];
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const [isPending, startTransition] = useTransition();

  const rows = draft[config.listKey];
  const isDirty = draft[config.dirtyKey];

  // ── Store actions directes (évite les keyof complexes) ──
  const storeSetFn = type === "AUTRE" ? store.setAutresCharges : type === "REMBOURSEMENT" ? store.setRemboursements : store.setParticipations;
  const markSavedFn = type === "AUTRE" ? store.markAutresChargesSaved : type === "REMBOURSEMENT" ? store.markRemboursementsSaved : store.markParticipationsSaved;

  useEffect(() => {
    if (rows.length === 0 && initialData && initialData.length > 0) {
      storeSetFn(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleAdd = useCallback(() => {
    if (type === "AUTRE") store.addAutreCharge(dossierId);
    else if (type === "REMBOURSEMENT") store.addRemboursement(dossierId);
    else store.addParticipation(dossierId);
  }, [store, dossierId, type]);

  const handleRemove = useCallback((i: number) => {
    if (type === "AUTRE") store.removeAutreCharge(dossierId, i);
    else if (type === "REMBOURSEMENT") store.removeRemboursement(dossierId, i);
    else store.removeParticipation(dossierId, i);
  }, [store, dossierId, type]);

  const handleUpdate = useCallback((i: number, data: Partial<LigneChargePersonnelRow>) => {
    if (type === "AUTRE") store.updateAutreCharge(dossierId, i, data);
    else if (type === "REMBOURSEMENT") store.updateRemboursement(dossierId, i, data);
    else store.updateParticipation(dossierId, i, data);
  }, [store, dossierId, type]);
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesChargesPersonnel(dossierId, type, rows);
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          storeSetFn(dossierId, rows.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        markSavedFn(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, type, rows, storeSetFn, markSavedFn]);

  const { withDates, withCalcAuto } = config;
  const colSpanEmpty = 4 + (withCalcAuto ? 1 : 0) + (withDates ? 6 : 0);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={handleAdd}
        onSave={handleSave}
      />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-24">Hypothèse</Th>
              {withCalcAuto && <Th className="w-16 text-center">Calcul</Th>}
              {withDates ? (
                <>
                  <Th className="w-24">Date N</Th>
                  <Th className="w-28 text-right">N (€)</Th>
                  <Th className="w-24">Date N+1</Th>
                  <Th className="w-28 text-right">N+1 (€)</Th>
                  <Th className="w-24">Date N+2</Th>
                  <Th className="w-28 text-right">N+2 (€)</Th>
                </>
              ) : (
                <>
                  <Th className="w-28 text-right">N (€)</Th>
                  <Th className="w-28 text-right">N+1 (€)</Th>
                  <Th className="w-28 text-right">N+2 (€)</Th>
                </>
              )}
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpanEmpty} className="py-6 text-center text-xs text-muted-foreground">
                  Aucune ligne — cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? `chg-${type}-${i}`}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
                >
                  <Td className="pl-2">
                    <input type="checkbox" checked={row.actif !== false} onChange={(e) => handleUpdate(i, { actif: e.target.checked })} className="h-3.5 w-3.5 accent-primary" aria-label="Activer" />
                  </Td>
                  <Td>
                    <input className={cellInput} value={row.libelle} placeholder="Libellé…" onChange={(e) => handleUpdate(i, { libelle: e.target.value })} />
                  </Td>
                  <Td>
                    <select className={cellSelect} value={row.hypothese} onChange={(e) => handleUpdate(i, { hypothese: e.target.value })} aria-label="Hypothèse">
                      {HYPOTHESES_PERSONNEL.map((h) => <option key={h.value} value={h.value} className="bg-background text-foreground">{h.label}</option>)}
                    </select>
                  </Td>
                  {withCalcAuto && (
                    <Td className="text-center">
                      <input type="checkbox" checked={row.calcAuto} onChange={(e) => handleUpdate(i, { calcAuto: e.target.checked })} className="h-3.5 w-3.5 accent-primary" aria-label="Calcul auto" />
                    </Td>
                  )}
                  {withDates ? (
                    <>
                      <Td><input className={cellInput} value={row.dateN ?? ""} placeholder="mm/aaaa" onChange={(e) => handleUpdate(i, { dateN: e.target.value })} /></Td>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN === 0 ? "" : row.montantN} placeholder="0" onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })} /></Td>
                      <Td><input className={cellInput} value={row.dateN1 ?? ""} placeholder="mm/aaaa" onChange={(e) => handleUpdate(i, { dateN1: e.target.value })} /></Td>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN1 === 0 ? "" : row.montantN1} placeholder="0" onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })} /></Td>
                      <Td><input className={cellInput} value={row.dateN2 ?? ""} placeholder="mm/aaaa" onChange={(e) => handleUpdate(i, { dateN2: e.target.value })} /></Td>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN2 === 0 ? "" : row.montantN2} placeholder="0" onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })} /></Td>
                    </>
                  ) : (
                    <>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN === 0 ? "" : row.montantN} placeholder="0" readOnly={withCalcAuto && row.calcAuto} onChange={(e) => handleUpdate(i, { montantN: numVal(e.target.value) })} /></Td>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN1 === 0 ? "" : row.montantN1} placeholder="0" readOnly={withCalcAuto && row.calcAuto} onChange={(e) => handleUpdate(i, { montantN1: numVal(e.target.value) })} /></Td>
                      <Td><input type="text" inputMode="decimal" className={cn(cellInput, "text-right")} value={row.montantN2 === 0 ? "" : row.montantN2} placeholder="0" readOnly={withCalcAuto && row.calcAuto} onChange={(e) => handleUpdate(i, { montantN2: numVal(e.target.value) })} /></Td>
                    </>
                  )}
                <Td className="text-center px-1">
                  <button
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto"
                    onClick={() => handleRemove(i)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td colSpan={withDates ? 6 : (3 + (withCalcAuto ? 1 : 0))} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rows.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}</td>
                {withDates ? (
                  <>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rows.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}</td>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rows.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}</td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rows.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}</td>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{fmt(rows.filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}</td>
                  </>
                )}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FORMULAIRE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

interface PersonnelFormProps {
  dossierId: string;
  salaries?: LigneSalarieRow[];
  dirigeants?: LigneDirigeantRow[];
  cotisationsTNS?: LigneCotisationTNSRow[];
  taxesSalaires?: LigneTaxeSalaireRow[];
  autresCharges?: LigneChargePersonnelRow[];
  remboursements?: LigneChargePersonnelRow[];
  participations?: LigneChargePersonnelRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function PersonnelForm({
  dossierId,
  salaries,
  dirigeants,
  cotisationsTNS,
  taxesSalaires,
  autresCharges,
  remboursements,
  participations,
  dateDebutExerciceN,
  exercices,
}: PersonnelFormProps) {
  return (
    <div className="flex flex-col h-full gap-10 overflow-y-auto">
      <ParamsGlobauxSection dossierId={dossierId} />
      <TableauSalaries dossierId={dossierId} initialData={salaries} dateDebutExerciceN={dateDebutExerciceN} exercices={exercices} />
      <TableauDirigeant dossierId={dossierId} initialData={dirigeants} dateDebutExerciceN={dateDebutExerciceN} exercices={exercices} />
      <TableauCotisationsTNS dossierId={dossierId} initialData={cotisationsTNS} />
      <TableauTaxesSalaires dossierId={dossierId} initialData={taxesSalaires} />
      <TableauChargePersonnel dossierId={dossierId} type="AUTRE" initialData={autresCharges} />
      <TableauChargePersonnel dossierId={dossierId} type="REMBOURSEMENT" initialData={remboursements} />
      <TableauChargePersonnel dossierId={dossierId} type="PARTICIPATION" initialData={participations} />
    </div>
  );
}
