import type { YearKey } from "@/lib/finance/utils";
import type { PctValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type SigValue = PctValue;

export interface SigNode {
  key: string;
  label: string;
  values: Record<YearKey, SigValue>;
  children?: SigNode[];
  /** Niveau d'affichage */
  style: "normal" | "total" | "highlight" | "section" | "caf";
  hideIfZero?: boolean;
}

export interface SigData {
  yearLabels: Record<YearKey, string>;
  nodes: SigNode[];
}
