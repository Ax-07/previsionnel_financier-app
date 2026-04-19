/**
 * Couche d'agrégation — point d'entrée unique pour les builders de tableaux UI.
 *
 * Chaque module exporte :
 *  - Les types de données (XxxData, XxxRow, XxxRowValue…)
 *  - La fonction pure buildXxxRows(data, fc) → XxxData
 *
 * @module aggregations
 */

// ── Helpers partagés ─────────────────────────────────────────────────────────
export * from "./helpers/shared-helpers";
export * from "./helpers/financement-helpers";

// ── Compte de résultat & SIG ─────────────────────────────────────────────────
export * from "./compte-resultat";
export * from "./sig";

// ── BFR, CAF & TVA ───────────────────────────────────────────────────────────
export * from "./bfr";
export * from "./caf";
export * from "./tva";

// ── Bilan & ratios ────────────────────────────────────────────────────────────
export * from "./bilan";
export * from "./ratios";

// ── Financement ───────────────────────────────────────────────────────────────
export * from "./plan-financement";
export * from "./tableau-financement";

// ── Trésorerie ────────────────────────────────────────────────────────────────
export * from "./tresorerie";

// ── Synthèse & Dashboard KPI ──────────────────────────────────────────────────
export * from "./synthese";
export * from "./dashboard-kpi";
