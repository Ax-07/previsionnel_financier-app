/**
 * Script de diagnostic du SIG (Soldes Intermédiaires de Gestion).
 *
 * Usage :
 *   pnpm tsx scripts/debug-sig.ts <dossierId>
 *
 * Produit : scripts/debug-sig-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildSigData, buildSigRows, buildSigTree, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildSigData, buildSigRows } from "@/lib/finance/aggregations/sig";
import type { SigNode } from "@/lib/finance/aggregations/sig";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires d'affichage ─────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number | null) =>
  v === null ? "—" : `${v.toFixed(1)} %`;
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };

function row(
  label: string,
  v: YAcc,
  { note, bold }: { note?: string; bold?: boolean } = {},
): string {
  const p = bold ? "**" : "";
  return `| ${p}${label}${p} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |${note ? ` *${note}*` : ""}`;
}

function rowPct(
  label: string,
  v: YAcc,
  pctV: { y1: number | null; y2: number | null; y3: number | null },
  { bold }: { bold?: boolean } = {},
): string {
  const p = bold ? "**" : "";
  return `| ${p}${label}${p} | ${fmt(v.y1)} | ${fmtPct(pctV.y1)} | ${fmt(v.y2)} | ${fmtPct(pctV.y2)} | ${fmt(v.y3)} | ${fmtPct(pctV.y3)} |`;
}

function sep(): string {
  return `| --- | ---: | ---: | ---: |`;
}
function sepPct(): string {
  return `| --- | ---: | ---: | ---: | ---: | ---: | ---: |`;
}
function header(y1: string, y2: string, y3: string): string {
  return `| Désignation | ${y1} | ${y2} | ${y3} |\n${sep()}`;
}
function headerPct(y1: string, y2: string, y3: string): string {
  return `| Désignation | ${y1} € | ${y1} % CA | ${y2} € | ${y2} % CA | ${y3} € | ${y3} % CA |\n${sepPct()}`;
}
function section(title: string): string {
  return `\n### ${title}\n`;
}
function section2(title: string): string {
  return `\n## ${title}\n`;
}

/** Labels de mois courts en français */
const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Rendu récursif de l'arbre SIG ───────────────────────────────────────────

