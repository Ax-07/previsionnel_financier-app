"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { makeExerciceHelpers, n } from "@/lib/finance/utils";
import type { YearKey as BilanYearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BilanRowValue {
  amount: number;
}

export interface BilanRow {
  key: string;
  label: string;
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → total / ligne clé
   * section   → bandeau de section (ACTIF / PASSIF)
   * indent    → ligne de détail indentée
   */
  style: "normal" | "subtotal" | "highlight" | "section" | "indent";
  indent?: number;
  hideIfZero?: boolean;
  values: Record<BilanYearKey, BilanRowValue>;
}

export interface BilanData {
  yearLabels: Record<BilanYearKey, string>;
  rows: BilanRow[];
  /** Alerte si Total Actif ≠ Total Passif */
  equilibre: Record<BilanYearKey, boolean>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function mkRow(
  key: string,
  label: string,
  style: BilanRow["style"],
  vals: Record<BilanYearKey, number>,
  options?: { indent?: number; hideIfZero?: boolean },
): BilanRow {
  return {
    key,
    label,
    style,
    indent: options?.indent,
    hideIfZero: options?.hideIfZero,
    values: {
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
  };
}

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchBilan(dossierId: string, preloadedData?: ScenarioFinData): Promise<BilanData> {
  const data = preloadedData ?? await fetchScenarioData(dossierId);
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    apports,
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
  } = data;
  const immobilisationsActives = immobilisations.filter((i) => i.actif !== false);
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth(); // 0-based (0 = jan)
  const fmtEx = (start: number) =>
    moisDebut === 0 ? `${start}` : `${start}–${start + 1}`;
  const { exBorne1, exBorne2, exBorne3, pFin, pDeb, toExerciceKey } = makeExerciceHelpers(dateDemarrageDate);
  const yearLabels: Record<BilanYearKey, string> = {
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };
  const fc = buildFinCalc(data, data.dateDemarrage);

  // ══════════════════════════════════════════════════════════════════════════
  // ── ACTIF ─────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Immobilisations brutes ─────────────────────────────────────────────────
  const immoBruteIncorp: YAcc = { ...zero };
  const immoBruteCorp: YAcc = { ...zero };

  for (const immo of immobilisationsActives) {
    const dAcq = new Date(String(immo.dateAcquisition));
    const montant = n(immo.montantHT);
    if (immo.nature === "INCORPOREL") {
      if (dAcq < exBorne1) immoBruteIncorp.y1 += montant;
      if (dAcq < exBorne2) immoBruteIncorp.y2 += montant;
      if (dAcq < exBorne3) immoBruteIncorp.y3 += montant;
    } else {
      if (dAcq < exBorne1) immoBruteCorp.y1 += montant;
      if (dAcq < exBorne2) immoBruteCorp.y2 += montant;
      if (dAcq < exBorne3) immoBruteCorp.y3 += montant;
    }
  }

  // ── Amortissements cumulés — via distribuerAmortParExercice (mode réel) ──
  // Gère AUCUN, LINEAIRE et DEGRESSIF de façon cohérente avec monthly.ts.
  const dotIncorp: YAcc = { ...zero };
  const dotCorp: YAcc   = { ...zero };
  for (const immo of immobilisationsActives) {
    const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const acc = immo.nature === "INCORPOREL" ? dotIncorp : dotCorp;
    acc.y1 += dot.y1;
    acc.y2 += dot.y2;
    acc.y3 += dot.y3;
  }
  // Cumulatif des dotations exercice par exercice
  const amortCumulIncorp: YAcc = {
    y1: dotIncorp.y1,
    y2: dotIncorp.y1 + dotIncorp.y2,
    y3: dotIncorp.y1 + dotIncorp.y2 + dotIncorp.y3,
  };
  const amortCumulCorp: YAcc = {
    y1: dotCorp.y1,
    y2: dotCorp.y1 + dotCorp.y2,
    y3: dotCorp.y1 + dotCorp.y2 + dotCorp.y3,
  };

  const immoNetteIncorp: YAcc = {
    y1: immoBruteIncorp.y1 - amortCumulIncorp.y1,
    y2: immoBruteIncorp.y2 - amortCumulIncorp.y2,
    y3: immoBruteIncorp.y3 - amortCumulIncorp.y3,
  };
  const immoNetteCorp: YAcc = {
    y1: immoBruteCorp.y1 - amortCumulCorp.y1,
    y2: immoBruteCorp.y2 - amortCumulCorp.y2,
    y3: immoBruteCorp.y3 - amortCumulCorp.y3,
  };
  const immoNette: YAcc = {
    y1: immoNetteIncorp.y1 + immoNetteCorp.y1,
    y2: immoNetteIncorp.y2 + immoNetteCorp.y2,
    y3: immoNetteIncorp.y3 + immoNetteCorp.y3,
  };

  // ── Stocks de matières (= stock fin exercice du BFR) ──────────────────────
  const actifsActifs = activites.filter((a) => a.actif !== false);
  const achatsRows = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      coef: Math.max(0, 1 - n(a.tauxMarge) / 100),
      joursStock: n(a.stocks ?? 0),
      tvaAchats: n(a.tvaAchats ?? 20) / 100,
    }));
  const stocks: YAcc = {
    y1: achatsRows.reduce((s, r) => s + (r.montantN * r.coef * r.joursStock) / 365, 0),
    y2: achatsRows.reduce((s, r) => s + (r.montantN1 * r.coef * r.joursStock) / 365, 0),
    y3: achatsRows.reduce((s, r) => s + (r.montantN2 * r.coef * r.joursStock) / 365, 0),
  };

  // ── Intérêts emprunts ommis (intérêts via buildFinCalc) ─────────────────
  // ── Capital restant dû ───────────────────────────────────────────────────
  const capitalRestantDu: YAcc = { ...zero };
  for (const emprunt of emprunts) {
    const totalCapital = n(emprunt.montant);
    let rembourseCumY1 = 0;
    let rembourseCumY2 = 0;
    let rembourseCumY3 = 0;
    for (const ligne of emprunt.lignesEcheancier) {
      const dl = new Date(String(ligne.dateEcheance));
      const cap = n(ligne.capitalRembourse);
      if (dl < exBorne1) rembourseCumY1 += cap;
      if (dl < exBorne2) rembourseCumY2 += cap;
      if (dl < exBorne3) rembourseCumY3 += cap;
    }
    capitalRestantDu.y1 += Math.max(0, totalCapital - rembourseCumY1);
    capitalRestantDu.y2 += Math.max(0, totalCapital - rembourseCumY2);
    capitalRestantDu.y3 += Math.max(0, totalCapital - rembourseCumY3);
  }

  // ── Agrégats depuis buildFinCalc ──────────────────────────────────────────
  const chargesPersonnel = fc.chargesPersonnel.total;
  const impotsTotal = fc.impotsTaxes;
  const isParAnnee = fc.isParAnnee;
  const resultatNet = fc.resNet;
  const caf = fc.caf;

  // Provisions nettes cumulées (source du déséquilibre : CAF inclut dotProv−reprises
  // mais ces montants n'ont pas de contrepartie au passif sans cette ligne)
  const dotProv = fc.dotationsProvisions;
  const reprProvAnnee: YAcc = {
    y1: dotProv.y1 - fc.reprises.y1,
    y2: dotProv.y2 - fc.reprises.y2,
    y3: dotProv.y3 - fc.reprises.y3,
  };
  const provisionsCumul: YAcc = {
    y1: reprProvAnnee.y1,
    y2: reprProvAnnee.y1 + reprProvAnnee.y2,
    y3: reprProvAnnee.y1 + reprProvAnnee.y2 + reprProvAnnee.y3,
  };

  // Apports capital (cumulatif)
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

  // Emprunts débloqués (cumulatif)
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

  // Immobilisations acquises (cumulatif)
  const immoAcquises: YAcc = { ...zero };
  for (const immo of immobilisationsActives) {
    const dAcq = new Date(String(immo.dateAcquisition));
    const montant = n(immo.montantHT);
    if (dAcq < exBorne1) immoAcquises.y1 += montant;
    if (dAcq < exBorne2) immoAcquises.y2 += montant;
    if (dAcq < exBorne3) immoAcquises.y3 += montant;
  }

  // BFR (stocks de matières + crédit TVA − dettes)
  // Simplifié : solde BFR = actif circulant hors trésorerie - dettes exploitation
  // Trésorerie = cumul(CAF + ressources financières - emplois - variation BFR)
  // On calcule le solde de trésorerie cumulatif comme dans le plan de financement
  const cafCumul: YAcc = {
    y1: caf.y1,
    y2: caf.y1 + caf.y2,
    y3: caf.y1 + caf.y2 + caf.y3,
  };

  // Variation BFR (stocks uniquement pour simplification cohérente)
  const bfr: YAcc = { ...stocks }; // approx : BFR ≈ stocks en l'absence de créances
  const variationBFR: YAcc = {
    y1: bfr.y1,
    y2: bfr.y2 - bfr.y1,
    y3: bfr.y3 - bfr.y2,
  };

  const tresorerie: YAcc = {
    y1:
      apportsCapital.y1 +
      apportsCC.y1 +
      empruntsDebloques.y1 +
      cafCumul.y1 -
      immoAcquises.y1 -
      variationBFR.y1 -
      remboursementsCumul.y1,
    y2:
      apportsCapital.y2 +
      apportsCC.y2 +
      empruntsDebloques.y2 +
      cafCumul.y2 -
      immoAcquises.y2 -
      (variationBFR.y1 + variationBFR.y2) -
      remboursementsCumul.y2,
    y3:
      apportsCapital.y3 +
      apportsCC.y3 +
      empruntsDebloques.y3 +
      cafCumul.y3 -
      immoAcquises.y3 -
      (variationBFR.y1 + variationBFR.y2 + variationBFR.y3) -
      remboursementsCumul.y3,
  };

  // ── Actif circulant et totalActif seront calculés après les dettes (voir ci-dessous) ───

  // ══════════════════════════════════════════════════════════════════════════
  // ── PASSIF ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // Capital social = apports en capital cumulatifs
  const capitalSocial: YAcc = { ...apportsCapital };

  // Comptes courants associés
  const comptesCoursants: YAcc = { ...apportsCC };

  // Réserves / report à nouveau = cumul des résultats antérieurs
  const reportANouveau: YAcc = {
    y1: 0,
    y2: resultatNet.y1,
    y3: resultatNet.y1 + resultatNet.y2,
  };

  const capitauxPropres: YAcc = {
    y1: capitalSocial.y1 + comptesCoursants.y1 + reportANouveau.y1 + resultatNet.y1,
    y2: capitalSocial.y2 + comptesCoursants.y2 + reportANouveau.y2 + resultatNet.y2,
    y3: capitalSocial.y3 + comptesCoursants.y3 + reportANouveau.y3 + resultatNet.y3,
  };

  // Emprunts restant dû
  const empruntsRestants: YAcc = { ...capitalRestantDu };

  // Dettes exploitation (du BFR)
  // Dettes fournisseurs
  const chargesExtRows = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((sv) => sv.actif !== false),
  ].map((c) => ({
    montantN: n(c.montantN),
    montantN1: n(c.montantN1),
    montantN2: n(c.montantN2),
    delaiReglement: n(c.delaiReglement ?? 30),
    tauxTVA: n(c.tauxTVA ?? 20) / 100,
  }));

  const dettesFournisseurs: YAcc = {
    y1: achatsRows.reduce((s, r) => s + (r.montantN * r.coef * 30) / 365, 0),
    y2: achatsRows.reduce((s, r) => s + (r.montantN1 * r.coef * 30) / 365, 0),
    y3: achatsRows.reduce((s, r) => s + (r.montantN2 * r.coef * 30) / 365, 0),
  };
  const dettesChargesExternes: YAcc = {
    y1: chargesExtRows.reduce((s, r) => s + (r.montantN * r.delaiReglement) / 365, 0),
    y2: chargesExtRows.reduce((s, r) => s + (r.montantN1 * r.delaiReglement) / 365, 0),
    y3: chargesExtRows.reduce((s, r) => s + (r.montantN2 * r.delaiReglement) / 365, 0),
  };
  const dettesPersonnel: YAcc = {
    y1: (chargesPersonnel.y1 * 30) / 365,
    y2: (chargesPersonnel.y2 * 30) / 365,
    y3: (chargesPersonnel.y3 * 30) / 365,
  };
  const dettesImpots: YAcc = {
    y1: (impotsTotal.y1 * 30) / 365,
    y2: (impotsTotal.y2 * 30) / 365,
    y3: (impotsTotal.y3 * 30) / 365,
  };

  // TVA nette à payer
  const tvaCollectee: YAcc = {
    y1: actifsActifs.reduce((s, a) => s + n(a.montantN) * (n(a.tauxTVA) / 100), 0),
    y2: actifsActifs.reduce((s, a) => s + n(a.montantN1) * (n(a.tauxTVA) / 100), 0),
    y3: actifsActifs.reduce((s, a) => s + n(a.montantN2) * (n(a.tauxTVA) / 100), 0),
  };

  // TVA récupérable sur immobilisations (par exercice d'acquisition)
  const tvaImmoDeductible: YAcc = { y1: 0, y2: 0, y3: 0 };
  for (const immo of immobilisationsActives) {
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tvaImmo <= 0) continue;
    const yk = toExerciceKey(immo.dateAcquisition as Date);
    if (yk) tvaImmoDeductible[yk] += tvaImmo;
  }

  const tvaDeductible: YAcc = {
    y1:
      achatsRows.reduce((s, r) => s + r.montantN * r.coef * r.tvaAchats, 0) +
      chargesExtRows.reduce((s, r) => s + r.montantN * r.tauxTVA, 0) +
      tvaImmoDeductible.y1,
    y2:
      achatsRows.reduce((s, r) => s + r.montantN1 * r.coef * r.tvaAchats, 0) +
      chargesExtRows.reduce((s, r) => s + r.montantN1 * r.tauxTVA, 0) +
      tvaImmoDeductible.y2,
    y3:
      achatsRows.reduce((s, r) => s + r.montantN2 * r.coef * r.tvaAchats, 0) +
      chargesExtRows.reduce((s, r) => s + r.montantN2 * r.tauxTVA, 0) +
      tvaImmoDeductible.y3,
  };
  const tvaAPayer: YAcc = {
    y1: Math.max(0, tvaCollectee.y1 - tvaDeductible.y1) / 12,
    y2: Math.max(0, tvaCollectee.y2 - tvaDeductible.y2) / 12,
    y3: Math.max(0, tvaCollectee.y3 - tvaDeductible.y3) / 12,
  };

  // IS dû (acomptes trimestriels en cours)
  const dettesIS: YAcc = {
    y1: isIS ? isParAnnee.y1 / 4 : 0,
    y2: isIS ? isParAnnee.y2 / 4 : 0,
    y3: isIS ? isParAnnee.y3 / 4 : 0,
  };

  const totalDettesExploitation: YAcc = {
    y1: dettesFournisseurs.y1 + dettesChargesExternes.y1 + dettesPersonnel.y1 + dettesImpots.y1 + tvaAPayer.y1 + dettesIS.y1,
    y2: dettesFournisseurs.y2 + dettesChargesExternes.y2 + dettesPersonnel.y2 + dettesImpots.y2 + tvaAPayer.y2 + dettesIS.y2,
    y3: dettesFournisseurs.y3 + dettesChargesExternes.y3 + dettesPersonnel.y3 + dettesImpots.y3 + tvaAPayer.y3 + dettesIS.y3,
  };

  // ── Correction BFR : trésorerie nette intégrant les dettes d'exploitation ──
  // La trésorerie du plan de financement est calculée avec variationBFR = Δstocks.
  // Or le passif affiche totalDettesExploitation (composant négatif du BFR réel).
  // Pour équilibrer : tréso corrigée = tréso brute + dettes exploitation
  // (ces dettes sont des ressources implicites qui augmentent le cash disponible)
  const tresorerieCor: YAcc = {
    y1: tresorerie.y1 + totalDettesExploitation.y1,
    y2: tresorerie.y2 + totalDettesExploitation.y2,
    y3: tresorerie.y3 + totalDettesExploitation.y3,
  };

  // Découvert = trésorerie négative → concours bancaires courants (passif)
  const decouvert: YAcc = {
    y1: Math.max(0, -tresorerieCor.y1),
    y2: Math.max(0, -tresorerieCor.y2),
    y3: Math.max(0, -tresorerieCor.y3),
  };

  // ── Actif circulant et Total Actif (calculés après les dettes) ─────────────
  const disponibilites: YAcc = {
    y1: Math.max(0, tresorerieCor.y1),
    y2: Math.max(0, tresorerieCor.y2),
    y3: Math.max(0, tresorerieCor.y3),
  };

  const actifCirculant: YAcc = {
    y1: stocks.y1 + disponibilites.y1,
    y2: stocks.y2 + disponibilites.y2,
    y3: stocks.y3 + disponibilites.y3,
  };

  const totalActif: YAcc = {
    y1: immoNette.y1 + actifCirculant.y1,
    y2: immoNette.y2 + actifCirculant.y2,
    y3: immoNette.y3 + actifCirculant.y3,
  };

  const totalDettes: YAcc = {
    y1: empruntsRestants.y1 + totalDettesExploitation.y1 + decouvert.y1,
    y2: empruntsRestants.y2 + totalDettesExploitation.y2 + decouvert.y2,
    y3: empruntsRestants.y3 + totalDettesExploitation.y3 + decouvert.y3,
  };

  const totalPassif: YAcc = {
    y1: capitauxPropres.y1 + provisionsCumul.y1 + totalDettes.y1,
    y2: capitauxPropres.y2 + provisionsCumul.y2 + totalDettes.y2,
    y3: capitauxPropres.y3 + provisionsCumul.y3 + totalDettes.y3,
  };

  // ── Équilibre ──────────────────────────────────────────────────────────────
  const equilibre: Record<BilanYearKey, boolean> = {
    y1: Math.abs(totalActif.y1 - totalPassif.y1) < 1,
    y2: Math.abs(totalActif.y2 - totalPassif.y2) < 1,
    y3: Math.abs(totalActif.y3 - totalPassif.y3) < 1,
  };

  // ── Construction des lignes ────────────────────────────────────────────────
  const rows: BilanRow[] = [
    // ──────────────────────────────────────────────────────────────────────
    // ACTIF
    // ──────────────────────────────────────────────────────────────────────
    mkRow("section_actif", "ACTIF", "section", zero),

    // Immobilisations incorporelles
    mkRow("immo_incorp_brute", "Immobilisations incorporelles brutes", "indent", immoBruteIncorp, { hideIfZero: true }),
    mkRow("amort_incorp", "  − Amortissements incorporels cumulés", "indent", amortCumulIncorp, { hideIfZero: true }),
    mkRow("immo_incorp_nette", "Immobilisations incorporelles nettes", "normal", immoNetteIncorp, { hideIfZero: true }),

    // Immobilisations corporelles
    mkRow("immo_corp_brute", "Immobilisations corporelles brutes", "indent", immoBruteCorp, { hideIfZero: true }),
    mkRow("amort_corp", "  − Amortissements corporels cumulés", "indent", amortCumulCorp, { hideIfZero: true }),
    mkRow("immo_corp_nette", "Immobilisations corporelles nettes", "normal", immoNetteCorp, { hideIfZero: true }),

    // Total immobilisations nettes
    mkRow("immo_nette_total", "Total immobilisations nettes", "subtotal", immoNette),

    // Actif circulant
    mkRow("stocks", "Stocks de matières", "normal", stocks, { hideIfZero: true }),
    mkRow("disponibilites", "Disponibilités (trésorerie)", "normal", disponibilites),
    mkRow("actif_circulant", "Total actif circulant", "subtotal", actifCirculant),

    // Total actif
    mkRow("total_actif", "TOTAL ACTIF", "highlight", totalActif),

    // ──────────────────────────────────────────────────────────────────────
    // PASSIF
    // ──────────────────────────────────────────────────────────────────────
    mkRow("section_passif", "PASSIF", "section", zero),

    // Capitaux propres
    mkRow("capital_social", "Capital social", "normal", capitalSocial, { hideIfZero: true }),
    mkRow("comptes_courants", "Comptes courants associés", "normal", comptesCoursants, { hideIfZero: true }),
    mkRow("report_a_nouveau", "Réserves / Report à nouveau", "normal", reportANouveau, { hideIfZero: true }),
    mkRow("resultat_exercice", "Résultat de l'exercice", "normal", resultatNet),
    mkRow("capitaux_propres", "Total capitaux propres", "subtotal", capitauxPropres),

    // Provisions pour risques et charges (cumulatives)
    ...(provisionsCumul.y1 + provisionsCumul.y2 + provisionsCumul.y3 !== 0
      ? [mkRow("provisions", "Provisions pour risques et charges", "normal", provisionsCumul, { hideIfZero: true })]
      : []),

    // Dettes financières
    mkRow("emprunts", "Emprunts (capital restant dû)", "normal", empruntsRestants, { hideIfZero: true }),

    // Dettes d'exploitation
    mkRow("dettes_fournisseurs", "Dettes fournisseurs", "normal", dettesFournisseurs, { hideIfZero: true }),
    mkRow("dettes_charges_ext", "Dettes charges externes", "normal", dettesChargesExternes, { hideIfZero: true }),
    mkRow("dettes_personnel", "Dettes personnel", "normal", dettesPersonnel, { hideIfZero: true }),
    mkRow("dettes_impots", "Dettes impôts et taxes", "normal", dettesImpots, { hideIfZero: true }),
    mkRow("tva_a_payer", "TVA à payer", "normal", tvaAPayer, { hideIfZero: true }),
    ...(isIS ? [mkRow("dettes_is", "Impôt sur les sociétés (acompte)", "normal", dettesIS, { hideIfZero: true })] : []),
    mkRow("total_dettes_expl", "Total dettes d'exploitation", "subtotal", totalDettesExploitation),

    // Concours bancaires courants (trésorerie négative)
    ...(decouvert.y1 + decouvert.y2 + decouvert.y3 > 0
      ? [mkRow("decouvert", "Concours bancaires courants", "normal", decouvert, { hideIfZero: true })]
      : []),

    // Total dettes
    mkRow("total_dettes", "Total des dettes", "subtotal", totalDettes),

    // Total passif
    mkRow("total_passif", "TOTAL PASSIF", "highlight", totalPassif),
  ];

  return { yearLabels, rows, equilibre };
}
