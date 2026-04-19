"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import type { BreakEvenData } from "@/lib/finance/calculs/seuil";
import type { DataState } from "@/lib/types/data-state";

export type SeuilRentabiliteDataState = DataState<BreakEvenData>;

export function useSeuilRentabiliteData(dossierId: string): SeuilRentabiliteDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BreakEvenData | null>(() => {
    if (!data || !fc) return null;
    return calcSeuil(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
