/**
 * Script de diagnostic du bilan prévisionnel.
 *
 * Usage :
 *   pnpm tsx scripts/debug-bilan.ts <dossierId>
 *
 * Produit : scripts/debug-bilan-output.md
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { makeExerciceHelpers, n } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

function row(
  label: string,
  v: YAcc,
  { note, bold }: { note?: string; bold?: boolean } = {},
): string {
  const prefix = bold ? "**" : "";
  const suffix = bold ? "**" : "";
  return `| ${prefix}${label}${suffix} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |${note ? ` *${note}*` : ""}`;
}
function sep(): string {
  return `| --- | ---: | ---: | ---: |`;
}
function header(y1: string, y2: string, y3: string): string {
  return `| Désignation | ${y1} | ${y2} | ${y3} |\n${sep()}`;
}
function section(title: string): string {
  return `\n### ${title}\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-bilan.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

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
  const moisDebut = dateDemarrageDate.getMonth();
  const fmtEx = (s: number) => (moisDebut === 0 ? `${s}` : `${s}–${s + 1}`);
  const { exBorne1, exBorne2, exBorne3, pFin, pDeb } = makeExerciceHelpers(dateDemarrageDate);

  const y1L = fmtEx(anneeDebut);
  const y2L = fmtEx(anneeDebut + 1);
  const y3L = fmtEx(anneeDebut + 2);

  const fc = buildFinCalc(data, dateDemarrageDate);

  // ── ACTIF ──────────────────────────────────────────────────────────────────

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

  // Dotations amort par exercice — respecte modeAmortissement (AUCUN/LINEAIRE/DEGRESSIF)
  const dotIncorp: YAcc = { ...zero };
  const dotCorp: YAcc = { ...zero };
  for (const immo of immobilisationsActives) {
    const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const acc = immo.nature === "INCORPOREL" ? dotIncorp : dotCorp;
    acc.y1 += dot.y1;
    acc.y2 += dot.y2;
    acc.y3 += dot.y3;
  }
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
  const immoNette: YAcc = {
    y1: (immoBruteIncorp.y1 - amortCumulIncorp.y1) + (immoBruteCorp.y1 - amortCumulCorp.y1),
    y2: (immoBruteIncorp.y2 - amortCumulIncorp.y2) + (immoBruteCorp.y2 - amortCumulCorp.y2),
    y3: (immoBruteIncorp.y3 - amortCumulIncorp.y3) + (immoBruteCorp.y3 - amortCumulCorp.y3),
  };

  // Stocks
  const actifsActifs = activites.filter((a) => a.actif !== false);
  const achatsRows = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      montantN: n(a.montantN), montantN1: n(a.montantN1), montantN2: n(a.montantN2),
      coef: Math.max(0, 1 - n(a.tauxMarge) / 100),
      joursStock: n(a.stocks ?? 0),
    }));
  const stocks: YAcc = {
    y1: achatsRows.reduce((s, r) => s + (r.montantN  * r.coef * r.joursStock) / 365, 0),
    y2: achatsRows.reduce((s, r) => s + (r.montantN1 * r.coef * r.joursStock) / 365, 0),
    y3: achatsRows.reduce((s, r) => s + (r.montantN2 * r.coef * r.joursStock) / 365, 0),
  };

  // Capital restant dû
  const capitalRestantDu: YAcc = { ...zero };
  for (const emprunt of emprunts) {
    const totalCapital = n(emprunt.montant);
    let rY1 = 0, rY2 = 0, rY3 = 0;
    for (const l of emprunt.lignesEcheancier) {
      const dl = new Date(String(l.dateEcheance));
      const cap = n(l.capitalRembourse);
      if (dl < exBorne1) rY1 += cap;
      if (dl < exBorne2) rY2 += cap;
      if (dl < exBorne3) rY3 += cap;
    }
    capitalRestantDu.y1 += Math.max(0, totalCapital - rY1);
    capitalRestantDu.y2 += Math.max(0, totalCapital - rY2);
    capitalRestantDu.y3 += Math.max(0, totalCapital - rY3);
  }

  // Agrégats fc
  const chargesPersonnel = fc.chargesPersonnel.total;
  const impotsTotal = fc.impotsTaxes;
  const isParAnnee = fc.isParAnnee;
  const resultatNet = fc.resNet;
  const caf = fc.caf;
  const dotProv = fc.dotationsProvisions;
  const dotAmort = fc.dotationsAmort;

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

  // Apports
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
    for (const l of emprunt.lignesEcheancier) {
      const dl = new Date(String(l.dateEcheance));
      const cap = n(l.capitalRembourse);
      if (dl < exBorne1) remboursementsCumul.y1 += cap;
      if (dl < exBorne2) remboursementsCumul.y2 += cap;
      if (dl < exBorne3) remboursementsCumul.y3 += cap;
    }
  }

  const immoAcquises: YAcc = { ...zero };
  for (const immo of immobilisationsActives) {
    const dAcq = new Date(String(immo.dateAcquisition));
    const montant = n(immo.montantHT);
    if (dAcq < exBorne1) immoAcquises.y1 += montant;
    if (dAcq < exBorne2) immoAcquises.y2 += montant;
    if (dAcq < exBorne3) immoAcquises.y3 += montant;
  }

  const cafCumul: YAcc = {
    y1: caf.y1,
    y2: caf.y1 + caf.y2,
    y3: caf.y1 + caf.y2 + caf.y3,
  };
  const bfr: YAcc = { ...stocks };
  const variationBFR: YAcc = {
    y1: bfr.y1,
    y2: bfr.y2 - bfr.y1,
    y3: bfr.y3 - bfr.y2,
  };
  const tresorerie: YAcc = {
    y1: apportsCapital.y1 + apportsCC.y1 + empruntsDebloques.y1 + cafCumul.y1 - immoAcquises.y1 - variationBFR.y1 - remboursementsCumul.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + empruntsDebloques.y2 + cafCumul.y2 - immoAcquises.y2 - (variationBFR.y1 + variationBFR.y2) - remboursementsCumul.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + empruntsDebloques.y3 + cafCumul.y3 - immoAcquises.y3 - (variationBFR.y1 + variationBFR.y2 + variationBFR.y3) - remboursementsCumul.y3,
  };

  // ── PASSIF ─────────────────────────────────────────────────────────────────

  const capitalSocial: YAcc = { ...apportsCapital };
  const comptesCoursants: YAcc = { ...apportsCC };
  const reportANouveau: YAcc = { y1: 0, y2: resultatNet.y1, y3: resultatNet.y1 + resultatNet.y2 };
  const capitauxPropres: YAcc = {
    y1: capitalSocial.y1 + comptesCoursants.y1 + reportANouveau.y1 + resultatNet.y1,
    y2: capitalSocial.y2 + comptesCoursants.y2 + reportANouveau.y2 + resultatNet.y2,
    y3: capitalSocial.y3 + comptesCoursants.y3 + reportANouveau.y3 + resultatNet.y3,
  };

  const chargesExtRows = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((sv) => sv.actif !== false),
  ].map((c) => ({
    montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2),
    delaiReglement: n(c.delaiReglement ?? 30),
  }));

  const dettesFournisseurs: YAcc = {
    y1: achatsRows.reduce((s, r) => s + (r.montantN  * r.coef * 30) / 365, 0),
    y2: achatsRows.reduce((s, r) => s + (r.montantN1 * r.coef * 30) / 365, 0),
    y3: achatsRows.reduce((s, r) => s + (r.montantN2 * r.coef * 30) / 365, 0),
  };
  const dettesChargesExternes: YAcc = {
    y1: chargesExtRows.reduce((s, r) => s + (r.montantN  * r.delaiReglement) / 365, 0),
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

  const tvaCollectee: YAcc = {
    y1: actifsActifs.reduce((s, a) => s + n(a.montantN)  * (n(a.tauxTVA) / 100), 0),
    y2: actifsActifs.reduce((s, a) => s + n(a.montantN1) * (n(a.tauxTVA) / 100), 0),
    y3: actifsActifs.reduce((s, a) => s + n(a.montantN2) * (n(a.tauxTVA) / 100), 0),
  };
  const tvaDeductible: YAcc = {
    y1: achatsRows.reduce((s, r) => s + r.montantN  * r.coef * 0.2, 0) + chargesExtRows.reduce((s, r) => s + r.montantN  * 0.2, 0),
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

  // Trésorerie corrigée (dettes exploitation = ressources)
  const tresorerieCor: YAcc = {
    y1: tresorerie.y1 + totalDettesExploitation.y1,
    y2: tresorerie.y2 + totalDettesExploitation.y2,
    y3: tresorerie.y3 + totalDettesExploitation.y3,
  };
  const decouvert: YAcc = {
    y1: Math.max(0, -tresorerieCor.y1),
    y2: Math.max(0, -tresorerieCor.y2),
    y3: Math.max(0, -tresorerieCor.y3),
  };
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
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1 + decouvert.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2 + decouvert.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3 + decouvert.y3,
  };
  const totalPassif: YAcc = {
    y1: capitauxPropres.y1 + provisionsCumul.y1 + totalDettes.y1,
    y2: capitauxPropres.y2 + provisionsCumul.y2 + totalDettes.y2,
    y3: capitauxPropres.y3 + provisionsCumul.y3 + totalDettes.y3,
  };

  const ecart: YAcc = {
    y1: totalActif.y1 - totalPassif.y1,
    y2: totalActif.y2 - totalPassif.y2,
    y3: totalActif.y3 - totalPassif.y3,
  };

  // ─── Vérification identité CAF ─────────────────────────────────────────────
  // CAF = ResNet + DotAmort + DotProv - Reprises
  const cafRecalc: YAcc = {
    y1: resultatNet.y1 + dotAmort.y1 + dotProv.y1 - fc.reprises.y1,
    y2: resultatNet.y2 + dotAmort.y2 + dotProv.y2 - fc.reprises.y2,
    y3: resultatNet.y3 + dotAmort.y3 + dotProv.y3 - fc.reprises.y3,
  };
  const cafEcart: YAcc = {
    y1: caf.y1 - cafRecalc.y1,
    y2: caf.y2 - cafRecalc.y2,
    y3: caf.y3 - cafRecalc.y3,
  };

  // ─── Vérification DotAmort bilan vs fc ────────────────────────────────────
  const dotAmortBilan: YAcc = {
    y1: dotIncorp.y1 + dotCorp.y1,
    y2: dotIncorp.y2 + dotCorp.y2,
    y3: dotIncorp.y3 + dotCorp.y3,
  };
  const dotAmortEcart: YAcc = {
    y1: dotAmortBilan.y1 - dotAmort.y1,
    y2: dotAmortBilan.y2 - dotAmort.y2,
    y3: dotAmortBilan.y3 - dotAmort.y3,
  };

  // ─── Reconstitution trésorerie théorique (identité comptable) ────────────
  // Tréso = Actif − ImmoNette − Stocks − DettesExpl + ProvCumul − CapPropres − EmpruntsRestants
  // (dérivé de : TotalActif = TotalPassif ⟺ tréso = PassifTotal − ImmoNette − Stocks)
  const tresoTheoriqueParPassif: YAcc = {
    y1: totalPassif.y1 - immoNette.y1 - stocks.y1,
    y2: totalPassif.y2 - immoNette.y2 - stocks.y2,
    y3: totalPassif.y3 - immoNette.y3 - stocks.y3,
  };

  // ─── Génération Markdown ───────────────────────────────────────────────────

  const lines: string[] = [];
  const L = (...s: string[]) => lines.push(...s);

  L(
    `# Diagnostic bilan — Dossier \`${dossierId}\``,
    ``,
    `> Généré le ${new Date().toLocaleString("fr-FR")}`,
    `> pFin = ${pFin.toFixed(4)}, pDeb = ${pDeb.toFixed(4)}, anneeDebut = ${anneeDebut}, moisDebut = ${moisDebut + 1}`,
    ``,
  );

  // ── Résumé équilibre ────────────────────────────────────────────────────────
  L(`## Résumé équilibre`, ``);
  L(header(y1L, y2L, y3L));
  L(row("TOTAL ACTIF",  totalActif,  { bold: true }));
  L(row("TOTAL PASSIF", totalPassif, { bold: true }));
  L(row("Écart (Actif − Passif)", ecart, {
    note: eq(ecart.y1, 0) && eq(ecart.y2, 0) && eq(ecart.y3, 0) ? "✅ ÉQUILIBRÉ" : "❌ DÉSÉQUILIBRÉ",
    bold: true,
  }));
  L(``);

  // ── ACTIF détaillé ──────────────────────────────────────────────────────────
  L(section("ACTIF — Détail"));
  L(header(y1L, y2L, y3L));
  L(row("Immo incorp. brutes",       immoBruteIncorp));
  L(row("Amort. incorp. annuels (dot)", { y1: dotIncorp.y1, y2: dotIncorp.y2, y3: dotIncorp.y3 },
      { note: "par exercice fiscal" }));
  L(row("Amort. incorp. cumulés",    amortCumulIncorp));
  L(row("Immo corp. brutes",         immoBruteCorp));
  L(row("Amort. corp. annuels (dot)", { y1: dotCorp.y1, y2: dotCorp.y2, y3: dotCorp.y3 },
      { note: "par exercice fiscal" }));
  L(row("Amort. corp. cumulés",      amortCumulCorp));
  L(row("**Immo nettes**",           immoNette));
  L(row("Stocks",                    stocks));
  L(row("Tréso brute (avant correction BFR)", tresorerie));
  L(row("+ Dettes exploitation (correction)", totalDettesExploitation));
  L(row("= Tréso corrigée",          tresorerieCor));
  L(row("Disponibilités (max 0)",    disponibilites));
  L(row("Découvert (max 0, passif)", decouvert));
  L(row("Actif circulant",           actifCirculant));
  L(row("**TOTAL ACTIF**",           totalActif, { bold: true }));
  L(``);

  // ── PASSIF détaillé ─────────────────────────────────────────────────────────
  L(section("PASSIF — Détail"));
  L(header(y1L, y2L, y3L));
  L(row("Capital social",            capitalSocial));
  L(row("Comptes courants",          comptesCoursants));
  L(row("Report à nouveau",          reportANouveau));
  L(row("Résultat net",              resultatNet));
  L(row("**Capitaux propres**",      capitauxPropres, { bold: true }));
  L(row("Provisions nettes (annue.)", reprProvAnnee, { note: "dotProv − reprises" }));
  L(row("Provisions cumulées",       provisionsCumul));
  L(row("Capital restant dû",        capitalRestantDu));
  L(row("Dettes fournisseurs",       dettesFournisseurs));
  L(row("Dettes charges externes",   dettesChargesExternes));
  L(row("Dettes personnel",          dettesPersonnel));
  L(row("Dettes impôts/taxes",       dettesImpots));
  L(row("TVA à payer",               tvaAPayer));
  if (isIS) L(row("IS acompte", dettesIS));
  L(row("**Total dettes exploitation**", totalDettesExploitation, { bold: true }));
  L(row("Emprunts restants",         capitalRestantDu));
  L(row("Découvert (passif)",        decouvert));
  L(row("**Total dettes**",          totalDettes, { bold: true }));
  L(row("**TOTAL PASSIF**",          totalPassif, { bold: true }));
  L(``);

  // ── CAF & dotations ─────────────────────────────────────────────────────────
  L(section("CAF et dotations — Vérification"));
  L(header(y1L, y2L, y3L));
  L(row("Résultat net (fc.resNet)",       resultatNet));
  L(row("Dot. amort. (fc.dotAmort)",      dotAmort));
  L(row("Dot. amort. (bilan pFin/pDeb)",  dotAmortBilan));
  L(row("Écart dotAmort bilan vs fc",     dotAmortEcart,
      { note: eq(dotAmortEcart.y1, 0) && eq(dotAmortEcart.y2, 0) && eq(dotAmortEcart.y3, 0) ? "✅" : "❌ ÉCART DOTATIONS" }));
  L(row("Dot. provisions (fc)",           dotProv));
  L(row("Reprises (fc)",                  fc.reprises));
  L(row("Prov nettes / an",               reprProvAnnee));
  L(row("CAF (fc.caf)",                   caf));
  L(row("CAF recalculée (ResNet+DotA+DotP−Rep)", cafRecalc));
  L(row("Écart CAF",                      cafEcart,
      { note: eq(cafEcart.y1, 0) && eq(cafEcart.y2, 0) && eq(cafEcart.y3, 0) ? "✅" : "❌ ÉCART CAF" }));
  L(row("CAF cumulée",                    cafCumul));
  L(``);

  // ── Plan de financement simplifié ───────────────────────────────────────────
  L(section("Plan de financement simplifié (reconstitution trésorerie)"));
  L(header(y1L, y2L, y3L));
  L(row("Apports capital (cumul)",     apportsCapital));
  L(row("Apports CCA (cumul)",         apportsCC));
  L(row("Emprunts débloqués (cumul)",  empruntsDebloques));
  L(row("CAF cumulée",                 cafCumul));
  L(row("− Immo acquises (cumul)",     immoAcquises));
  L(row("− Variation BFR stocks y1",   { y1: variationBFR.y1, y2: 0, y3: 0 }));
  L(row("− Variation BFR stocks y2",   { y1: 0, y2: variationBFR.y2, y3: 0 }));
  L(row("− Variation BFR stocks y3",   { y1: 0, y2: 0, y3: variationBFR.y3 }));
  L(row("− Remboursements capital (cumul)", remboursementsCumul));
  L(row("**= Tréso brute**",           tresorerie, { bold: true }));
  L(row("+ Dettes exploitation",       totalDettesExploitation));
  L(row("**= Tréso corrigée**",        tresorerieCor, { bold: true }));
  L(``);

  // ── Vérification identité comptable ────────────────────────────────────────
  L(section("Vérification identité comptable"));
  L(`> Théorème : si le bilan est équilibré, \`Tréso corrigée = TotalPassif − ImmoNette − Stocks\`\n`);
  L(header(y1L, y2L, y3L));
  L(row("Tréso corrigée (calculée)", tresorerieCor));
  L(row("TotalPassif − ImmoNette − Stocks (théorique)", tresoTheoriqueParPassif));
  const identEcart: YAcc = {
    y1: tresorerieCor.y1 - tresoTheoriqueParPassif.y1,
    y2: tresorerieCor.y2 - tresoTheoriqueParPassif.y2,
    y3: tresorerieCor.y3 - tresoTheoriqueParPassif.y3,
  };
  L(row("Écart identité comptable", identEcart,
    { note: eq(identEcart.y1, 0) && eq(identEcart.y2, 0) && eq(identEcart.y3, 0) ? "✅ IDENTITÉ VÉRIFIÉE" : "❌ IDENTITÉ ROMPUE" }));
  L(``);

  // ── Compte de résultat ─────────────────────────────────────────────────────
  L(section("Compte de résultat"));
  L(header(y1L, y2L, y3L));

  // Produits d'exploitation
  L(row("Chiffre d'affaires (CA)",          fc.ca));
  L(row("Subventions d'exploitation",       fc.subventions));
  L(row("Commissions / autres CA",          fc.commissionsTotal));
  L(row("Productions immobilisées",         fc.prodImmo));
  L(row("Transferts de charges",            fc.transferts));
  L(row("Autres produits de gestion",       fc.autresProdGestion));
  L(row("**Total produits exploitation**",  fc.totalProduitsExpl, { bold: true }));

  // Charges d'exploitation
  const margeCommerciale: YAcc = {
    y1: fc.ca.y1 - fc.achatsConsommes.y1,
    y2: fc.ca.y2 - fc.achatsConsommes.y2,
    y3: fc.ca.y3 - fc.achatsConsommes.y3,
  };
  L(row("− Achats consommés",               fc.achatsConsommes, { note: "achats effectués ± var. stock" }));
  L(row("  dont stock initial",             fc.stockInitial));
  L(row("  dont achats effectués",          fc.achatsEffectues));
  L(row("  dont stock final",               { y1: -fc.stockFinal.y1, y2: -fc.stockFinal.y2, y3: -fc.stockFinal.y3 }));
  L(row("= Marge commerciale",              margeCommerciale));
  L(row("− Fournitures",                    fc.fournitures));
  L(row("− Services extérieurs",            fc.services));
  L(row("− Charges extérieures (total)",    fc.chargesExternes));
  L(row("**= VALEUR AJOUTÉE**",             fc.valeurAjoutee, { bold: true }));

  // Charges de personnel & impôts/taxes
  L(row("− Impôts et taxes",                fc.impotsTaxes));
  L(row("− Salaires bruts",                 fc.chargesPersonnel.salairesBruts));
  L(row("− Charges patronales",             fc.chargesPersonnel.chargesPatronales));
  L(row("− Rémunération dirigeant",         fc.chargesPersonnel.remuDirigeant));
  L(row("− Cotisations TNS",                fc.chargesPersonnel.cotisationsTNSTotal));
  L(row("− Taxes sur salaires",             fc.chargesPersonnel.taxesSalairesTotal));
  L(row("− Charges personnel (total)",      fc.chargesPersonnel.total));
  L(row("**= EBE**",                        fc.ebe, { bold: true }));

  // Résultat d'exploitation
  L(row("− Dot. amortissements",            fc.dotationsAmort));
  L(row("− Dot. provisions",                fc.dotationsProvisions));
  L(row("+ Reprises",                       fc.reprises));
  L(row("− Autres charges de gestion",      fc.autresChargesGestion));
  L(row("**= RÉSULTAT D'EXPLOITATION**",    fc.resExpl, { bold: true }));

  // Résultat financier
  L(row("− Intérêts emprunts",              fc.interetsEmprunts));
  L(row("+ Produits financiers",            fc.produitsFinanciers));
  L(row("− Autres charges financières",     fc.autresChargesFinancieres));
  L(row("**= RÉSULTAT FINANCIER**",         fc.resFin, { bold: true }));
  L(row("**= RÉSULTAT COURANT**",           fc.resCourant, { bold: true }));

  // Exceptionnel & IS
  L(row("Résultat exceptionnel",            fc.resExcep));
  L(row("Ajustement net",                   fc.ajustementNet));
  L(row("− IS",                             fc.isParAnnee));
  L(row("**= RÉSULTAT NET**",               fc.resNet, { bold: true }));

  // Vérification : ResExpl = TotalProduitsExpl − TotalChargesExpl
  const totalChargesExpl: YAcc = {
    y1: fc.achatsConsommes.y1 + fc.chargesExternes.y1 + fc.impotsTaxes.y1 + fc.chargesPersonnel.total.y1 + fc.dotationsAmort.y1 + fc.dotationsProvisions.y1 - fc.reprises.y1 + fc.autresChargesGestion.y1,
    y2: fc.achatsConsommes.y2 + fc.chargesExternes.y2 + fc.impotsTaxes.y2 + fc.chargesPersonnel.total.y2 + fc.dotationsAmort.y2 + fc.dotationsProvisions.y2 - fc.reprises.y2 + fc.autresChargesGestion.y2,
    y3: fc.achatsConsommes.y3 + fc.chargesExternes.y3 + fc.impotsTaxes.y3 + fc.chargesPersonnel.total.y3 + fc.dotationsAmort.y3 + fc.dotationsProvisions.y3 - fc.reprises.y3 + fc.autresChargesGestion.y3,
  };
  const resExplRecalc: YAcc = {
    y1: fc.totalProduitsExpl.y1 - totalChargesExpl.y1,
    y2: fc.totalProduitsExpl.y2 - totalChargesExpl.y2,
    y3: fc.totalProduitsExpl.y3 - totalChargesExpl.y3,
  };
  const resExplEcart: YAcc = {
    y1: fc.resExpl.y1 - resExplRecalc.y1,
    y2: fc.resExpl.y2 - resExplRecalc.y2,
    y3: fc.resExpl.y3 - resExplRecalc.y3,
  };
  L(section("Vérification compte de résultat"));
  L(header(y1L, y2L, y3L));
  L(row("ResExpl (fc)",                     fc.resExpl));
  L(row("ResExpl recalculé (Prod − Charges)", resExplRecalc));
  L(row("Écart ResExpl",                    resExplEcart,
    { note: eq(resExplEcart.y1, 0) && eq(resExplEcart.y2, 0) && eq(resExplEcart.y3, 0) ? "✅" : "❌ ÉCART RÉSULTAT EXPL" }));
  L(row("ResNet (fc)",                      fc.resNet));
  L(``);

  // ── Détail dotations amortissement par immobilisation ────────────────────────
  L(section("Détail dotations amortissement (par immobilisation)"));
  L(`> Méthode : \`distribuerAmortParExercice\` — respecte AUCUN / LINEAIRE / DEGRESSIF.`);
  L(``);
  L(`| Libellé | Mode | Durée | Montant HT | Dot Y1 | Dot Y2 | Dot Y3 |`);
  L(`| --- | --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const immo of immobilisationsActives) {
    const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const mode = String(immo.modeAmortissement ?? "LINEAIRE");
    const dur  = n(immo.dureeAmortissement);
    const montant = n(immo.montantHT);
    L(`| ${immo.libelle} | ${mode} | ${dur} | ${fmt(montant)} | ${fmt(dot.y1)} | ${fmt(dot.y2)} | ${fmt(dot.y3)} |`);
  }
  L(``);

  // Comparaison : dotAmortBilan (bilan.ts) vs fc.dotationsAmort (monthly.ts)
  const dotAmortBilanTotal: YAcc = dotAmortBilan;
  const dotAmortMonthlyTotal: YAcc = {
    y1: fc.dotationsAmort.y1,
    y2: fc.dotationsAmort.y2,
    y3: fc.dotationsAmort.y3,
  };
  const ecartBilanMonthly: YAcc = {
    y1: dotAmortBilanTotal.y1 - dotAmortMonthlyTotal.y1,
    y2: dotAmortBilanTotal.y2 - dotAmortMonthlyTotal.y2,
    y3: dotAmortBilanTotal.y3 - dotAmortMonthlyTotal.y3,
  };
  L(`#### Cohérence bilan ↔ monthly.ts`);
  L(header(y1L, y2L, y3L));
  L(row("Dotations bilan (dotAmortBilan)",  dotAmortBilanTotal));
  L(row("Dotations monthly (fc.dotAmort)",  dotAmortMonthlyTotal));
  L(row("Écart bilan − monthly", ecartBilanMonthly,
    { note: eq(ecartBilanMonthly.y1, 0) && eq(ecartBilanMonthly.y2, 0) && eq(ecartBilanMonthly.y3, 0)
        ? "✅ Cohérent"
        : "❌ DIVERGENCE bilan / monthly" }));
  L(``);


  // ── Détail immobilisations ──────────────────────────────────────────────────
  L(section("Détail immobilisations actives"));
  L(`| Libellé | Nature | Date acq. | Montant HT | Durée | Actif |`);
  L(`| --- | --- | --- | ---: | ---: | --- |`);
  for (const immo of immobilisationsActives) {
    const dAcq = new Date(String(immo.dateAcquisition)).toLocaleDateString("fr-FR");
    L(`| ${immo.libelle} | ${immo.nature} | ${dAcq} | ${fmt(n(immo.montantHT))} | ${immo.dureeAmortissement ?? "—"} | ${immo.actif !== false ? "oui" : "non"} |`);
  }
  L(``);

  // ── Détail emprunts ─────────────────────────────────────────────────────────
  L(section("Détail emprunts"));
  L(`| Libellé | Montant | Date déblocage | Capital restant Y1 | Y2 | Y3 |`);
  L(`| --- | ---: | --- | ---: | ---: | ---: |`);
  for (const emprunt of emprunts) {
    const totalCapital = n(emprunt.montant);
    let rY1 = 0, rY2 = 0, rY3 = 0;
    for (const l of emprunt.lignesEcheancier) {
      const dl = new Date(String(l.dateEcheance));
      const cap = n(l.capitalRembourse);
      if (dl < exBorne1) rY1 += cap;
      if (dl < exBorne2) rY2 += cap;
      if (dl < exBorne3) rY3 += cap;
    }
    const dDeb = new Date(String(emprunt.dateDéblocage)).toLocaleDateString("fr-FR");
    L(`| ${emprunt.libelle} | ${fmt(totalCapital)} | ${dDeb} | ${fmt(Math.max(0, totalCapital - rY1))} | ${fmt(Math.max(0, totalCapital - rY2))} | ${fmt(Math.max(0, totalCapital - rY3))} |`);
  }
  L(``);

  // ── Détail apports ──────────────────────────────────────────────────────────
  L(section("Détail apports"));
  L(`| Type | Montant | Date apport |`);
  L(`| --- | ---: | --- |`);
  for (const apport of apports) {
    const dApp = new Date(String(apport.dateApport)).toLocaleDateString("fr-FR");
    L(`| ${apport.type} | ${fmt(n(apport.montant))} | ${dApp} |`);
  }
  L(``);

  // ── Conclusion ──────────────────────────────────────────────────────────────
  L(section("Conclusion"));
  const ok = eq(ecart.y1, 0) && eq(ecart.y2, 0) && eq(ecart.y3, 0);
  if (ok) {
    L(`✅ **Le bilan est équilibré** pour les 3 exercices.`);
  } else {
    L(`❌ **Écart résiduel détecté :**`);
    L(``);
    L(`- ${y1L} : **${fmt(ecart.y1)} €**`);
    L(`- ${y2L} : **${fmt(ecart.y2)} €**`);
    L(`- ${y3L} : **${fmt(ecart.y3)} €**`);
    L(``);
    L(`Vérifiez les sections ci-dessus (CAF, dotations, provisions, trésorerie) pour identifier la source.`);
  }

  // ─── Écriture fichier ──────────────────────────────────────────────────────
  const outputPath = join(process.cwd(), "scripts", "debug-bilan-output.md");
  writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`\n✅ Fichier créé : ${outputPath}`);
  console.log(`   Écart Y1=${fmt(ecart.y1)} / Y2=${fmt(ecart.y2)} / Y3=${fmt(ecart.y3)}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Erreur :", err);
  await prisma.$disconnect().catch(() => void 0);
  process.exit(1);
});
