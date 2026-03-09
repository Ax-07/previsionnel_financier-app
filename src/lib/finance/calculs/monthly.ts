/**
 * Calculs mensuels (source unique de vérité)
 *
 * `buildMonthlyCalc(data, dateDemarrage)` distribue chaque poste financier
 * sur 12 mois × 3 exercices.
 *
 * Règles de répartition :
 *  - CA / Achats   → saisonnaliteCA / saisonnaliteAchats (JSON % par mois)
 *                    ou répartition uniforme si absente
 *  - ChargeExpl.   → frequence (MENSUELLE / TRIMESTRIELLE / ANNUELLE) + moisPaiement
 *  - Emprunts      → tableau d'échéancier (mois exact)
 *  - Amortissements→ dotationAnnuelle ÷ 12 par exercice (pFin/pDeb appliqués)
 *  - Autres postes → répartition uniforme ÷ 12
 *
 * `buildFinCalc` importe ce module et somme les séries pour ses YearAcc.
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MonthlySeries = number[]; // longueur 12
export type MonthlyAcc = Record<YearKey, MonthlySeries>;

// ── Helpers de séries mensuelles (source unique de vérité) ───────────────────

export const FR_MONTHS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
] as const;

export function zeroSeries(): MonthlySeries {
  return Array(12).fill(0) as MonthlySeries;
}

export function sumSeries(a: MonthlySeries, b: MonthlySeries): MonthlySeries {
  return a.map((v, i) => v + (b[i] ?? 0));
}

export function subSeries(a: MonthlySeries, b: MonthlySeries): MonthlySeries {
  return a.map((v, i) => v - (b[i] ?? 0));
}

export function sumAll(...series: MonthlySeries[]): MonthlySeries {
  return series.reduce((acc, s) => sumSeries(acc, s), zeroSeries());
}

export function totalOf(s: MonthlySeries): number {
  return s.reduce((acc, v) => acc + v, 0);
}

/** Répartition uniforme d'un total annuel sur 12 mois. */
export function uniformMonthly(total: number): MonthlySeries {
  const v = total / 12;
  return Array(12).fill(v) as MonthlySeries;
}

/** Alias interne non exporté pour la compatibilité avec buildMonthlyCalc. */
const uniform = uniformMonthly;

/** Construit les labels de mois (ex: "Jan 2026") pour les 12 mois d'un exercice. */
export function buildMonthLabels(startMonth: number, startYear: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    return `${FR_MONTHS[m]} ${y}`;
  });
}

/** Somme les séries de chaque exercice pour obtenir un YearAcc. */
export function monthlyToYearAcc(m: MonthlyAcc): Record<YearKey, number> {
  return { y1: totalOf(m.y1), y2: totalOf(m.y2), y3: totalOf(m.y3) };
}

/**
 * Répartit un total annuel selon la saisonnalité JSON { N: number[], N1: number[], N2: number[] }
 * (pourcentages mensuels), ou uniformément si absente/incomplète.
 */
export function seasonalMonthly(
  total: number,
  saisonnalite: unknown,
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  if (saisonnalite && typeof saisonnalite === "object") {
    const rec = saisonnalite as Record<string, unknown>;
    const pcts = rec[yearKey];
    if (Array.isArray(pcts) && pcts.length >= 12) {
      return (pcts as number[]).slice(0, 12).map((p) => (total * p) / 100);
    }
  }
  return uniform(total);
}

/** Alias interne pour la compatibilité avec buildMonthlyCalc. */
const withSaisonnalite = seasonalMonthly;

/**
 * Convertit le JSON { N: number[], N1: number[], N2: number[] } des achats ponctuels
 * en MonthlySeries (montants bruts par mois, pas des pourcentages).
 * La longueur peut être < 12 si l'exercice est incomplet ; on complète avec 0.
 */
export function ponctuelMonthly(
  ponctuel: unknown,
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  if (ponctuel && typeof ponctuel === "object") {
    const rec = ponctuel as Record<string, unknown>;
    const vals = rec[yearKey];
    if (Array.isArray(vals) && vals.length > 0) {
      const series = zeroSeries();
      (vals as number[]).forEach((v, i) => {
        if (i < 12) series[i] = v;
      });
      return series;
    }
  }
  return zeroSeries();
}

/**
 * Distribue un total annuel selon la fréquence de paiement.
 *  - MENSUELLE    → ÷ 12
 *  - TRIMESTRIELLE→ 4 versements à partir du mois de paiement
 *  - ANNUELLE     → tout au mois de paiement
 */