function renderSigNode(
  node: SigNode,
  lines: string[],
  depth: number,
): void {
  const L = (s: string) => lines.push(s);

  const indent = "\\  ".repeat(depth);
  const label = `${indent}${node.label}`;
  const v: YAcc = {
    y1: node.values.y1.amount,
    y2: node.values.y2.amount,
    y3: node.values.y3.amount,
  };
  const pct = {
    y1: node.values.y1.pct,
    y2: node.values.y2.pct,
    y3: node.values.y3.pct,
  };

  const isBold = node.style === "highlight" || node.style === "total" || node.style === "section";

  if (node.style === "section") {
    L(rowPct(`**${label}**`, v, pct, { bold: false }));
  } else {
    L(rowPct(label, v, pct, { bold: isBold }));
  }

  if (node.children) {
    for (const child of node.children) {
      renderSigNode(child, lines, depth + 1);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-sig.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const { dateDemarrage: dateDemarrageDate } = data;
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth();

  const par = data.scenario.parametres;
  const isIS = (par?.regimeFiscal ?? "IS") === "IS";

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const sigData = buildSigData(data, fc, isIS);
  // buildSigRows pour les détails drill-down
  const sigRows = buildSigRows(data, fc);

  const y1L = sigData.yearLabels.y1;
  const y2L = sigData.yearLabels.y2;
  const y3L = sigData.yearLabels.y3;

  // Raccourcis vers les agrégats du moteur financier
  const {
    ca,
    achatsEffectues,
    achatsConsommes,
    fournitures: fournituresAgg,
    services: servicesAgg,
    chargesExternes,
    valeurAjoutee,
    subventions: subventionsAgg,
    impotsTaxes: impotsTaxesAgg,
    chargesPersonnel,
    ebe,
    dotationsAmort,
    dotationsProvisions,
    reprises,
    resExpl,
    produitsFinanciers,
    interetsEmprunts,
    fraisDossierEmprunts,
    autresChargesFinancieres,
    resFin,
    resCourant,
    resExcep,
    isParAnnee,
    resNet,
    caf,
  } = fc;

  const chargesPersonnelTotal = chargesPersonnel.total;
  const salairesBruts         = chargesPersonnel.salairesBruts;
  const chargesPatronales     = chargesPersonnel.chargesPatronales;
  const remuDirigeant         = chargesPersonnel.remuDirigeant;
  const cotisationsTNSTotal   = chargesPersonnel.cotisationsTNSTotal;

  // chargesFinancieres = interetsEmprunts + fraisDossierEmprunts + autresChargesFinancieres
  // (même formule que monthly.ts > chargesFinancieresAcc)
  const chargesFinTotal: YAcc = {
    y1: interetsEmprunts.y1 + fraisDossierEmprunts.y1 + autresChargesFinancieres.y1,
    y2: interetsEmprunts.y2 + fraisDossierEmprunts.y2 + autresChargesFinancieres.y2,
    y3: interetsEmprunts.y3 + fraisDossierEmprunts.y3 + autresChargesFinancieres.y3,
  };

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic SIG (Soldes Intermédiaires de Gestion) — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildSigData\` · \`buildSigRows\` · \`buildSigTree\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Année de début | ${anneeDebut} |`);
  L(`| Mois de début | ${MOIS_COURTS[moisDebut]} (${moisDebut + 1}) |`);
  L(`| Régime fiscal | ${isIS ? "IS" : "IR"} |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Activités | ${data.activites.length} |`);
  L(`| Salariés | ${data.salaries.length} |`);
  L(`| Dirigeants | ${data.dirigeants.length} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(``);

  // ─── Section 1 : Arbre SIG complet ───────────────────────────────────────────

  L(section2("1. Arbre SIG complet (avec drill-down)"));
  L(``);
  L(`*Les % CA sont calculés par rapport au CA HT de l'exercice. \`\\  \` = niveau d'indentation.*`);
  L(``);
  L(headerPct(y1L, y2L, y3L));

  for (const node of sigData.nodes) {
    renderSigNode(node, lines, 0);
  }
  L(``);

  // ─── Section 2 : SIG synthèse (sans drill-down) ───────────────────────────────

  L(section2("2. SIG — Synthèse des grands soldes"));
  L(``);
  L(headerPct(y1L, y2L, y3L));

  const pctCa = (v: YAcc): { y1: number | null; y2: number | null; y3: number | null } => ({
    y1: ca.y1 !== 0 ? (v.y1 / ca.y1) * 100 : null,
    y2: ca.y2 !== 0 ? (v.y2 / ca.y2) * 100 : null,
    y3: ca.y3 !== 0 ? (v.y3 / ca.y3) * 100 : null,
  });

  L(rowPct("**Chiffre d'affaires (CA)**", ca, pctCa(ca), { bold: true }));
  L(rowPct("  Achats effectués", achatsEffectues, pctCa(achatsEffectues)));
  L(rowPct("  Achats consommés", achatsConsommes, pctCa(achatsConsommes)));
  L(rowPct("**Marge globale**", valeurAjoutee.y1 !== undefined ? {
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  } : ca, pctCa({
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  }), { bold: true }));
  L(rowPct("  Fournitures consommables", fournituresAgg, pctCa(fournituresAgg)));
  L(rowPct("  Services extérieurs", servicesAgg, pctCa(servicesAgg)));
  L(rowPct("  Charges externes (Total)", chargesExternes, pctCa(chargesExternes)));
  L(rowPct("**Valeur ajoutée (VA)**", valeurAjoutee, pctCa(valeurAjoutee), { bold: true }));
  L(rowPct("  Subventions exploitation", subventionsAgg, pctCa(subventionsAgg)));
  L(rowPct("  Impôts et taxes", impotsTaxesAgg, pctCa(impotsTaxesAgg)));
  L(rowPct("  Charges de personnel (Total)", chargesPersonnelTotal, pctCa(chargesPersonnelTotal)));
  L(rowPct("    Salaires bruts (Salariés)", salairesBruts, pctCa(salairesBruts)));
  L(rowPct("    Charges sociales (Salariés)", chargesPatronales, pctCa(chargesPatronales)));
  L(rowPct("    Rémunération dirigeant", remuDirigeant, pctCa(remuDirigeant)));
  L(rowPct("    Cotisations TNS", cotisationsTNSTotal, pctCa(cotisationsTNSTotal)));
  L(rowPct("**EBE**", ebe, pctCa(ebe), { bold: true }));
  L(rowPct("  Dotations amortissements", dotationsAmort, pctCa(dotationsAmort)));
  L(rowPct("  Dotations provisions", dotationsProvisions, pctCa(dotationsProvisions)));
  L(rowPct("  Reprises sur provisions", reprises, pctCa(reprises)));
  L(rowPct("**Résultat d'exploitation**", resExpl, pctCa(resExpl), { bold: true }));
  L(rowPct("  Charges financières", chargesFinTotal, pctCa(chargesFinTotal)));
  L(rowPct("  Produits financiers", produitsFinanciers, pctCa(produitsFinanciers)));
  L(rowPct("**Résultat financier**", resFin, pctCa(resFin), { bold: true }));
  L(rowPct("**Résultat courant**", resCourant, pctCa(resCourant), { bold: true }));
  if (isIS) {
    L(rowPct("  Impôt sur les bénéfices (IS)", isParAnnee, pctCa(isParAnnee)));
  }
  if (resExcep.y1 !== 0 || resExcep.y2 !== 0 || resExcep.y3 !== 0) {
    L(rowPct("  Résultat exceptionnel", resExcep, pctCa(resExcep)));
  }
  L(rowPct("**Résultat de l'exercice**", resNet, pctCa(resNet), { bold: true }));
  L(rowPct("**CAF**", caf, pctCa(caf), { bold: true }));
  L(``);

  // ─── Section 3 : Vérifications de cohérence ──────────────────────────────────

  L(section2("3. Vérifications de cohérence des soldes"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  // Helper : check pour les 3 années
  function chk3(
    key: string,
    labelFn: (y: string) => string,
    aFn: (y: YearKey) => number,
    bFn: (y: YearKey) => number,
  ) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const a = aFn(y);
      const b = bFn(y);
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      checks.push({
        label: `${labelFn(yLabel)}`,
        ok: eq(a, b),
        detail: `${fmt(a)} ≟ ${fmt(b)}`,
      });
    }
  }

  const margeGlobaleAcc: YAcc = {
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  };

  // 3.1 Marge globale = CA − Achats consommés
  chk3(
    "mg",
    (y) => `Marge globale = CA − Achats consommés (${y})`,
    (y) => margeGlobaleAcc[y],
    (y) => ca[y] - achatsConsommes[y],
  );

  // 3.2 VA = Marge globale − Charges externes (+ Subventions)
  chk3(
    "va",
    (y) => `VA = Marge globale − Charges externes + Subventions (${y})`,
    (y) => valeurAjoutee[y],
    (y) => margeGlobaleAcc[y] - chargesExternes[y] + subventionsAgg[y],
  );

  // 3.3 EBE = VA − Impôts/taxes − Charges personnel
  chk3(
    "ebe",
    (y) => `EBE = VA − Impôts/taxes − Charges personnel (${y})`,
    (y) => ebe[y],
    (y) => valeurAjoutee[y] - impotsTaxesAgg[y] - chargesPersonnelTotal[y],
  );

  // 3.4 Résultat expl = EBE − Dot. amort − Dot. prov + Reprises
  chk3(
    "re",
    (y) => `Résultat expl = EBE − Dot.amort − Dot.prov + Reprises (${y})`,
    (y) => resExpl[y],
    (y) => ebe[y] - dotationsAmort[y] - dotationsProvisions[y] + reprises[y],
  );

  // 3.5 Résultat financier = Produits financiers − Charges financières
  chk3(
    "rf",
    (y) => `Résultat financier = Prod.fin − Chg.fin (${y})`,
    (y) => resFin[y],
    (y) => produitsFinanciers[y] - chargesFinTotal[y],
  );

  // 3.6 Résultat courant = Résultat expl + Résultat financier
  chk3(
    "rc",
    (y) => `Résultat courant = Résultat expl + Résultat fin (${y})`,
    (y) => resCourant[y],
    (y) => resExpl[y] + resFin[y],
  );

  // 3.7 Résultat net = Résultat courant − IS + Résultat exceptionnel
  chk3(
    "rn",
    (y) => `Résultat net = Résultat courant − IS + Résultat excep. (${y})`,
    (y) => resNet[y],
    (y) => resCourant[y] - (isIS ? isParAnnee[y] : 0) + resExcep[y],
  );

  // 3.8 CAF = Résultat net + Dotations amort − Reprises (+ Dot.prov)
  chk3(
    "caf",
    (y) => `CAF = Résultat net + Dot.amort + Dot.prov − Reprises (${y})`,
    (y) => caf[y],
    (y) => resNet[y] + dotationsAmort[y] + dotationsProvisions[y] - reprises[y],
  );

  // 3.9 Charges de personnel = Salaires + Charges pat + Rému dir + Cotis TNS
  chk3(
    "cp",
    (y) => `Charges personnel = Salaires + Chg.pat + Rému.dir + Cotis.TNS (${y})`,
    (y) => chargesPersonnelTotal[y],
    (y) => salairesBruts[y] + chargesPatronales[y] + remuDirigeant[y] + cotisationsTNSTotal[y],
  );

  L(`| Check | Statut | Détail |`);
  L(`| --- | :---: | --- |`);
  for (const c of checks) {
    L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
  }
  L(``);

  // ─── Section 4 : Drill-down activités ────────────────────────────────────────

  L(section2("4. Drill-down — Activités (CA)"));
  L(``);

  const caRows = sigRows.caRows;
  if (caRows.length > 0) {
    L(`| Activité | Type | ${y1L} € | ${y1L} % CA | ${y2L} € | ${y2L} % CA | ${y3L} € | ${y3L} % CA |`);
    L(`| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |`);
    for (const r of caRows) {
      const p1 = ca.y1 !== 0 ? ((r.montantN  / ca.y1) * 100).toFixed(1) + " %" : "—";
      const p2 = ca.y2 !== 0 ? ((r.montantN1 / ca.y2) * 100).toFixed(1) + " %" : "—";
      const p3 = ca.y3 !== 0 ? ((r.montantN2 / ca.y3) * 100).toFixed(1) + " %" : "—";
      L(`| ${r.libelle} | ${r.typeActivite} | ${fmt(r.montantN)} | ${p1} | ${fmt(r.montantN1)} | ${p2} | ${fmt(r.montantN2)} | ${p3} |`);
    }
    L(``);
    L(row("**Total CA**", ca, { bold: true }));
    L(``);
  } else {
    L(`*Aucune activité.*\n`);
  }

  // ─── Section 5 : Drill-down charges ───────────────────────────────────────────

  L(section2("5. Drill-down — Charges"));
  L(``);

  function drillDownSection(
    title: string,
    rows: { libelle: string; montantN: number; montantN1: number; montantN2: number }[],
    total: YAcc,
  ) {
    L(section(`5 — ${title}`));
    if (rows.length > 0) {
      L(header(y1L, y2L, y3L));
      for (const r of rows) {
        L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
      }
      L(row(`**Total**`, total, { bold: true }));
      L(``);
    } else {
      L(`*Aucune ligne.*\n`);
    }
  }

  drillDownSection("Fournitures consommables", sigRows.fournituresRows, fournituresAgg);
  drillDownSection("Services extérieurs", sigRows.servicesRows, servicesAgg);
  drillDownSection("Impôts et taxes", sigRows.impotsRows, impotsTaxesAgg);

  // Salariés (avec taux cotisation patronale)
  L(section("5 — Salariés"));
  if (sigRows.salaireRows.length > 0) {
    L(`| Salarié | Tx.cot.pat | ${y1L} brut | ${y2L} brut | ${y3L} brut |`);
    L(`| --- | ---: | ---: | ---: | ---: |`);
    for (const r of sigRows.salaireRows) {
      L(`| ${r.libelle} | ${r.tauxCotPat.toFixed(1)} % | ${fmt(r.montantN)} | ${fmt(r.montantN1)} | ${fmt(r.montantN2)} |`);
    }
    L(``);
    L(header(y1L, y2L, y3L));
    L(row("Salaires bruts", salairesBruts));
    L(row("Charges sociales patronales", chargesPatronales));
    L(row("**Total charges salariés**", { y1: salairesBruts.y1 + chargesPatronales.y1, y2: salairesBruts.y2 + chargesPatronales.y2, y3: salairesBruts.y3 + chargesPatronales.y3 }, { bold: true }));
    L(``);
  } else {
    L(`*Aucun salarié.*\n`);
  }

  drillDownSection("Dirigeants", sigRows.dirigeantRows, remuDirigeant);
  drillDownSection("Cotisations TNS", sigRows.cotisationsRows, cotisationsTNSTotal);
  drillDownSection("Reprises sur provisions", sigRows.reprisesRows, reprises);
  drillDownSection("Produits financiers", sigRows.prodFinRows, produitsFinanciers);

  // ─── Section 6 : Dotations aux amortissements détaillées ─────────────────────

  L(section2("6. Détail des dotations aux amortissements"));
  L(``);

  const dotsParImmo = sigRows.dotationsParImmoData;
  if (dotsParImmo.length > 0) {
    L(`| Immobilisation | Nature | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | --- | ---: | ---: | ---: |`);
    for (const d of dotsParImmo) {
      L(`| ${d.immo.libelle} | ${d.immo.nature ?? "—"} | ${fmt(d.y1)} | ${fmt(d.y2)} | ${fmt(d.y3)} |`);
    }
    L(``);
    L(row("**Total dotations amortissements**", dotationsAmort, { bold: true }));
    L(``);
  } else {
    L(`*Aucune dotation.*\n`);
  }

  // ─── Section 7 : Mensualités CA par activité ──────────────────────────────────

  L(section2("7. CA mensuel par exercice (agrégat)"));
  L(``);

  L(header(y1L, y2L, y3L));
  L(row("**CA annuel**", ca, { bold: true }));
  L(``);
  L(`*Note : la série mensuelle du CA n'est pas exposée dans \`FinCalcResult\`. Voir le tableau de trésorerie pour le détail mensuel des encaissements.*`);

  // ─── Section 8 : Récapitulatif global ────────────────────────────────────────

  L(section2("8. Récapitulatif global de cohérence"));
  L(``);

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;

  L(`| Bilan | Valeur |`);
  L(`| --- | --- |`);
  L(`| Total checks | ${checks.length} |`);
  L(`| ✅ OK | ${passed} |`);
  L(`| ❌ KO | ${failed} |`);
  L(``);

  if (failed === 0) {
    L(`> ✅ **Tous les checks sont OK.** Les calculs SIG sont cohérents.`);
  } else {
    L(`> ❌ **${failed} check(s) échoué(s).** Voir la section 3 pour les détails.`);
  }
  L(``);

  L(section("8.1 Indicateurs clés SIG"));
  L(``);
  L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  L(`| CA | ${fmt(ca.y1)} | ${fmt(ca.y2)} | ${fmt(ca.y3)} |`);
  L(`| Achats consommés | ${fmt(achatsConsommes.y1)} | ${fmt(achatsConsommes.y2)} | ${fmt(achatsConsommes.y3)} |`);
  L(`| Marge globale | ${fmt(margeGlobaleAcc.y1)} | ${fmt(margeGlobaleAcc.y2)} | ${fmt(margeGlobaleAcc.y3)} |`);
  L(`| Charges externes | ${fmt(chargesExternes.y1)} | ${fmt(chargesExternes.y2)} | ${fmt(chargesExternes.y3)} |`);
  L(`| Valeur ajoutée | ${fmt(valeurAjoutee.y1)} | ${fmt(valeurAjoutee.y2)} | ${fmt(valeurAjoutee.y3)} |`);
  L(`| Charges personnel | ${fmt(chargesPersonnelTotal.y1)} | ${fmt(chargesPersonnelTotal.y2)} | ${fmt(chargesPersonnelTotal.y3)} |`);
  L(`| EBE | ${fmt(ebe.y1)} | ${fmt(ebe.y2)} | ${fmt(ebe.y3)} |`);
  L(`| Dotations amort. | ${fmt(dotationsAmort.y1)} | ${fmt(dotationsAmort.y2)} | ${fmt(dotationsAmort.y3)} |`);
  L(`| Résultat exploitation | ${fmt(resExpl.y1)} | ${fmt(resExpl.y2)} | ${fmt(resExpl.y3)} |`);
  L(`| Résultat financier | ${fmt(resFin.y1)} | ${fmt(resFin.y2)} | ${fmt(resFin.y3)} |`);
  L(`| Résultat courant | ${fmt(resCourant.y1)} | ${fmt(resCourant.y2)} | ${fmt(resCourant.y3)} |`);
  if (isIS) {
    L(`| IS | ${fmt(isParAnnee.y1)} | ${fmt(isParAnnee.y2)} | ${fmt(isParAnnee.y3)} |`);
  }
  L(`| Résultat net | ${fmt(resNet.y1)} | ${fmt(resNet.y2)} | ${fmt(resNet.y3)} |`);
  L(`| CAF | ${fmt(caf.y1)} | ${fmt(caf.y2)} | ${fmt(caf.y3)} |`);
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-sig-output.md");
  writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`\n✅ Diagnostic écrit dans : ${outputPath}`);
  console.log(`   Checks : ${passed}/${checks.length} OK${failed > 0 ? ` · ${failed} KO` : ""}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  prisma.$disconnect();
  process.exit(1);
});
