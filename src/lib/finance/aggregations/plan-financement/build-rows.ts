/**
 * Construction des lignes de présentation du Plan de Financement.
 *
 * Responsabilité unique : assembler les données financières en une
 * structure `PfData` consommable par le composant UI.
 *
 * @module aggregations/plan-financement/build-rows
 */

import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { mkFinRow, buildFinancementBase } from "../helpers/financement-helpers";
import type { FinKey, FinRow } from "../helpers/financement-helpers";
import type { PfData } from "./types";

export function buildPlanFinancementRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): PfData {
  const base = buildFinancementBase(data, fc);
  const {
    yearLabels,
    caf,
    apportsCapital,
    apportsCC,
    nouveauxEmprunts,
    remboursementCapital,
    immoIncorporelles,
    immoCorporelles,
    immoFinancieres,
    totalImmo,
    immoIncorporellesChildren,
    immoCorporellesChildren,
    immoFinancieresChildren,
    subventionsInvest,
    totalRessources,
  } = base;

  const variationBFR = fc.variationBFR;

  const totalBesoins: Record<FinKey, number> = {
    y0: totalImmo.y0 + variationBFR.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + variationBFR.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + variationBFR.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + variationBFR.y3 + remboursementCapital.y3,
  };

  const variationTresorerie: Record<FinKey, number> = {
    y0: totalRessources.y0 - totalBesoins.y0,
    y1: totalRessources.y1 - totalBesoins.y1,
    y2: totalRessources.y2 - totalBesoins.y2,
    y3: totalRessources.y3 - totalBesoins.y3,
  };

  const soldeTresorerie: Record<FinKey, number> = {
    y0: variationTresorerie.y0,
    y1: variationTresorerie.y0 + variationTresorerie.y1,
    y2: variationTresorerie.y0 + variationTresorerie.y1 + variationTresorerie.y2,
    y3: variationTresorerie.y0 + variationTresorerie.y1 + variationTresorerie.y2 + variationTresorerie.y3,
  };

  const rows: FinRow[] = [
    mkFinRow("immo_incorporelles", "Immobilisations incorporelles", "+", "normal", immoIncorporelles, true, immoIncorporellesChildren),
    mkFinRow("immo_corporelles", "Immobilisations corporelles", "+", "normal", immoCorporelles, true, immoCorporellesChildren),
    mkFinRow("immo_financieres", "Immobilisations financières", "+", "normal", immoFinancieres, true, immoFinancieresChildren),
    mkFinRow("total_immo", "Total immobilisations", "=", "subtotal", totalImmo, true),
    mkFinRow("variation_bfr", "Variation du BFR", "+", "normal", variationBFR, true),
    mkFinRow("remboursement_capital", "Remboursement des emprunts", "+", "normal", remboursementCapital, true),
    mkFinRow("total_besoins", "Total des besoins", "=", "highlight", totalBesoins),
    mkFinRow("section_ressources", "RESSOURCES", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("apports_capital", "Apports en capital", "+", "normal", apportsCapital, true),
    mkFinRow("apports_cc", "Apports en comptes courants", "+", "normal", apportsCC, true),
    mkFinRow("nouveaux_emprunts", "Souscription d'emprunts", "+", "normal", nouveauxEmprunts, true),
    mkFinRow("subventions_invest", "Subventions d'investissement", "+", "normal", subventionsInvest, true),
    mkFinRow("caf", "Capacité d'autofinancement (CAF)", "+", "normal", caf, true),
    mkFinRow("total_ressources", "Total des ressources", "=", "highlight", totalRessources),
    mkFinRow("section_tresorerie", "TRÉSORERIE", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("variation_tresorerie", "Variation de trésorerie", "=", "subtotal", variationTresorerie),
    mkFinRow("solde_tresorerie", "Solde de trésorerie", "=", "highlight", soldeTresorerie),
  ];

  return { yearLabels, rows };
}
