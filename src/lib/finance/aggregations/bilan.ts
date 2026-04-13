/**
 * Construction des lignes de présentation du Bilan prévisionnel.
 *
 * Responsabilité unique : assembler les résultats des calculs de bilan en une
 * structure `BilanData` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/bilan
 * @extracted-from app/actions/controle/bilan.ts
 */

import type { YearKey as BilanYearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  calcImmosBilan,
  calcApportsCumulatifs,
  calcEmpruntsPassif,
  calcProvisionsCumul,
  calcCapitauxPropres,
  calcTresorerieBilan,
  calcFluxNonPLCumul,
} from "@/lib/finance/calculs/bilan";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BilanRowValue {
  amount: number;
}

export interface BilanRow {
  key: string;
  label: string;
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → total / ligne clé
   * section   → bandeau de section (ACTIF / PASSIF)
   * indent    → ligne de détail indentée
   */
  style: "normal" | "subtotal" | "highlight" | "section" | "indent";
  indent?: number;
  hideIfZero?: boolean;
  values: Record<BilanYearKey, BilanRowValue>;
}

export interface BilanData {
  yearLabels: Record<BilanYearKey, string>;
  rows: BilanRow[];
  /** Alerte si Total Actif ≠ Total Passif */
  equilibre: Record<BilanYearKey, boolean>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

function mkRow(
  key: string,
  label: string,
  style: BilanRow["style"],
  vals: YAcc,
  options?: { indent?: number; hideIfZero?: boolean },
): BilanRow {
  return {
    key,
    label,
    style,
    indent: options?.indent,
    hideIfZero: options?.hideIfZero,
    values: {
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
  };
}

// ── Builder principal ─────────────────────────────────────────────────────────

export function buildBilanRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): BilanData {
  const bfrCalc = calcBfr(data, fc);
  const { anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3 } = fc;
  const yearLabels = fc.yearLabels;

  // ── Calculs délégués aux modules spécialisés ─────────────────────────────

  const immos = calcImmosBilan(data, anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3, fc.dotationsParImmoAcc);

  const { apportsCapital, apportsCC } = calcApportsCumulatifs(data, exBorne1, exBorne2, exBorne3);

  const { capitalRestantDu, empruntsDebloques, remboursementsCumul } =
    calcEmpruntsPassif(data, exBorne1, exBorne2, exBorne3);

  const provisionsCumul = calcProvisionsCumul(fc);

  const { capitalSocial, comptesCoursants, reportANouveau, capitauxPropres } =
    calcCapitauxPropres(apportsCapital, apportsCC, fc.resNet);

  // BFR : stocks, crédit TVA et dettes d'exploitation depuis la source unique de vérité (calcBfr)
  const stocks: YAcc = { y1: bfrCalc.stocksMatieres.y1, y2: bfrCalc.stocksMatieres.y2, y3: bfrCalc.stocksMatieres.y3 };
  const creditTVA: YAcc = { y1: bfrCalc.creditTVA.y1, y2: bfrCalc.creditTVA.y2, y3: bfrCalc.creditTVA.y3 };
  const creancesClients: YAcc = { y1: bfrCalc.creancesClients.y1, y2: bfrCalc.creancesClients.y2, y3: bfrCalc.creancesClients.y3 };
  const dettesFournisseurs: YAcc = { y1: bfrCalc.dettesFournisseurs.y1, y2: bfrCalc.dettesFournisseurs.y2, y3: bfrCalc.dettesFournisseurs.y3 };
  const dettesChargesExternes: YAcc = { y1: bfrCalc.dettesChargesExternes.y1, y2: bfrCalc.dettesChargesExternes.y2, y3: bfrCalc.dettesChargesExternes.y3 };
  const dettesPersonnel: YAcc = { y1: bfrCalc.dettesPersonnel.y1, y2: bfrCalc.dettesPersonnel.y2, y3: bfrCalc.dettesPersonnel.y3 };
  const dettesImpots: YAcc = { y1: bfrCalc.dettesImpots.y1, y2: bfrCalc.dettesImpots.y2, y3: bfrCalc.dettesImpots.y3 };
  const tvaAPayer: YAcc = { y1: bfrCalc.tvaAPayer.y1, y2: bfrCalc.tvaAPayer.y2, y3: bfrCalc.tvaAPayer.y3 };
  const dettesIS: YAcc = { y1: bfrCalc.dettesIS.y1, y2: bfrCalc.dettesIS.y2, y3: bfrCalc.dettesIS.y3 };
  const totalDettesExploitation: YAcc = { y1: bfrCalc.totalRessources.y1, y2: bfrCalc.totalRessources.y2, y3: bfrCalc.totalRessources.y3 };

  // ── Flux non-P&L : subventions d'investissement + divers enc/dec ────────
  // Source unique de vérité partagée avec aggregations/ratios.ts via calcFluxNonPLCumul.
  const { encFluxNonPLCumul, decFluxNonPLCumul } = calcFluxNonPLCumul(
    data,
    exBorne1,
    exBorne2,
    exBorne3,
  );

  const { disponibilites, decouvert } = calcTresorerieBilan({
    caf: fc.caf,
    apportsCapital,
    apportsCC,
    empruntsDebloques,
    immoAcquises: immos.immoAcquises,
    // stocksCumul = besoins BFR non-cash : stocks + crédit TVA + créances clients
    stocksCumul: { y1: stocks.y1 + creditTVA.y1 + creancesClients.y1, y2: stocks.y2 + creditTVA.y2 + creancesClients.y2, y3: stocks.y3 + creditTVA.y3 + creancesClients.y3 },
    totalDettesExploitation,
    remboursementsCumul,
    encFluxNonPLCumul,
    decFluxNonPLCumul,
  });

  // ── Totaux ───────────────────────────────────────────────────────────────

  const actifCirculant: YAcc = {
    y1: stocks.y1 + creditTVA.y1 + creancesClients.y1 + disponibilites.y1,
    y2: stocks.y2 + creditTVA.y2 + creancesClients.y2 + disponibilites.y2,
    y3: stocks.y3 + creditTVA.y3 + creancesClients.y3 + disponibilites.y3,
  };
  const totalActif: YAcc = {
    y1: immos.immoNette.y1 + actifCirculant.y1,
    y2: immos.immoNette.y2 + actifCirculant.y2,
    y3: immos.immoNette.y3 + actifCirculant.y3,
  };
  const totalDettes: YAcc = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1 + decouvert.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2 + decouvert.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3 + decouvert.y3,
  };
  const totalPassif: YAcc = {
    y1: capitauxPropres.y1 + provisionsCumul.y1 + totalDettes.y1,
    y2: capitauxPropres.y2 + provisionsCumul.y2 + totalDettes.y2,
    y3: capitauxPropres.y3 + provisionsCumul.y3 + totalDettes.y3,
  };
  const equilibre: Record<BilanYearKey, boolean> = {
    y1: Math.abs(totalActif.y1 - totalPassif.y1) < 1,
    y2: Math.abs(totalActif.y2 - totalPassif.y2) < 1,
    y3: Math.abs(totalActif.y3 - totalPassif.y3) < 1,
  };

