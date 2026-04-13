/**
 * Calcul du seuil de rentabilité et de la marge de sécurité.
 *
 * Responsabilité :
 *   - Produit `BreakEvenData` (lignes de tableau prêtes pour l'UI)
 *   - Séparation coûts variables / coûts fixes
 *   - Seuil économique et financier (avec remboursement capital + IS)
 *
 * Convention : Option B — base d'activité = CA + subventions d'exploitation.
 * Cohérent avec le calcul de l'EBE dans le SIG (PCG).
 *
 * Sources de données :
 *   - `ScenarioFinData` : activites (pour typeActivite + tauxMarge),
 *     subventionsExploitation, isIS
 *   - `FinCalcResult` : coûts fixes (chargesExternes, chargesPersonnel,
 *     dotations, impôtsTaxes), capitalRembourse, isParAnnee, yearLabels
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";

// ── Types publics ─────────────────────────────────────────────────────────────

export interface BreakEvenValue {
  /** Montant en € (ou nombre de jours pour point mort). null = non calculable (ex: marge nulle) */
  amount: number | null;
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

// ── Helpers internes ──────────────────────────────────────────────────────────

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

// ── Fonction pure principale ──────────────────────────────────────────────────

/**
 * Calcule le tableau complet du seuil de rentabilité.
 *
 * @param data - Données brutes du scénario (activites, subventions, isIS)
 * @param fc   - Résultat du moteur financier (source unique de vérité pour les coûts fixes)
 */