export function distributeByFrequency(
  total: number,
  frequence: string | null | undefined,
  moisPaiement: number | null | undefined, // 1..12
): MonthlySeries {
  const series = zeroSeries();
  if (total === 0) return series;
  const freq = (frequence ?? "MENSUELLE").toUpperCase();
  const mois = moisPaiement ?? 1;
  switch (freq) {
    case "MENSUELLE":
      return uniform(total);
    case "TRIMESTRIELLE": {
      const quarter = total / 4;
      const starts = [mois - 1, mois + 2, mois + 5, mois + 8].map(
        (m) => ((m % 12) + 12) % 12,
      );
      for (const idx of starts) series[idx]! += quarter;
      return series;
    }
    case "ANNUELLE":
      series[(mois - 1 + 12) % 12] = total;
      return series;
    default:
      return uniform(total);
  }
}

/**
 * Distribue un montant de `ChargeExploitation` en respectant son mode de calcul :
 * - POURCENTAGE_CA → saisonnalité stockée dans `detailCalc.saisonnaliteCA`
 * - FIXE (défaut)  → `distributeByFrequency` selon la fréquence de paiement
 */
export function chargeExplMonthly(
  montant: number,
  row: {
    frequence?: string | null;
    moisPaiement?: number | null;
    detailCalc?: unknown;
  },
  yearKey: "N" | "N1" | "N2",
): MonthlySeries {
  const detail = row.detailCalc as Record<string, unknown> | null | undefined;
  if (detail?.modeCalc === "POURCENTAGE_CA") {
    return seasonalMonthly(montant, detail["saisonnaliteCA"], yearKey);
  }
  return distributeByFrequency(montant, row.frequence, row.moisPaiement);
}

/** Accumule les séries d'un tableau de lignes dans un MonthlyAcc. */
function addSeries(acc: MonthlyAcc, yk: YearKey, s: MonthlySeries): void {
  for (let i = 0; i < 12; i++) acc[yk][i]! += s[i] ?? 0;
}

// ── Résultat de buildMonthlyCalc ──────────────────────────────────────────────

export interface MonthlyCalcResult {
  // ── Méta ──────────────────────────────────────────────────────────────────
  anneeDebut: number;
  moisDebut: number;

  // ── CA & stocks ───────────────────────────────────────────────────────────
  ca: MonthlyAcc;
  /** Drill-down par activité */
  caByActivity: { libelle: string; series: MonthlyAcc }[];
  caByType: {
    productionVendue: MonthlyAcc;
    prestationServices: MonthlyAcc;
    ventesMarchandises: MonthlyAcc;
  };
  achatsEffectues: MonthlyAcc;
  /** Drill-down par activité */
  achatsByActivity: { libelle: string; series: MonthlyAcc }[];
  stockInitial: MonthlyAcc;
  /** Drill-down par activité */
  stockInitialByActivity: { libelle: string; series: MonthlyAcc }[];
  stockFinal: MonthlyAcc;
  /** Drill-down par activité */
  stockFinalByActivity: { libelle: string; series: MonthlyAcc }[];
  varStock: MonthlyAcc;
  /** Drill-down par activité */
  varStockByActivity: { libelle: string; series: MonthlyAcc }[];
  achatsConsommes: MonthlyAcc;

  // ── Charges d'exploitation ────────────────────────────────────────────────
  fournitures: MonthlyAcc;
  services: MonthlyAcc;
  chargesExternes: MonthlyAcc;
  impotsTaxes: MonthlyAcc;

  // ── Personnel ─────────────────────────────────────────────────────────────
  salairesBruts: MonthlyAcc;
  chargesPatronales: MonthlyAcc;
  remuDirigeant: MonthlyAcc;
  cotisationsTNS: MonthlyAcc;
  taxesSalaires: MonthlyAcc;
  chargesPersonnel: MonthlyAcc;

  // ── SIG ───────────────────────────────────────────────────────────────────
  margeGlobale: MonthlyAcc;
  chargesExtTotal: MonthlyAcc;
  valeurAjoutee: MonthlyAcc;
  subventions: MonthlyAcc;
  ebe: MonthlyAcc;

  // ── Amortissements & provisions ───────────────────────────────────────────
  dotationsAmort: MonthlyAcc;
  /** Drill-down par immo avec nature */
  dotationsParImmo: {
    immo: { id: string; libelle: string; nature: string };
    series: MonthlyAcc;
  }[];
  dotationsProvisions: MonthlyAcc;
  reprises: MonthlyAcc;

