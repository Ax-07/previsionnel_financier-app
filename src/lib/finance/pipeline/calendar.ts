/**
 * Utilitaires de calendrier fiscal.
 *
 * Ce fichier est la source unique de vérité pour :
 *   - le mapping date → exercice fiscal (makeExerciceHelpers, toExerciceKey)
 *   - le formatage des labels d'exercice (fmtExercice)
 *   - le contexte temporel partagé trésorerie (TemporelCtx, buildTemporelCtx, dateToSlot)
 *
 * Exception §3.5.8 : importable depuis n'importe quelle couche (calculs/, normalize/).
 */

import type { YearKey } from "@/lib/finance/types/series";

// ── Types exercice fiscal ─────────────────────────────────────────────────────

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
   */
  pFin: number;
  pDeb: number;
}

// ── Labels d'exercice fiscal ──────────────────────────────────────────────────

/**
 * Formate le label d'un exercice fiscal.
 * - moisDebut = 0 → "2026"
 * - moisDebut > 0  → "2026–2027"
 */
export const fmtExercice = (start: number, moisDebut: number): string =>
  moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;

// ── Mappeur date → exercice fiscal ────────────────────────────────────────────

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

// ── Contexte temporel (trésorerie) ────────────────────────────────────────────

/** Contexte temporel partagé par tous les calculs d'encaissements/décaissements. */
export interface TemporelCtx {
  anneeDebut: number;
  moisDebut: number;
  yearStarts: readonly [Date, Date, Date, Date];
  isFranchise: boolean;
  defaultDelaiClients: number;
}

/**
 * Construit le contexte temporel utilisé par les calculs d'encaissements/décaissements.
 */
export function buildTemporelCtx(
  dateDemarrage: Date,
  isFranchise: boolean,
  defaultDelaiClients = 30,
): TemporelCtx {
  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth();
  return {
    anneeDebut,
    moisDebut,
    yearStarts: [
      new Date(anneeDebut, moisDebut, 1),
      new Date(anneeDebut + 1, moisDebut, 1),
      new Date(anneeDebut + 2, moisDebut, 1),
      new Date(anneeDebut + 3, moisDebut, 1),
    ] as const,
    isFranchise,
    defaultDelaiClients,
  };
}

const YKS = ["y1", "y2", "y3"] as const;

/**
 * Mappe une date vers son slot (yearKey + monthIndex) dans les 3 exercices.
 * Retourne `{ yk: null, mi: -1 }` si hors périmètre.
 */
export function dateToSlot(
  d: Date,
  yearStarts: TemporelCtx["yearStarts"],
): { yk: YearKey | null; mi: number } {
  for (let i = 0; i < 3; i++) {
    if (d >= yearStarts[i]! && d < yearStarts[i + 1]!) {
      const dy = d.getFullYear() - yearStarts[i]!.getFullYear();
      const dm = d.getMonth() - yearStarts[i]!.getMonth();
      return {
        yk: YKS[i]!,
        mi: Math.min(11, Math.max(0, dy * 12 + dm)),
      };
    }
  }
  return { yk: null, mi: -1 };
}
