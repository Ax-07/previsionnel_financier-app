"use client";

/**
 * Onglet Unités d'œuvre
 * Modélise les indicateurs opérationnels (décomposition CA = volume × prix)
 * jusqu'à 5 unités d'œuvre indépendantes par scénario.
 */

import { useCallback, useEffect, useTransition, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  TYPES_UNITE,
  TYPES_INDICATEUR,
  TYPES_DUREE,
  type UniteDOeuvreRow,
  type ExerciceUO,
} from "@/lib/schemas/unites-oeuvre";

import { useUnitesDOeuvreStore } from "@/stores/unites-oeuvre-store";
import { saveUnitesDOeuvre } from "@/app/actions/unites-oeuvre";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_UNITES = 5;

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

const cellReadonly =
  "h-7 w-full px-1 text-sm font-medium text-muted-foreground bg-muted/40 flex items-center";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number, decimals = 2): string {
  if (v === 0) return "—";
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** Recalcule les champs dérivés d'un exercice */
function recalcExercice(ex: ExerciceUO): ExerciceUO {
  const chiffreAffaires = ex.indicateurBase > 0 && ex.partPct > 0
    ? (ex.indicateurBase * ex.partPct) / 100
    : ex.chiffreAffaires;
  const parJour = ex.nbJours > 0 ? chiffreAffaires / ex.nbJours : 0;
  const quantite = ex.prixMoyen > 0 ? chiffreAffaires / ex.prixMoyen : 0;
  return { ...ex, chiffreAffaires, parJour, quantite };
}

// ── Composants ───────────────────────────────────────────────────────────────

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

// ── Table de calcul pour une unité ──────────────────────────────────────────

interface UniteTableProps {
  unite: UniteDOeuvreRow;
  onChange: (patch: Partial<UniteDOeuvreRow>) => void;
}

function UniteTable({ unite, onChange }: UniteTableProps) {
  function handleExercice(
    ex: "n" | "n1" | "n2",
    field: keyof ExerciceUO,
    rawValue: string,
  ) {
    const value = numVal(rawValue);
    const updatedEx: ExerciceUO = { ...unite[ex], [field]: value };
    const recalculated = recalcExercice(updatedEx);
    onChange({ [ex]: recalculated });
  }

  const dureeLabel =
    TYPES_DUREE.find((d) => d.value === unite.typeDuree)?.label ?? "Nb de jours / an";

  const rows: {
    key: keyof ExerciceUO;
    label: string;
    editable: boolean;
    decimals?: number;
  }[] = [
    { key: "indicateurBase", label: "Indicateur", editable: true },
    { key: "partPct", label: "Part (%)", editable: true, decimals: 4 },
    { key: "chiffreAffaires", label: "Chiffre d'affaires", editable: false },
    { key: "nbJours", label: dureeLabel, editable: true },
    { key: "parJour", label: "Soit par jour", editable: false, decimals: 4 },
    { key: "prixMoyen", label: "Prix moyen / unité", editable: true, decimals: 4 },
    { key: "quantite", label: "Quantité", editable: false, decimals: 4 },
  ];

  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <Th className="w-52">Calcul</Th>
            <Th className="w-36 text-right">N</Th>
            <Th className="w-36 text-right">N+1</Th>
            <Th className="w-36 text-right">N+2</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.key}
              className={cn(
                "border-b last:border-0",
                rowIdx % 2 === 0 ? "bg-background" : "bg-muted/10",
              )}
            >
              <Td>
                <span className="block px-2 py-1 text-xs font-medium text-muted-foreground">
                  {row.label}
                </span>
              </Td>
              {(["n", "n1", "n2"] as const).map((ex) => (
                <Td key={ex} className="text-right">
                  {row.editable ? (
                    <input
                      type="number"
                      step="any"
                      className={cn(cellInput, "text-right")}
                      value={unite[ex][row.key] === 0 ? "" : unite[ex][row.key]}
                      placeholder="0"
                      onChange={(e) => handleExercice(ex, row.key, e.target.value)}
                    />
                  ) : (
                    <span className={cn(cellReadonly, "justify-end text-right")}>
                      {fmt(Number(unite[ex][row.key]), row.decimals ?? 2)}
                    </span>
                  )}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Bloc d'une unité (collapsible) ───────────────────────────────────────────

interface UniteBlockProps {
  unite: UniteDOeuvreRow;
  index: number;
  onUpdate: (index: number, patch: Partial<UniteDOeuvreRow>) => void;
  onRemove: (index: number) => void;
}

function UniteBlock({ unite, index, onUpdate, onRemove }: UniteBlockProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* En-tête collapsible */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20">
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Scale className="h-3.5 w-3.5 shrink-0 text-primary" />
          Unité d&apos;œuvre {index + 1}
          {unite.libelle && (
            <span className="ml-1 text-muted-foreground font-normal">
              — {unite.libelle}
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden text-xs sm:flex"
          >
            {TYPES_UNITE.find((t) => t.value === unite.typeUnite)?.label ?? unite.typeUnite}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
            title="Supprimer cette unité"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="px-4 py-4 space-y-4">
          {/* Paramètres généraux */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Intitulé</label>
              <input
                type="text"
                className="h-8 rounded border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={unite.libelle}
                placeholder="ex: Couverts moyen / jour"
                onChange={(e) => onUpdate(index, { libelle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Unité</label>
              <select
                className={cn(cellSelect, "h-8 rounded border px-2")}
                value={unite.typeUnite}
                onChange={(e) =>
                  onUpdate(index, { typeUnite: e.target.value as UniteDOeuvreRow["typeUnite"] })
                }
              >
                {TYPES_UNITE.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Indicateur</label>
              <select
                className={cn(cellSelect, "h-8 rounded border px-2")}
                value={unite.typeIndicateur}
                onChange={(e) =>
                  onUpdate(index, {
                    typeIndicateur: e.target.value as UniteDOeuvreRow["typeIndicateur"],
                  })
                }
              >
                {TYPES_INDICATEUR.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Durée</label>
              <select
                className={cn(cellSelect, "h-8 rounded border px-2")}
                value={unite.typeDuree}
                onChange={(e) =>
                  onUpdate(index, { typeDuree: e.target.value as UniteDOeuvreRow["typeDuree"] })
                }
              >
                {TYPES_DUREE.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau de calcul */}
          <UniteTable
            unite={unite}
            onChange={(patch) => onUpdate(index, patch)}
          />

          {/* Note de validation */}
          {(() => {
            const totalPct = unite.n.partPct + unite.n1.partPct + unite.n2.partPct;
            if (totalPct > 100)
              return (
                <p className="text-xs text-destructive">
                  ⚠ La somme des parts dépasse 100 %.
                </p>
              );
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

interface UnitesDOeuvreFormProps {
  dossierId: string;
  initialData?: UniteDOeuvreRow[];
}

export function UnitesDOeuvreForm({ dossierId, initialData = [] }: UnitesDOeuvreFormProps) {
  const store = useUnitesDOeuvreStore();
  const [isPending, startTransition] = useTransition();
  const initializedRef = useRef(false);

  const { unites, hasUnsaved } = store.getDraft(dossierId);
  const invalidateControleStores = useInvalidateControleStores();

  // Initialisation depuis les données serveur (sans écraser un draft non sauvegardé)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (!store.hasUnsavedChanges(dossierId)) {
      store.setUnites(dossierId, initialData);
    }
  }, [dossierId, initialData, store]);

  const handleAdd = useCallback(() => {
    if (unites.length >= MAX_UNITES) {
      toast.warning(`Maximum ${MAX_UNITES} unités d'œuvre par scénario.`);
      return;
    }
    store.addUnite(dossierId);
  }, [dossierId, store, unites.length]);

  const handleUpdate = useCallback(
    (index: number, patch: Partial<UniteDOeuvreRow>) => {
      store.updateUnite(dossierId, index, patch);
    },
    [dossierId, store],
  );

  const handleRemove = useCallback(
    (index: number) => {
      store.removeUnite(dossierId, index);
    },
    [dossierId, store],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveUnitesDOeuvre(dossierId, unites);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      store.markSaved(dossierId, result.rows ?? unites);
      toast.success("Unités d'œuvre enregistrées");
      invalidateControleStores(dossierId);
    });
  }, [dossierId, unites, store]);

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-semibold leading-snug">Unités d&apos;œuvre</h3>
          <p className="text-xs text-muted-foreground">
            Indicateurs opérationnels pour décomposer le chiffre d&apos;affaires en volume × prix
            (max {MAX_UNITES} unités).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasUnsaved && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
              Modifications non enregistrées
            </Badge>
          )}
          {hasUnsaved && (
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1 text-xs"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
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
            onClick={handleAdd}
            disabled={unites.length >= MAX_UNITES}
          >
            <Plus className="h-3 w-3" />
            Ajouter une unité
          </Button>
        </div>
      </div>

      {/* Liste des unités */}
      {unites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Scale className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Aucune unité d&apos;œuvre</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajoutez jusqu&apos;à {MAX_UNITES} indicateurs opérationnels pour piloter vos
              hypothèses d&apos;activité.
            </p>
          </div>
          <Button size="sm" variant="outline" className="mt-1 gap-1 text-xs" onClick={handleAdd}>
            <Plus className="h-3 w-3" />
            Ajouter une unité
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {unites.map((unite, index) => (
            <UniteBlock
              key={unite.id ?? `new-${index}`}
              unite={unite}
              index={index}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}

          {/* Note validation part total */}
          {(() => {
            const totalPctN = unites.reduce((sum, u) => sum + u.n.partPct, 0);
            if (totalPctN > 100)
              return (
                <p className="text-xs text-destructive">
                  ⚠ La somme des parts (N) dépasse 100 % ({totalPctN.toFixed(2)} %).
                  Vérifiez la répartition entre vos unités.
                </p>
              );
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
