"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import type { BilanData } from "@/lib/finance/aggregations/bilan";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface BilanDataState {
  data: BilanData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useBilanData(dossierId: string): BilanDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BilanData | null>(() => {
    if (!data || !fc) return null;
    return buildBilanRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
