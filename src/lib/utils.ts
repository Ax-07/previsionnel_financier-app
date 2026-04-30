import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convertit une chaîne de caractères en nombre, en gérant les formats français
 * (virgule comme séparateur décimal, espaces comme séparateurs de milliers).
 *
 * @param v - Chaîne de caractères à convertir
 * @returns Le nombre correspondant, ou 0 si la conversion échoue
 */
export function numVal(v: string): number {
  const n = parseFloat(v.replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}

// ── Re-exports pour rétrocompatibilité ────────────────────────────────────────
// Les implémentations ont été déplacées vers @/lib/format (source unique).
export { formatAmount, formatAmountColored, formatPct } from "@/lib/format";