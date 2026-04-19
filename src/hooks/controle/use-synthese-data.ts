"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { useBfrData } from "@/hooks/controle/use-bfr-data";
import { useBilanData } from "@/hooks/controle/use-bilan-data";
import { useTresorerieData } from "@/hooks/controle/use-tresorerie-data";
import { buildSyntheseData } from "@/lib/finance/aggregations/synthese";
import type { SyntheseData } from "@/lib/finance/aggregations/synthese";
import type { DataState } from "@/lib/types/data-state";

// ── Types (ré-exportés depuis la couche aggregation) ──────────────────────────

export type { SynthValue, SynthRow, SyntheseData } from "@/lib/finance/aggregations/synthese";

export type SyntheseDataState = DataState<SyntheseData>;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSyntheseData(dossierId: string): SyntheseDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);
  const { data: seuilData } = useSeuilRentabiliteData(dossierId);
  const { data: bfrData }   = useBfrData(dossierId);
  const { data: bilanData } = useBilanData(dossierId);
  const { data: tresoData } = useTresorerieData(dossierId);

  const result = useMemo<SyntheseData | null>(() => {
    if (!data || !fc || !seuilData || !bfrData || !bilanData) return null;

    return buildSyntheseData(
      fc,
      seuilData.rows,
      bfrData.rows,
      bilanData.rows,
      tresoData?.rows ?? [],
    );
  }, [data, fc, seuilData, bfrData, bilanData, tresoData]);

  return { data: result, status, error };
}
