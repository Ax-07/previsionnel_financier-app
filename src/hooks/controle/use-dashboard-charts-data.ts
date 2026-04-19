"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { useTresorerieData } from "@/hooks/controle/use-tresorerie-data";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { usePlanFinancementData } from "@/hooks/controle/use-plan-financement-data";
import type { PfChartPoint } from "@/hooks/controle/use-plan-financement-data";
import type { YearKey } from "@/lib/finance/utils";
import type { DataState } from "@/lib/types/data-state";
import {
  extractBreakEvenAmt,
  extractTresoMonthly,
} from "@/lib/finance/aggregations/helpers/extract";

// ── Types charts ──────────────────────────────────────────────────────────────

export interface TresoMonthPoint {
  mois: string;
  encaissements: number;
  decaissements: number;
  solde: number;
  /** CA mensuel (encaissements prod vendue TTC) */
  ca: number;
  /** Charges d'exploitation mensuelles décaissées */
  charges: number;
}

export interface AnnuelBarPoint {
  exercice: string;
  ca: number;
  charges: number;
  ebe: number;
  resNet: number;
}

export interface MonthlyBarPoint {
  mois: string;
  ca: number;
  charges: number;
  ebe: number;
  resNet: number;
}

export interface ChargesBreakdownPoint {
  exercice: string;
  achats: number;
  chargesExternes: number;
  personnel: number;
  impotsTaxes: number;
  amortissements: number;
  interets: number;
}

export interface SeuilBarPoint {
  exercice: string;
  caRealise: number;
  seuilEco: number;
  excedent: number;
}

export type { PfChartPoint } from "@/hooks/controle/use-plan-financement-data";

export interface DashboardChartData {
  tresorerie: Record<YearKey, TresoMonthPoint[]>;
  annuel: AnnuelBarPoint[];
  monthly: Record<YearKey, MonthlyBarPoint[]>;
  chargesBreakdown: ChargesBreakdownPoint[];
  seuil: SeuilBarPoint[];
  planFinancement: PfChartPoint[];
}

