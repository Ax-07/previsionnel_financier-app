/**
 * Couche d'agrégation — point d'entrée unique pour les builders de tableaux UI.
 *
 * Chaque module exporte :
 *  - Les types de données (XxxData, XxxRow, XxxRowValue…)
 *  - La fonction pure buildXxxRows(data, fc) → XxxData
 *
 * @module aggregations
 */

export * from "./tresorerie";
export * from "./bfr";
export * from "./caf";
export * from "./bilan";
export * from "./ratios";
export * from "./financement-helpers";
export * from "./plan-financement";
export * from "./tableau-financement";
export * from "./compte-resultat";
export * from "./sig";
export * from "./tva";
