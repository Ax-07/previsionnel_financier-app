/**
 * Facade du module Tableau de Financement -- re-exporte depuis tableau-financement/.
 * @module aggregations/tableau-financement
 */

export type { TfData } from "./tableau-financement/types";
export { buildTableauFinancementRows } from "./tableau-financement/build-rows";
export type { FinRow as TfRow, FinRowValue as TfRowValue } from "./helpers/financement-helpers";
