/**
 * Types de présentation du Besoin en Fonds de Roulement (BFR).
 * @module aggregations/bfr/types
 */

import type { YearKey4 } from "@/lib/finance/utils";
import type { AmountValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type BfrRowValue = AmountValue;

export interface BfrRow {
  key: string;
  label: string;
  sign: "+" | "−" | "=" | "";
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → ligne clé (BFR)
   * section   → en-tête de section (bandeau)
   */
  style: "normal" | "subtotal" | "highlight" | "section";
  values: Record<YearKey4, BfrRowValue>;
  hideIfZero?: boolean;
  children?: BfrRow[];
}

export interface BfrData {
  yearLabels: Record<YearKey4, string>;
  rows: BfrRow[];
}
