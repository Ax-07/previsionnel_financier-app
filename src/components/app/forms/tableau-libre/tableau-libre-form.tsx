"use client";

/**
 * Onglet Tableaux libres
 * Permet de créer des tableaux personnalisés pour construire des indicateurs
 * spécifiques, des agrégats personnalisés et des données prévisionnelles sur mesure.
 */

import { useCallback, useEffect, useRef, useTransition, useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Settings2,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

import {
  FORMAT_OPTIONS,
  calculerN1,
  calculerN2,
  type TableauLibreRow,
  type TableauLibreLigneRow,
  type DetailMensuelRow,
} from "@/lib/schemas/tableau-libre";
import {
  buildExercicesConfig,
  buildMoisLabels,
  type ExerciceCalendrierEntry,
  type ExerciceKey,
  type ExercicesConfig,
} from "@/lib/finance/forms-calendar";

import { useTableauxLibresStore } from "@/stores/tableau-libre-store";
import { saveTableauxLibres } from "@/app/actions/tableau-libre";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect, cellNum } from "../helpers/cell-styles";
import { Th } from "../helpers/table-helpers";


// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number): string => v === 0 ? "—" : formatNumber(v);

const pct = (v: number): string => v === 0 ? "—" : formatNumber(v) + " %";

// ── Composants basiques ───────────────────────────────────────────────────────


function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-0 py-0 align-middle border-r last:border-r-0 border-border/40", className)}>{children}</td>;
}

// ── Modal Propriétés ──────────────────────────────────────────────────────────

interface PropriétésDialogProps {
  open: boolean;
  onClose: () => void;
  tableau: TableauLibreRow;
  onChange: (patch: Partial<TableauLibreRow>) => void;
}

