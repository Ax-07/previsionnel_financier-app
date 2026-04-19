"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import type { BilanData } from "@/lib/finance/aggregations/bilan";
import type { DataState } from "@/lib/types/data-state";

export type BilanDataState = DataState<BilanData>;

export function useBilanData(dossierId: string): BilanDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BilanData | null>(() => {
    if (!data || !fc) return null;
    return buildBilanRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
