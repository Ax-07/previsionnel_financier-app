"use client";

/**
 * Utilitaires partagés pour les sous-composants du formulaire Personnel.
 * Constantes de style, helpers de calcul, composants atomiques de tableau.
 */

import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import type { LigneSalarieRow } from "@/lib/schemas/personnel";

// ── Constantes de style partagées ─────────────────────────────────────────────

export const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0 [appearance:textfield]";

export const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

// ── Helpers de formatage et de calcul ────────────────────────────────────────

/** Applique un taux d'évolution (en %) à un montant et arrondit à 2 décimales. */
export function applyEvolution(montant: number, evol: number): number {
  return Math.round((montant * (1 + evol / 100)) * 100) / 100;
}

/** Calcule le % d'évolution entre deux montants. Retourne 0 si base = 0. */
export function calcEvolution(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 10000) / 100;
}

// ── Composants utilitaires partagés ──────────────────────────────────────────

/**
 * En-tête de section avec titre, description, badge de modification non enregistrée
 * et boutons Enregistrer / Ajouter.
 */
export function SectionHeader({
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
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={onAdd}
          style={hideAdd ? { display: "none" } : undefined}
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

/** Cellule d'en-tête de tableau. */
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
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

/** Cellule de données de tableau. */
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>;
}

// ── Totaux communs ────────────────────────────────────────────────────────────

/**
 * Ligne de totaux générique pour les tableaux avec montants N / N+1 / N+2.
 */
export function TotauxRow({
  rows,
  colSpanBefore = 4,
  dossierId,
}: {
  rows: Array<{ actif?: boolean; hypothese?: string; montantN: number; montantN1: number; montantN2: number }>;
  colSpanBefore?: number;
  dossierId: string;
}) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
  const totalN = active.reduce((s, r) => s + r.montantN, 0);
  const totalN1 = active.reduce((s, r) => s + r.montantN1, 0);
  const totalN2 = active.reduce((s, r) => s + r.montantN2, 0);
  return (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={colSpanBefore} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
          Total (actifs)
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN, 0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN1, 0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN2, 0)}</td>
        <td colSpan={4} />
      </tr>
    </tfoot>
  );
}

/**
 * Ligne de totaux spécialisée pour le tableau des salariés :
 * affiche le brut total, les charges patronales calculées et le coût total employeur.
 */
export function TotauxSalariesRow({ rows, dossierId }: { rows: LigneSalarieRow[]; dossierId: string }) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const active = filterByHypothese(rows, hypotheseActive).filter((r) => r.actif !== false);
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
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN,0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN1,0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">{formatNumber(totalN2,0)}</td>
        <td colSpan={4} />
      </tr>
      <tr className="border-t border-dashed border-border/50">
        <td colSpan={5} className="px-2 py-1.5 text-xs font-medium text-right text-muted-foreground">
          Charges patronales (calc.)
        </td>
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(patN,0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(patN1,0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(patN2,0)}</td>
        <td colSpan={4} />
      </tr>
      <tr className="border-t border-border bg-muted/50">
        <td colSpan={5} className="px-2 py-1.5 text-xs font-bold text-right text-muted-foreground">
          Coût total employeur
        </td>
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(totalN + patN, 0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(totalN1 + patN1, 0)}</td>
        <td />
        <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(totalN2 + patN2, 0)}</td>
        <td colSpan={4} />
      </tr>
    </tfoot>
  );
}