function PropriétésDialog({ open, onClose, tableau, onChange }: PropriétésDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Propriétés du tableau</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {[
            { key: "showZeroLines" as const, label: "Afficher les lignes à 0" },
            { key: "hidePreviousYear" as const, label: "Masquer le N-1" },
            { key: "pieChart" as const, label: "Graphique en camembert" },
            { key: "histogram" as const, label: "Graphique histogramme" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tableau[key]}
                onChange={(e) => onChange({ [key]: e.target.checked })}
                className="accent-primary size-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal Détail mensuel ──────────────────────────────────────────────────────

interface DétailMensuelDialogProps {
  open: boolean;
  onClose: () => void;
  ligne: TableauLibreLigneRow;
  onSave: (details: DetailMensuelRow[]) => void;
  exercicesConfig: ExercicesConfig;
}

function buildDefaultDetails(
  existingDetails: DetailMensuelRow[],
  exercice: ExerciceKey,
  duree: number,
): DetailMensuelRow[] {
  const result: DetailMensuelRow[] = [];
  for (let m = 1; m <= duree; m++) {
    const existing = existingDetails.find((d) => d.mois === m && d.exercice === exercice);
    result.push(
      existing ?? { mois: m, montant: 0, pourcentage: 0, exercice }
    );
  }
  return result;
}

function DétailMensuelDialog({ open, onClose, ligne, onSave, exercicesConfig }: DétailMensuelDialogProps) {
  const [details, setDetails] = useState<DetailMensuelRow[]>(() => ligne.details);

  useEffect(() => {
    if (open) {
      // Réinitialiser le state quand le dialog s'ouvre
      const reset = setTimeout(() => setDetails(ligne.details), 0);
      return () => clearTimeout(reset);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function getDetailForExercice(exercice: ExerciceKey): DetailMensuelRow[] {
    return buildDefaultDetails(details, exercice, exercicesConfig[exercice].duree);
  }

  function updateDetail(exercice: ExerciceKey, mois: number, montant: number) {
    setDetails((prev) => {
      const filtered = prev.filter((d) => !(d.mois === mois && d.exercice === exercice));
      const total = filtered
        .filter((d) => d.exercice === exercice)
        .reduce((s, d) => s + d.montant, 0) + montant;
      const newDetail: DetailMensuelRow = {
        mois,
        montant,
        pourcentage: total > 0 ? (montant / total) * 100 : 0,
        exercice,
      };
      // recalculate all percentages for this exercice
      const allForEx = [...filtered.filter((d) => d.exercice === exercice), newDetail];
      const sum = allForEx.reduce((s, d) => s + d.montant, 0);
      const recalculated = allForEx.map((d) => ({
        ...d,
        pourcentage: sum > 0 ? (d.montant / sum) * 100 : 0,
      }));
      return [...prev.filter((d) => d.exercice !== exercice), ...recalculated];
    });
  }

  function handleRepartir(exercice: ExerciceKey) {
    const baseValue = exercice === "N" ? ligne.nValeur : exercice === "N1" ? calculerN1(ligne) : calculerN2(ligne);
    const duree = exercicesConfig[exercice].duree;
    const perMonth = duree > 0 ? baseValue / duree : 0;
    setDetails((prev) => {
      const filtered = prev.filter((d) => d.exercice !== exercice);
      const newDetails: DetailMensuelRow[] = Array.from({ length: duree }, (_, i) => ({
        mois: i + 1,
        montant: perMonth,
        pourcentage: duree > 0 ? 100 / duree : 0,
        exercice,
      }));
      return [...filtered, ...newDetails];
    });
  }

  function sanitizeDetails(): DetailMensuelRow[] {
    return details.filter((detail) => detail.mois <= exercicesConfig[detail.exercice].duree);
  }

  function renderExerciceTab(exercice: ExerciceKey) {
    const config = exercicesConfig[exercice];
    const rows = getDetailForExercice(exercice);
    const moisLabels = buildMoisLabels(config.startMonth, config.startYear, config.duree);
    const total = rows.reduce((s, d) => s + d.montant, 0);
    const totalPct = rows.reduce((s, d) => s + d.pourcentage, 0);

    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => handleRepartir(exercice)}>
            Répartir équitablement
          </Button>
        </div>
        <div className="rounded border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <Th>Mois</Th>
                <Th className="text-right">Montant</Th>
                <Th className="text-right">%</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.mois} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-2 py-1 text-muted-foreground text-xs">{moisLabels[row.mois - 1]}</td>
                  <td className="px-0 py-0">
                    <input
                      type="number"
                      step="0.01"
                      value={row.montant === 0 ? "" : row.montant}
                      onChange={(e) => updateDetail(exercice, row.mois, numVal(e.target.value))}
                      className={cellNum}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1 text-right text-muted-foreground text-xs">
                    {row.pourcentage > 0 ? row.pourcentage.toFixed(1) + " %" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t font-medium">
                <td className="px-2 py-1.5 text-xs">Total</td>
                <td className="px-2 py-1.5 text-right text-xs">
                  {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-2 py-1.5 text-right text-xs">
                  <span className={cn(Math.abs(totalPct - 100) > 0.1 ? "text-destructive" : "text-emerald-600")}>
                    {totalPct.toFixed(1)} %
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détail mensuel — {ligne.libelle || "Ligne"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="N" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="N" className="flex-1">Exercice N</TabsTrigger>
            <TabsTrigger value="N1" className="flex-1">N+1</TabsTrigger>
            <TabsTrigger value="N2" className="flex-1">N+2</TabsTrigger>
          </TabsList>
          <TabsContent value="N" className="mt-3">{renderExerciceTab("N")}</TabsContent>
          <TabsContent value="N1" className="mt-3">{renderExerciceTab("N1")}</TabsContent>
          <TabsContent value="N2" className="mt-3">{renderExerciceTab("N2")}</TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={() => { onSave(sanitizeDetails()); onClose(); }}>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Ligne du tableau ──────────────────────────────────────────────────────────

interface LigneRowProps {
  ligne: TableauLibreLigneRow;
  onUpdate: (data: Partial<TableauLibreLigneRow>) => void;
  onRemove: () => void;
  onOpenDetail: () => void;
}

function LigneRow({ ligne, onUpdate, onRemove, onOpenDetail }: LigneRowProps) {
  const n1 = calculerN1(ligne);
  const n2 = calculerN2(ligne);

  return (
    <tr className={cn("border-b last:border-b-0 hover:bg-muted/20 group", !ligne.actif && "opacity-50")}>
      {/* Sél. */}
      <Td className="w-8 text-center">
        <input
          type="checkbox"
          checked={ligne.actif}
          onChange={(e) => onUpdate({ actif: e.target.checked })}
          className="accent-primary size-4 cursor-pointer"
          title="Activer / désactiver la ligne"
        />
      </Td>
      {/* Libellé */}
      <Td className="min-w-36">
        <input
          type="text"
          value={ligne.libelle}
          onChange={(e) => onUpdate({ libelle: e.target.value })}
          className={cellInput}
          placeholder="Libellé…"
        />
      </Td>
      {/* Format */}
      <Td className="w-28">
        <select
          value={ligne.format}
          onChange={(e) => onUpdate({ format: e.target.value as TableauLibreLigneRow["format"] })}
          className={cellSelect}
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Td>
      {/* Détail */}
      <Td className="w-10 text-center">
        <button
          onClick={onOpenDetail}
          className={cn(
            "mx-auto flex items-center justify-center size-6 rounded hover:bg-muted transition-colors",
            ligne.detailEnabled ? "text-primary" : "text-muted-foreground"
          )}
          title="Détail mensuel"
        >
          <Calendar className="size-3.5" />
        </button>
      </Td>
      {/* N */}
      <Td className="w-28">
        <input
          type="number"
          step="0.01"
          value={ligne.nValeur === 0 ? "" : ligne.nValeur}
          onChange={(e) => onUpdate({ nValeur: numVal(e.target.value) })}
          className={cellNum}
          placeholder="0"
        />
      </Td>
      {/* % Évol. N→N+1 */}
      <Td className="w-20">
        <div className="flex items-center">
          <input
            type="number"
            step="0.01"
            value={ligne.growthRateN1 === 0 ? "" : ligne.growthRateN1}
            onChange={(e) => onUpdate({ growthRateN1: numVal(e.target.value) })}
            className={cellNum}
            placeholder="0"
          />
          <span className="text-muted-foreground text-xs px-1 shrink-0">%</span>
        </div>
      </Td>
      {/* N+1 calculé */}
      <Td className="w-28 bg-muted/30">
        <span className="h-7 flex items-center justify-end px-2 text-sm font-medium">
          {ligne.detailEnabled && ligne.details.some((d) => d.exercice === "N1")
            ? fmt(n1)
            : fmt(n1)}
        </span>
      </Td>
      {/* % Évol. N+1→N+2 */}
      <Td className="w-20">
        <div className="flex items-center">
          <input
            type="number"
            step="0.01"
            value={ligne.growthRateN2 === 0 ? "" : ligne.growthRateN2}
            onChange={(e) => onUpdate({ growthRateN2: numVal(e.target.value) })}
            className={cellNum}
            placeholder="0"
          />
          <span className="text-muted-foreground text-xs px-1 shrink-0">%</span>
        </div>
      </Td>
      {/* N+2 calculé */}
      <Td className="w-28 bg-muted/30">
        <span className="h-7 flex items-center justify-end px-2 text-sm font-medium">
          {fmt(n2)}
        </span>
      </Td>
      {/* Supprimer */}
      <Td className="w-8">
        <button
          onClick={onRemove}
          className="mx-auto flex items-center justify-center size-7 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
          title="Supprimer la ligne"
        >
          <Trash2 className="size-3.5" />
        </button>
      </Td>
    </tr>
  );
}

// ── Tableau individuel ────────────────────────────────────────────────────────

interface TableauCardProps {
  tableau: TableauLibreRow;
  tableauIndex: number;
  dossierId: string;
  exercicesConfig: ExercicesConfig;
}

function TableauCard({ tableau, tableauIndex, dossierId, exercicesConfig }: TableauCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [detailLigneIndex, setDetailLigneIndex] = useState<number | null>(null);

  const { updateTableau, removeTableau, addLigne, updateLigne, removeLigne, setDetails } =
    useTableauxLibresStore();

  function handleUpdateTableau(data: Partial<TableauLibreRow>) {
    updateTableau(dossierId, tableauIndex, data);
  }

  function handleUpdateLigne(ligneIndex: number, data: Partial<TableauLibreLigneRow>) {
    updateLigne(dossierId, tableauIndex, ligneIndex, data);
  }

  // Totaux colonnes
  const totalN = tableau.lignes
    .filter((l) => l.actif || tableau.showZeroLines)
    .reduce((s, l) => s + l.nValeur, 0);
  const totalN1 = tableau.lignes
    .filter((l) => l.actif || tableau.showZeroLines)
    .reduce((s, l) => s + calculerN1(l), 0);
  const totalN2 = tableau.lignes
    .filter((l) => l.actif || tableau.showZeroLines)
    .reduce((s, l) => s + calculerN2(l), 0);
  const growthN1 = totalN > 0 ? ((totalN1 - totalN) / totalN) * 100 : 0;
  const growthN2 = totalN1 > 0 ? ((totalN2 - totalN1) / totalN1) * 100 : 0;

  const activeDetail = detailLigneIndex !== null ? tableau.lignes[detailLigneIndex] : null;

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* En-tête du tableau */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1.5 hover:text-foreground text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <input
            type="text"
            value={tableau.nom}
            onChange={(e) => handleUpdateTableau({ nom: e.target.value })}
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded px-1"
            placeholder="Nom du tableau…"
          />
          <div className="flex items-center gap-1 ml-auto">
            {(tableau.pieChart || tableau.histogram) && (
              <BarChart3 className="size-4 text-muted-foreground" />
            )}
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => setPropsOpen(true)}
              title="Propriétés"
            >
              <Settings2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeTableau(dossierId, tableauIndex)}
              title="Supprimer le tableau"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Corps */}
        {!collapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <Th className="w-8 text-center">Sél.</Th>
                  <Th>Libellé</Th>
                  <Th className="w-28">Format</Th>
                  <Th className="w-10 text-center">Détail</Th>
                  <Th className="w-28 text-right">N</Th>
                  <Th className="w-20 text-right">% Évol.</Th>
                  <Th className="w-28 text-right">N+1</Th>
                  <Th className="w-20 text-right">% Évol.</Th>
                  <Th className="w-28 text-right">N+2</Th>
                  <Th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {tableau.lignes.map((ligne, lIdx) => (
                  <LigneRow
                    key={ligne.id ?? lIdx}
                    ligne={ligne}
                    onUpdate={(data) => handleUpdateLigne(lIdx, data)}
                    onRemove={() => removeLigne(dossierId, tableauIndex, lIdx)}
                    onOpenDetail={() => {
                      handleUpdateLigne(lIdx, { detailEnabled: true });
                      setDetailLigneIndex(lIdx);
                    }}
                  />
                ))}
                {tableau.lignes.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
                      Aucune ligne — cliquez sur « Ajouter une ligne »
                    </td>
                  </tr>
                )}
              </tbody>
              {tableau.lignes.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/50 border-t font-semibold text-sm">
                    <td colSpan={4} className="px-2 py-1.5 text-xs text-muted-foreground">Total</td>
                    <td className="px-2 py-1.5 text-right">{fmt(totalN)}</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground text-xs">{growthN1 !== 0 ? pct(growthN1) : "—"}</td>
                    <td className="px-2 py-1.5 text-right bg-muted/30">{fmt(totalN1)}</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground text-xs">{growthN2 !== 0 ? pct(growthN2) : "—"}</td>
                    <td className="px-2 py-1.5 text-right bg-muted/30">{fmt(totalN2)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Ajouter une ligne */}
            <div className="px-4 py-2 border-t bg-background">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 gap-1.5"
                onClick={() => addLigne(dossierId, tableauIndex)}
              >
                <Plus className="size-3.5" />
                Ajouter une ligne
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Propriétés */}
      <PropriétésDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        tableau={tableau}
        onChange={(data) => handleUpdateTableau(data)}
      />

      {/* Modal Détail mensuel */}
      {activeDetail !== null && detailLigneIndex !== null && (
        <DétailMensuelDialog
          open={detailLigneIndex !== null}
          onClose={() => setDetailLigneIndex(null)}
          ligne={activeDetail}
          exercicesConfig={exercicesConfig}
          onSave={(newDetails) => {
            setDetails(dossierId, tableauIndex, detailLigneIndex, newDetails);
          }}
        />
      )}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export interface TableauxLibresFormProps {
  dossierId: string;
  initialData: TableauLibreRow[];
  dateDebutExerciceN?: string;
  exercices?: ExerciceCalendrierEntry[];
}

export function TableauxLibresForm({
  dossierId,
  initialData,
  dateDebutExerciceN,
  exercices,
}: TableauxLibresFormProps) {
  const [isPending, startTransition] = useTransition();
  const hydrated = useRef(false);

  const store = useTableauxLibresStore();
  const draft = store.getDraft(dossierId);
  const tableaux = draft.tableaux;
  const hasUnsaved = store.hasUnsavedChanges(dossierId);
  const invalidateControleStores = useInvalidateControleStores();
  const exercicesConfig = buildExercicesConfig(dateDebutExerciceN, exercices);


  // Hydratation depuis le serveur.
  // Guard double : première fois ET vérif que le store n'est pas en avance
  // (cas où le remount se produit après un save — initialData est périmé).
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      const serverIds = new Set(initialData.map((t) => t.id).filter(Boolean));
      const current = store.getDraft(dossierId).tableaux;
      const storeIsAhead = current.some((r) => r.id && !serverIds.has(r.id));
      if (!storeIsAhead) store.setTableaux(dossierId, initialData);
    }
  }, [dossierId, initialData, store]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveTableauxLibres(dossierId, tableaux);
      if (result.success) {
        if (result.tableaux) store.markSaved(dossierId, result.tableaux);
        toast.success(result.message);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, tableaux, store, invalidateControleStores]);

  return (
    <div className="flex h-full flex-col py-8 px-4 2xl:px-32">
      {/* Barre d'actions */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Tableaux libres</h2>
          {hasUnsaved && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs">
              Modifications non enregistrées
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => store.addTableau(dossierId)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Nouveau tableau
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !hasUnsaved}
            className="gap-1.5"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Liste des tableaux */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {tableaux.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">Aucun tableau libre</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Créez un tableau personnalisé pour construire des indicateurs spécifiques,
                des agrégats personnalisés ou des données prévisionnelles sur mesure.
              </p>
            </div>
            <Button onClick={() => store.addTableau(dossierId)} className="gap-1.5">
              <Plus className="size-4" />
              Créer un tableau
            </Button>
          </div>
        ) : (
          tableaux.map((tableau, tIdx) => (
            <TableauCard
              key={tableau.id ?? tIdx}
              tableau={tableau}
              tableauIndex={tIdx}
              dossierId={dossierId}
              exercicesConfig={exercicesConfig}
            />
          ))
        )}
      </div>
    </div>
  );
}
