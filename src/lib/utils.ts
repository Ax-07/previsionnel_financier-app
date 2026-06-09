import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



// ── Re-exports pour rétrocompatibilité ────────────────────────────────────────
// Les implémentations ont été déplacées vers @/lib/format (source unique).
export { formatAmount, formatAmountColored, formatPct, numVal } from "@/lib/format";