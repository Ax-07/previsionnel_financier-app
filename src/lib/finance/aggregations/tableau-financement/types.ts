/**
 * Types de présentation du Tableau de Financement.
 * @module aggregations/tableau-financement/types
 */

import type { FinKey, FinRow } from "../helpers/financement-helpers";

export interface TfData {
  yearLabels: Record<FinKey, string>;
  rows: FinRow[];
}