  // ── Autres produits / charges exploitation ────────────────────────────────
  commissionsTotal: MonthlyAcc;
  prodImmo: MonthlyAcc;
  transferts: MonthlyAcc;
  autresProdGestion: MonthlyAcc;
  autresChargesGestion: MonthlyAcc;

  // ── Résultat d'exploitation ───────────────────────────────────────────────
  resExpl: MonthlyAcc;

  // ── Financier ─────────────────────────────────────────────────────────────
  produitsFinanciers: MonthlyAcc;
  interetsEmprunts: MonthlyAcc;
  fraisDossierEmprunts: MonthlyAcc;
  autresChargesFinancieres: MonthlyAcc;
  chargesFinancieres: MonthlyAcc;
  resFin: MonthlyAcc;

  // ── Résultats ─────────────────────────────────────────────────────────────
  resCourant: MonthlyAcc;
  produitsExcep: MonthlyAcc;
  chargesExcep: MonthlyAcc;
  resExcep: MonthlyAcc;

  // ── IS (réparti uniformément depuis le calcul annuel) ─────────────────────
  isParAnnee: Record<YearKey, number>;
  isSeries: MonthlyAcc;

  // ── Résultat net & CAF ────────────────────────────────────────────────────
  resNet: MonthlyAcc;
  caf: MonthlyAcc;
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Construit toutes les séries mensuelles à partir des données brutes.
 *
 * @param data           – résultat de fetchScenarioData
 * @param dateDemarrage  – date de démarrage du premier exercice
 * @param isParAnnee     – IS calculé annuellement (depuis buildFinCalc / calcISParAnnee)
 */
export function buildMonthlyCalc(
  data: ScenarioFinData,
  dateDemarrage: Date,
  isParAnnee: Record<YearKey, number>,
): MonthlyCalcResult {
  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth(); // 0-based
  const pFin = moisDebut === 0 ? 0 : moisDebut / 12;

  // ── Helpers locaux ────────────────────────────────────────────────────────

  function emptyAcc(): MonthlyAcc {
    return { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  }

  /** Résout la YearKey d'une année civile en tenant compte du décalage fiscal. */
  function ykOfCivilYear(yr: number): YearKey | null {
    if (yr === anneeDebut) return "y1";
    if (yr === anneeDebut + 1) return "y2";
    if (yr === anneeDebut + 2) return "y3";
    return null;
  }

  /** Résout la YearKey + index mois (0-11) d'une date ISO/Date. */
  function ykAndMonthIdx(
    dateStr: string,
  ): { yk: YearKey; idx: number } | null {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-based
    // moisDebut: début de l'exercice au sein d'une année civile
    // Exercice y1 : [anneeDebut+moisDebut .. anneeDebut+1+moisDebut[
    for (let e = 0; e < 3; e++) {
      const startYear = anneeDebut + e;
      const startMonth = moisDebut;
      const absStart = startYear * 12 + startMonth;
      const absEnd = absStart + 12;
      const absDate = year * 12 + month;
      if (absDate >= absStart && absDate < absEnd) {
        const yk = (["y1", "y2", "y3"] as YearKey[])[e]!;
        return { yk, idx: absDate - absStart };
      }
    }
    return null;
  }

  // ── CA ────────────────────────────────────────────────────────────────────

  const caAcc = emptyAcc();
  const caByActivity: { libelle: string; series: MonthlyAcc }[] = [];
  const caByType = {
    productionVendue: emptyAcc(),
    prestationServices: emptyAcc(),
    ventesMarchandises: emptyAcc(),
  };

  for (const a of data.activites) {
    if (a.actif === false) continue;
    const actSeries: MonthlyAcc = {
      y1: withSaisonnalite(n(a.montantN), a.saisonnaliteCA, "N"),
      y2: withSaisonnalite(n(a.montantN1), a.saisonnaliteCA, "N1"),
      y3: withSaisonnalite(n(a.montantN2), a.saisonnaliteCA, "N2"),
    };
    addSeries(caAcc, "y1", actSeries.y1);
    addSeries(caAcc, "y2", actSeries.y2);
    addSeries(caAcc, "y3", actSeries.y3);
    caByActivity.push({ libelle: a.libelle, series: actSeries });

    const typeKey =
      a.typeActivite === "PRODUCTION_VENDUE"
        ? "productionVendue"
        : a.typeActivite === "PRESTATION_SERVICES"
          ? "prestationServices"
          : "ventesMarchandises";
    addSeries(caByType[typeKey], "y1", actSeries.y1);
    addSeries(caByType[typeKey], "y2", actSeries.y2);
    addSeries(caByType[typeKey], "y3", actSeries.y3);
  }

  // ── Achats & stocks ───────────────────────────────────────────────────────

  const achatsEffectuesAcc = emptyAcc();
  const achatsByActivity: { libelle: string; series: MonthlyAcc }[] = [];
  const stockByActivity: { libelle: string; sfY1: number; sfY2: number; sfY3: number }[] = [];

  let sfY1 = 0, sfY2 = 0, sfY3 = 0;
  for (const a of data.activites) {
    if (a.actif === false || a.typeActivite === "PRESTATION_SERVICES") continue;
    const taux = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const stocks = n(a.stocks ?? 0);
    const aN = n(a.montantN) * taux;
    const aN1 = n(a.montantN1) * taux;
    const aN2 = n(a.montantN2) * taux;
    const actSfY1 = (aN * stocks) / 365;
    const actSfY2 = (aN1 * stocks) / 365;
    const actSfY3 = (aN2 * stocks) / 365;
    sfY1 += actSfY1;
    sfY2 += actSfY2;
    sfY3 += actSfY3;
    if (actSfY1 !== 0 || actSfY2 !== 0 || actSfY3 !== 0) {
      stockByActivity.push({ libelle: a.libelle, sfY1: actSfY1, sfY2: actSfY2, sfY3: actSfY3 });
    }
    const actSeries: MonthlyAcc = {
      y1: withSaisonnalite(aN, a.saisonnaliteAchats, "N"),
      y2: withSaisonnalite(aN1, a.saisonnaliteAchats, "N1"),
      y3: withSaisonnalite(aN2, a.saisonnaliteAchats, "N2"),
    };
    addSeries(achatsEffectuesAcc, "y1", actSeries.y1);
    addSeries(achatsEffectuesAcc, "y2", actSeries.y2);
    addSeries(achatsEffectuesAcc, "y3", actSeries.y3);
    achatsByActivity.push({
      libelle: `Achats – ${a.libelle}`,
      series: actSeries,
    });

    // Achats de stock ponctuels (stock initial, réassorts) : montants bruts mensuels
    const ponctuelSeries: MonthlyAcc = {
      y1: ponctuelMonthly(a.achatsStockPonctuel, "N"),
      y2: ponctuelMonthly(a.achatsStockPonctuel, "N1"),
      y3: ponctuelMonthly(a.achatsStockPonctuel, "N2"),
    };
    const ponctuelTotal = totalOf(ponctuelSeries.y1) + totalOf(ponctuelSeries.y2) + totalOf(ponctuelSeries.y3);
    if (ponctuelTotal !== 0) {
      addSeries(achatsEffectuesAcc, "y1", ponctuelSeries.y1);
      addSeries(achatsEffectuesAcc, "y2", ponctuelSeries.y2);
      addSeries(achatsEffectuesAcc, "y3", ponctuelSeries.y3);
      achatsByActivity.push({
        libelle: `Achats ponctuels – ${a.libelle}`,
        series: ponctuelSeries,
      });
    }
  }

  const stockInitialByActivity = stockByActivity.map((s) => ({
    libelle: s.libelle,
    series: {
      y1: uniform(0),
      y2: uniform(s.sfY1),
      y3: uniform(s.sfY2),
    } as MonthlyAcc,
  }));
  const stockFinalByActivity = stockByActivity.map((s) => ({
    libelle: s.libelle,
    series: {
      y1: uniform(s.sfY1),
      y2: uniform(s.sfY2),
      y3: uniform(s.sfY3),
    } as MonthlyAcc,
  }));
  const varStockByActivity = stockByActivity.map((s) => ({
    libelle: s.libelle,
    series: {
      y1: uniform(s.sfY1 - 0),
      y2: uniform(s.sfY2 - s.sfY1),
      y3: uniform(s.sfY3 - s.sfY2),
    } as MonthlyAcc,
  }));

  const stockInitialAcc: MonthlyAcc = {
    y1: uniform(0),
    y2: uniform(sfY1),
    y3: uniform(sfY2),
  };
  const stockFinalAcc: MonthlyAcc = {
    y1: uniform(sfY1),
    y2: uniform(sfY2),
    y3: uniform(sfY3),
  };
  const varStockAcc: MonthlyAcc = {
    y1: stockFinalAcc.y1.map((v, i) => v - (stockInitialAcc.y1[i] ?? 0)),
    y2: stockFinalAcc.y2.map((v, i) => v - (stockInitialAcc.y2[i] ?? 0)),
    y3: stockFinalAcc.y3.map((v, i) => v - (stockInitialAcc.y3[i] ?? 0)),
  };
  // achatsConsommés = achatsEffectués + SI − SF (sur l'exercice complet)
  const totalAchatsEff = monthlyToYearAcc(achatsEffectuesAcc);
  const achatsConsommesAcc: MonthlyAcc = {
    y1: uniform(totalAchatsEff.y1 + 0 - sfY1),
    y2: uniform(totalAchatsEff.y2 + sfY1 - sfY2),
    y3: uniform(totalAchatsEff.y3 + sfY2 - sfY3),
  };

  // ── Marges ────────────────────────────────────────────────────────────────

  const margeGlobaleAcc: MonthlyAcc = {
    y1: caAcc.y1.map((v, i) => v - (achatsConsommesAcc.y1[i] ?? 0)),
    y2: caAcc.y2.map((v, i) => v - (achatsConsommesAcc.y2[i] ?? 0)),
    y3: caAcc.y3.map((v, i) => v - (achatsConsommesAcc.y3[i] ?? 0)),
  };

  // ── Charges d'exploitation ────────────────────────────────────────────────

  function chargesExplSeries(
    rows: {
      montantN: unknown;
      montantN1: unknown;
      montantN2: unknown;
      frequence?: string | null;
      moisPaiement?: number | null;
      actif?: boolean | null;
      detailCalc?: unknown;
    }[],
  ): MonthlyAcc {
    const acc = emptyAcc();
    for (const r of rows) {
      if (r.actif === false) continue;
      addSeries(acc, "y1", chargeExplMonthly(n(r.montantN), r, "N"));
      addSeries(acc, "y2", chargeExplMonthly(n(r.montantN1), r, "N1"));
      addSeries(acc, "y3", chargeExplMonthly(n(r.montantN2), r, "N2"));
    }
    return acc;
  }

  const fournituresAcc = chargesExplSeries(data.fournitures);
  const servicesAcc = chargesExplSeries(data.services);
  const chargesExternesAcc: MonthlyAcc = {
    y1: sumSeries(fournituresAcc.y1, servicesAcc.y1),
    y2: sumSeries(fournituresAcc.y2, servicesAcc.y2),
    y3: sumSeries(fournituresAcc.y3, servicesAcc.y3),
  };
  const impotsTaxesAcc = chargesExplSeries(data.impotsTaxes);

  // ── Personnel ─────────────────────────────────────────────────────────────

  function simpleUniform(
    rows: {
      montantN: unknown;
      montantN1: unknown;
      montantN2: unknown;
      actif?: boolean | null;
    }[],
  ): MonthlyAcc {
    const acc = emptyAcc();
    for (const r of rows) {
      if (r.actif === false) continue;
      addSeries(acc, "y1", uniform(n(r.montantN)));
      addSeries(acc, "y2", uniform(n(r.montantN1)));
      addSeries(acc, "y3", uniform(n(r.montantN2)));
    }
    return acc;
  }

  const salairesBrutsAcc = simpleUniform(data.salaries);
  const chargesPatronalesAcc: MonthlyAcc = (() => {
    const acc = emptyAcc();
    for (const r of data.salaries) {
      if (r.actif === false) continue;
      addSeries(acc, "y1", uniform(n(r.montantN) * (n(r.tauxCotPat) / 100)));
      addSeries(acc, "y2", uniform(n(r.montantN1) * (n(r.tauxCotPat) / 100)));
      addSeries(acc, "y3", uniform(n(r.montantN2) * (n(r.tauxCotPat) / 100)));
    }
    return acc;
  })();
  const remuDirigeantAcc = simpleUniform(data.dirigeants);
  const cotisationsTNSAcc = simpleUniform(data.cotisationsTNS);
  const taxesSalairesAcc = simpleUniform(data.taxesSalaires);

  const chargesPersonnelAcc: MonthlyAcc = {
    y1: zeroSeries(),
    y2: zeroSeries(),
    y3: zeroSeries(),
  };
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    for (let i = 0; i < 12; i++) {
      chargesPersonnelAcc[yk][i] =
        (salairesBrutsAcc[yk][i] ?? 0) +
        (chargesPatronalesAcc[yk][i] ?? 0) +
        (remuDirigeantAcc[yk][i] ?? 0) +
        (cotisationsTNSAcc[yk][i] ?? 0) +
        (taxesSalairesAcc[yk][i] ?? 0);
    }
  }

  // ── SIG ───────────────────────────────────────────────────────────────────

  const subventionsAcc = simpleUniform(data.subventionsExploitation);

  const valeurAjouteeAcc: MonthlyAcc = {
    y1: margeGlobaleAcc.y1.map(
      (v, i) => v - (chargesExternesAcc.y1[i] ?? 0),
    ),
    y2: margeGlobaleAcc.y2.map(
      (v, i) => v - (chargesExternesAcc.y2[i] ?? 0),
    ),
    y3: margeGlobaleAcc.y3.map(
      (v, i) => v - (chargesExternesAcc.y3[i] ?? 0),
    ),
  };

  const ebeAcc: MonthlyAcc = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    for (let i = 0; i < 12; i++) {
      ebeAcc[yk][i] =
        (valeurAjouteeAcc[yk][i] ?? 0) -
        (impotsTaxesAcc[yk][i] ?? 0) -
        (chargesPersonnelAcc[yk][i] ?? 0) +
        (subventionsAcc[yk][i] ?? 0);
    }
  }