export function calcSeuil(
  data: Pick<ScenarioFinData, "activites" | "subventionsExploitation" | "isIS">,
  fc: FinCalcResult,
): BreakEvenData {
  const { activites, subventionsExploitation: subventions, isIS } = data;

  // ── Base d'activité ─────────────────────────────────────────────────────────
  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
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

  // Convention Option B : CA + subventions d'exploitation (suivant PCG)
  const ventesProduction: Record<YearKey, number> = {
    y1: caBase.y1 + subventionsTotal.y1,
    y2: caBase.y2 + subventionsTotal.y2,
    y3: caBase.y3 + subventionsTotal.y3,
  };

  // ── Coûts variables : achats consommés (PRIMAL = CA × coef) ─────────────────
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => ({
      montantN: r.montantN * Math.max(0, 1 - r.tauxMarge / 100),
      montantN1: r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100),
      montantN2: r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100),
    }));

  const achatsConsommes: Record<YearKey, number> = {
    y1: achatsRows.reduce((s, r) => s + r.montantN, 0),
    y2: achatsRows.reduce((s, r) => s + r.montantN1, 0),
    y3: achatsRows.reduce((s, r) => s + r.montantN2, 0),
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

  const tauxMargeCVPct: Record<YearKey, number> = {
    y1: ventesProduction.y1 > 0 ? (margeCV.y1 / ventesProduction.y1) * 100 : 0,
    y2: ventesProduction.y2 > 0 ? (margeCV.y2 / ventesProduction.y2) * 100 : 0,
    y3: ventesProduction.y3 > 0 ? (margeCV.y3 / ventesProduction.y3) * 100 : 0,
  };

  // ── Coûts fixes (depuis fc — source unique de vérité) ───────────────────────
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
    y1: chargesExternes.y1 + chargesPersonnel.y1 + totalDotations.y1 + impotsEtTaxes.y1 - fc.reprises.y1,
    y2: chargesExternes.y2 + chargesPersonnel.y2 + totalDotations.y2 + impotsEtTaxes.y2 - fc.reprises.y2,
    y3: chargesExternes.y3 + chargesPersonnel.y3 + totalDotations.y3 + impotsEtTaxes.y3 - fc.reprises.y3,
  };

  // ── Résultat courant (exploitation uniquement) ───────────────────────────────
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

  // IS et capital depuis fc (source unique de vérité)
  const remboursementCapital = fc.capitalRembourse;
  const isParAnnee = fc.isParAnnee;

  // ── Seuil de rentabilité économique ─────────────────────────────────────────
  // null = non calculable (marge sur coût variable nulle → seuil mathématiquement infini)
  const ZERO: Record<YearKey, number> = { y1: 0, y2: 0, y3: 0 };
  const seuilEco: Record<YearKey, number | null> = {
    y1: tauxMargeCVPct.y1 !== 0 ? totalCoutsFixes.y1 / (tauxMargeCVPct.y1 / 100) : null,
    y2: tauxMargeCVPct.y2 !== 0 ? totalCoutsFixes.y2 / (tauxMargeCVPct.y2 / 100) : null,
    y3: tauxMargeCVPct.y3 !== 0 ? totalCoutsFixes.y3 / (tauxMargeCVPct.y3 / 100) : null,
  };

  const excedentEco: Record<YearKey, number | null> = {
    y1: seuilEco.y1 !== null ? ventesProduction.y1 - seuilEco.y1 : null,
    y2: seuilEco.y2 !== null ? ventesProduction.y2 - seuilEco.y2 : null,
    y3: seuilEco.y3 !== null ? ventesProduction.y3 - seuilEco.y3 : null,
  };

  const pointMortEco: Record<YearKey, number | null> = {
    y1: seuilEco.y1 !== null && ventesProduction.y1 > 0 ? (seuilEco.y1 / ventesProduction.y1) * 365 : (seuilEco.y1 !== null ? 0 : null),
    y2: seuilEco.y2 !== null && ventesProduction.y2 > 0 ? (seuilEco.y2 / ventesProduction.y2) * 365 : (seuilEco.y2 !== null ? 0 : null),
    y3: seuilEco.y3 !== null && ventesProduction.y3 > 0 ? (seuilEco.y3 / ventesProduction.y3) * 365 : (seuilEco.y3 !== null ? 0 : null),
  };

  // ── Seuil de rentabilité financier ───────────────────────────────────────────
  const chargesSupplementaires: Record<YearKey, number> = {
    y1: remboursementCapital.y1 + isParAnnee.y1,
    y2: remboursementCapital.y2 + isParAnnee.y2,
    y3: remboursementCapital.y3 + isParAnnee.y3,
  };

  const seuilFin: Record<YearKey, number | null> = {
    y1: tauxMargeCVPct.y1 !== 0 ? (totalCoutsFixes.y1 + chargesSupplementaires.y1) / (tauxMargeCVPct.y1 / 100) : null,
    y2: tauxMargeCVPct.y2 !== 0 ? (totalCoutsFixes.y2 + chargesSupplementaires.y2) / (tauxMargeCVPct.y2 / 100) : null,
    y3: tauxMargeCVPct.y3 !== 0 ? (totalCoutsFixes.y3 + chargesSupplementaires.y3) / (tauxMargeCVPct.y3 / 100) : null,
  };

  const excedentFin: Record<YearKey, number | null> = {
    y1: seuilFin.y1 !== null ? ventesProduction.y1 - seuilFin.y1 : null,
    y2: seuilFin.y2 !== null ? ventesProduction.y2 - seuilFin.y2 : null,
    y3: seuilFin.y3 !== null ? ventesProduction.y3 - seuilFin.y3 : null,
  };

  const pointMortFin: Record<YearKey, number | null> = {
    y1: seuilFin.y1 !== null && ventesProduction.y1 > 0 ? (seuilFin.y1 / ventesProduction.y1) * 365 : (seuilFin.y1 !== null ? 0 : null),
    y2: seuilFin.y2 !== null && ventesProduction.y2 > 0 ? (seuilFin.y2 / ventesProduction.y2) * 365 : (seuilFin.y2 !== null ? 0 : null),
    y3: seuilFin.y3 !== null && ventesProduction.y3 > 0 ? (seuilFin.y3 / ventesProduction.y3) * 365 : (seuilFin.y3 !== null ? 0 : null),
  };

  // ── Assemblage des lignes ─────────────────────────────────────────────────────
  const vp = ventesProduction;
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
    mkSection("sec_activite", "Base d'activité"),
    mkRow("ventes_production", "Ventes + Production réelle", undefined, "highlight", true, vp, vp),

    mkSection("sec_cv", "Coûts variables"),
    mkRow("achats_consommes", "Achats consommés", undefined, "indent", true, achatsConsommes, vp),
    mkRow("total_cv", "Total coûts variables", "=", "subtotal", true, totalCoutsVariables, vp),

    mkRow("marge_cv", "Marge sur coût variable", "=", "highlight", true, margeCV, vp),
    tauxMargeCVRow,

    mkSection("sec_cf", "Coûts fixes"),
    mkRow("charges_ext", "Charges externes", undefined, "indent", true, chargesExternes, vp),
    mkRow("charges_pers", "Charges de personnel", undefined, "indent", true, chargesPersonnel, vp),
    mkRow("dotations", "Dotations aux amortissements", undefined, "indent", true, totalDotations, vp),
    mkRow("impots_taxes", "Impôts et taxes", undefined, "indent", true, impotsEtTaxes, vp),
    mkRow("total_cf", "Total coûts fixes", "=", "subtotal", true, totalCoutsFixes, vp),

    mkRow("resultat", "Résultat courant avant impôt", "=", "highlight", true, resExpl, vp),

    mkSeparator("sep_eco"),
    mkSection("sec_eco", "Seuil de rentabilité économique"),
    {
      key: "seuil_eco",
      label: "Seuil de rentabilité économique",
      style: "highlight" as const,
      showPct: false,
      values: {
        y1: { amount: seuilEco.y1, pct: null },
        y2: { amount: seuilEco.y2, pct: null },
        y3: { amount: seuilEco.y3, pct: null },
      },
    },
    {
      key: "excedent_eco",
      label: "Excédent / insuffisance d'activité",
      style: "normal" as const,
      showPct: false,
      values: {
        y1: { amount: excedentEco.y1, pct: null },
        y2: { amount: excedentEco.y2, pct: null },
        y3: { amount: excedentEco.y3, pct: null },
      },
    },
    {
      key: "point_mort_eco",
      label: "Point mort (jours)",
      style: "normal" as const,
      showPct: false,
      values: {
        y1: { amount: pointMortEco.y1 !== null ? Math.round(pointMortEco.y1) : null, pct: null },
        y2: { amount: pointMortEco.y2 !== null ? Math.round(pointMortEco.y2) : null, pct: null },
        y3: { amount: pointMortEco.y3 !== null ? Math.round(pointMortEco.y3) : null, pct: null },
      },
    },

    mkSeparator("sep_fin"),
    mkSection("sec_fin", "Seuil de rentabilité financier"),
    ...(remboursementCapital.y1 !== 0 || remboursementCapital.y2 !== 0 || remboursementCapital.y3 !== 0
      ? [mkRow("remboursement_capital", "+ Remboursement des emprunts (capital)", "+", "indent", false, remboursementCapital, ZERO)]
      : []),
    ...(isIS && (isParAnnee.y1 !== 0 || isParAnnee.y2 !== 0 || isParAnnee.y3 !== 0)
      ? [mkRow("is_annee", "+ Impôt sur les sociétés", "+", "indent", false, isParAnnee, ZERO)]
      : []),
    {
      key: "seuil_fin",
      label: "Seuil de rentabilité financier",
      style: "highlight" as const,
      showPct: false,
      values: {
        y1: { amount: seuilFin.y1, pct: null },
        y2: { amount: seuilFin.y2, pct: null },
        y3: { amount: seuilFin.y3, pct: null },
      },
    },
    {
      key: "excedent_fin",
      label: "Excédent / insuffisance d'activité",
      style: "normal" as const,
      showPct: false,
      values: {
        y1: { amount: excedentFin.y1, pct: null },
        y2: { amount: excedentFin.y2, pct: null },
        y3: { amount: excedentFin.y3, pct: null },
      },
    },
    {
      key: "point_mort_fin",
      label: "Point mort financier (jours)",
      style: "normal" as const,
      showPct: false,
      values: {
        y1: { amount: pointMortFin.y1 !== null ? Math.round(pointMortFin.y1) : null, pct: null },
        y2: { amount: pointMortFin.y2 !== null ? Math.round(pointMortFin.y2) : null, pct: null },
        y3: { amount: pointMortFin.y3 !== null ? Math.round(pointMortFin.y3) : null, pct: null },
      },
    },
  ];

  return { yearLabels: fc.yearLabels, rows };
}