  // ── Construction des lignes ───────────────────────────────────────────────

  const rows: BilanRow[] = [
    // ── ACTIF ───────────────────────────────────────────────────────────────
    mkRow("section_actif", "ACTIF", "section", zero),

    mkRow("immo_incorp_brute", "Immobilisations incorporelles brutes", "indent", immos.immoBruteIncorp, { hideIfZero: true }),
    mkRow("amort_incorp", "  − Amortissements incorporels cumulés", "indent", immos.amortCumulIncorp, { hideIfZero: true }),
    mkRow("immo_incorp_nette", "Immobilisations incorporelles nettes", "normal", immos.immoNetteIncorp, { hideIfZero: true }),

    mkRow("immo_corp_brute", "Immobilisations corporelles brutes", "indent", immos.immoBruteCorp, { hideIfZero: true }),
    mkRow("amort_corp", "  − Amortissements corporels cumulés", "indent", immos.amortCumulCorp, { hideIfZero: true }),
    mkRow("immo_corp_nette", "Immobilisations corporelles nettes", "normal", immos.immoNetteCorp, { hideIfZero: true }),

    mkRow("immo_fin_brute", "Immobilisations financières brutes", "indent", immos.immoBruteFin, { hideIfZero: true }),
    mkRow("amort_fin", "  − Amortissements financiers cumulés", "indent", immos.amortCumulFin, { hideIfZero: true }),
    mkRow("immo_fin_nette", "Immobilisations financières nettes", "normal", immos.immoNetteFin, { hideIfZero: true }),

    mkRow("immo_nette_total", "Total immobilisations nettes", "subtotal", immos.immoNette),

    mkRow("stocks", "Stocks de matières", "normal", stocks, { hideIfZero: true }),
    mkRow("credit_tva", "Crédit de TVA", "normal", creditTVA, { hideIfZero: true }),
    mkRow("creances_clients", "Créances clients", "normal", creancesClients, { hideIfZero: true }),
    mkRow("disponibilites", "Disponibilités (trésorerie)", "normal", disponibilites),
    mkRow("actif_circulant", "Total actif circulant", "subtotal", actifCirculant),

    mkRow("total_actif", "TOTAL ACTIF", "highlight", totalActif),

    // ── PASSIF ──────────────────────────────────────────────────────────────
    mkRow("section_passif", "PASSIF", "section", zero),

    mkRow("capital_social", "Capital social", "normal", capitalSocial, { hideIfZero: true }),
    mkRow("comptes_courants", "Comptes courants associés", "normal", comptesCoursants, { hideIfZero: true }),
    mkRow("report_a_nouveau", "Réserves / Report à nouveau", "normal", reportANouveau, { hideIfZero: true }),
    mkRow("resultat_exercice", "Résultat de l'exercice", "normal", fc.resNet),
    mkRow("capitaux_propres", "Total capitaux propres", "subtotal", capitauxPropres),

    ...(provisionsCumul.y1 + provisionsCumul.y2 + provisionsCumul.y3 !== 0
      ? [mkRow("provisions", "Provisions pour risques et charges", "normal", provisionsCumul, { hideIfZero: true })]
      : []),

    mkRow("emprunts", "Emprunts (capital restant dû)", "normal", capitalRestantDu, { hideIfZero: true }),

    mkRow("dettes_fournisseurs", "Dettes fournisseurs", "normal", dettesFournisseurs, { hideIfZero: true }),
    mkRow("dettes_charges_ext", "Dettes charges externes", "normal", dettesChargesExternes, { hideIfZero: true }),
    mkRow("dettes_personnel", "Dettes personnel", "normal", dettesPersonnel, { hideIfZero: true }),
    mkRow("dettes_impots", "Dettes impôts et taxes", "normal", dettesImpots, { hideIfZero: true }),
    mkRow("tva_a_payer", "TVA à payer", "normal", tvaAPayer, { hideIfZero: true }),
    ...(data.isIS ? [mkRow("dettes_is", "Impôt sur les sociétés (acompte)", "normal", dettesIS, { hideIfZero: true })] : []),
    mkRow("total_dettes_expl", "Total dettes d'exploitation", "subtotal", totalDettesExploitation),

    ...(decouvert.y1 + decouvert.y2 + decouvert.y3 > 0
      ? [mkRow("decouvert", "Concours bancaires courants", "normal", decouvert, { hideIfZero: true })]
      : []),

    mkRow("total_dettes", "Total des dettes", "subtotal", totalDettes),
    mkRow("total_passif", "TOTAL PASSIF", "highlight", totalPassif),
  ];

  return { yearLabels, rows, equilibre };
}
