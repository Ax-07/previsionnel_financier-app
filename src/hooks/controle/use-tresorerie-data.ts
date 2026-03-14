"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildMonthLabels, subSeries } from "@/lib/finance/calculs/monthly";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import { buildTemporelCtx } from "@/lib/finance/pipeline/calendar";
import {
  calcEncaissements,
  calcAchatsRaw,
  calcEncoursFournisseurs,
} from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { buildTresorerieRows } from "@/lib/finance/aggregations/tresorerie";
import type { TresorerieData } from "@/lib/finance/tresorerie-types";
import type { YearKey } from "@/lib/finance/utils";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

export type { TresorerieValue, TresorerieRowStyle, TresorerieRow, TresorerieData } from "@/lib/finance/tresorerie-types";

export interface TresorerieDataState {
  data: TresorerieData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

export function useTresorerieData(
  dossierId: string,
  moisPaiementSalairesOverride?: number,
): TresorerieDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<TresorerieData | null>(() => {
    if (!data || !fc) return null;

    const { dateDemarrage, scenario } = data;
    const effectiveMoisPaiement =
      moisPaiementSalairesOverride ?? scenario.parametres?.moisPaiementSalaires ?? 1;

    const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
    const isFranchise = regimeTVA === "FRANCHISE";

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

    const ctx = buildTemporelCtx(dateDemarrage, isFranchise);

    const enc = calcEncaissements(data, ctx);
    const dec = calcDecaissements(data, ctx, effectiveMoisPaiement, fc.isParAnnee);

    const variation = {
      y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
      y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
      y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
    };

    const y1Sol = computeSoldeMonthly(variation.y1, 0);
    const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
    const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

    const soldePrecedent = {
      y1: y1Sol.soldePrecedent,
      y2: y2Sol.soldePrecedent,
      y3: y3Sol.soldePrecedent,
    };
    const soldeFinal = {
      y1: y1Sol.soldeFinal,
      y2: y2Sol.soldeFinal,
      y3: y3Sol.soldeFinal,
    };

    const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
    const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);

    const rows = buildTresorerieRows({
      enc,
      dec,
      soldePrecedent,
      variation,
      soldeFinal,
      encoursFournisseurs,
      immosParNature: dec.immosParNature,
    });

    return { yearLabels, monthLabels, rows };
  }, [data, fc, moisPaiementSalairesOverride]);

  return { data: result, status, error };
}
