/**
 * Couche calculs TVA — interface de la couche calculs vers le moteur TVA bas niveau.
 *
 * Responsabilité : exposer les calculs TVA (mensuelle) depuis la couche `calculs/`
 * en ré-exportant depuis `tva-engine.ts` (source unique de vérité du moteur).
 *
 * Consommateurs :
 *   - `pipeline/build.ts` (futur) — TVA intégrée au pipeline complet
 *   - `app/actions/controle/tva.ts` — tableau TVA UI
 *   - `app/actions/controle/tresorerie.ts` — TVA à décaisser
 */

export type {
  TVAMonthlyResult,
} from "@/lib/finance/tva-engine";

export { computeTVAMonthly } from "@/lib/finance/tva-engine";
