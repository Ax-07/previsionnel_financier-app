/**
 * Types de présentation du Plan de Financement.
 * @module aggregations/plan-financement/types
 */

import type { FinKey, FinRow } from "../helpers/financement-helpers";

export interface PfData {
  yearLabels: Record<FinKey, string>;
  rows: FinRow[];
}
