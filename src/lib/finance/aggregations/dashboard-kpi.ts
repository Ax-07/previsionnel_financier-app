/**
 * Couche d'agrégation pour l'onglet Dashboard KPI.
 *
 * Fonction pure : construit les groupes de KPI à partir de `FinCalcResult`
 * et des résultats d'agrégation des autres onglets (seuil, BFR, bilan, PF, trésorerie).
 *
 * Contrairement à l'ancienne implémentation qui extrayait les valeurs depuis
 * l'arbre SIG (avec des clés manquantes comme `"ca"`, `"marge_globale"`),
 * cette version utilise `fc` directement — source unique de vérité.
 *
 * @module aggregations/dashboard-kpi
 */

import type { FinCalcResult } from "@/lib/finance/types/results";
import type { YearKey } from "@/lib/finance/utils";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import type { BilanRow } from "@/lib/finance/aggregations/bilan";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import type { PfRow } from "@/lib/finance/aggregations/plan-financement";
import type { DashboardChartData } from "@/hooks/controle/use-dashboard-charts-data";
import {
  extractBreakEvenAmt,
  extractBfrAmt,
  extractBilanAmt,
  extractTresoAmt,
  extractTresoMonthly,
} from "@/lib/finance/aggregations/helpers/extract";

// ── Types ─────────────────────────────────────────────────────────────────────

export type KpiCategory = "activite" | "rentabilite" | "cash" | "bfr" | "seuil" | "investissement" | "financement";
export type KpiFormat = "currency" | "percent" | "days" | "ratio" | "months";
/** `"up"` = hausse = positif, `"down"` = hausse = négatif */
export type KpiPositive = "up" | "down";

export interface KpiValue {
  /** Valeur brute */
  amount: number;
  /** % par rapport au CA (si applicable) */
  pctOfCa?: number | null;
  /** Variation % par rapport à l'exercice précédent (null pour y1) */
  trend?: number | null;
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
  /** Valeur de la période initiale (y0 / démarrage), si pertinente */
  y0value?: KpiValue;
}

export interface KpiGroup {
  key: KpiCategory;
  label: string;
  cards: KpiCard[];
}

export interface DashboardKpiData {
  yearLabels: Record<YearKey, string>;
  y0Label: string;
  groups: KpiGroup[];
  charts: DashboardChartData;
}

// ── Helpers internes ──────────────────────────────────────────────────────────

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

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Construit les données du dashboard KPI.
 *
 * @param fc            Résultat du moteur de calcul (source unique de vérité)
 * @param seuilRows     Lignes du seuil de rentabilité
 * @param bfrRows       Lignes du BFR
 * @param bilanRows     Lignes du bilan
 * @param pfRows        Lignes du plan de financement
 * @param pfYearLabels  Labels des exercices du plan de financement (avec y0)
 * @param tresoRows     Lignes de trésorerie
 * @param chartsData    Données des graphiques (pré-calculées)
 */
