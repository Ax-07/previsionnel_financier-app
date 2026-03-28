"use client";

import { useMemo } from "react";
import { useFinCalc } from "@/hooks/use-fin-calc";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
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
import { buildPlanFinancementRows, type PfRow } from "@/lib/finance/aggregations/plan-financement";
import type { SigNode } from "@/lib/finance/aggregations/sig";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import type { BilanRow } from "@/lib/finance/aggregations/bilan";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import type { YearKey } from "@/lib/finance/utils";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type KpiCategory = "activite" | "rentabilite" | "cash" | "bfr" | "seuil" | "investissement" | "financement";
export type KpiFormat = "currency" | "percent" | "days" | "ratio" | "months";
export type KpiPositive = "up" | "down"; // "up" = hausse = positif, "down" = hausse = négatif

export interface KpiValue {
  /** Valeur brute */
  amount: number;
  /** % par rapport au CA (si applicable) */
  pctOfCa?: number | null;
  /** Variation % par rapport à l'exercice précédent (null pour y1) */
  trend?: number | null;
}

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
  resNet: number;
}

export interface MonthlyBarPoint {
  mois: string;
  ca: number;
  charges: number;
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

export interface PfChartPoint {
  periode: string;
  besoins: number;
  ressources: number;
  solde: number;
}

export interface DashboardChartData {
  tresorerie: Record<YearKey, TresoMonthPoint[]>;
  annuel: AnnuelBarPoint[];
  monthly: Record<YearKey, MonthlyBarPoint[]>;
  chargesBreakdown: ChargesBreakdownPoint[];
  seuil: SeuilBarPoint[];
  planFinancement: PfChartPoint[];
}

export interface KpiCard {
  key: string;
  label: string;
  sublabel?: string;
  category: KpiCategory;
  format: KpiFormat;
  /** Indique si une valeur haute est un signal positif */
  positive: KpiPositive;
  showPctOfCa: boolean;
  values: Record<YearKey, KpiValue>;
}

export interface KpiGroup {
  key: KpiCategory;
  label: string;
  cards: KpiCard[];
}

export interface DashboardKpiData {
  yearLabels: Record<YearKey, string>;
  groups: KpiGroup[];
  charts: DashboardChartData;
}

export interface DashboardKpiState {
  data: DashboardKpiData | null;
  status: ScenarioDataStatus;
  error: string | null;
}

// ── Helpers d'extraction ──────────────────────────────────────────────────────

function extractSigAmt(nodes: SigNode[], key: string): Record<YearKey, number> {
  const node = nodes.find((n) => n.key === key);
  if (!node) return { y1: 0, y2: 0, y3: 0 };
  return { y1: node.values.y1.amount, y2: node.values.y2.amount, y3: node.values.y3.amount };
}

function extractBreakEvenAmt(rows: BreakEvenRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return { y1: row.values.y1.amount, y2: row.values.y2.amount, y3: row.values.y3.amount };
}

function extractBfrAmt(rows: BfrRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return { y1: row.values.y1.amount, y2: row.values.y2.amount, y3: row.values.y3.amount };
}

function extractBilanAmt(rows: BilanRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return { y1: row.values.y1.amount, y2: row.values.y2.amount, y3: row.values.y3.amount };
}

function extractTresoAmt(rows: TresorerieRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return { y1: row.values.y1.total, y2: row.values.y2.total, y3: row.values.y3.total };
}

function extractPfAmt(rows: PfRow[], key: string): Record<"y0" | "y1" | "y2" | "y3", number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y0: 0, y1: 0, y2: 0, y3: 0 };
  return {
    y0: row.values.y0.amount,
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

/** Calcule la variation % entre deux valeurs (null si base = 0) */
function calcTrend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Construit un KpiCard à partir d'un tableau de montants annuels */
function buildCard(
  key: string,
  label: string,
  category: KpiCategory,
  format: KpiFormat,
  positive: KpiPositive,
  amounts: Record<YearKey, number>,
  caAmounts: Record<YearKey, number>,
  showPctOfCa: boolean,
  sublabel?: string,
): KpiCard {
  function pctOfCa(amt: number, ca: number): number | null {
    if (!showPctOfCa || ca === 0) return null;
    return (amt / ca) * 100;
  }
  return {
    key,
    label,
    sublabel,
    category,
    format,
    positive,
    showPctOfCa,
    values: {
      y1: { amount: amounts.y1, pctOfCa: pctOfCa(amounts.y1, caAmounts.y1), trend: null },
      y2: { amount: amounts.y2, pctOfCa: pctOfCa(amounts.y2, caAmounts.y2), trend: calcTrend(amounts.y2, amounts.y1) },
      y3: { amount: amounts.y3, pctOfCa: pctOfCa(amounts.y3, caAmounts.y3), trend: calcTrend(amounts.y3, amounts.y2) },
    },
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardKpiData(dossierId: string): DashboardKpiState {
  const { data, fc, status, error } = useFinCalc(dossierId);

  const result = useMemo<DashboardKpiData | null>(() => {
    if (!data || !fc) return null;

    // ── Calculs dépendants ─────────────────────────────────────────────────────
    const sigData = buildSigData(data, fc, data.isIS);
    const seuilData = calcSeuil(data, fc);
    const bfrData = buildBfrRows(data, fc);
    const bilanData = buildBilanRows(data, fc);

    const { dateDemarrage, scenario } = data;
    const effectiveMoisPaiement = scenario.parametres?.moisPaiementSalaires ?? 1;
    const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
    const isFranchise = regimeTVA === "FRANCHISE";

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

    const soldePrecedent = { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent };
    const soldeFinal = { y1: y1Sol.soldeFinal, y2: y2Sol.soldeFinal, y3: y3Sol.soldeFinal };
    const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
    const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);
    const tresoRows = buildTresorerieRows({
      enc, dec, soldePrecedent, variation, soldeFinal, encoursFournisseurs,
      immosParNature: dec.immosParNature,
    });

    // ── Extractions ────────────────────────────────────────────────────────────
    const ca = extractSigAmt(sigData.nodes, "ca");
    const margeGlobale = extractSigAmt(sigData.nodes, "marge_globale");
    const va = extractSigAmt(sigData.nodes, "va");
    const ebe = extractSigAmt(sigData.nodes, "ebe");
    const resExpl = extractSigAmt(sigData.nodes, "res_expl");
    const resCourant = extractSigAmt(sigData.nodes, "res_courant");
    const resNet = extractSigAmt(sigData.nodes, "res_net");
    const cafAmt = extractSigAmt(sigData.nodes, "caf");

    const seuilEco = extractBreakEvenAmt(seuilData.rows, "seuil_eco");
    const pointMort = extractBreakEvenAmt(seuilData.rows, "point_mort_eco");
    const tauxMargeCV = extractBreakEvenAmt(seuilData.rows, "taux_marge_cv");

    const capitauxPropres = extractBilanAmt(bilanData.rows, "capitaux_propres");
    const empruntsPassif = extractBilanAmt(bilanData.rows, "emprunts");
    const immoNette = extractBilanAmt(bilanData.rows, "immo_nette_total");

    const frAmt: Record<YearKey, number> = {
      y1: capitauxPropres.y1 + empruntsPassif.y1 - immoNette.y1,
      y2: capitauxPropres.y2 + empruntsPassif.y2 - immoNette.y2,
      y3: capitauxPropres.y3 + empruntsPassif.y3 - immoNette.y3,
    };

    const bfrAmt = extractBfrAmt(bfrData.rows, "bfr");

    const soldeAnnuelAmt: Record<YearKey, number> = {
      y1: frAmt.y1 - bfrAmt.y1,
      y2: frAmt.y2 - bfrAmt.y2,
      y3: frAmt.y3 - bfrAmt.y3,
    };

    const soldeMensuelAmt = extractTresoAmt(tresoRows, "tres-solde-final");

    // Autofinancement = CAF - remboursements emprunts
    const autofinAnce: Record<YearKey, number> = {
      y1: cafAmt.y1 - fc.capitalRembourse.y1,
      y2: cafAmt.y2 - fc.capitalRembourse.y2,
      y3: cafAmt.y3 - fc.capitalRembourse.y3,
    };

    // Croissance CA
    const croissanceCA: Record<YearKey, number> = {
      y1: 0,
      y2: ca.y1 !== 0 ? ((ca.y2 - ca.y1) / Math.abs(ca.y1)) * 100 : 0,
      y3: ca.y2 !== 0 ? ((ca.y3 - ca.y2) / Math.abs(ca.y2)) * 100 : 0,
    };

    // Runway (mois avant trésorerie nulle)
    function calcRunway(encSeries: number[], decSeries: number[], lastSolde: number): number {
      const avgBurn = decSeries.reduce((s, v, i) => s + v - (encSeries[i] ?? 0), 0) / 12;
      if (avgBurn <= 0) return 36; // génère du cash → runway infini
      return lastSolde > 0 ? lastSolde / avgBurn : 0;
    }
    const runwayAmt: Record<YearKey, number> = {
      y1: calcRunway(enc.totalEnc.y1, dec.totalDec.y1, soldeFinal.y1[11] ?? 0),
      y2: calcRunway(enc.totalEnc.y2, dec.totalDec.y2, soldeFinal.y2[11] ?? 0),
      y3: calcRunway(enc.totalEnc.y3, dec.totalDec.y3, soldeFinal.y3[11] ?? 0),
    };

    // ── Plan de financement & KPIs Investissements / Financement ─────────────
    const pfData = buildPlanFinancementRows(data, fc);
    const pfRows = pfData.rows;
    const pfTotalImmo = extractPfAmt(pfRows, "total_immo");
    const pfApportsCapital = extractPfAmt(pfRows, "apports_capital");
    const pfApportsCC = extractPfAmt(pfRows, "apports_cc");
    const pfNouveauxEmprunts = extractPfAmt(pfRows, "nouveaux_emprunts");
    const pfTotalBesoins = extractPfAmt(pfRows, "total_besoins");
    const pfTotalRessources = extractPfAmt(pfRows, "total_ressources");
    const pfSolde = extractPfAmt(pfRows, "solde_tresorerie");

    // KPI — Total investissements (acquisitions initiales y0 → incluses en N1)
    const totalImmoKpi: Record<YearKey, number> = {
      y1: pfTotalImmo.y0 + pfTotalImmo.y1,
      y2: pfTotalImmo.y2,
      y3: pfTotalImmo.y3,
    };

    // KPI — Apports en capital + comptes courants (y0 initial → inclus en N1)
    const apportsCapitalKpi: Record<YearKey, number> = {
      y1: pfApportsCapital.y0 + pfApportsCapital.y1 + pfApportsCC.y0 + pfApportsCC.y1,
      y2: pfApportsCapital.y2 + pfApportsCC.y2,
      y3: pfApportsCapital.y3 + pfApportsCC.y3,
    };

    // KPI — Nouveaux emprunts (y0 initial → inclus en N1)
    const nouveauxEmpruntsKpi: Record<YearKey, number> = {
      y1: pfNouveauxEmprunts.y0 + pfNouveauxEmprunts.y1,
      y2: pfNouveauxEmprunts.y2,
      y3: pfNouveauxEmprunts.y3,
    };

    // KPI — Taux d'endettement = emprunts passif / capitaux propres × 100 %
    const tauxEndettement: Record<YearKey, number> = {
      y1: capitauxPropres.y1 !== 0 ? (empruntsPassif.y1 / capitauxPropres.y1) * 100 : 0,
      y2: capitauxPropres.y2 !== 0 ? (empruntsPassif.y2 / capitauxPropres.y2) * 100 : 0,
      y3: capitauxPropres.y3 !== 0 ? (empruntsPassif.y3 / capitauxPropres.y3) * 100 : 0,
    };

    // KPI — Couverture CAF = CAF / remboursement capital
    // Les intérêts sont déjà déduits du résultat net (donc couverts par la CAF),
    // seul le remboursement en capital constitue la charge à couvrir.
    const couvertureCAF: Record<YearKey, number> = {
      y1: fc.capitalRembourse.y1 > 0 ? cafAmt.y1 / fc.capitalRembourse.y1 : 0,
      y2: fc.capitalRembourse.y2 > 0 ? cafAmt.y2 / fc.capitalRembourse.y2 : 0,
      y3: fc.capitalRembourse.y3 > 0 ? cafAmt.y3 / fc.capitalRembourse.y3 : 0,
    };

    // ── Construction des groupes ───────────────────────────────────────────────
    const ZERO: Record<YearKey, number> = { y1: 0, y2: 0, y3: 0 };

    const groups: KpiGroup[] = [
      {
        key: "activite",
        label: "Activité",
        cards: [
          buildCard("ca", "Chiffre d'affaires", "activite", "currency", "up", ca, ca, false),
          {
            key: "croissance_ca",
            label: "Croissance CA",
            category: "activite",
            format: "percent",
            positive: "up",
            showPctOfCa: false,
            values: {
              y1: { amount: croissanceCA.y1, trend: null },
              y2: { amount: croissanceCA.y2, trend: null },
              y3: { amount: croissanceCA.y3, trend: null },
            },
          },
          buildCard("marge_globale", "Marge brute", "activite", "currency", "up", margeGlobale, ca, true),
          buildCard("va", "Valeur ajoutée", "activite", "currency", "up", va, ca, true),
        ],
      },
      {
        key: "rentabilite",
        label: "Rentabilité",
        cards: [
          buildCard("ebe", "EBE / EBITDA", "rentabilite", "currency", "up", ebe, ca, true),
          buildCard("res_expl", "Résultat d'exploitation", "rentabilite", "currency", "up", resExpl, ca, true),
          buildCard("res_courant", "Résultat courant", "rentabilite", "currency", "up", resCourant, ca, true),
          buildCard("res_net", "Résultat net", "rentabilite", "currency", "up", resNet, ca, true),
        ],
      },
      {
        key: "cash",
        label: "Cash & Financement",
        cards: [
          buildCard("caf", "CAF", "cash", "currency", "up", cafAmt, ca, true, "Capacité d'autofinancement"),
          buildCard("autofinancement", "Autofinancement net", "cash", "currency", "up", autofinAnce, ZERO, false, "CAF − remboursements"),
          buildCard("tresorerie_mensuelle", "Trésorerie fin d'exercice", "cash", "currency", "up", soldeMensuelAmt, ZERO, false, "Solde mensuel M12"),
          buildCard("runway", "Autonomie de trésorerie", "cash", "months", "up", runwayAmt, ZERO, false, "Mois avant trésorerie nulle"),
        ],
      },
      {
        key: "bfr",
        label: "BFR & Trésorerie",
        cards: [
          buildCard("fr", "Fonds de roulement", "bfr", "currency", "up", frAmt, ZERO, false),
          buildCard("bfr", "Besoin en fonds de roulement", "bfr", "currency", "down", bfrAmt, ZERO, false),
          buildCard("solde_annuel", "Trésorerie nette", "bfr", "currency", "up", soldeAnnuelAmt, ZERO, false, "FR − BFR"),
        ],
      },
      {
        key: "seuil",
        label: "Seuil de rentabilité",
        cards: [
          buildCard("taux_marge_cv", "Taux marge sur CV", "seuil", "percent", "up", tauxMargeCV, ZERO, false),
          buildCard("seuil_eco", "CA seuil d'équilibre", "seuil", "currency", "down", seuilEco, ca, true),
          {
            key: "point_mort",
            label: "Point mort",
            sublabel: "Jours pour atteindre l'équilibre",
            category: "seuil",
            format: "days",
            positive: "down",
            showPctOfCa: false,
            values: {
              y1: { amount: pointMort.y1, trend: null },
              y2: { amount: pointMort.y2, trend: calcTrend(pointMort.y2, pointMort.y1) },
              y3: { amount: pointMort.y3, trend: calcTrend(pointMort.y3, pointMort.y2) },
            },
          },
        ],
      },
      {
        key: "investissement",
        label: "Investissements",
        cards: [
          buildCard("total_immo", "Total investissements", "investissement", "currency", "up", totalImmoKpi, ZERO, false, "Immo corpo + incorpo"),
          buildCard("dotations_amort", "Dotations amortissements", "investissement", "currency", "up", { y1: fc.dotationsAmort.y1, y2: fc.dotationsAmort.y2, y3: fc.dotationsAmort.y3 }, ZERO, false),
          buildCard("immo_nette", "Immobilisations nettes", "investissement", "currency", "up", immoNette, ZERO, false, "Bilan fin d'exercice"),
        ],
      },
      {
        key: "financement",
        label: "Financement",
        cards: [
          buildCard("apports_capital", "Apports en capital", "financement", "currency", "up", apportsCapitalKpi, ZERO, false, "Capital + comptes courants"),
          buildCard("nouveaux_emprunts", "Emprunts souscrits", "financement", "currency", "up", nouveauxEmpruntsKpi, ZERO, false),
          buildCard("capital_restant_du", "Capital restant dû", "financement", "currency", "down", empruntsPassif, ZERO, false, "Bilan fin d'exercice"),
          buildCard("taux_endettement", "Taux d'endettement", "financement", "percent", "down", tauxEndettement, ZERO, false, "Emprunts / Capitaux propres"),
          buildCard("couverture_caf", "Couverture CAF", "financement", "ratio", "up", couvertureCAF, ZERO, false, "CAF / Remboursement capital"),
        ],
      },
    ];

    // ── Données charts ─────────────────────────────────────────────────────────

    // Labels des mois en français
    const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    function monthLabel(moisDemarrage: number, idx: number): string {
      return MONTH_SHORT[(moisDemarrage - 1 + idx) % 12];
    }
    const moisDeb = fc.moisDebut ?? 1;

    // Chart 1 — Trésorerie mensuelle par exercice
    // Décaissements d'exploitation (hors immo, emprunts, TVA, IS) pour les colonnes CA/Charges
    const decExpl = {
      y1: Array.from({ length: 12 }, (_, i) =>
        (dec.decAchats.y1[i] ?? 0) + (dec.decChargesExt.y1[i] ?? 0) +
        (dec.decImpots.y1[i] ?? 0) + (dec.decPersonnel.y1[i] ?? 0),
      ),
      y2: Array.from({ length: 12 }, (_, i) =>
        (dec.decAchats.y2[i] ?? 0) + (dec.decChargesExt.y2[i] ?? 0) +
        (dec.decImpots.y2[i] ?? 0) + (dec.decPersonnel.y2[i] ?? 0),
      ),
      y3: Array.from({ length: 12 }, (_, i) =>
        (dec.decAchats.y3[i] ?? 0) + (dec.decChargesExt.y3[i] ?? 0) +
        (dec.decImpots.y3[i] ?? 0) + (dec.decPersonnel.y3[i] ?? 0),
      ),
    };
    const tresorerieCharts: Record<YearKey, TresoMonthPoint[]> = {
      y1: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(enc.totalEnc.y1[i] ?? 0),
        decaissements: Math.round(dec.totalDec.y1[i] ?? 0),
        solde: Math.round(soldeFinal.y1[i] ?? 0),
        ca: Math.round(enc.encProdVendue.y1[i] ?? 0),
        charges: Math.round(decExpl.y1[i]),
      })),
      y2: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(enc.totalEnc.y2[i] ?? 0),
        decaissements: Math.round(dec.totalDec.y2[i] ?? 0),
        solde: Math.round(soldeFinal.y2[i] ?? 0),
        ca: Math.round(enc.encProdVendue.y2[i] ?? 0),
        charges: Math.round(decExpl.y2[i]),
      })),
      y3: Array.from({ length: 12 }, (_, i) => ({
        mois: monthLabel(moisDeb, i),
        encaissements: Math.round(enc.totalEnc.y3[i] ?? 0),
        decaissements: Math.round(dec.totalDec.y3[i] ?? 0),
        solde: Math.round(soldeFinal.y3[i] ?? 0),
        ca: Math.round(enc.encProdVendue.y3[i] ?? 0),
        charges: Math.round(decExpl.y3[i]),
      })),
    };

    // Chart 2 — CA vs Charges vs Résultat par exercice
    const yearKeys: YearKey[] = ["y1", "y2", "y3"];
    const annuelChart: AnnuelBarPoint[] = yearKeys.map((yk) => ({
      exercice: sigData.yearLabels[yk],
      ca: Math.round(ca[yk]),
      charges: Math.round(
        fc.achatsConsommes[yk] +
        fc.chargesExternes[yk] +
        fc.chargesPersonnel.total[yk] +
        fc.impotsTaxes[yk] +
        fc.dotationsAmort[yk] +
        fc.interetsEmprunts[yk],
      ),
      resNet: Math.round(resNet[yk]),
    }));

    // Chart 2b — Vue mensuelle (CA + Charges + Résultat mensuel approximatif)
    const monthlyChart: Record<YearKey, MonthlyBarPoint[]> = {
      y1: Array.from({ length: 12 }, (_, i) => {
        const caM = Math.round(enc.encProdVendue.y1[i] ?? 0);
        const chM = Math.round(decExpl.y1[i]);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: chM, resNet: caM - chM };
      }),
      y2: Array.from({ length: 12 }, (_, i) => {
        const caM = Math.round(enc.encProdVendue.y2[i] ?? 0);
        const chM = Math.round(decExpl.y2[i]);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: chM, resNet: caM - chM };
      }),
      y3: Array.from({ length: 12 }, (_, i) => {
        const caM = Math.round(enc.encProdVendue.y3[i] ?? 0);
        const chM = Math.round(decExpl.y3[i]);
        return { mois: monthLabel(moisDeb, i), ca: caM, charges: chM, resNet: caM - chM };
      }),
    };

    // Chart 3 — Répartition des charges par exercice
    const chargesBreakdownChart: ChargesBreakdownPoint[] = yearKeys.map((yk) => ({
      exercice: sigData.yearLabels[yk],
      achats: Math.round(fc.achatsConsommes[yk]),
      chargesExternes: Math.round(fc.chargesExternes[yk]),
      personnel: Math.round(fc.chargesPersonnel.total[yk]),
      impotsTaxes: Math.round(fc.impotsTaxes[yk]),
      amortissements: Math.round(fc.dotationsAmort[yk]),
      interets: Math.round(fc.interetsEmprunts[yk]),
    }));

    // Chart 4 — Seuil de rentabilité vs CA réalisé
    const seuilChart: SeuilBarPoint[] = yearKeys.map((yk) => {
      const caVal = Math.round(ca[yk]);
      const seuilVal = Math.round(seuilEco[yk]);
      return {
        exercice: sigData.yearLabels[yk],
        caRealise: caVal,
        seuilEco: seuilVal,
        excedent: caVal - seuilVal,
      };
    });

    // Chart 5 — Plan de financement : Besoins vs Ressources sur 4 périodes
    const PF_PERIODS: Array<{ key: "y0" | "y1" | "y2" | "y3"; label: string }> = [
      { key: "y0", label: pfData.yearLabels.y0 },
      { key: "y1", label: pfData.yearLabels.y1 },
      { key: "y2", label: pfData.yearLabels.y2 },
      { key: "y3", label: pfData.yearLabels.y3 },
    ];
    const planFinancementChart: PfChartPoint[] = PF_PERIODS.map(({ key, label }) => ({
      periode: label,
      besoins: Math.round(pfTotalBesoins[key]),
      ressources: Math.round(pfTotalRessources[key]),
      solde: Math.round(pfSolde[key]),
    }));

    const charts: DashboardChartData = {
      tresorerie: tresorerieCharts,
      annuel: annuelChart,
      monthly: monthlyChart,
      chargesBreakdown: chargesBreakdownChart,
      seuil: seuilChart,
      planFinancement: planFinancementChart,
    };

    return {
      yearLabels: sigData.yearLabels,
      groups,
      charts,
    };
  }, [data, fc]);

  return { data: result, status, error };
}
