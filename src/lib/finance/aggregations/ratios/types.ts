/**
 * Types de présentation des Ratios financiers.
 * @module aggregations/ratios/types
 */

import type { YearKey } from "@/lib/finance/utils";

export interface RatioValue {
  /** Valeur calculée (null si dénominateur = 0) */
  value: number | null;
}

export interface RatioRow {
  key: string;
  label: string;
  /** Unité affichée : "jours", "%", "années" */
  unit: string;
  /** Nombre de décimales */
  decimals: number;
  values: Record<YearKey, RatioValue>;
}

export interface RatiosData {
  yearLabels: Record<YearKey, string>;
  rows: RatioRow[];
}
