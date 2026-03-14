import type { YearKey } from "@/lib/finance/utils";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";

export type MonthValue = number;

export interface BudgetValue {
  months: MonthlySeries;
  total: number;
}

export type BudgetNodeStyle =
  | "normal"    // ligne de détail
  | "section"   // en-tête de section
  | "total"     // sous-total
  | "result"    // résultat intermédiaire clé
  | "highlight"; // résultat final mis en avant

export interface BudgetNode {
  key: string;
  label: string;
  values: Record<YearKey, BudgetValue>;
  children?: BudgetNode[];
  style: BudgetNodeStyle;
  hideIfZero?: boolean;
}

export interface BudgetData {
  /** Labels des exercices, ex: "2026–2027" */
  yearLabels: Record<YearKey, string>;
  /** Labels des mois (12 par exercice basés sur la date de démarrage) */
  monthLabels: Record<YearKey, string[]>;
  nodes: BudgetNode[];
}
