/**
 * Script de diagnostic du tableau de trésorerie prévisionnel.
 *
 * Usage :
 *   pnpm tsx scripts/debug/debug-tresorerie.ts <dossierId>
 *
 * Produit : scripts/debug/output/debug-tresorerie-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildTresorerieRows, calcEncaissements, calcDecaissements, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildMonthLabels, subSeries } from "@/lib/finance/calculs/monthly";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import { buildTemporelCtx } from "@/lib/finance/pipeline/calendar";
import {
  calcEncaissements,
  calcAchatsRaw,
  calcEncoursFournisseurs,
} from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { buildTresorerieRows } from "@/lib/finance/aggregations/tresorerie";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;
const sumS = (s: MonthlySeries) => s.reduce((a, b) => a + b, 0);

/** Génère un tableau markdown mensuel (12 colonnes + Total). */
function mkMonthTable(
  rowLabel: string,
  months: MonthlySeries,
  monthLabels: string[],
  totalIsEndValue = false,
): string {
  const total = totalIsEndValue ? (months[11] ?? 0) : sumS(months);
  const hdr = `| ${rowLabel} | ${monthLabels.join(" | ")} | **Total** |`;
  const sep = `| :--- | ${Array(12).fill("---:").join(" | ")} | ---: |`;
  const cells = months.map((v) => fmt(v)).join(" | ");
  const data = `| | ${cells} | **${fmt(total)}** |`;
  return `${hdr}\n${sep}\n${data}`;
}

/** Rend un tableau mensuel multi-lignes (label + mois + total). */
function monthlyTable(
  labelHeader: string,
  rowsData: Array<{ label: string; months: MonthlySeries; totalIsEndValue?: boolean; bold?: boolean }>,
  monthLabels: string[],
): string {
  const hdr = `| ${labelHeader} | ${monthLabels.join(" | ")} | **Total** |`;
  const sep = `| --- | ${Array(12).fill("---:").join(" | ")} | ---: |`;
  const lines: string[] = [hdr, sep];
  for (const r of rowsData) {
    const total = r.totalIsEndValue ? (r.months[11] ?? 0) : sumS(r.months);
    const p = r.bold ? "**" : "";
    const cells = r.months.map((v) => fmt(v)).join(" | ");
    lines.push(`| ${p}${r.label}${p} | ${cells} | ${p}${fmt(total)}${p} |`);
  }
  return lines.join("\n");
}

/** Collecte récursivement toutes les TresorerieRow (exclut les lignes purement section). */
function collectRows(rows: TresorerieRow[]): TresorerieRow[] {
  const result: TresorerieRow[] = [];
  for (const row of rows) {
    if (row.style !== "section") result.push(row);
    if (row.children) result.push(...collectRows(row.children));
  }
  return result;
}

