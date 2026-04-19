import type { YearKey } from "@/lib/finance/utils";
import type { SigNode } from "./types";
import { mkVal } from "../helpers/shared-helpers";

/**
 * Nœud avec pct forcé à 100% (pour lignes CA/Production).
 * Spécifique SIG — ne peut pas être absorbé par `makeNodeBuilder` (pct calculé différemment).
 */
export function makeSigNodeAt100Builder() {
  return function sigNodeAt100(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: SigNode["style"],
    children?: SigNode[],
  ): SigNode {
    return {
      key,
      label,
      values: {
        y1: mkVal(vals.y1, vals.y1 !== 0 ? 100 : null),
        y2: mkVal(vals.y2, vals.y2 !== 0 ? 100 : null),
        y3: mkVal(vals.y3, vals.y3 !== 0 ? 100 : null),
      },
      children,
      style,
    };
  };
}
