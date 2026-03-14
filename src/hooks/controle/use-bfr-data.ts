"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import type { BfrData } from "@/lib/finance/aggregations/bfr";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface BfrDataState {
  data: BfrData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useBfrData(dossierId: string): BfrDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BfrData | null>(() => {
    if (!data || !fc) return null;
    return buildBfrRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
