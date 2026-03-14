import type { YearKey } from "@/lib/finance/utils";
import type { SigValue, SigNode } from "./types";

export function mkVal(amount: number, pct: number | null): SigValue {
  return { amount, pct };
}

export function pct(amount: number, base: number): number | null {
  return base !== 0 ? (amount / base) * 100 : null;
}

/** Factory : retourne un constructeur de nœud lié au CA de référence. */
export function makeSigNodeBuilder(ca: Record<YearKey, number>) {
  return function sigNode(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: SigNode["style"],
    children?: SigNode[],
    hideIfZero = false,
  ): SigNode {
    return {
      key,
      label,
      values: {
        y1: mkVal(vals.y1, pct(vals.y1, ca.y1)),
        y2: mkVal(vals.y2, pct(vals.y2, ca.y2)),
        y3: mkVal(vals.y3, pct(vals.y3, ca.y3)),
      },
      children,
      style,
      hideIfZero,
    };
  };
}

/** Nœud avec pct forcé à 100% (pour lignes CA/Production). */
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

/** Construit les nœuds enfants pour le drill-down d'un nœud parent. */
export function buildSigChildNodes(
  rows: { libelle: string; montantN: number; montantN1: number; montantN2: number }[],
  parentKey: string,
  ca: Record<YearKey, number>,
): SigNode[] {
  return rows
    .filter((r) => r.montantN !== 0 || r.montantN1 !== 0 || r.montantN2 !== 0)
    .map((r, i) => ({
      key: `${parentKey}_c${i}`,
      label: r.libelle,
      values: {
        y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
        y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
        y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
      },
      style: "normal" as const,
      hideIfZero: true,
    }));
}
