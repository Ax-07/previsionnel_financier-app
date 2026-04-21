"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBudgetTree } from "@/lib/finance/aggregations/budget/build-tree";
import { buildBudgetMonthLabels } from "@/lib/finance/aggregations/budget/helpers";
import type { BudgetData } from "@/lib/finance/aggregations/budget/types";
import type { YearKey } from "@/lib/finance/utils";
import type { DataState } from "@/lib/types/data-state";

export type { BudgetValue, BudgetNode, BudgetNodeStyle, BudgetData } from "@/lib/finance/aggregations/budget/types";

export type BudgetDataState = DataState<BudgetData>;

export function useBudgetData(dossierId: string): BudgetDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BudgetData | null>(() => {
    if (!data || !fc) return null;

    const mc = fc.monthlyCalc;

    const monthLabels: Record<YearKey, string[]> = {
      y1: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut),
      y2: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut + 1),
      y3: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut + 2),
    };

    const nodes = buildBudgetTree(fc.filteredData, mc);

    return { yearLabels: fc.yearLabels, monthLabels, nodes };
  }, [data, fc]);

  return { data: result, status, error };
}
