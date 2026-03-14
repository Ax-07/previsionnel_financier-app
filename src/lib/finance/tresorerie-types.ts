/**
 * Types partagés du tableau de trésorerie prévisionnel.
 *
 * Séparés de la server action pour permettre leur réutilisation dans
 * les composants UI sans importer de code serveur.
 */

import type { YearKey } from "@/lib/finance/utils";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";

export interface TresorerieValue {
  months: MonthlySeries;
  total: number;
}

export type TresorerieRowStyle =
  | "normal"     // ligne de détail
  | "indent"     // sous-ligne (enfant)
  | "section"    // en-tête de section (bandeau)
  | "subtotal"   // sous-total
  | "result"     // résultat intermédiaire clé
  | "highlight"; // solde final mis en avant

export interface TresorerieRow {
  key: string;
  label: string;
  style: TresorerieRowStyle;
  /** true → total = valeur M12 au lieu de la somme */
  totalIsEndValue?: boolean;
  values: Record<YearKey, TresorerieValue>;
  hideIfZero?: boolean;
  /** Sous-lignes dépliables */
  children?: TresorerieRow[];
  /** Replié par défaut */
  defaultCollapsed?: boolean;
}

export interface TresorerieData {
  yearLabels: Record<YearKey, string>;
  monthLabels: Record<YearKey, string[]>;
  rows: TresorerieRow[];
}

/** Alias interne : série indexée par les 3 exercices */
export type Yk3 = Record<YearKey, MonthlySeries>;
