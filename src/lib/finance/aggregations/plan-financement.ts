/**
 * Construction des lignes de présentation du Plan de Financement.
 *
 * Responsabilité unique : assembler les données financières en une
 * structure `PfData` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/plan-financement
 * @extracted-from app/actions/controle/plan-financement.ts
 */

import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  mkFinRow,
  buildToKeyY0,
  buildApportsData,
  buildEmpruntsData,
  buildImmoData,
  buildSubventionsInvestData,
} from "./financement-helpers";
import type { FinKey, FinRow } from "./financement-helpers";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PfData {
  yearLabels: Record<FinKey, string>;
  rows: FinRow[];
}

// Re-exports utiles pour les consommateurs
export type { FinRow as PfRow, FinRowValue as PfRowValue } from "./financement-helpers";

// ── Builder principal ─────────────────────────────────────────────────────────

export function buildPlanFinancementRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): PfData {
  const { dateDemarrage, apports, subventions, emprunts, immobilisations } = data;
  const yearLabels: Record<FinKey, string> = { y0: "Initial", ...fc.yearLabels };

  const toKey = buildToKeyY0(dateDemarrage, fc.exBorne1, fc.exBorne2, fc.exBorne3);

  const { apportsCapital, apportsCC } = buildApportsData(apports, subventions, toKey);
  const { nouveauxEmprunts, remboursementCapital } = buildEmpruntsData(emprunts, toKey);
  const { immoIncorporelles, immoCorporelles, totalImmo } = buildImmoData(immobilisations, toKey);
  const subventionsInvest = buildSubventionsInvestData(subventions, toKey);

  const caf: Record<FinKey, number> = { y0: 0, y1: fc.caf.y1, y2: fc.caf.y2, y3: fc.caf.y3 };
  const { variationBFR } = calcBfr(data, fc);

  const totalBesoins: Record<FinKey, number> = {
    y0: totalImmo.y0 + variationBFR.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + variationBFR.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + variationBFR.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + variationBFR.y3 + remboursementCapital.y3,
  };

  const totalRessources: Record<FinKey, number> = {
    y0: apportsCapital.y0 + apportsCC.y0 + nouveauxEmprunts.y0 + caf.y0 + subventionsInvest.y0,
    y1: apportsCapital.y1 + apportsCC.y1 + nouveauxEmprunts.y1 + caf.y1 + subventionsInvest.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + nouveauxEmprunts.y2 + caf.y2 + subventionsInvest.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + nouveauxEmprunts.y3 + caf.y3 + subventionsInvest.y3,
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
    mkFinRow("section_besoins", "BESOINS", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("immo_incorporelles", "Immobilisations incorporelles", "+", "normal", immoIncorporelles, true),
    mkFinRow("immo_corporelles", "Immobilisations corporelles", "+", "normal", immoCorporelles, true),
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
