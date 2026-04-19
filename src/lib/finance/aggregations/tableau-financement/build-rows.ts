/**
 * Construction des lignes de présentation du Tableau de Financement.
 *
 * Responsabilité unique : assembler les données financières en une
 * structure `TfData` consommable par le composant UI.
 *
 * @module aggregations/tableau-financement/build-rows
 */

import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { mkFinRow, buildFinancementBase } from "../helpers/financement-helpers";
import type { FinKey, FinRow } from "../helpers/financement-helpers";
import type { TfData } from "./types";

export function buildTableauFinancementRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): TfData {
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

  const totalEmplois: Record<FinKey, number> = {
    y0: totalImmo.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + remboursementCapital.y3,
  };

  const variationFR: Record<FinKey, number> = {
    y0: totalRessources.y0 - totalEmplois.y0,
    y1: totalRessources.y1 - totalEmplois.y1,
    y2: totalRessources.y2 - totalEmplois.y2,
    y3: totalRessources.y3 - totalEmplois.y3,
  };

  const fondRoulement: Record<FinKey, number> = {
    y0: variationFR.y0,
    y1: variationFR.y0 + variationFR.y1,
    y2: variationFR.y0 + variationFR.y1 + variationFR.y2,
    y3: variationFR.y0 + variationFR.y1 + variationFR.y2 + variationFR.y3,
  };

  const rows: FinRow[] = [
    mkFinRow("section_ressources", "RESSOURCES", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("apports_capital", "Apports en capital", "+", "normal", apportsCapital, true),
    mkFinRow("apports_cc", "Apports en comptes courants", "+", "normal", apportsCC, true),
    mkFinRow("nouveaux_emprunts", "Souscription d'emprunts", "+", "normal", nouveauxEmprunts, true),
    mkFinRow("subventions_invest", "Subventions d'investissement", "+", "normal", subventionsInvest, true),
    mkFinRow("caf", "Capacité d'autofinancement (CAF)", "+", "normal", caf, true),
    mkFinRow("total_ressources", "Total des ressources", "=", "highlight", totalRessources),
    mkFinRow("section_emplois", "EMPLOIS", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("immo_incorporelles", "Immobilisations incorporelles", "+", "normal", immoIncorporelles, true, immoIncorporellesChildren),
    mkFinRow("immo_corporelles", "Immobilisations corporelles", "+", "normal", immoCorporelles, true, immoCorporellesChildren),
    mkFinRow("immo_financieres", "Immobilisations financières", "+", "normal", immoFinancieres, true, immoFinancieresChildren),
    mkFinRow("total_immo", "Total immobilisations", "=", "subtotal", totalImmo, true),
    mkFinRow("remboursement_capital", "Remboursement des emprunts", "+", "normal", remboursementCapital, true),
    mkFinRow("total_emplois", "Total des emplois", "=", "highlight", totalEmplois),
    mkFinRow("section_fr", "FONDS DE ROULEMENT", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("variation_fr", "Variation du fonds de roulement", "=", "subtotal", variationFR),
    mkFinRow("fonds_roulement", "Fonds de roulement", "=", "highlight", fondRoulement),
  ];

  return { yearLabels, rows };
}
