"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildTableauFinancementRows } from "@/lib/finance/aggregations/tableau-financement";
import type { TfData } from "@/lib/finance/aggregations/tableau-financement";
import type { DataState } from "@/lib/types/data-state";

export type TableauFinancementDataState = DataState<TfData>;

export function useTableauFinancementData(dossierId: string): TableauFinancementDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<TfData | null>(() => {
    if (!data || !fc) return null;
    return buildTableauFinancementRows(fc.filteredData, fc);
  }, [data, fc]);

  return { data: result, status, error };
}
