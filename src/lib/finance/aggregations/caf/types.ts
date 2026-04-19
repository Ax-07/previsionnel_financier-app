/**
 * Types de présentation de la Capacité d'Autofinancement (CAF).
 * @module aggregations/caf/types
 */

import type { YearKey } from "@/lib/finance/utils";
import type { AmountValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type CafRowValue = AmountValue;

export interface CafRow {
  key: string;
  label: string;
  /** signe affiché dans le libellé : "+", "−", "=" */
  sign: "+" | "−" | "=" | "";
  /** style de rendu */
  style: "normal" | "subtotal" | "highlight";
  values: Record<YearKey, CafRowValue>;
  hideIfZero?: boolean;
  children?: CafRow[];
}

export interface CafData {
  yearLabels: Record<YearKey, string>;
  rows: CafRow[];
}
