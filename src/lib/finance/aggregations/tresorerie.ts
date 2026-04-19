/**
 * Facade du module Tresorerie -- re-exporte depuis tresorerie/.
 * @module aggregations/tresorerie
 */

export type { TresorerieRowsInput } from "./tresorerie/types";
export { tresoValue, mkRow, sectionRow } from "./tresorerie/helpers";
export { buildTresorerieRows } from "./tresorerie/build-rows";