export function buildDashboardKpiData(
  fc: FinCalcResult,
  seuilRows: BreakEvenRow[],
  bfrRows: BfrRow[],
  bilanRows: BilanRow[],
  pfRows: PfRow[],
  pfY0Label: string,
  tresoRows: TresorerieRow[],
  chartsData: DashboardChartData,
): DashboardKpiData {
  // ── Valeurs depuis FinCalcResult (source unique de vérité) ─────────────────
  const ca = fc.ca;
  const margeGlobale = fc.margeProd;
  const va = fc.valeurAjoutee;
  const ebe = fc.ebe;
  const resExpl = fc.resExpl;
  const resCourant = fc.resCourant;
  const resNet = fc.resNet;
  const cafAmt = fc.caf;

  // ── Séries mensuelles pour le calcul du runway ────────────────────────────
  const totalEncMonthly = extractTresoMonthly(tresoRows, "enc-total");
  const totalDecMonthly = extractTresoMonthly(tresoRows, "dec-total");
  const soldeFinal      = extractTresoMonthly(tresoRows, "tres-solde-final");

  // ── Seuil de rentabilité ───────────────────────────────────────────────────
  const seuilEco = extractBreakEvenAmt(seuilRows, "seuil_eco");
  const pointMort = extractBreakEvenAmt(seuilRows, "point_mort_eco");
  const tauxMargeCV = extractBreakEvenAmt(seuilRows, "taux_marge_cv");

  // ── Bilan ──────────────────────────────────────────────────────────────────
  const capitauxPropres = extractBilanAmt(bilanRows, "capitaux_propres");
  const empruntsPassif = extractBilanAmt(bilanRows, "emprunts");
  const immoNette = extractBilanAmt(bilanRows, "immo_nette_total");

  const frAmt: Record<YearKey, number> = {
    y1: capitauxPropres.y1 + empruntsPassif.y1 - immoNette.y1,
    y2: capitauxPropres.y2 + empruntsPassif.y2 - immoNette.y2,
    y3: capitauxPropres.y3 + empruntsPassif.y3 - immoNette.y3,
  };

  const bfrAmt = extractBfrAmt(bfrRows, "bfr");

  const soldeAnnuelAmt: Record<YearKey, number> = {
    y1: frAmt.y1 - bfrAmt.y1,
    y2: frAmt.y2 - bfrAmt.y2,
    y3: frAmt.y3 - bfrAmt.y3,
  };

  const soldeMensuelAmt = extractTresoAmt(tresoRows, "tres-solde-final");

  // Autofinancement = CAF − remboursements emprunts
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
    y1: calcRunway(totalEncMonthly.y1, totalDecMonthly.y1, soldeFinal.y1[11] ?? 0),
    y2: calcRunway(totalEncMonthly.y2, totalDecMonthly.y2, soldeFinal.y2[11] ?? 0),
    y3: calcRunway(totalEncMonthly.y3, totalDecMonthly.y3, soldeFinal.y3[11] ?? 0),
  };

  // ── Plan de financement & KPIs Investissements / Financement ──────────────
  const pfTotalImmo = extractPfAmt(pfRows, "total_immo");
  const pfApportsCapital = extractPfAmt(pfRows, "apports_capital");
  const pfApportsCC = extractPfAmt(pfRows, "apports_cc");
  const pfNouveauxEmprunts = extractPfAmt(pfRows, "nouveaux_emprunts");
  const pfTotalBesoins = extractPfAmt(pfRows, "total_besoins");
  const pfTotalRessources = extractPfAmt(pfRows, "total_ressources");
  const pfVariationBfr = extractPfAmt(pfRows, "variation_bfr");
  const pfRemboursementCapital = extractPfAmt(pfRows, "remboursement_capital");
  const pfCaf = extractPfAmt(pfRows, "caf");

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

  // KPI — Besoin total de financement (y0 initial → inclus en N1)
  const totalBesoinsKpi: Record<YearKey, number> = {
    y1: pfTotalBesoins.y0 + pfTotalBesoins.y1,
    y2: pfTotalBesoins.y2,
    y3: pfTotalBesoins.y3,
  };

  // KPI — Total ressources (y0 initial → inclus en N1)
  const totalRessourcesKpi: Record<YearKey, number> = {
    y1: pfTotalRessources.y0 + pfTotalRessources.y1,
    y2: pfTotalRessources.y2,
    y3: pfTotalRessources.y3,
  };

  // KPI — Couverture des besoins initiaux (snapshot y0 uniquement)
  const totalBesoinsInitialKpi: Record<YearKey, number> = {
    y1: pfTotalBesoins.y0,
    y2: pfTotalBesoins.y0,
    y3: pfTotalBesoins.y0,
  };
  const totalRessourcesInitialKpi: Record<YearKey, number> = {
    y1: pfTotalRessources.y0,
    y2: pfTotalRessources.y0,
    y3: pfTotalRessources.y0,
  };

  // KPI — Taux d'endettement = emprunts passif / capitaux propres × 100 %
  const tauxEndettement: Record<YearKey, number> = {
    y1: capitauxPropres.y1 !== 0 ? (empruntsPassif.y1 / capitauxPropres.y1) * 100 : 0,
    y2: capitauxPropres.y2 !== 0 ? (empruntsPassif.y2 / capitauxPropres.y2) * 100 : 0,
    y3: capitauxPropres.y3 !== 0 ? (empruntsPassif.y3 / capitauxPropres.y3) * 100 : 0,
  };

  // KPI — Couverture CAF = CAF / remboursement capital
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
        { ...buildCard("caf", "CAF", "cash", "currency", "up", cafAmt, ca, true, "Capacité d'autofinancement"), y0value: { amount: pfCaf.y0, trend: null } },
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
        { ...buildCard("bfr", "Besoin en fonds de roulement", "bfr", "currency", "down", bfrAmt, ZERO, false), y0value: { amount: pfVariationBfr.y0, trend: null } },
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
        { ...buildCard("total_immo", "Total investissements", "investissement", "currency", "up", totalImmoKpi, ZERO, false, "Immo corpo + incorpo"), y0value: { amount: pfTotalImmo.y0, trend: null } },
        buildCard("dotations_amort", "Dotations amortissements", "investissement", "currency", "up", { y1: fc.dotationsAmort.y1, y2: fc.dotationsAmort.y2, y3: fc.dotationsAmort.y3 }, ZERO, false),
        buildCard("immo_nette", "Immobilisations nettes", "investissement", "currency", "up", immoNette, ZERO, false, "Bilan fin d'exercice"),
      ],
    },
    {
      key: "financement",
      label: "Financement",
      cards: [
        { ...buildCard("apports_capital", "Apports en capital", "financement", "currency", "up", apportsCapitalKpi, ZERO, false, "Capital + comptes courants"), y0value: { amount: pfApportsCapital.y0 + pfApportsCC.y0, trend: null } },
        { ...buildCard("nouveaux_emprunts", "Emprunts souscrits", "financement", "currency", "up", nouveauxEmpruntsKpi, ZERO, false), y0value: { amount: pfNouveauxEmprunts.y0, trend: null } },
        { ...buildCard("total_besoins", "Total besoins", "financement", "currency", "up", totalBesoinsKpi, ZERO, false, "Investissements + BFR"), y0value: { amount: pfTotalBesoins.y0, trend: null } },
        { ...buildCard("total_ressources", "Total ressources", "financement", "currency", "up", totalRessourcesKpi, ZERO, false, "Apports + emprunts + CAF"), y0value: { amount: pfTotalRessources.y0, trend: null } },
        buildCard("total_besoins_initial", "Besoins initiaux (y0)", "financement", "currency", "up", totalBesoinsInitialKpi, ZERO, false, "Snapshot démarrage"),
        buildCard("total_ressources_initial", "Ressources initiales (y0)", "financement", "currency", "up", totalRessourcesInitialKpi, ZERO, false, "Snapshot démarrage"),
        buildCard("mensualite_emprunt", "Mensualité emprunt", "financement", "currency", "down", { y1: Math.round((fc.capitalRembourse.y1 + fc.interetsEmprunts.y1) / 12), y2: Math.round((fc.capitalRembourse.y2 + fc.interetsEmprunts.y2) / 12), y3: Math.round((fc.capitalRembourse.y3 + fc.interetsEmprunts.y3) / 12) }, ZERO, false, "Capital + intérêts / 12"),
        buildCard("capital_restant_du", "Capital restant dû", "financement", "currency", "down", empruntsPassif, ZERO, false, "Bilan fin d'exercice"),
        buildCard("capitaux_propres", "Capitaux propres", "financement", "currency", "up", capitauxPropres, ZERO, false, "Bilan fin d'exercice"),
        { ...buildCard("remboursement_capital", "Remboursement capital", "financement", "currency", "down", { y1: fc.capitalRembourse.y1, y2: fc.capitalRembourse.y2, y3: fc.capitalRembourse.y3 }, ZERO, false, "Annuel"), y0value: { amount: pfRemboursementCapital.y0, trend: null } },
        buildCard("taux_endettement", "Taux d'endettement", "financement", "percent", "down", tauxEndettement, ZERO, false, "Emprunts / Capitaux propres"),
        buildCard("couverture_caf", "Couverture CAF", "financement", "ratio", "up", couvertureCAF, ZERO, false, "CAF / Remboursement capital"),
      ],
    },
  ];

  return {
    yearLabels: fc.yearLabels,
    y0Label: pfY0Label,
    groups,
    charts: chartsData,
  };
}
