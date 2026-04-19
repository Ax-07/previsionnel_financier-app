/**
 * Helpers de manipulation de séries mensuelles.
 *
 * Ce module centralise les fonctions purement utilitaires opérant sur les
 * séries temporelles (`MonthlySeries`, `MonthlyAcc`). Aucun calcul métier ici.
 *
 * Importé par : `calculs/monthly.ts`, `calculs/ca.ts`, `calculs/personnel.ts`, etc.
 * Ne doit importer que depuis `types/series.ts`.
 */

import type { MonthlySeries, MonthlyAcc } from "@/lib/finance/types/series";
import type { YearKey } from "@/lib/finance/utils";

export type { MonthlySeries, MonthlyAcc };

// ── Labels ────────────────────────────────────────────────────────────────────

export const FR_MONTHS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
] as const;

// ── Constructeurs ─────────────────────────────────────────────────────────────

/**
 * Crée une série de 12 zéros mutables.
 * Retourne `number[]` (mutable) pour permettre l'accumulation interne.
 * Les consommateurs reçoivent la valeur via `MonthlySeries` (readonly) à la frontière publique.
 */
export function zeroSeries(): number[] {
  return Array(12).fill(0);
}

/** Crée un accumulateur mensuel mutable initialisé à zéro pour les 3 exercices. */
export function emptyAcc(): Record<YearKey, number[]> {
  return { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
}

// ── Opérations arithmétiques ──────────────────────────────────────────────────

/** Addition terme à terme de deux séries (a + b). */
export function sumSeries(a: MonthlySeries, b: MonthlySeries): MonthlySeries {
  return a.map((v, i) => v + (b[i] ?? 0)) as MonthlySeries;
}

/** Soustraction terme à terme (a − b). */
export function subSeries(a: MonthlySeries, b: MonthlySeries): MonthlySeries {
  return a.map((v, i) => v - (b[i] ?? 0)) as MonthlySeries;
}

/** Addition de N séries (équivalent de sumSeries étendu). */
export function sumAll(...series: MonthlySeries[]): MonthlySeries {
  return series.reduce((acc, s) => sumSeries(acc, s), zeroSeries() as MonthlySeries);
}

/** Somme annuelle d'une série mensuelle. */
export function totalOf(s: MonthlySeries): number {
  return s.reduce((acc, v) => acc + v, 0);
}

// ── Répartitions ─────────────────────────────────────────────────────────────

/** Répartition uniforme d'un total annuel sur 12 mois (total ÷ 12). */
export function uniformMonthly(total: number): MonthlySeries {
  const v = total / 12;
  return Array(12).fill(v) as MonthlySeries;
}

// ── Agrégation ────────────────────────────────────────────────────────────────

/**
 * Somme les séries mensuelles de chaque exercice pour obtenir un `YearAcc`
 * (agrégat annuel par exercice).
 */
export function monthlyToYearAcc(m: MonthlyAcc): Record<YearKey, number> {
  return { y1: totalOf(m.y1), y2: totalOf(m.y2), y3: totalOf(m.y3) };
}

// ── Labels de mois ────────────────────────────────────────────────────────────

/** Construit les labels de mois (ex: "Jan 2026") pour les 12 mois d'un exercice. */
export function buildMonthLabels(startMonth: number, startYear: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    return `${FR_MONTHS[m]} ${y}`;
  });
}

// ── Distributions saisonnières ────────────────────────────────────────────────

/**
 * Répartit un total annuel selon la saisonnalité (pourcentages mensuels),
 * ou uniformément si absente ou incomplète.
 *
 * @param saisonnalite - Objet `{ N: number[], N1: number[], N2: number[] }` ou `null`
 * @param yearKey      - Clé d'exercice : `"N"` | `"N1"` | `"N2"`
 */
export function seasonalMonthly(
  total: number,
  saisonnalite: unknown,
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  if (saisonnalite && typeof saisonnalite === "object") {
    const rec = saisonnalite as Record<string, unknown>;
    const pcts = rec[yearKey];
    if (Array.isArray(pcts) && pcts.length >= 12) {
      return (pcts as number[]).slice(0, 12).map((p) => (total * p) / 100) as MonthlySeries;
    }
  }
  return uniformMonthly(total);
}

/**
 * Convertit le JSON `{ N: number[], N1: number[], N2: number[] }` des achats
 * ponctuels en `MonthlySeries` (montants bruts par mois, pas des pourcentages).
 */
export function ponctuelMonthly(
  ponctuel: unknown,
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  if (ponctuel && typeof ponctuel === "object") {
    const rec = ponctuel as Record<string, unknown>;
    const vals = rec[yearKey];
    if (Array.isArray(vals) && vals.length > 0) {
      const series = zeroSeries();
      (vals as number[]).forEach((v, i) => {
        if (i < 12) series[i] = v;
      });
      return series;
    }
  }
  return zeroSeries();
}

/**
 * Distribue un total annuel selon la fréquence de règlement.
 *
 * - `MENSUELLE`    → ÷ 12
 * - `TRIMESTRIELLE`→ 4 versements à partir du mois de paiement
 * - `SEMESTRIELLE` → M6/M12
 * - `ANNUELLE`     → tout au mois de paiement
 */
export function distributeByFrequency(
  total: number,
  frequence: string | null | undefined,
  moisPaiement: number | null | undefined, // 1..12
): MonthlySeries {
  const series = zeroSeries();
  if (total === 0) return series;
  const freq = (frequence ?? "MENSUELLE").toUpperCase();
  const mois = moisPaiement ?? 1;
  switch (freq) {
    case "MENSUELLE":
      return uniformMonthly(total);
    case "TRIMESTRIELLE": {
      const quarter = total / 4;
      const starts = [mois - 1, mois + 2, mois + 5, mois + 8].map(
        (m) => ((m % 12) + 12) % 12,
      );
      for (const idx of starts) series[idx]! += quarter;
      return series;
    }
    case "SEMESTRIELLE": {
      const half = total / 2;
      series[5] = half;
      series[11] = half;
      return series;
    }
    case "ANNUELLE":
      series[(mois - 1 + 12) % 12] = total;
      return series;
    default:
      return uniformMonthly(total);
  }
}

/**
 * Distribue un montant de `ChargeExploitation` en respectant son mode de calcul :
 * - `POURCENTAGE_CA` → saisonnalité CA depuis `detailCalc.saisonnaliteCA`
 * - `FIXE` (défaut) → `distributeByFrequency` selon la fréquence
 */
export function chargeExplMonthly(
  montant: number,
  row: {
    frequence?: string | null;
    moisPaiement?: number | null;
    detailCalc?: unknown;
  },
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  const detail = row.detailCalc as Record<string, unknown> | null | undefined;
  if (detail?.modeCalc === "POURCENTAGE_CA") {
    return seasonalMonthly(montant, detail["saisonnaliteCA"], yearKey);
  }
  return distributeByFrequency(montant, row.frequence, row.moisPaiement);
}

// ── Accumulateur ─────────────────────────────────────────────────────────────

/** Ajoute in-place une série à un accumulateur `MonthlyAcc` sur la clé donnée. */
export function addSeriesInPlace(acc: MonthlyAcc, yk: YearKey, s: MonthlySeries): void {
  for (let i = 0; i < 12; i++) (acc[yk] as number[])[i]! += s[i] ?? 0;
}
