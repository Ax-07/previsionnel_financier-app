#!/usr/bin/env python3
"""Corrige les commentaires UTF-8 corrompus dans tresorerie.ts"""
import os

path = os.path.join(
    r"e:\Projet Nextjs\Clone RCA previsionnel",
    "previsionnel-app",
    "src",
    "app",
    "actions",
    "controle",
    "tresorerie.ts",
)

content = '''"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildMonthLabels, subSeries } from "@/lib/finance/calculs/monthly";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import {
  buildTemporelCtx,
  calcEncaissements,
  calcAchatsRaw,
  calcEncoursFournisseurs,
} from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { buildTresorerieRows } from "@/lib/finance/calculs/tresorerie-rows";

// \u2500\u2500 R\u00e9-export des types publics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export type { TresorerieValue, TresorerieRowStyle, TresorerieRow, TresorerieData } from "@/lib/finance/tresorerie-types";
import type { TresorerieData } from "@/lib/finance/tresorerie-types";

// \u2500\u2500 Server Action \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export async function fetchTresorerie(
  dossierId: string,
  moisPaiementSalaires = 0,
  preloadedData?: ScenarioFinData,
): Promise<TresorerieData> {
  const data = preloadedData ?? (await fetchScenarioData(dossierId));
  const { dateDemarrage, scenario } = data;

  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";
  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth();

  const yearLabels = {
    y1: `${anneeDebut}`,
    y2: `${anneeDebut + 1}`,
    y3: `${anneeDebut + 2}`,
  };
  const monthLabels = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  const ctx = buildTemporelCtx(dateDemarrage, isFranchise);

  // \u2500\u2500 Encaissements \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const enc = calcEncaissements(data, ctx);

  // \u2500\u2500 D\u00e9caissements \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const dec = calcDecaissements(data, ctx, moisPaiementSalaires);

  // \u2500\u2500 Solde mensuel cumul\u00e9 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const variation = {
    y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
    y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
    y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
  };
  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);
  const soldePrecedent = { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent };
  const soldeFinal = { y1: y1Sol.soldeFinal, y2: y2Sol.soldeFinal, y3: y3Sol.soldeFinal };

  // \u2500\u2500 Encours fournisseurs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const coefTVAMoy = isFranchise ? 1 : 1.2;
  const decAchatsRaw = calcAchatsRaw(data.activites);
  const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats, coefTVAMoy);

  // \u2500\u2500 Construction des lignes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const rows = buildTresorerieRows({
    enc,
    dec,
    soldePrecedent,
    variation,
    soldeFinal,
    encoursFournisseurs,
    immosParNature: dec.immosParNature,
  });

  return { yearLabels, monthLabels, rows };
}
'''

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("tresorerie.ts fixed successfully")
