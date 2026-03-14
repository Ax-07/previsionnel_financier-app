import type { YearKey } from "@/lib/finance/utils";

export interface SigValue {
  amount: number;
  pct: number | null; // % du CA
}

export interface SigNode {
  key: string;
  label: string;
  values: Record<YearKey, SigValue>;
  children?: SigNode[];
  /** Niveau d'affichage */
  style: "normal" | "total" | "highlight" | "section";
  hideIfZero?: boolean;
}

export interface SigData {
  yearLabels: Record<YearKey, string>;
  nodes: SigNode[];
}
