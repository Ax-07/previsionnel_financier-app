"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import type { SigData } from "@/lib/finance/aggregations/sig";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface SigDataState {
  data: SigData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useSigData(dossierId: string): SigDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<SigData | null>(() => {
    if (!data || !fc) return null;
    return buildSigData(data, fc, data.isIS);
  }, [data, fc]);

  return { data: result, status, error };
}
