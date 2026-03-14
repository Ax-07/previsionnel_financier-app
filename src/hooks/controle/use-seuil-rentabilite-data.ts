"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import type { BreakEvenData } from "@/lib/finance/calculs/seuil";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface SeuilRentabiliteDataState {
  data: BreakEvenData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useSeuilRentabiliteData(dossierId: string): SeuilRentabiliteDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<BreakEvenData | null>(() => {
    if (!data || !fc) return null;
    return calcSeuil(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
