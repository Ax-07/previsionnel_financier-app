"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBudgetTree } from "@/app/actions/controle/budget/build-tree";
import { buildBudgetMonthLabels } from "@/app/actions/controle/budget/helpers";
import type { BudgetData } from "@/app/actions/controle/budget/types";
import type { YearKey } from "@/lib/finance/utils";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export type { BudgetValue, BudgetNode, BudgetNodeStyle, BudgetData } from "@/app/actions/controle/budget/types";

export interface BudgetDataState {
  data: BudgetData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

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

    const nodes = buildBudgetTree(data, mc);

    return { yearLabels: fc.yearLabels, monthLabels, nodes };
  }, [data, fc]);

  return { data: result, status, error };
}
