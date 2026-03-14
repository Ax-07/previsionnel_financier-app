"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildCafRows } from "@/lib/finance/aggregations/caf";
import type { CafData } from "@/lib/finance/aggregations/caf";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface CafDataState {
  data: CafData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useCafData(dossierId: string): CafDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<CafData | null>(() => {
    if (!data || !fc) return null;
    return buildCafRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
