"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildMonthLabels } from "@/lib/finance/calculs/monthly";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import type { VATData } from "@/lib/finance/aggregations/tva";
import type { YearKey } from "@/lib/finance/utils";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export type { VATValue, VATRowStyle, VATRow, VATData } from "@/lib/finance/aggregations/tva";

export interface TvaDataState {
  data: VATData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useTvaData(dossierId: string): TvaDataState {
  const { data, status, error } = useFinCalc(dossierId);

  const result = useMemo<VATData | null>(() => {
    if (!data) return null;

    const { dateDemarrage, scenario } = data;
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

    const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
    const isFranchise = regimeTVA === "FRANCHISE";

    if (isFranchise) {
      return { yearLabels, monthLabels, rows: [], periodicite: "mensuel", isFranchise: true };
    }

    const periodicite = (
      (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
        ? "trimestriel"
        : "mensuel"
    ) as "mensuel" | "trimestriel";

    const rows = buildTVARows(data, periodicite);

    return { yearLabels, monthLabels, rows, periodicite, isFranchise };
  }, [data]);

  return { data: result, status, error };
}
