/**
 * Composant centralisé d'arrondi pour le moteur de paie.
 *
 * Politique d'arrondi conforme aux règles Urssaf / BOSS 2026 :
 *   - Montants en euros         : 2 décimales (centime)
 *   - Coefficients / taux       : 4 décimales
 *   - Assiettes intermédiaires  : 2 décimales
 *
 * Toutes les fonctions `round2` / `round4` dispersées dans le moteur
 * doivent être remplacées par ces imports centralisés.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolitiqueArrondi = "centime" | "coefficient" | "assiette";

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions d'arrondi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arrondi monétaire : 2 décimales (centimes d'euro).
 * Utilisé pour tous les montants salariaux et patronaux.
 */
export function roundMontant(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Arrondi coefficient : 4 décimales.
 * Utilisé pour les taux et coefficients (RGDU, PAS, etc.).
 */
export function roundCoeff(v: number): number {
  return Math.round(v * 10000) / 10000;
}

/**
 * Arrondi assiette : 2 décimales.
 * Utilisé pour les bases de calcul intermédiaires (PMSS, T1, T2, CSG...).
 */
export function roundAssiette(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Arrondi générique configurable.
 *
 * @param v      - Valeur à arrondir
 * @param policy - Politique d'arrondi : "centime" (2 dec), "coefficient" (4 dec), "assiette" (2 dec)
 */
export function arrondir(v: number, policy: PolitiqueArrondi = "centime"): number {
  switch (policy) {
    case "coefficient":
      return roundCoeff(v);
    case "assiette":
      return roundAssiette(v);
    case "centime":
    default:
      return roundMontant(v);
  }
}
