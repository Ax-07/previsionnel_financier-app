/**
 * Registre des adapters de schémas externes.
 *
 * Les modules spécialisés (BTP, épargne salariale, intermittents, international…)
 * enregistrent leurs adapters ici. Le pipeline simulate() les interroge à chaque étape.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §3.1 (ExternalSchemeAdapters)
 * Table DB correspondante : ExternalSchemeAdapter (P-15)
 */

import type { ExternalSchemeAdapter, PipelineStep } from "./types";
import type { PipelineContext } from "@/lib/paie/engine/pipeline-context";

/** Registre global des adapters actifs */
export const ADAPTER_REGISTRY = new Map<string, ExternalSchemeAdapter>();

/**
 * Enregistre un adapter dans le registre global.
 * Idempotent : un second appel avec le même code remplace l'adapter existant.
 *
 * @example
 * // Dans lib/paie/btp/external-paid-leave-fund-adapter.ts (Lot 7)
 * registerAdapter(btpCaisseCpAdapter);
 */
export function registerAdapter(adapter: ExternalSchemeAdapter): void {
  ADAPTER_REGISTRY.set(adapter.code, adapter);
}

/**
 * Désactive un adapter (par exemple pour les tests).
 */
export function unregisterAdapter(code: string): void {
  ADAPTER_REGISTRY.delete(code);
}

/**
 * Retourne tous les adapters éligibles pour une étape donnée du pipeline,
 * triés par code pour des résultats déterministes.
 *
 * @param step - Étape courante du pipeline (1–11)
 * @param ctx  - Contexte pipeline courant
 */
export function getAdaptersForStep(
  step: PipelineStep,
  ctx: PipelineContext,
): ExternalSchemeAdapter[] {
  const result: ExternalSchemeAdapter[] = [];
  for (const adapter of ADAPTER_REGISTRY.values()) {
    if (
      adapter.insertAtSteps.includes(step) &&
      adapter.eligibilityCheck(ctx)
    ) {
      result.push(adapter);
    }
  }
  // Tri déterministe par code
  return result.sort((a, b) => a.code.localeCompare(b.code));
}
