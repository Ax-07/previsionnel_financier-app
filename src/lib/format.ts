/**
 * Fonctions de formatage centralisées pour le simulateur de paie.
 *
 * Évite la duplication de `formatEur`, `formatPct` et `eur` dans chaque composant.
 */

/**
 * Formate un nombre en euros (fr-FR, 2 décimales, symbole €).
 *
 * @param v - Montant en euros
 * @returns Ex. "1 823,03 €"
 */
export function formatEur(v: number): string {
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/**
 * Alias de `formatEur` — utilisé dans certains composants historiques.
 */
export const eur = formatEur;

/**
 * Formate un ratio (0–1) en pourcentage avec 2 décimales.
 *
 * @param v - Ratio (ex. 0.4532)
 * @returns Ex. "45.32 %"
 */
export function formatPct(v: number): string {
  return (v * 100).toFixed(2) + " %";
}
