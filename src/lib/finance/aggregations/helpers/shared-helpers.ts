/**
 * Utilitaires partagés entre les modules de la couche aggregations/.
 *
 * Ce module est un nœud feuille : aucun import depuis compte-resultat/, sig/, tva/
 * ou d'autres sous-modules. Tous les builders de tableaux peuvent importer depuis ici.
 *
 * Exports :
 *   - `PctValue`            — interface partagée { amount, pct } (CR + SIG)
 *   - `ChildRow`            — type de ligne minimale pour les nœuds enfants (CR + SIG)
 *   - `mkVal` / `pct`       — construction d'une valeur affichée avec %CA (CR + SIG)
 *   - `makeNodeBuilder`     — factory générique de nœuds avec %CA (CR + SIG)
 *   - `buildChildNodes`     — factory générique de nœuds enfants (CR + SIG)
 *   - `dateToExercise`      — mapping date → exercice fiscal + index de mois (TVA + autres)
 *
 * @module aggregations/shared-helpers
 */

import type { YearKey } from "@/lib/finance/utils";

// ── Valeur affichée (montant seul) ────────────────────────────────────────────

/**
 * Valeur d'un nœud affichant uniquement un montant.
 * Partagée entre CAF, BFR, Bilan et Financement.
 */
export interface AmountValue {
  amount: number;
}

// ── Valeur affichée (montant + pourcentage) ───────────────────────────────────

/**
 * Valeur d'un nœud affiché avec pourcentage du CA.
 * Partagée structurellement entre `CRYearValue` (CR) et `SigValue` (SIG).
 */
export interface PctValue {
  amount: number;
  pct: number | null;
}

/**
 * Construit une valeur d'affichage `{ amount, pct }`.
 *
 * La structure retournée est structurellement compatible avec `CRYearValue`
 * (compte-resultat) et `SigValue` (SIG) — les deux interfaces sont identiques.
 */
export function mkVal(val: number, p: number | null): { amount: number; pct: number | null } {
  return { amount: val, pct: p };
}

/**
 * Réexporté depuis utils.ts — source unique de vérité.
 */
export { pct } from "@/lib/finance/utils";
import { pct } from "@/lib/finance/utils";

// ── Type de ligne minimale pour les nœuds enfants ───────────────────────────

/**
 * Champs minimaux requis par `buildChildNodes`.
 * CR y ajoute `id?` et `actif?`, SIG l'utilise directement.
 */
export interface ChildRow {
  libelle: string;
  montantN: number;
  montantN1: number;
  montantN2: number;
}

// ── Factory générique de nœuds avec %CA ─────────────────────────────────────

/**
 * Factory générique pour construire des nœuds avec pourcentage du total de référence.
 *
 * `TNode` doit exposer : `key`, `label`, `values: Record<YearKey, PctValue>`,
 * `style`, `hideIfZero?`, `children?: TNode[]`.
 *
 * Utilisé par `makeNodeBuilder` (CR) et `makeSigNodeBuilder` (SIG) pour éliminer
 * la duplication de l'implémentation (corps identiques, seuls les types diffèrent).
 *
 * Le cast `as TNode` est sûr : ni `CRNode` ni `SigNode` n'ont de champs requis
 * supplémentaires au-delà de ceux construits ici.
 */
export function makeNodeBuilder<
  TNode extends {
    key: string;
    label: string;
    values: Record<YearKey, PctValue>;
    style: string;
    hideIfZero?: boolean;
    children?: TNode[];
  },
>(ca: Record<YearKey, number>) {
  return (
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: TNode["style"],
    children?: TNode[],
    hideIfZero = false,
  ): TNode =>
    ({
      key,
      label,
      style,
      hideIfZero,
      children,
      values: {
        y1: mkVal(vals.y1, pct(vals.y1, ca.y1)),
        y2: mkVal(vals.y2, pct(vals.y2, ca.y2)),
        y3: mkVal(vals.y3, pct(vals.y3, ca.y3)),
      },
    }) as TNode;
}

// ── Factory générique de nœuds enfants ─────────────────────────────────────────

/**
 * Filtre et mappe une liste de lignes vers des nœuds enfants affichés `style="normal"`.
 *
 * - `TRow` — doit étendre `ChildRow`; permet à CR de passer `actif?` dans le prédicat.
 * - `TNode` — type cible (CRNode, SigNode, …); le cast `as TNode[]` est sûr car
 *   ni CRNode ni SigNode n'ont de champs requis au-delà de ceux construits ici.
 * - `filter` — prédicat spécifique à chaque module (actif, non-zéro, …).
 */
export function buildChildNodes<
  TRow extends ChildRow,
  TNode extends {
    key: string;
    label: string;
    values: Record<YearKey, PctValue>;
    style: string;
    hideIfZero?: boolean;
  },
>(
  rows: TRow[],
  parentKey: string,
  ca: Record<YearKey, number>,
  filter: (r: TRow) => boolean,
): TNode[] {
  return rows
    .filter(filter)
    .map((r, i) => ({
      key: `${parentKey}_child_${i}`,
      label: r.libelle,
      values: {
        y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
        y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
        y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
      },
      style: "normal" as const,
      hideIfZero: true,
    })) as TNode[];
}

// ── Mapping date → exercice fiscal ───────────────────────────────────────────

/**
 * Retourne l'exercice fiscal (`y1` | `y2` | `y3` | `null`) et l'index de mois
 * dans l'exercice (0 = premier mois, 11 = dernier mois) pour une date donnée.
 *
 * Les bornes sont calculées à partir de `dateDemarrage` (début du premier exercice).
 * Une date antérieure à `dateDemarrage` ou postérieure à l'exercice 3 retourne `yk: null`.
 */
export function dateToExercise(
  dateDemarrage: Date,
  d: Date,
): { yk: YearKey | null; monthIndex: number } {
  const starts = [
    new Date(dateDemarrage.getFullYear(), dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 1, dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 2, dateDemarrage.getMonth(), 1),
    new Date(dateDemarrage.getFullYear() + 3, dateDemarrage.getMonth(), 1),
  ];
  const YKS: YearKey[] = ["y1", "y2", "y3"];

  for (let i = 0; i < 3; i++) {
    if (d >= starts[i]! && d < starts[i + 1]!) {
      const yearDiff = d.getFullYear() - starts[i]!.getFullYear();
      const monthDiff = d.getMonth() - starts[i]!.getMonth();
      const monthIndex = Math.min(11, Math.max(0, yearDiff * 12 + monthDiff));
      return { yk: YKS[i]!, monthIndex };
    }
  }
  return { yk: null, monthIndex: -1 };
}
