/**
 * Construction des lignes de présentation des Ratios financiers.
 *
 * Responsabilité unique : assembler les résultats des calculs de bilan/BFR en une
 * structure `RatiosData` consommable par le composant UI.
 *
 * @module aggregations/ratios/build-rows
 */

import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildBilanContext } from "../bilan/context";
import { mkRow, safeDiv } from "./helpers";
import type { YearAcc } from "@/lib/finance/utils";
import type { RatiosData } from "./types";

export function buildRatiosRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): RatiosData {
  const { yearLabels } = fc;
  const ctx = buildBilanContext(data, fc);

  const {
    bfr,
    capitalRestantDu,
    capitauxPropres,
    stocks,
    totalDettesExploitation,
    actifCirculant,
    totalActif,
    totalDettes,
  } = ctx;

  const caf = fc.caf;
  const resultatNet = fc.resNet;

  // ── Achats annuels bruts ──────────────────────────────────────────────────
  const achatsRows = bfr.achatsRows;
  const achatsConsommes: YearAcc = {
    y1: achatsRows.reduce((s: number, r) => s + r.montantN * r.coef, 0),
    y2: achatsRows.reduce((s: number, r) => s + r.montantN1 * r.coef, 0),
    y3: achatsRows.reduce((s: number, r) => s + r.montantN2 * r.coef, 0),
  };
  const achatsEffectuesHT: YearAcc = {
    y1: achatsConsommes.y1 + stocks.y1,
    y2: achatsConsommes.y2 + stocks.y2 - stocks.y1,
    y3: achatsConsommes.y3 + stocks.y3 - stocks.y2,
  };

  const rows = [
    // ── Rotation ─────────────────────────────────────────────────────────────
    mkRow("delai_stocks", "Délai des stocks de matières", "jours", 1, {
      y1: safeDiv(stocks.y1 * 365, achatsEffectuesHT.y1),
      y2: safeDiv(stocks.y2 * 365, achatsEffectuesHT.y2),
      y3: safeDiv(stocks.y3 * 365, achatsEffectuesHT.y3),
    }),
    mkRow("delai_fournisseurs", "Délai des dettes fournisseurs", "jours", 1, {
      y1: safeDiv(bfr.dettesFournisseurs.y1 * 365, achatsEffectuesHT.y1),
      y2: safeDiv(bfr.dettesFournisseurs.y2 * 365, achatsEffectuesHT.y2),
      y3: safeDiv(bfr.dettesFournisseurs.y3 * 365, achatsEffectuesHT.y3),
    }),
    // ── Structure financière ──────────────────────────────────────────────────
    mkRow("autonomie_lt", "Autonomie financière à long terme", "%", 1, {
      y1: safeDiv(capitauxPropres.y1 * 100, totalActif.y1),
      y2: safeDiv(capitauxPropres.y2 * 100, totalActif.y2),
      y3: safeDiv(capitauxPropres.y3 * 100, totalActif.y3),
    }),
    mkRow("solvabilite_mt", "Solvabilité à moyen terme", "%", 1, {
      y1: safeDiv(totalActif.y1 * 100, totalDettes.y1),
      y2: safeDiv(totalActif.y2 * 100, totalDettes.y2),
      y3: safeDiv(totalActif.y3 * 100, totalDettes.y3),
    }),
    mkRow("solvabilite_ct", "Solvabilité à court terme", "%", 1, {
      y1: safeDiv(actifCirculant.y1 * 100, totalDettesExploitation.y1),
      y2: safeDiv(actifCirculant.y2 * 100, totalDettesExploitation.y2),
      y3: safeDiv(actifCirculant.y3 * 100, totalDettesExploitation.y3),
    }),
    mkRow("taux_endettement", "Taux d'endettement", "%", 1, {
      y1: safeDiv(totalDettes.y1 * 100, capitauxPropres.y1),
      y2: safeDiv(totalDettes.y2 * 100, capitauxPropres.y2),
      y3: safeDiv(totalDettes.y3 * 100, capitauxPropres.y3),
    }),
    // ── Capacité de remboursement ─────────────────────────────────────────────
    mkRow("capacite_remboursement", "Capacité de remboursement", "années", 2, {
      y1: safeDiv(capitalRestantDu.y1, caf.y1),
      y2: safeDiv(capitalRestantDu.y2, caf.y2),
      y3: safeDiv(capitalRestantDu.y3, caf.y3),
    }),
  ];

  return { yearLabels, rows };
}
