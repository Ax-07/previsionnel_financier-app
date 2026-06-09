"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { subSeries } from "@/lib/finance/calculs/monthly";
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
import type { DataState } from "@/lib/types/data-state";

export type { TresorerieValue, TresorerieRowStyle, TresorerieRow, TresorerieData } from "@/lib/finance/tresorerie-types";

export type TresorerieDataState = DataState<TresorerieData>;

export function useTresorerieData(
  dossierId: string,
  moisPaiementSalairesOverride?: number,
): TresorerieDataState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<TresorerieData | null>(() => {
    if (!data || !fc) return null;

    const { scenario } = fc.filteredData;
    const calendar = fc.calendar;
    const effectiveMoisPaiement =
      moisPaiementSalairesOverride ?? scenario.parametres?.moisPaiementSalaires ?? 1;

    const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
    const isFranchise = regimeTVA === "FRANCHISE";

    const yearLabels: Record<YearKey, string> = fc.yearLabels;
    const monthLabels: Record<YearKey, string[]> = calendar.monthLabels;

    const ctx = buildTemporelCtx(calendar, isFranchise);

    const enc = calcEncaissements(fc.filteredData, ctx);
    const dec = calcDecaissements(fc.filteredData, ctx, effectiveMoisPaiement, fc.isParAnnee, fc.tva);

    const variation = {
      y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
      y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
      y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
    };

    const y1Sol = computeSoldeMonthly(variation.y1, 0);
    const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[y1Sol.soldeFinal.length - 1] ?? 0);
    const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[y2Sol.soldeFinal.length - 1] ?? 0);

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

    const decAchatsRaw = calcAchatsRaw(fc.filteredData.activites, isFranchise, ctx.dureesMois);
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
