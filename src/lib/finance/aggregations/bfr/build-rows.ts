/**
 * Construction des lignes de présentation du Besoin en Fonds de Roulement (BFR).
 *
 * Responsabilité unique : assembler les résultats de `calcBfr()` en une
 * structure `BfrData` consommable par le composant UI.
 *
 * @module aggregations/bfr/build-rows
 */

import { calcBfr } from "@/lib/finance/calculs/bfr";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { mkRow } from "./helpers";
import { zeroAcc4 } from "@/lib/finance/utils";
import type { BfrRow, BfrData } from "./types";

export function buildBfrRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): BfrData {
  const bfrCalc = calcBfr(data, fc);
  const yearLabels: BfrData["yearLabels"] = { y0: "Initial", ...fc.yearLabels };

  const {
    achatsRows,
    chargesExtRows,
    stocksMatieres,
    creditTVA,
    totalBesoins,
    dettesFournisseurs,
    dettesChargesExternes,
    dettesImpots,
    dettesPersonnel,
    tvaAPayer,
    dettesIS,
    totalRessources,
    bfr,
    variationBFR,
  } = bfrCalc;

  // ── Détail drill-down ────────────────────────────────────────────────────────

  const stocksChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(`stocks_child_${i}`, r.libelle, "", "normal",
      {
        y0: r.stockPonctuelY0,
        y1: r.m11StockY1,
        y2: r.m11StockY2,
        y3: r.m11StockY3,
      },
      { hideIfZero: true },
    ),
  );

  const dettesFournisseursChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(`fournisseurs_child_${i}`, r.libelle, "", "normal",
      {
        y0: 0,
        y1: r.m11FournY1,
        y2: r.m11FournY2,
        y3: r.m11FournY3,
      },
      { hideIfZero: true },
    ),
  );

  const dettesChargesExtChildren: BfrRow[] = chargesExtRows.map((r, i) =>
    mkRow(`charges_ext_child_${i}`, r.libelle, "", "normal",
      {
        y0: 0,
        y1: r.m11ChargeY1,
        y2: r.m11ChargeY2,
        y3: r.m11ChargeY3,
      },
      { hideIfZero: true },
    ),
  );

  // ── Construction des lignes ─────────────────────────────────────────────────
  const rows: BfrRow[] = [
    mkRow("section_besoins", "BESOINS D'EXPLOITATION", "", "section", zeroAcc4()),
    mkRow("stocks", "Stocks de matières", "", "normal", stocksMatieres,
      { hideIfZero: true, children: stocksChildren.length > 0 ? stocksChildren : undefined }),
    mkRow("credit_tva", "Crédit de TVA", "", "normal", creditTVA, { hideIfZero: true }),
    mkRow("total_besoins", "Total des besoins", "=", "subtotal", totalBesoins),

    mkRow("section_ressources", "RESSOURCES D'EXPLOITATION", "", "section", zeroAcc4()),
    mkRow(
      "dettes_fournisseurs",
      "Dettes fournisseurs (achats matières)",
      "",
      "normal",
      dettesFournisseurs,
      { hideIfZero: true, children: dettesFournisseursChildren.length > 0 ? dettesFournisseursChildren : undefined },
    ),
    mkRow(
      "dettes_charges_ext",
      "Dettes charges externes",
      "",
      "normal",
      dettesChargesExternes,
      { hideIfZero: true, children: dettesChargesExtChildren.length > 0 ? dettesChargesExtChildren : undefined },
    ),
    mkRow("dettes_impots", "Dettes impôts et taxes", "", "normal", dettesImpots, { hideIfZero: true }),
    mkRow("dettes_personnel", "Dettes personnel", "", "normal", dettesPersonnel, { hideIfZero: true }),
    mkRow("tva_a_payer", "TVA à payer", "", "normal", tvaAPayer),
    ...(data.isIS
      ? [mkRow("dettes_is", "Impôt sur les sociétés (dette)", "", "normal", dettesIS, { hideIfZero: true })]
      : []),
    mkRow("total_ressources", "Total des ressources", "=", "subtotal", totalRessources),

    mkRow("variation_bfr", "Variation du BFR", "", "normal", variationBFR),
    mkRow("bfr", "Besoin en fonds de roulement (BFR)", "=", "highlight", bfr),
  ];

  return { yearLabels, rows };
}
