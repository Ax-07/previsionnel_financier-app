import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/calculs";
import { buildDrilldownRows } from "./compte-resultat/build-rows";
import { buildCRTree } from "./compte-resultat/build-tree";
import type { CompteResultatData } from "./compte-resultat/types";

export type { CRYearValue, CRNode, CompteResultatData } from "./compte-resultat/types";
export { buildDrilldownRows } from "./compte-resultat/build-rows";
export { buildCRTree } from "./compte-resultat/build-tree";

/**
 * Construit le compte de résultat complet (drill-down + arbre de nœuds).
 * Fonction pure, testable indépendamment de la couche serveur.
 */
export function buildCompteResultatRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
  isIS: boolean,
): CompteResultatData {
  const rows = buildDrilldownRows(data, fc);
  const nodes = buildCRTree(fc, rows, isIS);
  return { yearLabels: fc.yearLabels, nodes };
}
