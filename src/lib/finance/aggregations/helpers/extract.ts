/**
 * Helpers d'extraction partagés pour les hooks de contrôle.
 *
 * Centralisent les fonctions de recherche par clé dans les structures de données
 * financières (SIG, seuil de rentabilité, BFR, bilan, trésorerie).
 */
import type { SigNode } from "@/lib/finance/aggregations/sig";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import type { BilanRow } from "@/lib/finance/aggregations/bilan";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import type { YearKey } from "@/lib/finance/utils";

// ── Extraction montant annuel ─────────────────────────────────────────────────

const ZERO_YK: Record<YearKey, number> = { y1: 0, y2: 0, y3: 0 };

export function extractSigAmt(nodes: SigNode[], key: string): Record<YearKey, number> {
  const node = nodes.find((n) => n.key === key);
  if (!node) return { ...ZERO_YK };
  return { y1: node.values.y1.amount, y2: node.values.y2.amount, y3: node.values.y3.amount };
}

export function extractBreakEvenAmt(rows: BreakEvenRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { ...ZERO_YK };
  return { y1: row.values.y1.amount ?? 0, y2: row.values.y2.amount ?? 0, y3: row.values.y3.amount ?? 0 };
}

export function extractBfrAmt(rows: BfrRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { ...ZERO_YK };
  return { y1: row.values.y1.amount, y2: row.values.y2.amount, y3: row.values.y3.amount };
}

export function extractBilanAmt(rows: BilanRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { ...ZERO_YK };
  return { y1: row.values.y1.amount, y2: row.values.y2.amount, y3: row.values.y3.amount };
}

export function extractTresoAmt(rows: TresorerieRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { ...ZERO_YK };
  return { y1: row.values.y1.total, y2: row.values.y2.total, y3: row.values.y3.total };
}

// ── Extraction séries mensuelles ──────────────────────────────────────────────

const ZERO_MONTHS = new Array(12).fill(0) as number[];

export function extractTresoMonthly(rows: TresorerieRow[], key: string): Record<YearKey, number[]> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: [...ZERO_MONTHS], y2: [...ZERO_MONTHS], y3: [...ZERO_MONTHS] };
  return {
    y1: Array.from(row.values.y1.months),
    y2: Array.from(row.values.y2.months),
    y3: Array.from(row.values.y3.months),
  };
}
