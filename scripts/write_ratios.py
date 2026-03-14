#!/usr/bin/env python3
"""Refactorise ratios.ts pour déléguer à calcBfr et fc"""
import os

path = os.path.join(
    r"e:\Projet Nextjs\Clone RCA previsionnel",
    "previsionnel-app",
    "src",
    "app",
    "actions",
    "controle",
    "ratios.ts",
)

content = '''"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { calcBfr } from "@/lib/finance/calculs/bfr";

// \u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export interface RatioValue {
  /** Valeur calcul\u00e9e (null si d\u00e9nominateur = 0) */
  value: number | null;
}

export interface RatioRow {
  key: string;
  label: string;
  /** Unit\u00e9 affich\u00e9e : "jours", "%", "ann\u00e9es" */
  unit: string;
  /** Nombre de d\u00e9cimales */
  decimals: number;
  values: Record<YearKey, RatioValue>;
}

export interface RatiosData {
  yearLabels: Record<YearKey, string>;
  rows: RatioRow[];
}

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

/** Division s\u00e9curis\u00e9e \u2014 renvoie null si le d\u00e9nominateur vaut 0 */
function safeDiv(num: number, den: number): number | null {
  return Math.abs(den) < 0.001 ? null : num / den;
}

function mkRow(
  key: string,
  label: string,
  unit: string,
  decimals: number,
  vals: Record<YearKey, number | null>,
): RatioRow {
  return {
    key,
    label,
    unit,
    decimals,
    values: {
      y1: { value: vals.y1 },
      y2: { value: vals.y2 },
      y3: { value: vals.y3 },
    },
  };
}

// \u2500\u2500 Server Action \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export async function fetchRatios(
  dossierId: string,
  preloadedData?: ScenarioFinData,
): Promise<RatiosData> {
  const data = preloadedData ?? (await fetchScenarioData(dossierId));
  const { immobilisations, emprunts, apports } = data;

  const fc = buildFinCalc(data, data.dateDemarrage);
  const { yearLabels, anneeDebut, exBorne1, exBorne2, exBorne3 } = fc;

  // Source unique de v\u00e9rit\u00e9 pour les calculs BFR (stocks, dettes, TVA)
  const bfr = calcBfr(data, fc);

  // \u2500\u2500 Achats annuels bruts (sans variation stock) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const achatsRows = bfr.achatsRows;
  const stocks = bfr.stocksMatieres;

  const achatsAnnuels: YAcc = {
    y1: achatsRows.reduce((s: number, r) => s + r.montantN * r.coef, 0),
    y2: achatsRows.reduce((s: number, r) => s + r.montantN1 * r.coef, 0),
    y3: achatsRows.reduce((s: number, r) => s + r.montantN2 * r.coef, 0),
  };

  // Achats consomm\u00e9s (variation de stocks incluse)
  const achatsConsommes: YAcc = {
    y1: achatsAnnuels.y1 - stocks.y1,
    y2: achatsAnnuels.y2 + stocks.y1 - stocks.y2,
    y3: achatsAnnuels.y3 + stocks.y2 - stocks.y3,
  };

  // \u2500\u2500 Capital restant d\u00fb en fin d\'exercice \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const capitalRestantDu: YAcc = { ...zero };
  for (const emprunt of emprunts) {
    let cumY1 = 0, cumY2 = 0, cumY3 = 0;
    for (const ligne of emprunt.lignesEcheancier) {
      const dl = new Date(String(ligne.dateEcheance));
      const cap = n(ligne.capitalRembourse);
      if (dl < exBorne1) cumY1 += cap;
      if (dl < exBorne2) cumY2 += cap;
      if (dl < exBorne3) cumY3 += cap;
    }
    const total = n(emprunt.montant);
    capitalRestantDu.y1 += Math.max(0, total - cumY1);
    capitalRestantDu.y2 += Math.max(0, total - cumY2);
    capitalRestantDu.y3 += Math.max(0, total - cumY3);
  }

  // \u2500\u2500 Agr\u00e9gats depuis buildFinCalc \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const resultatNet = fc.resNet;
  const caf = fc.caf;

  // \u2500\u2500 Immobilisations nettes en fin d\'exercice \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const immoNette: YAcc = { ...zero };
  for (const immo of immobilisations) {
    const montant = n(immo.montantHT);
    const dAcq = new Date(String(immo.dateAcquisition));
    if (dAcq < exBorne1) immoNette.y1 += montant;
    if (dAcq < exBorne2) immoNette.y2 += montant;
    if (dAcq < exBorne3) immoNette.y3 += montant;
  }
  const amortCumul: YAcc = { ...zero };
  for (const immo of immobilisations) {
    for (const ligne of immo.lignesAmortissement) {
      const dot = n(ligne.dotationAnnuelle);
      if (ligne.annee <= anneeDebut) amortCumul.y1 += dot;
      if (ligne.annee <= anneeDebut + 1) amortCumul.y2 += dot;
      if (ligne.annee <= anneeDebut + 2) amortCumul.y3 += dot;
    }
  }
  const immoNetteFin: YAcc = {
    y1: Math.max(0, immoNette.y1 - amortCumul.y1),
    y2: Math.max(0, immoNette.y2 - amortCumul.y2),
    y3: Math.max(0, immoNette.y3 - amortCumul.y3),
  };

  // \u2500\u2500 Tr\u00e9sorerie cumulative (plan de financement simplifi\u00e9) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const cafCumul: YAcc = { y1: caf.y1, y2: caf.y1 + caf.y2, y3: caf.y1 + caf.y2 + caf.y3 };
  const apportsCapital: YAcc = { ...zero };
  const apportsCC: YAcc = { ...zero };
  for (const apport of apports) {
    const dApp = new Date(String(apport.dateApport));
    const montant = n(apport.montant);
    const isCapital = apport.type === "CAPITAL" || apport.type === "APPORT_NATURE";
    if (dApp < exBorne1) { if (isCapital) apportsCapital.y1 += montant; else if (apport.type === "COMPTE_COURANT") apportsCC.y1 += montant; }
    if (dApp < exBorne2) { if (isCapital) apportsCapital.y2 += montant; else if (apport.type === "COMPTE_COURANT") apportsCC.y2 += montant; }
    if (dApp < exBorne3) { if (isCapital) apportsCapital.y3 += montant; else if (apport.type === "COMPTE_COURANT") apportsCC.y3 += montant; }
  }
  const empruntsDebloques: YAcc = { ...zero };
  const remboursementsCumul: YAcc = { ...zero };
  for (const emprunt of emprunts) {
    const dDeb = new Date(String(emprunt.dateDéblocage));
    const montant = n(emprunt.montant);
    if (dDeb < exBorne1) empruntsDebloques.y1 += montant;
    if (dDeb < exBorne2) empruntsDebloques.y2 += montant;
    if (dDeb < exBorne3) empruntsDebloques.y3 += montant;
    for (const ligne of emprunt.lignesEcheancier) {
      const dl = new Date(String(ligne.dateEcheance));
      const cap = n(ligne.capitalRembourse);
      if (dl < exBorne1) remboursementsCumul.y1 += cap;
      if (dl < exBorne2) remboursementsCumul.y2 += cap;
      if (dl < exBorne3) remboursementsCumul.y3 += cap;
    }
  }
  const immoAcquises: YAcc = { ...zero };
  for (const immo of immobilisations) {
    const dAcq = new Date(String(immo.dateAcquisition));
    const montant = n(immo.montantHT);
    if (dAcq < exBorne1) immoAcquises.y1 += montant;
    if (dAcq < exBorne2) immoAcquises.y2 += montant;
    if (dAcq < exBorne3) immoAcquises.y3 += montant;
  }
  const variationBFR: YAcc = { y1: stocks.y1, y2: stocks.y2 - stocks.y1, y3: stocks.y3 - stocks.y2 };
  const tresorerie: YAcc = {
    y1: apportsCapital.y1 + apportsCC.y1 + empruntsDebloques.y1 + cafCumul.y1 - immoAcquises.y1 - variationBFR.y1 - remboursementsCumul.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + empruntsDebloques.y2 + cafCumul.y2 - immoAcquises.y2 - (variationBFR.y1 + variationBFR.y2) - remboursementsCumul.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + empruntsDebloques.y3 + cafCumul.y3 - immoAcquises.y3 - (variationBFR.y1 + variationBFR.y2 + variationBFR.y3) - remboursementsCumul.y3,
  };

  const actifCirculant: YAcc = {
    y1: stocks.y1 + Math.max(0, tresorerie.y1),
    y2: stocks.y2 + Math.max(0, tresorerie.y2),
    y3: stocks.y3 + Math.max(0, tresorerie.y3),
  };
  const totalActif: YAcc = {
    y1: immoNetteFin.y1 + actifCirculant.y1,
    y2: immoNetteFin.y2 + actifCirculant.y2,
    y3: immoNetteFin.y3 + actifCirculant.y3,
  };

  // Capitaux propres
  const reportANouveau: YAcc = { y1: 0, y2: resultatNet.y1, y3: resultatNet.y1 + resultatNet.y2 };
  const capitauxPropres: YAcc = {
    y1: apportsCapital.y1 + apportsCC.y1 + reportANouveau.y1 + resultatNet.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + reportANouveau.y2 + resultatNet.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + reportANouveau.y3 + resultatNet.y3,
  };

  // \u2500\u2500 Dettes d\'exploitation (source : calcBfr) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const totalDettesExploitation: YAcc = {
    y1: bfr.dettesFournisseurs.y1 + bfr.dettesChargesExternes.y1 + bfr.dettesPersonnel.y1 + bfr.dettesImpots.y1 + bfr.tvaAPayer.y1 + bfr.dettesIS.y1,
    y2: bfr.dettesFournisseurs.y2 + bfr.dettesChargesExternes.y2 + bfr.dettesPersonnel.y2 + bfr.dettesImpots.y2 + bfr.tvaAPayer.y2 + bfr.dettesIS.y2,
    y3: bfr.dettesFournisseurs.y3 + bfr.dettesChargesExternes.y3 + bfr.dettesPersonnel.y3 + bfr.dettesImpots.y3 + bfr.tvaAPayer.y3 + bfr.dettesIS.y3,
  };
  const totalDettes: YAcc = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3,
  };

  // \u2500\u2500 Construction des lignes de ratios \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const rows: RatioRow[] = [
    // \u2500\u2500 Rotation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    mkRow(
      "delai_stocks",
      "D\u00e9lai des stocks de mati\u00e8res",
      "jours",
      1,
      {
        y1: safeDiv(stocks.y1 * 365, achatsConsommes.y1),
        y2: safeDiv(stocks.y2 * 365, achatsConsommes.y2),
        y3: safeDiv(stocks.y3 * 365, achatsConsommes.y3),
      },
    ),
    mkRow(
      "delai_fournisseurs",
      "D\u00e9lai des dettes fournisseurs",
      "jours",
      1,
      {
        y1: safeDiv(bfr.dettesFournisseurs.y1 * 365, achatsAnnuels.y1),
        y2: safeDiv(bfr.dettesFournisseurs.y2 * 365, achatsAnnuels.y2),
        y3: safeDiv(bfr.dettesFournisseurs.y3 * 365, achatsAnnuels.y3),
      },
    ),
    // \u2500\u2500 Structure financi\u00e8re \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    mkRow(
      "autonomie_lt",
      "Autonomie financi\u00e8re \u00e0 long terme",
      "%",
      1,
      {
        y1: safeDiv(capitauxPropres.y1 * 100, totalActif.y1),
        y2: safeDiv(capitauxPropres.y2 * 100, totalActif.y2),
        y3: safeDiv(capitauxPropres.y3 * 100, totalActif.y3),
      },
    ),
    mkRow(
      "solvabilite_mt",
      "Solvabilit\u00e9 \u00e0 moyen terme",
      "%",
      1,
      {
        y1: safeDiv(totalActif.y1 * 100, totalDettes.y1),
        y2: safeDiv(totalActif.y2 * 100, totalDettes.y2),
        y3: safeDiv(totalActif.y3 * 100, totalDettes.y3),
      },
    ),
    mkRow(
      "solvabilite_ct",
      "Solvabilit\u00e9 \u00e0 court terme",
      "%",
      1,
      {
        y1: safeDiv(actifCirculant.y1 * 100, totalDettesExploitation.y1),
        y2: safeDiv(actifCirculant.y2 * 100, totalDettesExploitation.y2),
        y3: safeDiv(actifCirculant.y3 * 100, totalDettesExploitation.y3),
      },
    ),
    mkRow(
      "taux_endettement",
      "Taux d\'endettement",
      "%",
      1,
      {
        y1: safeDiv(totalDettes.y1 * 100, capitauxPropres.y1),
        y2: safeDiv(totalDettes.y2 * 100, capitauxPropres.y2),
        y3: safeDiv(totalDettes.y3 * 100, capitauxPropres.y3),
      },
    ),
    // \u2500\u2500 Capacit\u00e9 de remboursement \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    mkRow(
      "capacite_remboursement",
      "Capacit\u00e9 de remboursement",
      "ann\u00e9es",
      2,
      {
        y1: safeDiv(capitalRestantDu.y1, caf.y1),
        y2: safeDiv(capitalRestantDu.y2, caf.y2),
        y3: safeDiv(capitalRestantDu.y3, caf.y3),
      },
    ),
  ];

  return { yearLabels, rows };
}
'''

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("ratios.ts refactored successfully")
