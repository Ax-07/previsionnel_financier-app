"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import type { SigData } from "@/lib/finance/aggregations/sig";
import type { DataState } from "@/lib/types/data-state";

export type SigDataState = DataState<SigData>;

export function useSigData(dossierId: string): SigDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<SigData | null>(() => {
    if (!data || !fc) return null;
    return buildSigData(fc.filteredData, fc, fc.filteredData.isIS);
  }, [data, fc]);

  return { data: result, status, error };
}
