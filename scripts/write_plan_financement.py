#!/usr/bin/env python3
# Script temporaire pour réécrire plan-financement.ts proprement
import os

path = os.path.join(
    r"e:\Projet Nextjs\Clone RCA previsionnel",
    "previsionnel-app",
    "src",
    "app",
    "actions",
    "controle",
    "plan-financement.ts",
)

content = '''"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  mkFinRow,
  buildToKeyY0,
  buildApportsData,
  buildEmpruntsData,
  buildImmoData,
} from "./financement/helpers";
import type { FinKey, FinRow } from "./financement/helpers";

export type { FinRow as PfRow, FinRowValue as PfRowValue } from "./financement/helpers";

export interface PfData {
  yearLabels: Record<FinKey, string>;
  rows: FinRow[];
}

export async function fetchPlanFinancement(
  dossierId: string,
  preloadedData?: ScenarioFinData,
): Promise<PfData> {
  const data = preloadedData ?? (await fetchScenarioData(dossierId));
  const { dateDemarrage, apports, subventions, emprunts, immobilisations } = data;

  const fc = buildFinCalc(data, dateDemarrage);
  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth();

  const fmtEx = (start: number) =>
    moisDebut === 0 ? `${start}` : `${start}\\u2013${start + 1}`;

  const yearLabels: Record<FinKey, string> = {
    y0: "Initial",
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  const toKey = buildToKeyY0(dateDemarrage, fc.exBorne1, fc.exBorne2, fc.exBorne3);

  const { apportsCapital, apportsCC } = buildApportsData(apports, subventions, toKey);
  const { nouveauxEmprunts, remboursementCapital } = buildEmpruntsData(emprunts, toKey);
  const { immoIncorporelles, immoCorporelles, totalImmo } = buildImmoData(immobilisations, toKey);

  const caf: Record<FinKey, number> = { y0: 0, y1: fc.caf.y1, y2: fc.caf.y2, y3: fc.caf.y3 };
  const { variationBFR } = calcBfr(data, fc);

  const totalBesoins: Record<FinKey, number> = {
    y0: totalImmo.y0 + variationBFR.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + variationBFR.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + variationBFR.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + variationBFR.y3 + remboursementCapital.y3,
  };

  const totalRessources: Record<FinKey, number> = {
    y0: apportsCapital.y0 + apportsCC.y0 + nouveauxEmprunts.y0 + caf.y0,
    y1: apportsCapital.y1 + apportsCC.y1 + nouveauxEmprunts.y1 + caf.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + nouveauxEmprunts.y2 + caf.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + nouveauxEmprunts.y3 + caf.y3,
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
    mkFinRow("nouveaux_emprunts", "Souscription d\'emprunts", "+", "normal", nouveauxEmprunts, true),
    mkFinRow("caf", "Capacit\u00e9 d\'autofinancement (CAF)", "+", "normal", caf, true),
    mkFinRow("total_ressources", "Total des ressources", "=", "highlight", totalRessources),
    mkFinRow("section_tresorerie", "TR\u00c9SORERIE", "", "section", { y0: 0, y1: 0, y2: 0, y3: 0 }),
    mkFinRow("variation_tresorerie", "Variation de tr\u00e9sorerie", "=", "subtotal", variationTresorerie),
    mkFinRow("solde_tresorerie", "Solde de tr\u00e9sorerie", "=", "highlight", soldeTresorerie),
  ];

  return { yearLabels, rows };
}
'''

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("plan-financement.ts written successfully")
