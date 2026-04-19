/**
 * Construction des lignes de présentation du Bilan prévisionnel.
 *
 * Responsabilité unique : assembler les résultats des calculs de bilan en une
 * structure `BilanData` consommable par le composant UI.
 *
 * @module aggregations/bilan/build-rows
 */

import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildBilanContext } from "./context";
import { mkRow } from "./helpers";
import { zeroAcc, type YearAcc } from "@/lib/finance/utils";
import type { BilanRow, BilanData } from "./types";

export function buildBilanRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): BilanData {
  const yearLabels = fc.yearLabels;
  const ctx = buildBilanContext(data, fc);

  const {
    bfr,
    immos,
    capitalRestantDu,
    provisionsCumul,
    capitalSocial,
    comptesCoursants,
    reportANouveau,
    capitauxPropres,
    disponibilites,
    decouvert,
    stocks,
    creditTVA,
    creancesClients,
    totalDettesExploitation,
    actifCirculant,
    totalActif,
    totalDettes,
  } = ctx;

  const dettesFournisseurs: YearAcc = bfr.dettesFournisseurs;
  const dettesChargesExternes: YearAcc = bfr.dettesChargesExternes;
  const dettesPersonnel: YearAcc = bfr.dettesPersonnel;
  const dettesImpots: YearAcc = bfr.dettesImpots;
  const tvaAPayer: YearAcc = bfr.tvaAPayer;
  const dettesIS: YearAcc = bfr.dettesIS;

  const totalPassif: YearAcc = {
    y1: capitauxPropres.y1 + provisionsCumul.y1 + totalDettes.y1,
    y2: capitauxPropres.y2 + provisionsCumul.y2 + totalDettes.y2,
    y3: capitauxPropres.y3 + provisionsCumul.y3 + totalDettes.y3,
  };
  const equilibre: Record<YearKey, boolean> = {
    y1: Math.abs(totalActif.y1 - totalPassif.y1) < 1,
    y2: Math.abs(totalActif.y2 - totalPassif.y2) < 1,
    y3: Math.abs(totalActif.y3 - totalPassif.y3) < 1,
  };

  const rows: BilanRow[] = [
    // ── ACTIF ───────────────────────────────────────────────────────────────
    mkRow("section_actif", "ACTIF", "section", zeroAcc()),

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
    mkRow("section_passif", "PASSIF", "section", zeroAcc()),

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
