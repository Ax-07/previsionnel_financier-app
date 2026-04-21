"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildMonthLabels } from "@/lib/finance/calculs/monthly";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import type { VATData } from "@/lib/finance/aggregations/tva";
import type { YearKey } from "@/lib/finance/utils";
import type { DataState } from "@/lib/types/data-state";

export type { VATValue, VATRowStyle, VATRow, VATData } from "@/lib/finance/aggregations/tva";

export type TvaDataState = DataState<VATData>;

export function useTvaData(dossierId: string): TvaDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<VATData | null>(() => {
    if (!data || !fc) return null;

    const { dateDemarrage } = fc.filteredData;
    const anneeDebut = dateDemarrage.getFullYear();
    const moisDebut = dateDemarrage.getMonth();

    const fmtEx = (yr: number) =>
      moisDebut === 0 ? `${yr}` : `${yr}\u2013${yr + 1}`;

    const yearLabels: Record<YearKey, string> = {
      y1: fmtEx(anneeDebut),
      y2: fmtEx(anneeDebut + 1),
      y3: fmtEx(anneeDebut + 2),
    };

    const monthLabels: Record<YearKey, string[]> = {
      y1: buildMonthLabels(moisDebut, anneeDebut),
      y2: buildMonthLabels(moisDebut, anneeDebut + 1),
      y3: buildMonthLabels(moisDebut, anneeDebut + 2),
    };

    const { isFranchise, periodicite } = fc.tva;

    if (isFranchise) {
      return { yearLabels, monthLabels, rows: [], periodicite: "mensuel", isFranchise: true };
    }

    const rows = buildTVARows(fc.filteredData, fc);

    return { yearLabels, monthLabels, rows, periodicite, isFranchise };
  }, [data, fc]);

  return { data: result, status, error };
}
