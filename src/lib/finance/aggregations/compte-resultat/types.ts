import type { YearKey } from "@/lib/finance/utils";
import type { PctValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type CRYearValue = PctValue;

export interface CRNode {
  key: string;
  label: string;
  values: Record<YearKey, CRYearValue>;
  children?: CRNode[];
  /** Niveau d'affichage : normal | section (titre section) | subtotal | total | result */
  style: "normal" | "section" | "subtotal" | "total" | "result";
  /** Masquer si les trois valeurs sont à 0 (lignes vides) */
  hideIfZero?: boolean;
}

export interface CompteResultatData {
  /** Labels des exercices, ex: "2026–2027" */
  yearLabels: Record<YearKey, string>;
  nodes: CRNode[];
}
