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

/** Clé des 3 exercices prévisionnels (N, N+1, N+2) */
export type YearKey = "y1" | "y2" | "y3";
/** Clé d'exercice étendue incluant l'année 0 (initial / pré-création) */
export type YearKey4 = "y0" | "y1" | "y2" | "y3";
export type YearAcc = Record<YearKey, number>;

// ── Conversion Decimal Prisma → number ────────────────────────────────────────

/** Convertit une valeur Prisma Decimal (ou tout autre type) en number. */
export const n = (v: unknown): number =>
  typeof v === "object" && v !== null && "toNumber" in v
    ? (v as { toNumber: () => number }).toNumber()
    : Number(v ?? 0);

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

// ── Labels d'exercice fiscal ─────────────────────────────────────────────────���

/**
 * Formate le label d'un exercice fiscal.
 * - Si le démarrage est en janvier (moisDebut = 0) → "2026"
 * - Sinon → "2026–2027" (exercice à cheval sur deux années civiles)
 */
export const fmtExercice = (start: number, moisDebut: number): string =>
  moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;

// ── Mappeur date → exercice fiscal ────────────────────────────────────────────

export interface ExerciceHelpers {
  /** Borne de fin de l'exercice N (= début exercice N+1) */
  exBorne1: Date;
  /** Borne de fin de l'exercice N+1 */
  exBorne2: Date;
  /** Borne de fin de l'exercice N+2 */
  exBorne3: Date;
  /**
   * Mappe une date vers sa clé d'exercice fiscal (y1 | y2 | y3).
   * Retourne null si la date est hors des 3 exercices projetés.
   */
  toExerciceKey: (date: Date | string) => YearKey | null;
  /**
   * Prorata de l'exercice appartenant à l'année civile de fin
   * (pFin = moisDebut / 12 ; pDeb = 1 − pFin).
   * Utile pour ventiler les dotations aux amortissements par exercice.
   */
  pFin: number;
  pDeb: number;
}

/**
 * Crée les helpers de mapping date → exercice fiscal à partir de la date de démarrage.
 *
 * @example
 * const { toExerciceKey, exBorne1 } = makeExerciceHelpers(new Date("2026-04-01"));
 * toExerciceKey(new Date("2026-10-15")) // → "y1"
 */
export function makeExerciceHelpers(dateDemarrage: Date): ExerciceHelpers {
  const exBorne1 = new Date(
    dateDemarrage.getFullYear() + 1,
    dateDemarrage.getMonth(),
    dateDemarrage.getDate(),
  );
  const exBorne2 = new Date(
    dateDemarrage.getFullYear() + 2,
    dateDemarrage.getMonth(),
    dateDemarrage.getDate(),
  );
  const exBorne3 = new Date(
    dateDemarrage.getFullYear() + 3,
    dateDemarrage.getMonth(),
    dateDemarrage.getDate(),
  );

  const moisDebut = dateDemarrage.getMonth();
  const pFin = moisDebut === 0 ? 0 : moisDebut / 12;
  const pDeb = 1 - pFin;

  function toExerciceKey(date: Date | string): YearKey | null {
    const d = date instanceof Date ? date : new Date(String(date));
    if (d >= dateDemarrage && d < exBorne1) return "y1";
    if (d >= exBorne1 && d < exBorne2) return "y2";
    if (d >= exBorne2 && d < exBorne3) return "y3";
    return null;
  }

  return { exBorne1, exBorne2, exBorne3, toExerciceKey, pFin, pDeb };
}

// ── Helpers d'accumulation ────────────────────────────────────────────────────

/** Retourne un accumulateur par année initialisé à zéro. */
export const zeroAcc = (): YearAcc => ({ y1: 0, y2: 0, y3: 0 });

/** Somme une propriété numérique sur un tableau. */
export const sumBy = <T>(arr: T[], fn: (item: T) => number): number =>
  arr.reduce((s, x) => s + fn(x), 0);
