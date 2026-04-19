import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/calculs";
import { buildSigRows } from "./sig/drilldown";
import { buildSigTree } from "./sig/build-rows";
import type { SigData } from "./sig/types";

export type { SigValue, SigNode, SigData } from "./sig/types";
export { buildSigRows } from "./sig/drilldown";
export { buildSigTree } from "./sig/build-rows";

/**
 * Construit le SIG complet (drill-down + arbre de nœuds).
 * Fonction pure, testable indépendamment de la couche serveur.
 */
export function buildSigData(
  data: ScenarioFinData,
  fc: FinCalcResult,
  isIS: boolean,
): SigData {
  const rows = buildSigRows(data, fc);
  const nodes = buildSigTree(fc, rows, isIS);
  return { yearLabels: fc.yearLabels, nodes };
}
