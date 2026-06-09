"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBudgetTree } from "@/lib/finance/aggregations/budget/build-tree";
import type { BudgetData } from "@/lib/finance/aggregations/budget/types";
import type { DataState } from "@/lib/types/data-state";

export type { BudgetValue, BudgetNode, BudgetNodeStyle, BudgetData } from "@/lib/finance/aggregations/budget/types";

export type BudgetDataState = DataState<BudgetData>;

export function useBudgetData(dossierId: string): BudgetDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BudgetData | null>(() => {
    if (!data || !fc) return null;

    const mc = fc.monthlyCalc;

    const nodes = buildBudgetTree(fc.filteredData, mc);

    return { yearLabels: fc.yearLabels, monthLabels: fc.calendar.monthLabels, nodes };
  }, [data, fc]);

  return { data: result, status, error };
}
