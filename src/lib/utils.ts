import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numVal(v: string): number {
  const n = parseFloat(v.replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}