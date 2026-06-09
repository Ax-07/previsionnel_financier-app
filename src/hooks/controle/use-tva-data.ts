"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import type { VATData } from "@/lib/finance/aggregations/tva";
import type { DataState } from "@/lib/types/data-state";

export type { VATValue, VATRowStyle, VATRow, VATData } from "@/lib/finance/aggregations/tva";

export type TvaDataState = DataState<VATData>;

export function useTvaData(dossierId: string): TvaDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<VATData | null>(() => {
    if (!data || !fc) return null;

    const yearLabels = fc.yearLabels;
    const monthLabels = fc.calendar.monthLabels;

    const { isFranchise, periodicite } = fc.tva;

    if (isFranchise) {
      return { yearLabels, monthLabels, rows: [], periodicite: "mensuel", isFranchise: true };
    }

    const rows = buildTVARows(fc.filteredData, fc);

    return { yearLabels, monthLabels, rows, periodicite, isFranchise };
  }, [data, fc]);

  return { data: result, status, error };
}