  // ── Amortissements & provisions ───────────────────────────────────────────
  //
  // Quand moisDebut > 0, l'exercice y1 couvre la partie "fin" de l'année civile
  // anneeDebut (pFin = moisDebut/12 de l'exercice y1) ET la partie "début" de
  // anneeDebut+1 (pDeb = 1-pFin).
  //
  // Convention mensuelle : on répartit d'abord par mois pour chaque année
  // civile, puis on affecte chaque mois au bon exercice fiscal.
  //
  //  Année civile anneeDebut   → mois [moisDebut .. 11]  appartiennent à y1
  //  Année civile anneeDebut+1 → mois [0 .. moisDebut-1] appartiennent à y1
  //                             mois [moisDebut .. 11]  appartiennent à y2
  //  etc.

  const dotationsAmortAcc = emptyAcc();
  const dotationsParImmo: {
    immo: { id: string; libelle: string; nature: string };
    series: MonthlyAcc;
  }[] = [];

  for (const immo of data.immobilisations) {
    if (immo.actif === false) continue;
    // Mode AUCUN → pas d'amortissement quelles que soient durée et montant
    if (immo.modeAmortissement === "AUCUN") continue;
    const dur    = n(immo.dureeAmortissement);
    const montant = n(immo.montantHT);
    // dureeAmortissement = 0 → non amortissable (ex : dépôt de garantie)
    if (dur <= 0 || montant <= 0) continue;

    const dAcq    = new Date(String(immo.dateAcquisition));
    const acqYear = dAcq.getFullYear();
    const acqMois = dAcq.getMonth();

    const immoSeries = emptyAcc();

    /** Ajoute dotMois au mois absolu dans les séries mensuelles. */
    function addMois(absMonth: number, dotMois: number) {
      for (let e = 0; e < 3; e++) {
        const exStart = (anneeDebut + e) * 12 + moisDebut;
        if (absMonth >= exStart && absMonth < exStart + 12) {
          const yk  = (["y1", "y2", "y3"] as YearKey[])[e]!;
          const idx = absMonth - exStart;
          immoSeries[yk][idx]!        += dotMois;
          dotationsAmortAcc[yk][idx]! += dotMois;
          break;
        }
      }
    }

    if (immo.modeAmortissement !== "DEGRESSIF") {
      // ── LINEAIRE : taux mensuel constant ────────────────────────────────
      const acqAbsMonth = acqYear * 12 + acqMois;
      const totalMonths = Math.round(dur * 12);
      const dotMois     = montant / totalMonths;
      for (let k = 0; k < totalMonths; k++) {
        addMois(acqAbsMonth + k, dotMois);
      }
    } else {
      // ── DEGRESSIF : distribuer depuis lignesAmortissement ────────────────
      // Les dotations annuelles en base sont correctes (calculées par
      // calculerAmortissementDegressif). On les distribue uniformément sur
      // les mois actifs de chaque année civile.
      for (const ligne of immo.lignesAmortissement) {
        const D = n(ligne.dotationAnnuelle);
        if (D === 0) continue;

        let moisCivilDebut: number;
        let nbMois: number;
        if (ligne.annee === acqYear) {
          moisCivilDebut = acqMois;
          nbMois         = 12 - acqMois;
        } else if (ligne.annee >= acqYear + Math.ceil(dur)) {
          moisCivilDebut = 0;
          nbMois         = acqMois;
        } else {
          moisCivilDebut = 0;
          nbMois         = 12;
        }
        if (nbMois <= 0) continue;
        const dotMois = D / nbMois;
        for (let m = moisCivilDebut; m < moisCivilDebut + nbMois; m++) {
          addMois(ligne.annee * 12 + m, dotMois);
        }
      }
    }

    dotationsParImmo.push({
      immo: { id: immo.id, libelle: immo.libelle, nature: immo.nature },
      series: immoSeries,
    });
  }

