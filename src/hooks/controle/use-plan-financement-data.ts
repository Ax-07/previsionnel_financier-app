"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import type { PfData, PfRow } from "@/lib/finance/aggregations/plan-financement";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export interface PfChartPoint {
  periode: string;
  // Besoins (détail)
  immoIncorpo: number;
  immoCorporo: number;
  bfr: number;
  remboursementCapital: number;
  // Ressources (détail)
  apports: number;
  emprunts: number;
  subventions: number;
  caf: number;
  // Totaux & solde
  besoins: number;
  ressources: number;
  solde: number;
}

export interface PlanFinancementDataState {
  data: PfData | null;
  chartPoints: PfChartPoint[];
  status: ScenarioDataStatus;
  error: string | null;
}

// ── Helper ────────────────────────────────────────────────────────────────

function extractPf(rows: PfRow[], key: string): Record<"y0" | "y1" | "y2" | "y3", number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y0: 0, y1: 0, y2: 0, y3: 0 };
  return {
    y0: row.values.y0.amount,
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────

export function usePlanFinancementData(dossierId: string): PlanFinancementDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const pfData = useMemo<PfData | null>(() => {
    if (!data || !fc) return null;
    return buildPlanFinancementRows(data, fc);
  }, [data, fc]);

  const chartPoints = useMemo<PfChartPoint[]>(() => {
    if (!pfData) return [];
    const rows = pfData.rows;
    const immoIncorpo      = extractPf(rows, "immo_incorporelles");
    const immoCorporo      = extractPf(rows, "immo_corporelles");
    const variationBfr     = extractPf(rows, "variation_bfr");
    const remboursementCap = extractPf(rows, "remboursement_capital");
    const apportsCapital   = extractPf(rows, "apports_capital");
    const apportsCC        = extractPf(rows, "apports_cc");
    const nouveauxEmprunts = extractPf(rows, "nouveaux_emprunts");
    const subventions      = extractPf(rows, "subventions_invest");
    const caf              = extractPf(rows, "caf");
    const totalBesoins     = extractPf(rows, "total_besoins");
    const totalRessources  = extractPf(rows, "total_ressources");
    const solde            = extractPf(rows, "solde_tresorerie");

    const periods: Array<{ key: "y0" | "y1" | "y2" | "y3"; label: string }> = [
      { key: "y0", label: pfData.yearLabels.y0 },
      { key: "y1", label: pfData.yearLabels.y1 },
      { key: "y2", label: pfData.yearLabels.y2 },
      { key: "y3", label: pfData.yearLabels.y3 },
    ];

    return periods.map(({ key, label }) => ({
      periode: label,
      immoIncorpo: Math.round(immoIncorpo[key]),
      immoCorporo: Math.round(immoCorporo[key]),
      bfr: Math.round(variationBfr[key]),
      remboursementCapital: Math.round(remboursementCap[key]),
      apports: Math.round(apportsCapital[key] + apportsCC[key]),
      emprunts: Math.round(nouveauxEmprunts[key]),
      subventions: Math.round(subventions[key]),
      caf: Math.round(caf[key]),
      besoins: Math.round(totalBesoins[key]),
      ressources: Math.round(totalRessources[key]),
      solde: Math.round(solde[key]),
    }));
  }, [pfData]);

  return { data: pfData, chartPoints, status, error };
}
