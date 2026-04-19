"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { useBfrData } from "@/hooks/controle/use-bfr-data";
import { useBilanData } from "@/hooks/controle/use-bilan-data";
import { usePlanFinancementData } from "@/hooks/controle/use-plan-financement-data";
import { useTresorerieData } from "@/hooks/controle/use-tresorerie-data";
import { useDashboardChartsData } from "@/hooks/controle/use-dashboard-charts-data";
import { buildDashboardKpiData } from "@/lib/finance/aggregations/dashboard-kpi";
import type { DashboardKpiData } from "@/lib/finance/aggregations/dashboard-kpi";
import type { DataState } from "@/lib/types/data-state";

// ── Types (ré-exportés depuis la couche aggregation) ──────────────────────────

export type {
  KpiCategory,
  KpiFormat,
  KpiPositive,
  KpiValue,
  KpiCard,
  KpiGroup,
  DashboardKpiData,
} from "@/lib/finance/aggregations/dashboard-kpi";

// ── Types charts (ré-exportés depuis use-dashboard-charts-data) ──────────────
export type {
  TresoMonthPoint,
  AnnuelBarPoint,
  MonthlyBarPoint,
  ChargesBreakdownPoint,
  SeuilBarPoint,
  PfChartPoint,
  DashboardChartData,
} from "@/hooks/controle/use-dashboard-charts-data";

export type DashboardKpiState = DataState<DashboardKpiData>;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardKpiData(dossierId: string): DashboardKpiState {
  const { data, fc, status, error } = useFinCalc(dossierId);
  const { data: seuilData } = useSeuilRentabiliteData(dossierId);
  const { data: bfrData }   = useBfrData(dossierId);
  const { data: bilanData } = useBilanData(dossierId);
  const { data: pfData }    = usePlanFinancementData(dossierId);
  const { data: tresoData }  = useTresorerieData(dossierId);
  const { data: chartsData } = useDashboardChartsData(dossierId);

  const result = useMemo<DashboardKpiData | null>(() => {
    if (!data || !fc || !seuilData || !bfrData || !bilanData || !pfData || !tresoData || !chartsData) return null;

    return buildDashboardKpiData(
      fc,
      seuilData.rows,
      bfrData.rows,
      bilanData.rows,
      pfData.rows,
      pfData.yearLabels.y0,
      tresoData.rows,
      chartsData,
    );
  }, [data, fc, seuilData, bfrData, bilanData, pfData, tresoData, chartsData]);

  return { data: result, status, error };
}
