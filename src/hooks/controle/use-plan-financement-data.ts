"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import type { PfData } from "@/lib/finance/aggregations/plan-financement";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface PlanFinancementDataState {
  data: PfData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function usePlanFinancementData(dossierId: string): PlanFinancementDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<PfData | null>(() => {
    if (!data || !fc) return null;
    return buildPlanFinancementRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
