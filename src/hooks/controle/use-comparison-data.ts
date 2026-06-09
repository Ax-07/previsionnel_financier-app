"use client";

import { useEffect, useMemo } from "react";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { buildFinCalc } from "@/lib/finance/calculs";
import type { DataStatus } from "@/lib/types/data-state";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { buildSyntheseData } from "@/lib/finance/aggregations/synthese";
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
import type { FinCalcResult } from "@/lib/finance/types/results";
import type { SyntheseData } from "@/lib/finance/aggregations/synthese";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import type { YearKey } from "@/lib/finance/utils";
import type { HypotheseType } from "@/lib/schemas/hypothese";

export type { SyntheseData } from "@/lib/finance/aggregations/synthese";

/**
 * Calcule les lignes de trésorerie à partir d'un `FinCalcResult` filtré.
 * Fonction pure extraite de `useTresorerieData` pour usage dans la comparaison.
 */
function buildTresoRows(fc: FinCalcResult): TresorerieRow[] {
  const d = fc.filteredData;
  const { scenario } = d;
  const calendar = fc.calendar;

  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";
  const effectiveMoisPaiement = scenario.parametres?.moisPaiementSalaires ?? 1;

  const ctx = buildTemporelCtx(calendar, isFranchise);
  const enc = calcEncaissements(d, ctx);
  const dec = calcDecaissements(d, ctx, effectiveMoisPaiement, fc.isParAnnee, fc.tva);

  const variation = {
    y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
    y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
    y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
  };

  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[y1Sol.soldeFinal.length - 1] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[y2Sol.soldeFinal.length - 1] ?? 0);

  const soldePrecedent = { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent };
  const soldeFinal     = { y1: y1Sol.soldeFinal,     y2: y2Sol.soldeFinal,     y3: y3Sol.soldeFinal     };

  const decAchatsRaw = calcAchatsRaw(d.activites, isFranchise, ctx.dureesMois);
  const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);

  return buildTresorerieRows({
    enc,
    dec,
    soldePrecedent,
    variation,
    soldeFinal,
    encoursFournisseurs,
    immosParNature: dec.immosParNature,
  });
}

/**
 * Calcule les `SyntheseData` pour une hypothèse donnée depuis les données brutes.
 */
function buildSyntheseForHypothese(
  data: Parameters<typeof buildFinCalc>[0],
  hyp: HypotheseType,
): SyntheseData {
  const fc = buildFinCalc(data, data.dateDemarrage, hyp);
  const d  = fc.filteredData;
  const seuilData  = calcSeuil(d, fc);
  const bfrData    = buildBfrRows(d, fc);
  const bilanData  = buildBilanRows(d, fc);
  const tresoRows  = buildTresoRows(fc);
  return buildSyntheseData(fc, seuilData.rows, bfrData.rows, bilanData.rows, tresoRows);
}

// ── Types publics ─────────────────────────────────────────────────────────────

export interface ComparisonSyntheseData {
  pessimiste: SyntheseData;
  realiste: SyntheseData;
  optimiste: SyntheseData;
  yearLabels: Record<YearKey, string>;
  dureeProjection: number;
}

export interface ComparisonDataState {
  data: ComparisonSyntheseData | null;
  status: DataStatus;
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de comparaison des 3 scénarios (Pessimiste / Réaliste / Optimiste).
 * Calcule une `SyntheseData` complète par hypothèse via les fonctions pures,
 * sans aucun appel réseau supplémentaire.
 *
 * @param dossierId - Identifiant du dossier
 * @returns Les 3 synthèses et métadonnées de calendrier, ou `null` si non chargé
 */
export function useComparisonData(
  dossierId: string,
): ComparisonDataState {
  const rawData = useScenarioDataStore((s) => s.cache[dossierId]?.data ?? null);
  const status  = useScenarioDataStore((s) => s.status[dossierId] ?? "idle");
  const error   = useScenarioDataStore((s) => s.errors[dossierId] ?? null);

  useEffect(() => {
    if (status === "idle") {
      useScenarioDataStore.getState().load(dossierId);
    }
  }, [dossierId, status]);

  const data = useMemo<ComparisonSyntheseData | null>(() => {
    if (!rawData) return null;

    const pessimiste = buildSyntheseForHypothese(rawData, "PESSIMISTE");
    const realiste   = buildSyntheseForHypothese(rawData, "REALISTE");
    const optimiste  = buildSyntheseForHypothese(rawData, "OPTIMISTE");

    const fcRef = buildFinCalc(rawData, rawData.dateDemarrage, "REALISTE");

    return {
      pessimiste,
      realiste,
      optimiste,
      yearLabels: fcRef.yearLabels,
      dureeProjection: fcRef.dureeProjection,
    };
  }, [rawData]);

  return { data, status, error };
}

// Ré-export pour les usages hérités
export type { FinCalcResult };
