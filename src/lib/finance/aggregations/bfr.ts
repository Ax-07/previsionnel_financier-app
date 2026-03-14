/**
 * Construction des lignes de présentation du Besoin en Fonds de Roulement (BFR).
 *
 * Responsabilité unique : assembler les résultats de `calcBfr()` en une
 * structure `BfrData` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/bfr
 * @extracted-from app/actions/controle/bfr.ts
 */

import type { YearKey4 as YearKey } from "@/lib/finance/utils";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BfrRowValue {
  amount: number;
}

export interface BfrRow {
  key: string;
  label: string;
  sign: "+" | "−" | "=" | "";
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → ligne clé (BFR)
   * section   → en-tête de section (bandeau)
   */
  style: "normal" | "subtotal" | "highlight" | "section";
  values: Record<YearKey, BfrRowValue>;
  hideIfZero?: boolean;
  children?: BfrRow[];
}

export interface BfrData {
  yearLabels: Record<YearKey, string>;
  rows: BfrRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkRow(
  key: string,
  label: string,
  sign: BfrRow["sign"],
  style: BfrRow["style"],
  vals: Record<YearKey, number>,
  hideIfZero?: boolean,
  children?: BfrRow[],
): BfrRow {
  return {
    key,
    label,
    sign,
    style,
    values: {
      y0: { amount: vals.y0 },
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    hideIfZero,
    children,
  };
}

type YearAcc = { y0: number; y1: number; y2: number; y3: number };
const zero: YearAcc = { y0: 0, y1: 0, y2: 0, y3: 0 };

// ── Builder principal ─────────────────────────────────────────────────────────

export function buildBfrRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): BfrData {
  const bfrCalc = calcBfr(data, fc);
  const yearLabels: Record<YearKey, string> = { y0: "Initial", ...fc.yearLabels };

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

  // Drill-down stocks : dernier mois réel × délai/30 — conforme §12.2 (pré-calculé dans calcBfr)
  // y0 = ponctuelN[0] (mois de démarrage) traité comme BFR initial pour l'activité
  const stocksChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(
      `stocks_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: r.stockPonctuelY0,
        y1: r.m11StockY1,
        y2: r.m11StockY2,
        y3: r.m11StockY3,
      },
      true,
    ),
  );

  // Drill-down dettes fournisseurs : dernier mois réel × délai/30 — conforme §12.3
  const dettesFournisseursChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(
      `fournisseurs_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: 0,
        y1: r.m11FournY1,
        y2: r.m11FournY2,
        y3: r.m11FournY3,
      },
      true,
    ),
  );

  // Drill-down charges externes : dernier mois série réelle × délai/30 — conforme §12.2
  const dettesChargesExtChildren: BfrRow[] = chargesExtRows.map((r, i) =>
    mkRow(
      `charges_ext_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: 0,
        y1: r.m11ChargeY1,
        y2: r.m11ChargeY2,
        y3: r.m11ChargeY3,
      },
      true,
    ),
  );

  // ── Construction des lignes ─────────────────────────────────────────────────
  const rows: BfrRow[] = [
    // ── Besoins ──────────────────────────────────────────────────────────────
    mkRow("section_besoins", "BESOINS D'EXPLOITATION", "", "section", zero),
    mkRow("stocks", "Stocks de matières", "", "normal", stocksMatieres, true,
      stocksChildren.length > 0 ? stocksChildren : undefined),
    mkRow("credit_tva", "Crédit de TVA", "", "normal", creditTVA, true),
    mkRow("total_besoins", "Total des besoins", "=", "subtotal", totalBesoins),

    // ── Ressources ────────────────────────────────────────────────────────────
    mkRow("section_ressources", "RESSOURCES D'EXPLOITATION", "", "section", zero),
    mkRow(
      "dettes_fournisseurs",
      "Dettes fournisseurs (achats matières)",
      "",
      "normal",
      dettesFournisseurs,
      true,
      dettesFournisseursChildren.length > 0 ? dettesFournisseursChildren : undefined,
    ),
    mkRow(
      "dettes_charges_ext",
      "Dettes charges externes",
      "",
      "normal",
      dettesChargesExternes,
      true,
      dettesChargesExtChildren.length > 0 ? dettesChargesExtChildren : undefined,
    ),
    mkRow("dettes_impots", "Dettes impôts et taxes", "", "normal", dettesImpots, true),
    mkRow("dettes_personnel", "Dettes personnel", "", "normal", dettesPersonnel, true),
    mkRow("tva_a_payer", "TVA à payer", "", "normal", tvaAPayer, false),
    ...(data.isIS
      ? [mkRow("dettes_is", "Impôt sur les sociétés (dette)", "", "normal", dettesIS, true)]
      : []),
    mkRow("total_ressources", "Total des ressources", "=", "subtotal", totalRessources),

    // ── BFR ──────────────────────────────────────────────────────────────────
    mkRow("variation_bfr", "Variation du BFR", "", "normal", variationBFR),
    mkRow("bfr", "Besoin en fonds de roulement (BFR)", "=", "highlight", bfr),
  ];

  return { yearLabels, rows };
}
