"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildRatiosRows } from "@/lib/finance/aggregations/ratios";
import type { RatiosData } from "@/lib/finance/aggregations/ratios";
import type { DataState } from "@/lib/types/data-state";

export type RatiosDataState = DataState<RatiosData>;

export function useRatiosData(dossierId: string): RatiosDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<RatiosData | null>(() => {
    if (!data || !fc) return null;
    return buildRatiosRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
