/**
 * Point d'entrée unique pour tous les types financiers partagés.
 *
 * Import recommandé :
 *   import type { YearKey, MonthlySeries, FinCalcResult } from "@/lib/finance/types";
 */

export type { MonthIndex, YearKey, YearKey4, YearAcc, MonthlySeries, MonthlyAcc } from "./series";
export type { FinCalcResult } from "./results";
export type {
  TresorerieValue,
  TresorerieRowStyle,
  TresorerieRow,
  TresorerieData,
  Yk3,
} from "./tresorerie";
export type { ScenarioFinData } from "./scenario";
