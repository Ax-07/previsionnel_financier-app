import type { YearKey } from "@/lib/finance/utils";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";

export interface VATValue {
  months: MonthlySeries;
  total: number;
}

export type VATRowStyle =
  | "normal"    // ligne de détail
  | "section"   // en-tête de section (bandeau)
  | "subtotal"  // sous-total
  | "result"    // résultat intermédiaire clé
  | "highlight"; // résultat final mis en avant

export interface VATRow {
  key: string;
  label: string;
  values: Record<YearKey, VATValue>;
  style: VATRowStyle;
  hideIfZero?: boolean;
  children?: VATRow[];
}

export interface VATData {
  yearLabels: Record<YearKey, string>;
  monthLabels: Record<YearKey, string[]>;
  rows: VATRow[];
  periodicite: "mensuel" | "trimestriel";
  isFranchise: boolean;
}
