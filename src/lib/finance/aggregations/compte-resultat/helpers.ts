import type { YearKey } from "@/lib/finance/utils";
import type { CRYearValue, CRNode } from "./types";

export function mkVal(val: number, p: number | null): CRYearValue {
  return { amount: val, pct: p };
}

export function pct(amount: number, base: number): number | null {
  return base !== 0 ? (amount / base) * 100 : null;
}

/** Construit les nœuds enfants d'un nœud parent à partir d'une liste de lignes actives. */
export function buildChildNodes(
  rows: Array<{
    id?: string;
    libelle: string;
    actif?: boolean | null;
    montantN: number;
    montantN1: number;
    montantN2: number;
  }>,
  parentKey: string,
  ca: Record<YearKey, number>,
): CRNode[] {
  return rows
    .filter((r) => r.actif !== false)
    .map((r, i) => ({
      key: `${parentKey}_child_${i}`,
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

/**
 * Factory : retourne un constructeur de nœud `node()` lié au CA de référence.
 * Utilisation : `const node = makeNodeBuilder(ca);`
 */
export function makeNodeBuilder(ca: Record<YearKey, number>) {
  return function node(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: CRNode["style"],
    children?: CRNode[],
    hideIfZero = false,
  ): CRNode {
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
