"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildRatiosRows } from "@/lib/finance/aggregations/ratios";
import type { RatiosData } from "@/lib/finance/aggregations/ratios";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface RatiosDataState {
  data: RatiosData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useRatiosData(dossierId: string): RatiosDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<RatiosData | null>(() => {
    if (!data || !fc) return null;
    return buildRatiosRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
