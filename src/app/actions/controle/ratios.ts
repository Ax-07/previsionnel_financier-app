"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RatioValue {
  /** Valeur calculée (null si dénominateur = 0) */
  value: number | null;
}

export interface RatioRow {
  key: string;
  label: string;
  /** Unité affichée : "jours", "%", "années" */
  unit: string;
  /** Nombre de décimales */
  decimals: number;
  values: Record<YearKey, RatioValue>;
}

export interface RatiosData {
  yearLabels: Record<YearKey, string>;
  rows: RatioRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────


type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

/** Division sécurisée — renvoie null si le dénominateur vaut 0 */
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

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchRatios(dossierId: string): Promise<RatiosData> {
  const data = await fetchScenarioData(dossierId);
  const {
    isIS,
    activites,
    fournitures,
    services,
    immobilisations,
    emprunts,
    apports,
  } = data;
  const fc = buildFinCalc(data, data.dateDemarrage);
  const { yearLabels, anneeDebut, exBorne1, exBorne2, exBorne3 } = fc;

  // ── Filtres actif (JS) ───────────────────────────────────────────────────
  const actifsActifs = activites.filter((a) => a.actif !== false);
  const fournituresActives = fournitures.filter((f) => f.actif !== false);
  const servicesActifs = services.filter((sv) => sv.actif !== false);


  // ── Stocks ────────────────────────────────────────────────────────────────
  const achatsRows = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      coef: Math.max(0, 1 - n(a.tauxMarge) / 100),
      joursStock: n(a.stocks ?? 0),
    }));

  const stocks: YAcc = {
    y1: achatsRows.reduce((s: number, r) => s + (r.montantN * r.coef * r.joursStock) / 365, 0),
    y2: achatsRows.reduce((s: number, r) => s + (r.montantN1 * r.coef * r.joursStock) / 365, 0),
    y3: achatsRows.reduce((s: number, r) => s + (r.montantN2 * r.coef * r.joursStock) / 365, 0),
  };

  // ── Achats annuels bruts (sans variation stock) ────────────────────────────
  const achatsAnnuels: YAcc = {
    y1: achatsRows.reduce((s: number, r) => s + r.montantN * r.coef, 0),
    y2: achatsRows.reduce((s: number, r) => s + r.montantN1 * r.coef, 0),
    y3: achatsRows.reduce((s: number, r) => s + r.montantN2 * r.coef, 0),
  };

  // ── Achats consommés (variation de stocks incluse) ─────────────────────────
  const achatsConsommes: YAcc = {
    y1: achatsAnnuels.y1 - stocks.y1,
    y2: achatsAnnuels.y2 + stocks.y1 - stocks.y2,
    y3: achatsAnnuels.y3 + stocks.y2 - stocks.y3,
  };

  // ── Charges externes ───────────────────────────────────────────────────────
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

  // ── CAF ────────────────────────────────────────────────────────────────────
  // Agregats depuis buildFinCalc
  const chargesPersonnel = fc.chargesPersonnel.total;
  const impotsTotal = fc.impotsTaxes;
  const isParAnnee = fc.isParAnnee;
  const resultatNet = fc.resNet;
  const caf = fc.caf;

  // Immobilisations nettes
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

  // Trésorerie (plan de financement simplifié)
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

  // Dettes fournisseurs
  const dettesFournisseurs: YAcc = {
    y1: achatsRows.reduce((s: number, r) => s + (r.montantN * r.coef * 30) / 365, 0),
    y2: achatsRows.reduce((s: number, r) => s + (r.montantN1 * r.coef * 30) / 365, 0),
    y3: achatsRows.reduce((s: number, r) => s + (r.montantN2 * r.coef * 30) / 365, 0),
  };
  const chargesExtRows = [...fournituresActives, ...servicesActifs].map((c) => ({
    montantN: n(c.montantN),
    montantN1: n(c.montantN1),
    montantN2: n(c.montantN2),
    delai: n(c.delaiReglement ?? 30),
  }));
  const dettesChargesExternes: YAcc = {
    y1: chargesExtRows.reduce((s: number, r) => s + (r.montantN * r.delai) / 365, 0),
    y2: chargesExtRows.reduce((s: number, r) => s + (r.montantN1 * r.delai) / 365, 0),
    y3: chargesExtRows.reduce((s: number, r) => s + (r.montantN2 * r.delai) / 365, 0),
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
  const tvaCollectee: YAcc = {
    y1: actifsActifs.reduce((s, a) => s + n(a.montantN) * (n(a.tauxTVA) / 100), 0),
    y2: actifsActifs.reduce((s, a) => s + n(a.montantN1) * (n(a.tauxTVA) / 100), 0),
    y3: actifsActifs.reduce((s, a) => s + n(a.montantN2) * (n(a.tauxTVA) / 100), 0),
  };
  const tvaDeductible: YAcc = {
    y1: achatsRows.reduce((s, r) => s + r.montantN * r.coef * 0.2, 0) + chargesExtRows.reduce((s, r) => s + r.montantN * 0.2, 0),
    y2: achatsRows.reduce((s, r) => s + r.montantN1 * r.coef * 0.2, 0) + chargesExtRows.reduce((s, r) => s + r.montantN1 * 0.2, 0),
    y3: achatsRows.reduce((s, r) => s + r.montantN2 * r.coef * 0.2, 0) + chargesExtRows.reduce((s, r) => s + r.montantN2 * 0.2, 0),
  };
  const tvaAPayer: YAcc = {
    y1: Math.max(0, tvaCollectee.y1 - tvaDeductible.y1) / 12,
    y2: Math.max(0, tvaCollectee.y2 - tvaDeductible.y2) / 12,
    y3: Math.max(0, tvaCollectee.y3 - tvaDeductible.y3) / 12,
  };
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
  const totalDettes: YAcc = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3,
  };

  // ── Construction des lignes de ratios ──────────────────────────────────────
  const rows: RatioRow[] = [
    // ── Rotation ─────────────────────────────────────────────────────────────
    mkRow(
      "delai_stocks",
      "Délai des stocks de matières",
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
      "Délai des dettes fournisseurs",
      "jours",
      1,
      {
        y1: safeDiv(dettesFournisseurs.y1 * 365, achatsAnnuels.y1),
        y2: safeDiv(dettesFournisseurs.y2 * 365, achatsAnnuels.y2),
        y3: safeDiv(dettesFournisseurs.y3 * 365, achatsAnnuels.y3),
      },
    ),
    // ── Structure financière ──────────────────────────────────────────────────
    mkRow(
      "autonomie_lt",
      "Autonomie financière à long terme",
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
      "Solvabilité à moyen terme",
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
      "Solvabilité à court terme",
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
      "Taux d'endettement",
      "%",
      1,
      {
        y1: safeDiv(totalDettes.y1 * 100, capitauxPropres.y1),
        y2: safeDiv(totalDettes.y2 * 100, capitauxPropres.y2),
        y3: safeDiv(totalDettes.y3 * 100, capitauxPropres.y3),
      },
    ),
    // ── Capacité de remboursement ─────────────────────────────────────────────
    mkRow(
      "capacite_remboursement",
      "Capacité de remboursement",
      "années",
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
