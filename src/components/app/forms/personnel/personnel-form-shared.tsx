"use client";

/**
 * Utilitaires partagés pour les sous-composants du formulaire Personnel.
 * Constantes de style, helpers de calcul, composants atomiques de tableau.
 */

import { formatNumber } from "@/lib/format";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import type { LigneSalarieRow } from "@/lib/schemas/personnel";

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
