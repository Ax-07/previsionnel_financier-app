/**
 * Utilitaires financiers partagés entre toutes les actions de contrôle.
 *
 * Centralise :
 *   - les types YearKey / YearAcc communs
 *   - la conversion Decimal Prisma → number
 *   - le calcul de l'IS
 *   - le formatage des labels d'exercice fiscal
 *   - la fabrique de mappeur date → exercice fiscal (toExerciceKey)
 *   - des helpers d'accumulation (zeroAcc, sumBy)
 */

// ── Types ─────────────────────────────────────────────────────────────────────
// Définis dans types/series.ts (feuille du graphe de dépendances).

export type { YearKey, YearKey4, YearAcc, YearAcc4 } from "@/lib/finance/types/series";
import type { YearKey, YearKey4, YearAcc, YearAcc4 } from "@/lib/finance/types/series";

// ── Constantes de clés d'exercice ─────────────────────────────────────────────

/** Clés des 3 exercices prévisionnels (N, N+1, N+2). */
export const YEAR_KEYS_3: YearKey[] = ["y1", "y2", "y3"] as const;

/** Clés des 4 exercices (Y0 initial + 3 exercices prévisionnels). */
export const YEAR_KEYS_4: YearKey4[] = ["y0", "y1", "y2", "y3"] as const;

// ── Conversion Decimal Prisma → number ────────────────────────────────────────

/**
 * Convertit une valeur Prisma Decimal (ou tout autre type) en number.
 *
 * Fix H6 : ajout d'un try/catch autour de toNumber() (duck-typing fragile)
 * et protection contre les résultats NaN.
 */
export const n = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "object" && "toNumber" in v) {
    try {
      const result = (v as { toNumber: () => number }).toNumber();
      return isNaN(result) ? 0 : result;
    } catch {
      return 0;
    }
  }
  const parsed = Number(v);
  return isNaN(parsed) ? 0 : parsed;
};

// ── Calcul IS ────────────────────────────────────────────────────────────────

/**
 * Calcule l'Impôt sur les Sociétés sur un résultat fiscal.
 *
 * @param resultat   – résultat imposable (avant IS, après ajustements)
 * @param plafond    – plafond du taux réduit (ex. 42 500 €)
 * @param tauxReduit – taux réduit en % (ex. 15)
 * @param tauxNormal – taux normal en % (ex. 25)
 * @param credit     – crédit d'impôt déductible
 * @param contrib    – contribution volontaire additionnelle
 */
export function calcIS(
  resultat: number,
  plafond: number,
  tauxReduit: number,
  tauxNormal: number,
  credit: number,
  contrib: number,
): number {
  if (resultat <= 0) return 0;
  const t1 = Math.min(resultat, plafond);
  const t2 = Math.max(0, resultat - plafond);
  return Math.max(0, t1 * (tauxReduit / 100) + t2 * (tauxNormal / 100) + contrib - credit);
}


// ── Labels d'exercice fiscal & Mappeur date → exercice fiscal ─────────────────
// Source unique : pipeline/calendar.ts (exception §3.5.8)

export {
  fmtExercice,
  makeExerciceHelpers,
  type ExerciceHelpers,
} from "@/lib/finance/pipeline/calendar";

// ── Helpers d'accumulation ────────────────────────────────────────────────────

/** Retourne un accumulateur par année initialisé à zéro. */
export const zeroAcc = (): YearAcc => ({ y1: 0, y2: 0, y3: 0 });
export const zeroAcc4 = (): YearAcc4 => ({ y0: 0, y1: 0, y2: 0, y3: 0 });

/** Somme une propriété numérique sur un tableau. */
export const sumBy = <T>(arr: T[], fn: (item: T) => number): number =>
  arr.reduce((s, x) => s + fn(x), 0);

// ── Ratio pourcentage ─────────────────────────────────────────────────────────

/**
 * Calcule le ratio `amount / base * 100`.
 * Retourne `null` si la base est 0 (évite la division par zéro).
 */
export function pct(amount: number, base: number): number | null {
  return base !== 0 ? (amount / base) * 100 : null;
}
