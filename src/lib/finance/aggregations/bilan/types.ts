/**
 * Types de présentation du Bilan prévisionnel.
 * @module aggregations/bilan/types
 */

import type { YearKey } from "@/lib/finance/utils";
import type { AmountValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type BilanRowValue = AmountValue;

export interface BilanRow {
  key: string;
  label: string;
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → total / ligne clé
   * section   → bandeau de section (ACTIF / PASSIF)
   * indent    → ligne de détail indentée
   */
  style: "normal" | "subtotal" | "highlight" | "section" | "indent";
  indent?: number;
  hideIfZero?: boolean;
  values: Record<YearKey, BilanRowValue>;
}

export interface BilanData {
  yearLabels: Record<YearKey, string>;
  rows: BilanRow[];
  /** Alerte si Total Actif ≠ Total Passif */
  equilibre: Record<YearKey, boolean>;
}
