"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildCafRows } from "@/lib/finance/aggregations/caf";
import type { CafData } from "@/lib/finance/aggregations/caf";
import type { DataState } from "@/lib/types/data-state";

export type CafDataState = DataState<CafData>;

export function useCafData(dossierId: string): CafDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<CafData | null>(() => {
    if (!data || !fc) return null;
    return buildCafRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
