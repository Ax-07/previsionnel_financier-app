import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convertit une chaîne de caractères en nombre, en gérant les formats français (virgule comme séparateur décimal, espaces comme séparateurs de milliers).
 *
 * Exemples :
 *   "1 234,56" → 1234.56
 *   "12,34" → 12.34
 *   "1 000" → 1000
 *   "abc" → 0 (fallback pour les entrées non numériques)
 * @param v - Chaîne de caractères à convertir en nombre
 * @returns Le nombre correspondant à la chaîne d'entrée, ou 0 si la conversion échoue
 * @see Utilisé dans les champs de saisie numérique du prévisionnel pour permettre une saisie au format français tout en travaillant avec des nombres en interne.
 */
export function numVal(v: string): number {
  const n = parseFloat(v.replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}
/**
 * Fonctions de formatage pour les montants financiers et les pourcentages.
 * Centralisent le formatage en français (espaces pour les milliers, virgule pour les décimales) et gèrent les cas particuliers (0 affiché comme "—", pourcentages avec 1 décimale).
 *
 * Exemples :
 *   formatAmount(1234.56) → "1 235"
 *   formatAmount(0) → "—"
 *   formatPct(0.1234) → "12.3 %"
 *   formatPct(null) → ""
 * @see Utilisé dans les tableaux de résultats financiers du prévisionnel pour un affichage clair et cohérent des montants et pourcentages.
 */
const frFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/**
 * Formate un montant en euros selon les conventions françaises, avec des espaces pour les milliers et une gestion spéciale pour le zéro.
 *
 * Exemples :
 *   formatAmount(1234.56) → "1 235"
 *   formatAmount(0) → "—"
 * @param amount - Montant à formater
 * @returns Le montant formaté en chaîne de caractères, ou "—" si le montant est zéro
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt.format(Math.round(amount));
}

/**
 * Formate un pourcentage avec une décimale, ou retourne une chaîne vide si la valeur est null.
 *
 * Exemples :
 *   formatPct(0.1234) → "12.3 %"
 *   formatPct(null) → ""
 * @param pct - Pourcentage à formater (valeur entre 0 et 1)
 * @returns Le pourcentage formaté en chaîne de caractères, ou une chaîne vide si la valeur est null
 */
export function formatPct(pct: number | null): string {
  if (pct === null) return "";
  return `${pct.toFixed(1)} %`;
}

/**
 * Formate un montant en euros avec une couleur conditionnelle : rouge pour les montants négatifs, vert pour les montants positifs, et gris pour zéro.
 *
 * Exemples :
 *   formatAmountColored(1234.56) → { text: "1 235", cls: "text-emerald-600 dark:text-emerald-400" }
 *   formatAmountColored(-500) → { text: "500", cls: "text-destructive" }
 *   formatAmountColored(0) → { text: "–", cls: "text-muted-foreground" }
 * @see Utile pour les indicateurs financiers du prévisionnel, où la couleur aide à visualiser rapidement les montants positifs, négatifs ou nuls.
 * @param v - Montant à formater et colorer
 * @returns Un objet contenant le texte formaté et la classe CSS correspondante pour la couleur
 */
export function formatAmountColored(v: number): { text: string; cls: string } {
  if (v === 0) return { text: "–", cls: "text-muted-foreground" };
  const text = frFmt.format(Math.round(v));
  return { text, cls: v < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400" };
}