/**
 * Couche calculs Trésorerie — barrel consolidant les flux d'encaissements
 * et de décaissements en un seul point d'entrée.
 *
 * Responsabilité : exposer toutes les fonctions et types liés aux flux de
 * trésorerie depuis la couche `calculs/`.
 *
 * Sources :
 *   - `encaissements.ts`   → calcEncaissements, TemporelCtx, buildTemporelCtx
 *   - `decaissements.ts`   → calcDecaissements, shiftYk3, buildFrequenceSeries
 *   - `tresorerie-engine.ts` (via decaissements.ts) → bas niveau déjà encapsulé
 *
 * Consommateurs :
 *   - `pipeline/build.ts` (futur) — orchestre trésorerie complète
 *   - `app/actions/controle/tresorerie.ts` — tableau trésorerie UI
 */

// ── Contexte temporel (source : pipeline/calendar) ───────────────────────────
export type { TemporelCtx } from "@/lib/finance/pipeline/calendar";
export { buildTemporelCtx, dateToSlot } from "@/lib/finance/pipeline/calendar";

// ── Encaissements ─────────────────────────────────────────────────────────────
export type { EncaissementsResult } from "@/lib/finance/calculs/encaissements";
export { addToYk3, calcEncaissements } from "@/lib/finance/calculs/encaissements";

// ── Décaissements ─────────────────────────────────────────────────────────────
export type {
  DecaissementsResult,
} from "@/lib/finance/calculs/decaissements";

export {
  shiftYk3,
  calcDecaissements,
} from "@/lib/finance/calculs/decaissements";
