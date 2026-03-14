"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildTableauFinancementRows } from "@/lib/finance/aggregations/tableau-financement";
import type { TfData } from "@/lib/finance/aggregations/tableau-financement";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface TableauFinancementDataState {
  data: TfData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useTableauFinancementData(dossierId: string): TableauFinancementDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<TfData | null>(() => {
    if (!data || !fc) return null;
    return buildTableauFinancementRows(data, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