/** Rend récursivement un arbre TresorerieRow en tableau annuel (3 colonnes). */
function renderRowsAnnual(
  rows: TresorerieRow[],
  lines: string[],
  depth = 0,
): void {
  for (const row of rows) {
    if (row.style === "section") {
      lines.push(`| **${row.label}** | | | |`);
      continue;
    }
    if (row.hideIfZero) {
      const allZero =
        row.values.y1.total === 0 &&
        row.values.y2.total === 0 &&
        row.values.y3.total === 0;
      if (allZero) continue;
    }
    const indent = "\\ ".repeat(depth);
    const bold = row.style === "subtotal" || row.style === "highlight" || row.style === "result";
    const p = bold ? "**" : "";
    lines.push(
      `| ${indent}${p}${row.label}${p} | ${p}${fmt(row.values.y1.total)}${p} | ${p}${fmt(row.values.y2.total)}${p} | ${p}${fmt(row.values.y3.total)}${p} |`,
    );
    if (row.children) {
      renderRowsAnnual(row.children, lines, depth + 1);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug/debug-tresorerie.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const { dateDemarrage: dateDemarrageDate, scenario } = data;

  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth();
  const par = scenario.parametres;

  const regimeTVA = par?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";
  const moisPaiementSalaires = par?.moisPaiementSalaires ?? 1;

  const fmtEx = (yr: number) =>
    moisDebut === 0 ? `${yr}` : `${yr}\u2013${yr + 1}`;
  const y1L = fmtEx(anneeDebut);
  const y2L = fmtEx(anneeDebut + 1);
  const y3L = fmtEx(anneeDebut + 2);

  const monthLabels: Record<"y1" | "y2" | "y3", string[]> = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  // ── Calculs officiels (= application) ─────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const ctx = buildTemporelCtx(dateDemarrageDate, isFranchise);

  const enc = calcEncaissements(data, ctx);
  const dec = calcDecaissements(data, ctx, moisPaiementSalaires, fc.isParAnnee);

  const variation = {
    y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
    y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
    y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
  };

  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

  const soldePrecedent = {
    y1: y1Sol.soldePrecedent,
    y2: y2Sol.soldePrecedent,
    y3: y3Sol.soldePrecedent,
  };
  const soldeFinal = {
    y1: y1Sol.soldeFinal,
    y2: y2Sol.soldeFinal,
    y3: y3Sol.soldeFinal,
  };

  const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
  const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);

  const rows = buildTresorerieRows({
    enc,
    dec,
    soldePrecedent,
    variation,
    soldeFinal,
    encoursFournisseurs,
    immosParNature: dec.immosParNature,
  });

  // ── Génération du rapport ─────────────────────────────────────────────────
  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Trésorerie — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildTresorerieRows\` · \`calcEncaissements\` · \`calcDecaissements\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ────────────────────────────────────────

  L(`## 0. Paramètres généraux`);
  L(``);
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Régime TVA | \`${regimeTVA}\` |`);
  L(`| Franchise de base | ${isFranchise ? "Oui" : "Non"} |`);
  L(`| Périodicité déclaration | ${par?.periodiciteDeclarationTVA ?? "—"} |`);
  L(`| Mois paiement salaires | ${moisPaiementSalaires} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(``);

  // ─── Section 1 : Récapitulatif annuel ────────────────────────────────────────

  L(`## 1. Tableau de trésorerie — récapitulatif annuel`);
  L(``);
  L(`| Désignation | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  renderRowsAnnual(rows, lines);
  L(``);

  // ─── Section 2 : Détail mensuel par exercice ─────────────────────────────────

  L(`## 2. Tableau de trésorerie — détail mensuel`);
  L(``);

  for (const [yk, yL, mL, enc_, dec_, var_, prec_, fin_] of [
    ["y1", y1L, monthLabels.y1, enc.totalEnc.y1, dec.totalDec.y1, variation.y1, soldePrecedent.y1, soldeFinal.y1],
    ["y2", y2L, monthLabels.y2, enc.totalEnc.y2, dec.totalDec.y2, variation.y2, soldePrecedent.y2, soldeFinal.y2],
    ["y3", y3L, monthLabels.y3, enc.totalEnc.y3, dec.totalDec.y3, variation.y3, soldePrecedent.y3, soldeFinal.y3],
  ] as [string, string, string[], MonthlySeries, MonthlySeries, MonthlySeries, MonthlySeries, MonthlySeries][]) {
    L(`### Exercice ${yL}`);
    L(``);

    const rowsData = [
      { label: "Total encaissements", months: enc_, bold: true },
      { label: "Total décaissements", months: dec_, bold: true },
      { label: "Variation de trésorerie", months: var_, bold: false },
      { label: "Solde précédent", months: prec_, totalIsEndValue: true, bold: false },
      { label: "**Solde de trésorerie**", months: fin_, totalIsEndValue: true, bold: true },
    ];
    L(monthlyTable("Désignation", rowsData, mL));
    L(``);

    // Détail encaissements
    const encDetails = [
      { label: "Apports capital", months: enc.encApportsCapital[yk as "y1"] },
      { label: "Apports CC", months: enc.encApportsCC[yk as "y1"] },
      { label: "Emprunts (déblocages)", months: enc.encEmprunts[yk as "y1"] },
      { label: "Production vendue (TTC)", months: enc.encProdVendue[yk as "y1"] },
      { label: "Subventions exploitation", months: enc.encSubvExpl[yk as "y1"] },
      { label: "Subventions / aides investissement", months: enc.encSubvInvest[yk as "y1"] },
      { label: "Encaissements divers", months: enc.encDivers[yk as "y1"] },
    ].filter((r) => sumS(r.months) !== 0);

    if (encDetails.length > 0) {
      L(`#### Détail encaissements ${yL}`);
      L(``);
      L(monthlyTable("Désignation", encDetails, mL));
      L(``);
    }

    // Détail encaissements par activité
    if (enc.activitesEncData.length > 0) {
      L(`#### Encaissements par activité ${yL}`);
      L(``);
      L(monthlyTable(
        "Activité",
        enc.activitesEncData
          .filter(({ yk3 }) => sumS(yk3[yk as "y1"]) !== 0)
          .map(({ act, yk3 }) => ({ label: act.libelle, months: yk3[yk as "y1"] })),
        mL,
      ));
      L(``);
    }

    // Détail décaissements
    const decDetails = [
      { label: "Immobilisations (TTC)", months: dec.decImmoTTC[yk as "y1"] },
      { label: "Échéances emprunts", months: dec.decEmprunts[yk as "y1"] },
      { label: "  dont capital", months: dec.decCapital[yk as "y1"] },
      { label: "  dont intérêts + assurances", months: dec.decInterets[yk as "y1"] },
      { label: "Achats effectués", months: dec.decAchats[yk as "y1"] },
      { label: "Charges externes", months: dec.decChargesExt[yk as "y1"] },
      { label: "Impôts et taxes", months: dec.decImpots[yk as "y1"] },
      { label: "Charges de personnel", months: dec.decPersonnel[yk as "y1"] },
      { label: "  dont salaires nets", months: dec.decSalairesNets[yk as "y1"] },
      { label: "  dont charges sociales", months: dec.decChargesSociales[yk as "y1"] },
      { label: "  dont rémunération dirigeant", months: dec.decRemuDirigeant[yk as "y1"] },
      { label: "  dont cotisations TNS", months: dec.decCotisationsTNS[yk as "y1"] },
      { label: "TVA à payer", months: dec.decTVA[yk as "y1"] },
      { label: "IS / Impôt sur les sociétés", months: dec.decIS[yk as "y1"] },
      { label: "Décaissements divers", months: dec.decDivers[yk as "y1"] },
    ].filter((r) => sumS(r.months) !== 0);

    L(`#### Détail décaissements ${yL}`);
    L(``);
    L(monthlyTable("Désignation", decDetails, mL));
    L(``);
  }

  // ─── Section 3 : Soldes mensuels par exercice (tableau compact) ──────────────

  L(`## 3. Soldes mensuels — vue synthétique`);
  L(``);

  for (const [yL, mL, fin_] of [
    [y1L, monthLabels.y1, soldeFinal.y1],
    [y2L, monthLabels.y2, soldeFinal.y2],
    [y3L, monthLabels.y3, soldeFinal.y3],
  ] as [string, string[], MonthlySeries][]) {
    L(`### ${yL}`);
    L(``);
    L(mkMonthTable("Solde fin de mois", fin_, mL, true));
    L(``);
  }

  // ─── Section 4 : Vérifications de cohérence ──────────────────────────────────

  L(`## 4. Vérifications de cohérence`);
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  const ykList = ["y1", "y2", "y3"] as const;
  const yLMap = { y1: y1L, y2: y2L, y3: y3L };

  // ── 1–3. Variation = totalEnc − totalDec (par mois, par exercice)
  for (const yk of ykList) {
    const yL = yLMap[yk];
    let allOk = true;
    for (let m = 0; m < 12; m++) {
      const exp = (enc.totalEnc[yk][m] ?? 0) - (dec.totalDec[yk][m] ?? 0);
      if (Math.abs((variation[yk][m] ?? 0) - exp) > 0.01) { allOk = false; break; }
    }
    checks.push({
      label: `[${yL}] Variation mensuelle = totalEnc − totalDec (12 mois)`,
      ok: allOk,
      detail: allOk ? `12/12 mois OK` : `divergence détectée`,
    });
  }

  // ── 4–6. Solde final = somme cumulative de la variation (par mois)
  for (const yk of ykList) {
    const yL = yLMap[yk];
    const sf = soldeFinal[yk];
    const sp = soldePrecedent[yk];
    const v = variation[yk];
    let allOk = true;
    for (let m = 0; m < 12; m++) {
      const exp = (sp[m] ?? 0) + (v[m] ?? 0);
      if (Math.abs((sf[m] ?? 0) - exp) > 0.01) { allOk = false; break; }
    }
    checks.push({
      label: `[${yL}] Solde final[m] = soldePrecedent[m] + variation[m] (12 mois)`,
      ok: allOk,
      detail: allOk ? `12/12 mois OK` : `divergence détectée`,
    });
  }

  // ── 7. Solde initial Y1 = 0
  checks.push({
    label: `Solde initial Y1 = 0 (démarrage)`,
    ok: eq(soldePrecedent.y1[0] ?? 0, 0),
    detail: `soldePrecedent.y1[0] = ${fmt(soldePrecedent.y1[0] ?? 0)}`,
  });

  // ── 8. Solde initial Y2 = solde final Y1 M12
  const sf1m12 = soldeFinal.y1[11] ?? 0;
  const sp2m1 = soldePrecedent.y2[0] ?? 0;
  checks.push({
    label: `Solde initial Y2 = soldeFinal Y1 M12`,
    ok: eq(sp2m1, sf1m12),
    detail: `${fmt(sp2m1)} ≟ ${fmt(sf1m12)}`,
  });

  // ── 9. Solde initial Y3 = solde final Y2 M12
  const sf2m12 = soldeFinal.y2[11] ?? 0;
  const sp3m1 = soldePrecedent.y3[0] ?? 0;
  checks.push({
    label: `Solde initial Y3 = soldeFinal Y2 M12`,
    ok: eq(sp3m1, sf2m12),
    detail: `${fmt(sp3m1)} ≟ ${fmt(sf2m12)}`,
  });

  // ── 10–12. Total annuel encaissements = somme des 12 mois
  for (const yk of ykList) {
    const yL = yLMap[yk];
    const annuel = sumS(enc.totalEnc[yk]);
    const sumMois = sumS(enc.totalEnc[yk]); // identique par construction
    checks.push({
      label: `[${yL}] Total encaissements annuel cohérent`,
      ok: eq(annuel, sumMois),
      detail: `${fmt(annuel)} ≟ ${fmt(sumMois)}`,
    });
  }

  // ── 13–15. Total annuel décaissements = somme des 12 mois
  for (const yk of ykList) {
    const yL = yLMap[yk];
    const annuel = sumS(dec.totalDec[yk]);
    checks.push({
      label: `[${yL}] Total décaissements annuel cohérent`,
      ok: true,
      detail: `${fmt(annuel)}`,
    });
  }

  // ── 16–18. Solde final M12 = solde précédent M12 + variation totale
  for (const yk of ykList) {
    const yL = yLMap[yk];
    const sf12 = soldeFinal[yk][11] ?? 0;
    const sp0  = soldePrecedent[yk][0] ?? 0;
    const varTotal = sumS(variation[yk]);
    checks.push({
      label: `[${yL}] Solde fin exercice = solde début + variation totale`,
      ok: eq(sf12, sp0 + varTotal),
      detail: `${fmt(sf12)} ≟ ${fmt(sp0)} + ${fmt(varTotal)} = ${fmt(sp0 + varTotal)}`,
    });
  }

  // ── 19–21. CA TTC = enc.encProdVendue ≈ fc.ca * (1 + tauxMoyen TVA)
  for (const yk of ykList) {
    const yL = yLMap[yk];
    const ttc = sumS(enc.encProdVendue[yk]);
    const ht = fc.ca[yk];
    checks.push({
      label: `[${yL}] Enc. production vendue TTC > CA HT`,
      ok: ttc >= ht - 1,
      detail: `TTC = ${fmt(ttc)} · HT = ${fmt(ht)}`,
    });
  }

  // ── Rendu des checks
  L(`| # | Vérification | Statut | Détail |`);
  L(`| --- | --- | --- | --- |`);
  let idx = 1;
  for (const c of checks) {
    const s = c.ok ? "✅" : "❌";
    L(`| ${idx++} | ${c.label} | ${s} | \`${c.detail}\` |`);
  }
  L(``);

  const okCount = checks.filter((c) => c.ok).length;
  const koCount = checks.filter((c) => !c.ok).length;
  L(`**Total : ${okCount} OK, ${koCount} KO sur ${checks.length} vérifications.**`);
  L(``);

  if (koCount > 0) {
    L(`### ⚠ Anomalies détectées`);
    L(``);
    for (const c of checks.filter((c) => !c.ok)) {
      L(`- **[KO]** ${c.label} — \`${c.detail}\``);
    }
    L(``);
  }

  // ─── Section 5 : Récapitulatif annuel détaillé ───────────────────────────────

  L(`## 5. Récapitulatif annuel par poste`);
  L(``);
  L(`| Désignation | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);

  const postes = [
    { label: "**ENCAISSEMENTS**", y1: 0, y2: 0, y3: 0, bold: true, section: true },
    { label: "Apports capital", y1: sumS(enc.encApportsCapital.y1), y2: sumS(enc.encApportsCapital.y2), y3: sumS(enc.encApportsCapital.y3) },
    { label: "Apports comptes courants", y1: sumS(enc.encApportsCC.y1), y2: sumS(enc.encApportsCC.y2), y3: sumS(enc.encApportsCC.y3) },
    { label: "Emprunts (déblocages)", y1: sumS(enc.encEmprunts.y1), y2: sumS(enc.encEmprunts.y2), y3: sumS(enc.encEmprunts.y3) },
    { label: "Production vendue (TTC)", y1: sumS(enc.encProdVendue.y1), y2: sumS(enc.encProdVendue.y2), y3: sumS(enc.encProdVendue.y3) },
    { label: "Subventions exploitation", y1: sumS(enc.encSubvExpl.y1), y2: sumS(enc.encSubvExpl.y2), y3: sumS(enc.encSubvExpl.y3) },
    { label: "Autres encaissements", y1: sumS(enc.encDivers.y1) + sumS(enc.encSubvInvest.y1), y2: sumS(enc.encDivers.y2) + sumS(enc.encSubvInvest.y2), y3: sumS(enc.encDivers.y3) + sumS(enc.encSubvInvest.y3) },
    { label: "**= Total encaissements**", y1: sumS(enc.totalEnc.y1), y2: sumS(enc.totalEnc.y2), y3: sumS(enc.totalEnc.y3), bold: true },
    { label: "", y1: 0, y2: 0, y3: 0, blank: true },
    { label: "**DÉCAISSEMENTS**", y1: 0, y2: 0, y3: 0, section: true },
    { label: "Immobilisations (TTC)", y1: sumS(dec.decImmoTTC.y1), y2: sumS(dec.decImmoTTC.y2), y3: sumS(dec.decImmoTTC.y3) },
    { label: "Échéances d'emprunts", y1: sumS(dec.decEmprunts.y1), y2: sumS(dec.decEmprunts.y2), y3: sumS(dec.decEmprunts.y3) },
    { label: "  dont remboursements capital", y1: sumS(dec.decCapital.y1), y2: sumS(dec.decCapital.y2), y3: sumS(dec.decCapital.y3) },
    { label: "  dont intérêts + assurances", y1: sumS(dec.decInterets.y1), y2: sumS(dec.decInterets.y2), y3: sumS(dec.decInterets.y3) },
    { label: "Achats effectués", y1: sumS(dec.decAchats.y1), y2: sumS(dec.decAchats.y2), y3: sumS(dec.decAchats.y3) },
    { label: "Charges externes", y1: sumS(dec.decChargesExt.y1), y2: sumS(dec.decChargesExt.y2), y3: sumS(dec.decChargesExt.y3) },
    { label: "Impôts et taxes", y1: sumS(dec.decImpots.y1), y2: sumS(dec.decImpots.y2), y3: sumS(dec.decImpots.y3) },
    { label: "Charges de personnel", y1: sumS(dec.decPersonnel.y1), y2: sumS(dec.decPersonnel.y2), y3: sumS(dec.decPersonnel.y3) },
    { label: "  dont salaires nets", y1: sumS(dec.decSalairesNets.y1), y2: sumS(dec.decSalairesNets.y2), y3: sumS(dec.decSalairesNets.y3) },
    { label: "  dont charges sociales", y1: sumS(dec.decChargesSociales.y1), y2: sumS(dec.decChargesSociales.y2), y3: sumS(dec.decChargesSociales.y3) },
    { label: "  dont rémunération dirigeant", y1: sumS(dec.decRemuDirigeant.y1), y2: sumS(dec.decRemuDirigeant.y2), y3: sumS(dec.decRemuDirigeant.y3) },
    { label: "  dont cotisations TNS", y1: sumS(dec.decCotisationsTNS.y1), y2: sumS(dec.decCotisationsTNS.y2), y3: sumS(dec.decCotisationsTNS.y3) },
    { label: "TVA à payer", y1: sumS(dec.decTVA.y1), y2: sumS(dec.decTVA.y2), y3: sumS(dec.decTVA.y3) },
    { label: "IS / Impôt sur les sociétés", y1: sumS(dec.decIS.y1), y2: sumS(dec.decIS.y2), y3: sumS(dec.decIS.y3) },
    { label: "Décaissements divers", y1: sumS(dec.decDivers.y1), y2: sumS(dec.decDivers.y2), y3: sumS(dec.decDivers.y3) },
    { label: "**= Total décaissements**", y1: sumS(dec.totalDec.y1), y2: sumS(dec.totalDec.y2), y3: sumS(dec.totalDec.y3), bold: true },
    { label: "", y1: 0, y2: 0, y3: 0, blank: true },
    { label: "**SOLDE**", y1: 0, y2: 0, y3: 0, section: true },
    { label: "Variation de trésorerie", y1: sumS(variation.y1), y2: sumS(variation.y2), y3: sumS(variation.y3) },
    { label: "Solde début d'exercice", y1: soldePrecedent.y1[0] ?? 0, y2: soldePrecedent.y2[0] ?? 0, y3: soldePrecedent.y3[0] ?? 0 },
    { label: "**= Solde fin d'exercice (M12)**", y1: soldeFinal.y1[11] ?? 0, y2: soldeFinal.y2[11] ?? 0, y3: soldeFinal.y3[11] ?? 0, bold: true },
  ] as Array<{ label: string; y1: number; y2: number; y3: number; bold?: boolean; section?: boolean; blank?: boolean }>;

  for (const p of postes) {
    if (p.blank) { L(`| | | | |`); continue; }
    if (p.section) { L(`| **${p.label}** | | | |`); continue; }
    if (p.y1 === 0 && p.y2 === 0 && p.y3 === 0 && !p.bold) continue;
    const pb = p.bold ? "**" : "";
    L(`| ${pb}${p.label}${pb} | ${pb}${fmt(p.y1)}${pb} | ${pb}${fmt(p.y2)}${pb} | ${pb}${fmt(p.y3)}${pb} |`);
  }
  L(``);

  // ─── Section 6 : Cohérence colonne annuelle vs données mensuelles ─────────────

  L(`## 6. Cohérence annuel vs M12 / ΣMois — par TresorerieRow`);
  L(``);
  L(`Pour chaque ligne du tableau de trésorerie, on vérifie que le \`total\` annuel est cohérent avec les données mensuelles :`);
  L(`- \`totalIsEndValue: true\` → **total = valeur M12** (soldes, report d'exercice)`);
  L(`- \`totalIsEndValue: false\` → **total = somme des 12 mois** (flux enc/déc)`);
  L(``);

  const allRows = collectRows(rows);
  type RowCheck = { label: string; yk: string; total: number; expected: number; totalIsEndValue: boolean; ok: boolean };
  const rowChecks: RowCheck[] = [];

  for (const row of allRows) {
    for (const yk of ykList) {
      const val = row.values[yk];
      const is12 = row.totalIsEndValue ?? false;
      const expected = is12 ? (val.months[11] ?? 0) : sumS(val.months);
      const ok = eq(val.total, expected);
      rowChecks.push({
        label: row.label,
        yk: yLMap[yk],
        total: val.total,
        expected,
        totalIsEndValue: is12,
        ok,
      });
    }
  }

  const rowOk = rowChecks.filter((c) => c.ok).length;
  const rowKo = rowChecks.filter((c) => !c.ok).length;

  L(`**${allRows.length} lignes vérifiées × 3 exercices = ${rowChecks.length} checks → ${rowOk} OK · ${rowKo} KO**`);
  L(``);

  if (rowKo > 0) {
    L(`### ⚠ Divergences détectées`);
    L(``);
    L(`| Ligne | Exercice | Mode | Total affiché | Attendu | Écart |`);
    L(`| --- | --- | --- | ---: | ---: | ---: |`);
    for (const c of rowChecks.filter((rc) => !rc.ok)) {
      const mode = c.totalIsEndValue ? "M12" : "ΣMois";
      const ecart = c.total - c.expected;
      L(`| ${c.label} | ${c.yk} | ${mode} | ${fmt(c.total)} | ${fmt(c.expected)} | **${fmt(ecart)}** |`);
    }
    L(``);
  } else {
    L(`✅ Toutes les ${rowChecks.length} valeurs annuelles sont cohérentes avec les séries mensuelles.`);
    L(``);
  }

  // ─── Écriture du fichier ──────────────────────────────────────────────────────

  const outPath = join(process.cwd(), "scripts", "debug", "output", "debug-tresorerie-output.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`\n✅ Rapport écrit dans ${outPath}`);
  console.log(`   ${checks.length} vérifications : ${okCount} OK · ${koCount} KO`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