  const dotationsProvisionsAcc = simpleUniform(data.provisions);
  const reprisesAcc = simpleUniform(data.reprisesProduits);

  // ── Autres produits / charges exploitation ────────────────────────────────

  const commissionsTotalAcc = simpleUniform(data.activiteCommissions);

  // Prod immobilisées : date unique → exercice + mois exacts
  const prodImmoAcc = emptyAcc();
  for (const p of data.productionsImmobilisees) {
    if (p.actif === false) continue;
    const m = n(p.montant);
    if (m === 0) continue;
    if (p.date) {
      const dateStr = typeof p.date === "object" ? (p.date as Date).toISOString() : String(p.date);
      const r = ykAndMonthIdx(dateStr);
      if (r) {
        prodImmoAcc[r.yk][r.idx]! += m;
        continue;
      }
    }
    // Sans date → répartir sur y1 uniformément
    addSeries(prodImmoAcc, "y1", uniform(m));
  }

  const transfertsAcc = simpleUniform(data.transfertsProduits);
  const autresProdGestionAcc = simpleUniform(data.gestionCouranteProduits);
  const autresChargesGestionAcc = simpleUniform(data.chargesGestionCourante);

  // ── Résultat d'exploitation ───────────────────────────────────────────────

  const resExplAcc: MonthlyAcc = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    for (let i = 0; i < 12; i++) {
      resExplAcc[yk][i] =
        (ebeAcc[yk][i] ?? 0) -
        (dotationsAmortAcc[yk][i] ?? 0) -
        (dotationsProvisionsAcc[yk][i] ?? 0) +
        (reprisesAcc[yk][i] ?? 0) +
        (commissionsTotalAcc[yk][i] ?? 0) +
        (prodImmoAcc[yk][i] ?? 0) +
        (transfertsAcc[yk][i] ?? 0) +
        (autresProdGestionAcc[yk][i] ?? 0) -
        (autresChargesGestionAcc[yk][i] ?? 0);
    }
  }

  // ── Financier ─────────────────────────────────────────────────────────────

  const produitsFinanciersAcc = simpleUniform(data.financiersProduits);

  // Intérêts emprunts : placement exact dans le mois de l'échéance
  const interetsEmpruntsAcc = emptyAcc();
  for (const emprunt of data.emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance ?? "");
      if (!dateStr) continue;
      const r = ykAndMonthIdx(dateStr);
      if (r) {
        interetsEmpruntsAcc[r.yk][r.idx]! +=
          n(ligne.interesMois) + n(ligne.assuranceMois);
      }
    }
  }

  // Frais de dossier : charge ponctuelle à la date de déblocage (moisNumero = 0)
  const fraisDossierAcc = emptyAcc();
  for (const emprunt of data.emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      if (ligne.moisNumero !== 0) continue;
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance ?? "");
      if (!dateStr) continue;
      const r = ykAndMonthIdx(dateStr);
      if (r) {
        fraisDossierAcc[r.yk][r.idx]! += n(ligne.mensualiteTotale);
      }
    }
  }

  const autresChargesFinancieresAcc = simpleUniform(data.chargesFinancieres);
  const chargesFinancieresAcc: MonthlyAcc = {
    y1: sumSeries(sumSeries(interetsEmpruntsAcc.y1, fraisDossierAcc.y1), autresChargesFinancieresAcc.y1),
    y2: sumSeries(sumSeries(interetsEmpruntsAcc.y2, fraisDossierAcc.y2), autresChargesFinancieresAcc.y2),
    y3: sumSeries(sumSeries(interetsEmpruntsAcc.y3, fraisDossierAcc.y3), autresChargesFinancieresAcc.y3),
  };

  const resFinAcc: MonthlyAcc = {
    y1: produitsFinanciersAcc.y1.map(
      (v, i) => v - (chargesFinancieresAcc.y1[i] ?? 0),
    ),
    y2: produitsFinanciersAcc.y2.map(
      (v, i) => v - (chargesFinancieresAcc.y2[i] ?? 0),
    ),
    y3: produitsFinanciersAcc.y3.map(
      (v, i) => v - (chargesFinancieresAcc.y3[i] ?? 0),
    ),
  };

  // ── Résultats ─────────────────────────────────────────────────────────────

  const resCourantAcc: MonthlyAcc = {
    y1: resExplAcc.y1.map((v, i) => v + (resFinAcc.y1[i] ?? 0)),
    y2: resExplAcc.y2.map((v, i) => v + (resFinAcc.y2[i] ?? 0)),
    y3: resExplAcc.y3.map((v, i) => v + (resFinAcc.y3[i] ?? 0)),
  };

  const produitsExcepAcc = simpleUniform(data.exceptionnelsProduits);
  const chargesExcepAcc = simpleUniform(data.chargesExceptionnelles);
  const resExcepAcc: MonthlyAcc = {
    y1: produitsExcepAcc.y1.map(
      (v, i) => v - (chargesExcepAcc.y1[i] ?? 0),
    ),
    y2: produitsExcepAcc.y2.map(
      (v, i) => v - (chargesExcepAcc.y2[i] ?? 0),
    ),
    y3: produitsExcepAcc.y3.map(
      (v, i) => v - (chargesExcepAcc.y3[i] ?? 0),
    ),
  };

  // ── IS : calculé annuellement, réparti uniformément ───────────────────────

  const isSeries: MonthlyAcc = {
    y1: uniform(isParAnnee.y1),
    y2: uniform(isParAnnee.y2),
    y3: uniform(isParAnnee.y3),
  };

  // ── Résultat net ──────────────────────────────────────────────────────────

  const resNetAcc: MonthlyAcc = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    for (let i = 0; i < 12; i++) {
      resNetAcc[yk][i] =
        (resCourantAcc[yk][i] ?? 0) +
        (resExcepAcc[yk][i] ?? 0) -
        (isSeries[yk][i] ?? 0);
    }
  }

  // ── CAF ───────────────────────────────────────────────────────────────────

  const cafAcc: MonthlyAcc = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    for (let i = 0; i < 12; i++) {
      cafAcc[yk][i] =
        (resNetAcc[yk][i] ?? 0) +
        (dotationsAmortAcc[yk][i] ?? 0) +
        (dotationsProvisionsAcc[yk][i] ?? 0) -
        (reprisesAcc[yk][i] ?? 0);
    }
  }

  // Supprimer la variable inutilisée pour éviter l'avertissement TS
  void pFin;

  return {
    anneeDebut,
    moisDebut,
    ca: caAcc,
    caByActivity,
    caByType,
    achatsEffectues: achatsEffectuesAcc,
    achatsByActivity,
    stockInitial: stockInitialAcc,
    stockInitialByActivity,
    stockFinal: stockFinalAcc,
    stockFinalByActivity,
    varStock: varStockAcc,
    varStockByActivity,
    achatsConsommes: achatsConsommesAcc,
    fournitures: fournituresAcc,
    services: servicesAcc,
    chargesExternes: chargesExternesAcc,
    chargesExtTotal: chargesExternesAcc,
    impotsTaxes: impotsTaxesAcc,
    salairesBruts: salairesBrutsAcc,
    chargesPatronales: chargesPatronalesAcc,
    remuDirigeant: remuDirigeantAcc,
    cotisationsTNS: cotisationsTNSAcc,
    taxesSalaires: taxesSalairesAcc,
    chargesPersonnel: chargesPersonnelAcc,
    margeGlobale: margeGlobaleAcc,
    valeurAjoutee: valeurAjouteeAcc,
    subventions: subventionsAcc,
    ebe: ebeAcc,
    dotationsAmort: dotationsAmortAcc,
    dotationsParImmo,
    dotationsProvisions: dotationsProvisionsAcc,
    reprises: reprisesAcc,
    commissionsTotal: commissionsTotalAcc,
    prodImmo: prodImmoAcc,
    transferts: transfertsAcc,
    autresProdGestion: autresProdGestionAcc,
    autresChargesGestion: autresChargesGestionAcc,
    resExpl: resExplAcc,
    produitsFinanciers: produitsFinanciersAcc,
    interetsEmprunts: interetsEmpruntsAcc,
    fraisDossierEmprunts: fraisDossierAcc,
    autresChargesFinancieres: autresChargesFinancieresAcc,
    chargesFinancieres: chargesFinancieresAcc,
    resFin: resFinAcc,
    resCourant: resCourantAcc,
    produitsExcep: produitsExcepAcc,
    chargesExcep: chargesExcepAcc,
    resExcep: resExcepAcc,
    isParAnnee,
    isSeries,
    resNet: resNetAcc,
    caf: cafAcc,
  };
}
