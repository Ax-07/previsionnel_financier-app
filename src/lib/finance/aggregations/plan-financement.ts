/**
 * Facade du module Plan de Financement -- re-exporte depuis plan-financement/.
 * @module aggregations/plan-financement
 */

export type { PfData } from "./plan-financement/types";
export { buildPlanFinancementRows } from "./plan-financement/build-rows";
export type { FinRow as PfRow, FinRowValue as PfRowValue } from "./helpers/financement-helpers";
