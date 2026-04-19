"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildCompteResultatRows } from "@/lib/finance/aggregations/compte-resultat";
import type { CompteResultatData } from "@/lib/finance/aggregations/compte-resultat";
import type { DataState } from "@/lib/types/data-state";

export type CompteResultatDataState = DataState<CompteResultatData>;

export function useCompteResultatData(dossierId: string): CompteResultatDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<CompteResultatData | null>(() => {
    if (!data || !fc) return null;
    return buildCompteResultatRows(data, fc, data.isIS);
  }, [data, fc]);

  return { data: result, status, error };
}
