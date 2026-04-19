"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import type { BfrData } from "@/lib/finance/aggregations/bfr";
import type { DataState } from "@/lib/types/data-state";

export type BfrDataState = DataState<BfrData>;

export function useBfrData(dossierId: string): BfrDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BfrData | null>(() => {
    if (!data || !fc) return null;
    return buildBfrRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