export type DashboardChartsState = DataState<DashboardChartData>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
function monthLabel(moisDemarrage: number, idx: number): string {
  return MONTH_SHORT[(((moisDemarrage + idx) % 12) + 12) % 12] ?? "";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardChartsData(dossierId: string): DashboardChartsState {
  const { fc, status, error } = useFinCalc(dossierId);
  const { data: tresoData } = useTresorerieData(dossierId);
  const { data: seuilData } = useSeuilRentabiliteData(dossierId);
  const { chartPoints: planFinancement } = usePlanFinancementData(dossierId);

  const result = useMemo<DashboardChartData | null>(() => {
    if (!fc || !tresoData || !seuilData || !planFinancement) return null;

    const moisDeb  = fc.moisDebut ?? 0;
    const yearKeys: YearKey[] = ["y1", "y2", "y3"];

    // ── Valeurs depuis FinCalcResult (source unique de vérité) ────────────────
    const ca       = fc.ca;
    const ebe      = fc.ebe;
    const resNet   = fc.resNet;
    const seuilEco = extractBreakEvenAmt(seuilData.rows, "seuil_eco");

    // ── Séries mensuelles ─────────────────────────────────────────────────────
    const totalEncMonthly  = extractTresoMonthly(tresoData.rows, "enc-total");
    const totalDecMonthly  = extractTresoMonthly(tresoData.rows, "dec-total");
    const encProdVendue    = extractTresoMonthly(tresoData.rows, "enc-ca");
    const soldeFinalMth    = extractTresoMonthly(tresoData.rows, "tres-solde-final");
    const decAchatsMth     = extractTresoMonthly(tresoData.rows, "dec-achats");
    const decChargesExtMth = extractTresoMonthly(tresoData.rows, "dec-charges-ext");
    const decImpotsMth     = extractTresoMonthly(tresoData.rows, "dec-impots");
    const decPersonnelMth  = extractTresoMonthly(tresoData.rows, "dec-personnel");

    // Décaissements d'exploitation (hors immo, emprunts, TVA, IS)
    const decExpl = {
      y1: Array.from({ length: 12 }, (_, i) =>
        (decAchatsMth.y1[i] ?? 0) + (decChargesExtMth.y1[i] ?? 0) +
        (decImpotsMth.y1[i] ?? 0) + (decPersonnelMth.y1[i] ?? 0),
      ),
      y2: Array.from({ length: 12 }, (_, i) =>
        (decAchatsMth.y2[i] ?? 0) + (decChargesExtMth.y2[i] ?? 0) +
        (decImpotsMth.y2[i] ?? 0) + (decPersonnelMth.y2[i] ?? 0),
      ),
      y3: Array.from({ length: 12 }, (_, i) =>
        (decAchatsMth.y3[i] ?? 0) + (decChargesExtMth.y3[i] ?? 0) +
        (decImpotsMth.y3[i] ?? 0) + (decPersonnelMth.y3[i] ?? 0),
      ),
    };

    // Chart 1 — Trésorerie mensuelle par exercice
    const tresorerie: Record<YearKey, TresoMonthPoint[]> = {
      y1: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(totalEncMonthly.y1[i] ?? 0),
        decaissements: Math.round(totalDecMonthly.y1[i] ?? 0),
        solde: Math.round(soldeFinalMth.y1[i] ?? 0),
        ca: Math.round(encProdVendue.y1[i] ?? 0),
        charges: Math.round(decExpl.y1[i]),
      })),
      y2: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(totalEncMonthly.y2[i] ?? 0),
        decaissements: Math.round(totalDecMonthly.y2[i] ?? 0),
        solde: Math.round(soldeFinalMth.y2[i] ?? 0),
        ca: Math.round(encProdVendue.y2[i] ?? 0),
        charges: Math.round(decExpl.y2[i]),
      })),
      y3: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(totalEncMonthly.y3[i] ?? 0),
        decaissements: Math.round(totalDecMonthly.y3[i] ?? 0),
        solde: Math.round(soldeFinalMth.y3[i] ?? 0),
        ca: Math.round(encProdVendue.y3[i] ?? 0),
        charges: Math.round(decExpl.y3[i]),
      })),
    };

    // Chart 2 — CA vs Charges vs EBE vs Résultat annuel
    const annuel: AnnuelBarPoint[] = yearKeys.map((yk) => ({
      exercice: fc.yearLabels[yk],
      ca: Math.round(ca[yk]),
      charges: Math.round(
        fc.achatsConsommes[yk] +
        fc.chargesExternes[yk] +
        fc.chargesPersonnel.total[yk] +
        fc.impotsTaxes[yk] +
        fc.dotationsAmort[yk] +
        fc.interetsEmprunts[yk],
      ),
      ebe: Math.round(ebe[yk]),
      resNet: Math.round(resNet[yk]),
    }));

    // Chart 2b — Vue mensuelle (CA + Charges + EBE + Résultat mensuel)
    // Toutes les valeurs proviennent des séries mensuelles du moteur (HT, comptable).
    // ca    = CA HT réel du mois (avec saisonnalité)
    // charges = ca - ebe (charges d'exploitation opérationnelles avant amortissements)
    // ebe   = EBE mensuel exact (saisonnalité, charges personnel réelles)
    // resNet = résultat net mensuel exact (IS réel — passe 2 du moteur double-passe)
    const monthly: Record<YearKey, MonthlyBarPoint[]> = {
      y1: Array.from({ length: 12 }, (_, i) => {
        const caM  = Math.round(fc.caSeries.y1[i] ?? 0);
        const ebeM = Math.round(fc.ebeSeries.y1[i] ?? 0);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: caM - ebeM, ebe: ebeM, resNet: Math.round(fc.resNetSeries.y1[i] ?? 0) };
      }),
      y2: Array.from({ length: 12 }, (_, i) => {
        const caM  = Math.round(fc.caSeries.y2[i] ?? 0);
        const ebeM = Math.round(fc.ebeSeries.y2[i] ?? 0);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: caM - ebeM, ebe: ebeM, resNet: Math.round(fc.resNetSeries.y2[i] ?? 0) };
      }),
      y3: Array.from({ length: 12 }, (_, i) => {
        const caM  = Math.round(fc.caSeries.y3[i] ?? 0);
        const ebeM = Math.round(fc.ebeSeries.y3[i] ?? 0);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: caM - ebeM, ebe: ebeM, resNet: Math.round(fc.resNetSeries.y3[i] ?? 0) };
      }),
    };

    // Chart 3 — Répartition des charges par exercice
    const chargesBreakdown: ChargesBreakdownPoint[] = yearKeys.map((yk) => ({
      exercice: fc.yearLabels[yk],
      achats: Math.round(fc.achatsConsommes[yk]),
      chargesExternes: Math.round(fc.chargesExternes[yk]),
      personnel: Math.round(fc.chargesPersonnel.total[yk]),
      impotsTaxes: Math.round(fc.impotsTaxes[yk]),
      amortissements: Math.round(fc.dotationsAmort[yk]),
      interets: Math.round(fc.interetsEmprunts[yk]),
    }));

    // Chart 4 — Seuil de rentabilité vs CA réalisé
    const seuil: SeuilBarPoint[] = yearKeys.map((yk) => {
      const caVal    = Math.round(ca[yk]);
      const seuilVal = Math.round(seuilEco[yk]);
      return {
        exercice: fc.yearLabels[yk],
        caRealise: caVal,
        seuilEco: seuilVal,
        excedent: caVal - seuilVal,
      };
    });

    return { tresorerie, annuel, monthly, chargesBreakdown, seuil, planFinancement };
  }, [fc, tresoData, seuilData, planFinancement]);

  return { data: result, status, error };
}
