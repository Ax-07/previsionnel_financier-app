"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BreakEvenValue {
  /** Montant en € (ou nombre de jours pour point mort) */
  amount: number;
  /** % par rapport aux ventes+production (null si non applicable) */
  pct: number | null;
}

export interface BreakEvenRow {
  key: string;
  label: string;
  /** Signe affiché devant le libellé */
  sign?: "+" | "−" | "=";
  /** Style de rendu */
  style: "section" | "normal" | "indent" | "subtotal" | "highlight" | "separator";
  /** Afficher la colonne % */
  showPct: boolean;
  values: Record<YearKey, BreakEvenValue>;
}

export interface BreakEvenData {
  yearLabels: Record<YearKey, string>;
  rows: BreakEvenRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function pct(amount: number, base: number): number | null {
  if (base === 0) return null;
  return (amount / base) * 100;
}

function mkRow(
  key: string,
  label: string,
  sign: BreakEvenRow["sign"] | undefined,
  style: BreakEvenRow["style"],
  showPct: boolean,
  vals: Record<YearKey, number>,
  base: Record<YearKey, number>,
): BreakEvenRow {
  return {
    key,
    label,
    sign,
    style,
    showPct,
    values: {
      y1: { amount: vals.y1, pct: showPct ? pct(vals.y1, base.y1) : null },
      y2: { amount: vals.y2, pct: showPct ? pct(vals.y2, base.y2) : null },
      y3: { amount: vals.y3, pct: showPct ? pct(vals.y3, base.y3) : null },
    },
  };
}

function mkSeparator(key: string): BreakEvenRow {
  return {
    key,
    label: "",
    style: "separator",
    showPct: false,
    values: {
      y1: { amount: 0, pct: null },
      y2: { amount: 0, pct: null },
      y3: { amount: 0, pct: null },
    },
  };
}

function mkSection(key: string, label: string): BreakEvenRow {
  return {
    key,
    label,
    style: "section",
    showPct: false,
    values: {
      y1: { amount: 0, pct: null },
      y2: { amount: 0, pct: null },
      y3: { amount: 0, pct: null },
    },
  };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchSeuilRentabilite(
  dossierId: string,
  preloadedData?: ScenarioFinData,
): Promise<BreakEvenData> {
  // ── 1. Infos dossier ────────────────────────────────────────────────────────
  const data = preloadedData ?? await fetchScenarioData(dossierId);
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    activites,
    subventionsExploitation: subventions,
  } = data;
  const anneeDebut = dateDemarrageDate.getFullYear();
  const fc = buildFinCalc(data, dateDemarrageDate);
  const yearLabels: Record<YearKey, string> = {
    y1: `${anneeDebut}–${anneeDebut + 1}`,
    y2: `${anneeDebut + 1}–${anneeDebut + 2}`,
    y3: `${anneeDebut + 2}–${anneeDebut + 3}`,
  };

  // ── 4. Calculs ──────────────────────────────────────────────────────────────

  // ── Chiffre d'affaires (base d'activité) ────────────────────────────────────
  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
      stocks: n(a.stocks ?? 0),
    }));

  const subventionsTotal: Record<YearKey, number> = {
    y1: subventions.filter((s) => s.actif !== false).reduce((acc, s) => acc + n(s.montantN), 0),
    y2: subventions.filter((s) => s.actif !== false).reduce((acc, s) => acc + n(s.montantN1), 0),
    y3: subventions.filter((s) => s.actif !== false).reduce((acc, s) => acc + n(s.montantN2), 0),
  };

  const caBase: Record<YearKey, number> = {
    y1: caRows.reduce((s, r) => s + r.montantN, 0),
    y2: caRows.reduce((s, r) => s + r.montantN1, 0),
    y3: caRows.reduce((s, r) => s + r.montantN2, 0),
  };

  // Convention choisie : Option B — base = CA + subventions d'exploitation
  // Les subventions d'exploitation sont des produits récurrents garantis qui réduisent
  // effectivement le point mort. Cette convention suit la "production vendue + subventions"
  // du PCG (Plan Comptable Général), cohérente avec le calcul de l'EBE dans le SIG.
  // (Option A : CA seul — plus proche de la définition académique stricte, mais ne tient
  //  pas compte des aides structurelles à l'exploitation.)
  const ventesProduction: Record<YearKey, number> = {
    y1: caBase.y1 + subventionsTotal.y1,
    y2: caBase.y2 + subventionsTotal.y2,
    y3: caBase.y3 + subventionsTotal.y3,
  };

  // ── Coûts variables : achats consommés ──────────────────────────────────────
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => ({
      montantN: r.montantN * Math.max(0, 1 - r.tauxMarge / 100),
      montantN1: r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100),
      montantN2: r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100),
      stocks: r.stocks,
    }));

  const stockFinalY1 = achatsRows.reduce((s, r) => s + (r.montantN * r.stocks) / 365, 0);
  const stockFinalY2 = achatsRows.reduce((s, r) => s + (r.montantN1 * r.stocks) / 365, 0);
  const stockFinalY3 = achatsRows.reduce((s, r) => s + (r.montantN2 * r.stocks) / 365, 0);

  const achatsConsommes: Record<YearKey, number> = {
    y1: achatsRows.reduce((s, r) => s + r.montantN, 0) - stockFinalY1,
    y2: achatsRows.reduce((s, r) => s + r.montantN1, 0) + stockFinalY1 - stockFinalY2,
    y3: achatsRows.reduce((s, r) => s + r.montantN2, 0) + stockFinalY2 - stockFinalY3,
  };

  const totalCoutsVariables: Record<YearKey, number> = {
    y1: achatsConsommes.y1,
    y2: achatsConsommes.y2,
    y3: achatsConsommes.y3,
  };

  // ── Marge sur coût variable ──────────────────────────────────────────────────
  const margeCV: Record<YearKey, number> = {
    y1: ventesProduction.y1 - totalCoutsVariables.y1,
    y2: ventesProduction.y2 - totalCoutsVariables.y2,
    y3: ventesProduction.y3 - totalCoutsVariables.y3,
  };

  // Taux de marge sur coût variable (en %)
  const tauxMargeCVPct: Record<YearKey, number> = {
    y1: ventesProduction.y1 > 0 ? (margeCV.y1 / ventesProduction.y1) * 100 : 0,
    y2: ventesProduction.y2 > 0 ? (margeCV.y2 / ventesProduction.y2) * 100 : 0,
    y3: ventesProduction.y3 > 0 ? (margeCV.y3 / ventesProduction.y3) * 100 : 0,
  };

  // ── Coûts fixes (depuis buildFinCalc — source unique de vérité) ────────────
  const chargesExternes: Record<YearKey, number> = {
    y1: fc.fournitures.y1 + fc.services.y1,
    y2: fc.fournitures.y2 + fc.services.y2,
    y3: fc.fournitures.y3 + fc.services.y3,
  };
  const chargesPersonnel = fc.chargesPersonnel.total;
  const totalDotations: Record<YearKey, number> = {
    y1: fc.dotationsAmort.y1 + fc.dotationsProvisions.y1,
    y2: fc.dotationsAmort.y2 + fc.dotationsProvisions.y2,
    y3: fc.dotationsAmort.y3 + fc.dotationsProvisions.y3,
  };
  const impotsEtTaxes = fc.impotsTaxes;

  const totalCoutsFixes: Record<YearKey, number> = {
    y1: chargesExternes.y1 + chargesPersonnel.y1 + totalDotations.y1 + impotsEtTaxes.y1,
    y2: chargesExternes.y2 + chargesPersonnel.y2 + totalDotations.y2 + impotsEtTaxes.y2,
    y3: chargesExternes.y3 + chargesPersonnel.y3 + totalDotations.y3 + impotsEtTaxes.y3,
  };

  // ── Résultat courant avant impôt (convention seuil : exploitation uniquement) ─
  const totalCharges: Record<YearKey, number> = {
    y1: totalCoutsVariables.y1 + totalCoutsFixes.y1,
    y2: totalCoutsVariables.y2 + totalCoutsFixes.y2,
    y3: totalCoutsVariables.y3 + totalCoutsFixes.y3,
  };
  const resExpl: Record<YearKey, number> = {
    y1: ventesProduction.y1 - totalCharges.y1,
    y2: ventesProduction.y2 - totalCharges.y2,
    y3: ventesProduction.y3 - totalCharges.y3,
  };

  // IS et remboursement capital depuis buildFinCalc (source unique de vérité)
  const remboursementCapital = fc.capitalRembourse;
  const isParAnnee = fc.isParAnnee;

  // ── Seuil de rentabilité économique ─────────────────────────────────────────
  // SeuilEco = CoutsFixes / TauxMargeCV
  const ZERO: Record<YearKey, number> = { y1: 0, y2: 0, y3: 0 };
  const seuilEco: Record<YearKey, number> = {
    y1: tauxMargeCVPct.y1 !== 0 ? totalCoutsFixes.y1 / (tauxMargeCVPct.y1 / 100) : 0,
    y2: tauxMargeCVPct.y2 !== 0 ? totalCoutsFixes.y2 / (tauxMargeCVPct.y2 / 100) : 0,
    y3: tauxMargeCVPct.y3 !== 0 ? totalCoutsFixes.y3 / (tauxMargeCVPct.y3 / 100) : 0,
  };

  const excedentEco: Record<YearKey, number> = {
    y1: ventesProduction.y1 - seuilEco.y1,
    y2: ventesProduction.y2 - seuilEco.y2,
    y3: ventesProduction.y3 - seuilEco.y3,
  };

  const pointMortEco: Record<YearKey, number> = {
    y1: ventesProduction.y1 > 0 ? (seuilEco.y1 / ventesProduction.y1) * 365 : 0,
    y2: ventesProduction.y2 > 0 ? (seuilEco.y2 / ventesProduction.y2) * 365 : 0,
    y3: ventesProduction.y3 > 0 ? (seuilEco.y3 / ventesProduction.y3) * 365 : 0,
  };

  // ── Seuil de rentabilité financier ──────────────────────────────────────────
  // SeuilFin = (CoutsFixes + RemboursementCapital + IS) / TauxMargeCV
  const chargesSupplementaires: Record<YearKey, number> = {
    y1: remboursementCapital.y1 + isParAnnee.y1,
    y2: remboursementCapital.y2 + isParAnnee.y2,
    y3: remboursementCapital.y3 + isParAnnee.y3,
  };

  const seuilFin: Record<YearKey, number> = {
    y1: tauxMargeCVPct.y1 !== 0 ? (totalCoutsFixes.y1 + chargesSupplementaires.y1) / (tauxMargeCVPct.y1 / 100) : 0,
    y2: tauxMargeCVPct.y2 !== 0 ? (totalCoutsFixes.y2 + chargesSupplementaires.y2) / (tauxMargeCVPct.y2 / 100) : 0,
    y3: tauxMargeCVPct.y3 !== 0 ? (totalCoutsFixes.y3 + chargesSupplementaires.y3) / (tauxMargeCVPct.y3 / 100) : 0,
  };

  const excedentFin: Record<YearKey, number> = {
    y1: ventesProduction.y1 - seuilFin.y1,
    y2: ventesProduction.y2 - seuilFin.y2,
    y3: ventesProduction.y3 - seuilFin.y3,
  };

  const pointMortFin: Record<YearKey, number> = {
    y1: ventesProduction.y1 > 0 ? (seuilFin.y1 / ventesProduction.y1) * 365 : 0,
    y2: ventesProduction.y2 > 0 ? (seuilFin.y2 / ventesProduction.y2) * 365 : 0,
    y3: ventesProduction.y3 > 0 ? (seuilFin.y3 / ventesProduction.y3) * 365 : 0,
  };

  // ── 5. Construction des lignes ──────────────────────────────────────────────
  const vp = ventesProduction; // base pour les %

  // Ligne spéciale « Taux de marge CV » (affiche le % directement dans la colonne montant)
  const tauxMargeCVRow: BreakEvenRow = {
    key: "taux_marge_cv",
    label: "Taux de marge sur coût variable",
    style: "normal",
    showPct: false,
    values: {
      y1: { amount: tauxMargeCVPct.y1, pct: null },
      y2: { amount: tauxMargeCVPct.y2, pct: null },
      y3: { amount: tauxMargeCVPct.y3, pct: null },
    },
  };

  const rows: BreakEvenRow[] = [
    // ── Section activité ────────────────────────────────────────────────────
    mkSection("sec_activite", "Base d'activité"),
    mkRow("ventes_production", "Ventes + Production réelle", undefined, "highlight", true, vp, vp),

    // ── Section coûts variables ─────────────────────────────────────────────
    mkSection("sec_cv", "Coûts variables"),
    mkRow("achats_consommes", "Achats consommés", undefined, "indent", true, achatsConsommes, vp),
    mkRow("total_cv", "Total coûts variables", "=", "subtotal", true, totalCoutsVariables, vp),

    // ── Marge ────────────────────────────────────────────────────────────────
    mkRow("marge_cv", "Marge sur coût variable", "=", "highlight", true, margeCV, vp),
    tauxMargeCVRow,

    // ── Section coûts fixes ──────────────────────────────────────────────────
    mkSection("sec_cf", "Coûts fixes"),
    mkRow("charges_ext", "Charges externes", undefined, "indent", true, chargesExternes, vp),
    mkRow("charges_pers", "Charges de personnel", undefined, "indent", true, chargesPersonnel, vp),
    mkRow("dotations", "Dotations aux amortissements", undefined, "indent", true, totalDotations, vp),
    mkRow("impots_taxes", "Impôts et taxes", undefined, "indent", true, impotsEtTaxes, vp),
    mkRow("total_cf", "Total coûts fixes", "=", "subtotal", true, totalCoutsFixes, vp),

    // ── Résultat courant ─────────────────────────────────────────────────────
    mkRow("resultat", "Résultat courant avant impôt", "=", "highlight", true, resExpl, vp),

    // ── Seuil économique ─────────────────────────────────────────────────────
    mkSeparator("sep_eco"),
    mkSection("sec_eco", "Seuil de rentabilité économique"),
    mkRow("seuil_eco", "Seuil de rentabilité économique", undefined, "highlight", false, seuilEco, ZERO),
    mkRow("excedent_eco", "Excédent / insuffisance d'activité", undefined, "normal", false, excedentEco, ZERO),
    {
      key: "point_mort_eco",
      label: "Point mort (jours)",
      style: "normal",
      showPct: false,
      values: {
        y1: { amount: Math.round(pointMortEco.y1), pct: null },
        y2: { amount: Math.round(pointMortEco.y2), pct: null },
        y3: { amount: Math.round(pointMortEco.y3), pct: null },
      },
    },

    // ── Seuil financier ──────────────────────────────────────────────────────
    mkSeparator("sep_fin"),
    mkSection("sec_fin", "Seuil de rentabilité financier"),
    ...(remboursementCapital.y1 !== 0 || remboursementCapital.y2 !== 0 || remboursementCapital.y3 !== 0
      ? [mkRow("remboursement_capital", "+ Remboursement des emprunts (capital)", "+", "indent", false, remboursementCapital, ZERO)]
      : []),
    ...(isIS && (isParAnnee.y1 !== 0 || isParAnnee.y2 !== 0 || isParAnnee.y3 !== 0)
      ? [mkRow("is_annee", "+ Impôt sur les sociétés", "+", "indent", false, isParAnnee, ZERO)]
      : []),
    mkRow("seuil_fin", "Seuil de rentabilité financier", undefined, "highlight", false, seuilFin, ZERO),
    mkRow("excedent_fin", "Excédent / insuffisance d'activité", undefined, "normal", false, excedentFin, ZERO),
    {
      key: "point_mort_fin",
      label: "Point mort financier (jours)",
      style: "normal",
      showPct: false,
      values: {
        y1: { amount: Math.round(pointMortFin.y1), pct: null },
        y2: { amount: Math.round(pointMortFin.y2), pct: null },
        y3: { amount: Math.round(pointMortFin.y3), pct: null },
      },
    },
  ];

  return { yearLabels, rows };
}
