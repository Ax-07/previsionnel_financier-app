import type { YearKey } from "@/lib/finance/utils";

export interface CRYearValue {
  amount: number;
  pct: number | null; // % du CA
}

export interface CRNode {
  key: string;
  label: string;
  values: Record<YearKey, CRYearValue>;
  children?: CRNode[];
  /** Niveau d'affichage : normal | section (titre section) | total | result */
  style: "normal" | "section" | "total" | "result";
  /** Masquer si les trois valeurs sont à 0 (lignes vides) */
  hideIfZero?: boolean;
}

export interface CompteResultatData {
  /** Labels des exercices, ex: "2026–2027" */
  yearLabels: Record<YearKey, string>;
  nodes: CRNode[];
}
