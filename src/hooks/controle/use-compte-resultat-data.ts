"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildCompteResultatRows } from "@/lib/finance/aggregations/compte-resultat";
import type { CompteResultatData } from "@/lib/finance/aggregations/compte-resultat";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface CompteResultatDataState {
  data: CompteResultatData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useCompteResultatData(dossierId: string): CompteResultatDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<CompteResultatData | null>(() => {
    if (!data || !fc) return null;
    return buildCompteResultatRows(data, fc, data.isIS);
  }, [data, fc]);

  return { data: result, status, error };
}
