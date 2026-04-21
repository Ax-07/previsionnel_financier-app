/**
 * Script de diagnostic du budget prévisionnel (mensuel).
 *
 * Usage :
 *   pnpm tsx scripts/debug-budget.ts <dossierId>
 *
 * Produit : scripts/debug-budget-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildBudgetTree, buildMonthlyCalc, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildMonthlyCalc, totalOf } from "@/lib/finance/calculs/monthly";
import { buildBudgetTree } from "@/lib/finance/aggregations/budget/build-tree";
import { buildBudgetMonthLabels } from "@/lib/finance/aggregations/budget/helpers";
import type { BudgetNode } from "@/lib/finance/aggregations/budget/types";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires d'affichage ─────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };

function sep(): string {
  return `| --- | ---: | ---: | ---: |`;
}
function header(y1: string, y2: string, y3: string): string {
  return `| Désignation | ${y1} | ${y2} | ${y3} |\n${sep()}`;
}
function rowAmt(label: string, v: YAcc, bold = false): string {
  const p = bold ? "**" : "";
  return `| ${p}${label}${p} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |`;
}
function section2(title: string): string {
  return `\n## ${title}\n`;
}
function sectionH(title: string): string {
  return `\n### ${title}\n`;
}

const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Extraction d'un nœud par clé ────────────────────────────────────────────

function findNode(nodes: BudgetNode[], key: string): BudgetNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const found = findNode(node.children, key);
      if (found) return found;
    }
  }
  return undefined;
}

function nodeTotal(nodes: BudgetNode[], key: string): YAcc {
  const node = findNode(nodes, key);
  if (!node) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: node.values.y1.total,
    y2: node.values.y2.total,
    y3: node.values.y3.total,
  };
}

// ─── Rendu récursif de l'arbre Budget ────────────────────────────────────────

function renderBudgetNode(
  node: BudgetNode,
  lines: string[],
  depth: number,
): void {
  const L = (s: string) => lines.push(s);
  const indent = "\\  ".repeat(depth);
  const label = `${indent}${node.label}`;
  const v: YAcc = {
    y1: node.values.y1.total,
    y2: node.values.y2.total,
    y3: node.values.y3.total,
  };
  const bold = node.style === "highlight" || node.style === "result" || node.style === "total" || node.style === "section";
  L(rowAmt(label, v, bold));
  if (node.children) {
    for (const child of node.children) {
      renderBudgetNode(child, lines, depth + 1);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-budget.ts <dossierId>");
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
  const isIS = data.isIS ?? (par?.regimeFiscal ?? "IS") === "IS";

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const d = fc.filteredData;
  const mc = buildMonthlyCalc(d, dateDemarrageDate, fc.isParAnnee);
  const nodes = buildBudgetTree(d, mc);

  const monthLabels: Record<YearKey, string[]> = {
    y1: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut),
    y2: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut + 1),
    y3: buildBudgetMonthLabels(mc.moisDebut, mc.anneeDebut + 2),
  };

  const y1L = fc.yearLabels.y1;
  const y2L = fc.yearLabels.y2;
  const y3L = fc.yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Budget Prévisionnel — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildBudgetTree\` · \`buildMonthlyCalc\` · \`buildFinCalc\``);
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

  // ─── Section 1 : Arbre Budget complet (totaux annuels) ───────────────────────

  L(section2("1. Budget complet — Totaux annuels"));
  L(``);
  L(header(y1L, y2L, y3L));
  for (const node of nodes) {
    renderBudgetNode(node, lines, 0);
  }
  L(``);

  // ─── Section 2 : Vérifications de cohérence ──────────────────────────────────

  L(section2("2. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  function chk3(
    labelFn: (y: string) => string,
    aFn: (y: YearKey) => number,
    bFn: (y: YearKey) => number,
  ) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const a = aFn(y);
      const b = bFn(y);
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      checks.push({ label: labelFn(yLabel), ok: eq(a, b), detail: `${fmt(a)} ≟ ${fmt(b)}` });
    }
  }

  const caTotal       = nodeTotal(nodes, "ca");
  const margeGlob     = nodeTotal(nodes, "marge_globale");
  const achatsCons    = nodeTotal(nodes, "achats_consommes_glob");
  const chargesExtT   = nodeTotal(nodes, "charges_ext");
  const vaTotal       = nodeTotal(nodes, "va");
  const ebeTotal      = nodeTotal(nodes, "ebe");
  const chargesPerso  = nodeTotal(nodes, "charges_personnel");
  const resExplTotal  = nodeTotal(nodes, "res_expl");
  const dotAmortTotal = nodeTotal(nodes, "dotations_amort");
  const dotProvTotal  = nodeTotal(nodes, "dotations_prov");
  const reprisesTotal = nodeTotal(nodes, "reprises_prov");
  const resCourantT   = nodeTotal(nodes, "res_courant");
  const resFinTotal   = nodeTotal(nodes, "res_financier");
  const resNetTotal   = nodeTotal(nodes, "res_net");
  const cafTotal      = nodeTotal(nodes, "caf");
  const isTotal       = nodeTotal(nodes, "is_benef");
  const resExcepT     = nodeTotal(nodes, "res_excep");

  chk3(
    (y) => `Marge globale = CA − Achats consommés (${y})`,
    (y) => margeGlob[y],
    (y) => caTotal[y] - achatsCons[y],
  );

  chk3(
    (y) => `VA = Marge globale − Charges externes (${y})`,
    (y) => vaTotal[y],
    (y) => margeGlob[y] - chargesExtT[y],
  );

  const impotsTaxesT = nodeTotal(nodes, "impots_taxes");
  const subventionsT  = nodeTotal(nodes, "subventions");

  chk3(
    (y) => `EBE = VA − Impôts/taxes − Charges personnel + Subventions (${y})`,
    (y) => ebeTotal[y],
    (y) => vaTotal[y] - impotsTaxesT[y] - chargesPerso[y] + subventionsT[y],
  );

  chk3(
    (y) => `Résultat expl = EBE − Dot.amort − Dot.prov + Reprises (${y})`,
    (y) => resExplTotal[y],
    (y) => ebeTotal[y] - dotAmortTotal[y] - dotProvTotal[y] + reprisesTotal[y],
  );

  chk3(
    (y) => `Résultat courant = Résultat expl + Résultat fin (${y})`,
    (y) => resCourantT[y],
    (y) => resExplTotal[y] + resFinTotal[y],
  );

  chk3(
    (y) => `Résultat net = Résultat courant − IS + Résultat excep. (${y})`,
    (y) => resNetTotal[y],
    (y) => resCourantT[y] - (isIS ? isTotal[y] : 0) + resExcepT[y],
  );

  chk3(
    (y) => `CAF = Résultat net + Dot.amort + Dot.prov − Reprises (${y})`,
    (y) => cafTotal[y],
    (y) => resNetTotal[y] + dotAmortTotal[y] + dotProvTotal[y] - reprisesTotal[y],
  );

  // Cohérence mensuelle : total des mois = total annuel (pour les nœuds clés)
  const keyNodes = ["ca", "marge_globale", "va", "ebe", "res_expl", "res_courant", "res_net", "caf"];
  for (const key of keyNodes) {
    const node = findNode(nodes, key);
    if (!node) continue;
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const sumMois = node.values[y].months.reduce((s: number, v: number) => s + v, 0);
      const tot = node.values[y].total;
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      checks.push({
        label: `Somme mois = Total annuel — ${node.label} (${yLabel})`,
        ok: eq(sumMois, tot),
        detail: `Σ mois = ${fmt(sumMois)} ≟ total = ${fmt(tot)}`,
      });
    }
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;

  L(`| Check | Statut | Détail |`);
  L(`| --- | :---: | --- |`);
  for (const c of checks) {
    L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
  }
  L(``);

  // ─── Section 3 : Détail mensuel CA ───────────────────────────────────────────

  L(section2("3. Détail mensuel — Chiffre d'affaires"));
  L(``);

  const caNode = findNode(nodes, "ca");
  if (caNode) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      L(sectionH(`CA — ${yLabel}`));
      L(`| Mois | CA |`);
      L(`| --- | ---: |`);
      let tot = 0;
      for (let m = 0; m < 12; m++) {
        const v = caNode.values[y].months[m] ?? 0;
        tot += v;
        L(`| ${monthLabels[y][m]} | ${fmt(v)} |`);
      }
      L(`| **Total** | **${fmt(tot)}** |`);
      L(``);
    }
  }

  // ─── Section 4 : Tableau mensuel complet (grands soldes) ─────────────────────

  L(section2("4. Tableau mensuel — Grands soldes"));
  L(``);
  L(`*36 colonnes (12 mois × 3 exercices). Nœuds de synthèse uniquement (sans drill-down).*`);
  L(``);

  const grandsSoldes = ["ca", "marge_globale", "va", "ebe", "res_expl", "res_courant", "res_net", "caf"];
  for (const key of grandsSoldes) {
    const node = findNode(nodes, key);
    if (!node) continue;
    L(sectionH(node.label));
    L(``);
    // Tableau compact : 1 ligne par exercice
    L(`| Exercice | ${MOIS_COURTS.join(" | ")} | **Total** |`);
    L(`| --- |${MOIS_COURTS.map(() => " ---: |").join("")} ---: |`);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const months = node.values[y].months;
      const tot = node.values[y].total;
      L(`| **${yLabel}** | ${months.map(fmt).join(" | ")} | **${fmt(tot)}** |`);
    }
    L(``);
  }

  // ─── Section 5 : Détail mensuel par activité ─────────────────────────────────

  L(section2("5. Détail mensuel par activité (CA)"));
  L(``);

  for (const a of mc.caByActivity) {
    L(sectionH(a.libelle));
    L(``);
    L(`| Exercice | ${MOIS_COURTS.join(" | ")} | **Total** |`);
    L(`| --- |${MOIS_COURTS.map(() => " ---: |").join("")} ---: |`);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const months = a.series[y];
      const tot = totalOf(months);
      L(`| **${yLabel}** | ${months.map(fmt).join(" | ")} | **${fmt(tot)}** |`);
    }
    L(``);
  }

  // ─── Section 6 : Détail mensuel charges ──────────────────────────────────────

  L(section2("6. Détail mensuel — Principales charges"));
  L(``);

  const chargeKeys: { key: string; label: string }[] = [
    { key: "achats_effectues",   label: "Achats effectués" },
    { key: "achats_consommes_glob", label: "Achats consommés" },
    { key: "fournitures",        label: "Fournitures consommables" },
    { key: "services",           label: "Services extérieurs" },
    { key: "charges_ext",        label: "Charges externes (Total)" },
    { key: "impots_taxes",       label: "Impôts et taxes" },
    { key: "salaires_bruts",     label: "Salaires bruts" },
    { key: "charges_sociales",   label: "Charges sociales" },
    { key: "remunerations_dir",  label: "Rémunération dirigeant" },
    { key: "cotisations_tns",    label: "Cotisations TNS" },
    { key: "charges_personnel",  label: "Charges personnel (Total)" },
    { key: "dotations_amort",    label: "Dotations amortissements" },
    { key: "charges_fin",        label: "Charges financières" },
  ];

  for (const { key } of chargeKeys) {
    const node = findNode(nodes, key);
    if (!node) continue;
    const anyNonZero = (["y1", "y2", "y3"] as YearKey[]).some((y) => node.values[y].total !== 0);
    if (!anyNonZero) continue;
    L(sectionH(node.label));
    L(``);
    L(`| Exercice | ${MOIS_COURTS.join(" | ")} | **Total** |`);
    L(`| --- |${MOIS_COURTS.map(() => " ---: |").join("")} ---: |`);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const months = node.values[y].months;
      const tot = node.values[y].total;
      L(`| **${yLabel}** | ${months.map(fmt).join(" | ")} | **${fmt(tot)}** |`);
    }
    L(``);
  }

  // ─── Section 7 : Récapitulatif global ────────────────────────────────────────

  L(section2("7. Récapitulatif global de cohérence"));
  L(``);

  L(`| Bilan | Valeur |`);
  L(`| --- | --- |`);
  L(`| Total checks | ${checks.length} |`);
  L(`| ✅ OK | ${passed} |`);
  L(`| ❌ KO | ${failed} |`);
  L(``);

  if (failed === 0) {
    L(`> ✅ **Tous les checks sont OK.** Les calculs du budget sont cohérents.`);
  } else {
    L(`> ❌ **${failed} check(s) échoué(s).** Voir la section 2 pour les détails.`);
  }
  L(``);

  L(sectionH("7.1 Indicateurs clés (totaux annuels)"));
  L(``);
  L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  const kpis: { key: string; label: string }[] = [
    { key: "ca",              label: "Chiffre d'affaires" },
    { key: "achats_consommes_glob", label: "Achats consommés" },
    { key: "marge_globale",   label: "Marge globale" },
    { key: "charges_ext",     label: "Charges externes" },
    { key: "va",              label: "Valeur ajoutée" },
    { key: "charges_personnel", label: "Charges personnel" },
    { key: "ebe",             label: "EBE" },
    { key: "dotations_amort", label: "Dotations amort." },
    { key: "res_expl",        label: "Résultat exploitation" },
    { key: "res_financier",   label: "Résultat financier" },
    { key: "res_courant",     label: "Résultat courant" },
    { key: "res_net",         label: "Résultat net" },
    { key: "caf",             label: "CAF" },
  ];
  for (const { key, label } of kpis) {
    const v = nodeTotal(nodes, key);
    L(`| ${label} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |`);
  }
  L(``);

  L(sectionH("7.2 Cohérence avec FinCalcResult"));
  L(``);
  L(`*Vérification que les totaux du budget correspondent aux agrégats annuels de \`buildFinCalc\`.*`);
  L(``);
  L(`| Indicateur | Budget y1 | FinCalc y1 | Budget y2 | FinCalc y2 | Budget y3 | FinCalc y3 |`);
  L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: |`);

  type FCRow = { key: string; label: string; fcVal: YAcc };
  const fcRows: FCRow[] = [
    { key: "ca",              label: "CA",              fcVal: fc.ca },
    { key: "marge_globale",   label: "Marge globale",   fcVal: { y1: fc.ca.y1 - fc.achatsConsommes.y1, y2: fc.ca.y2 - fc.achatsConsommes.y2, y3: fc.ca.y3 - fc.achatsConsommes.y3 } },
    { key: "va",              label: "VA",              fcVal: fc.valeurAjoutee },
    { key: "ebe",             label: "EBE",             fcVal: fc.ebe },
    { key: "res_expl",        label: "Résultat expl",   fcVal: fc.resExpl },
    { key: "res_courant",     label: "Résultat courant",fcVal: fc.resCourant },
    { key: "res_net",         label: "Résultat net",    fcVal: fc.resNet },
    { key: "caf",             label: "CAF",             fcVal: fc.caf },
  ];

  const crossChecks: Check[] = [];
  for (const { key, label, fcVal } of fcRows) {
    const bv = nodeTotal(nodes, key);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      crossChecks.push({
        label: `${label} (${yLabel})`,
        ok: eq(bv[y], fcVal[y]),
        detail: `Budget=${fmt(bv[y])} | FinCalc=${fmt(fcVal[y])}`,
      });
    }
  }

  // Tableau de comparaison
  for (const { key, label, fcVal } of fcRows) {
    const bv = nodeTotal(nodes, key);
    const icon = (["y1", "y2", "y3"] as YearKey[]).every((y) => eq(bv[y], fcVal[y])) ? "✅" : "❌";
    L(`| ${icon} ${label} | ${fmt(bv.y1)} | ${fmt(fcVal.y1)} | ${fmt(bv.y2)} | ${fmt(fcVal.y2)} | ${fmt(bv.y3)} | ${fmt(fcVal.y3)} |`);
  }
  L(``);

  const crossPassed = crossChecks.filter((c) => c.ok).length;
  const crossFailed = crossChecks.filter((c) => !c.ok).length;
  if (crossFailed === 0) {
    L(`> ✅ **Budget et FinCalcResult sont parfaitement cohérents (${crossPassed}/${crossChecks.length} checks OK).**`);
  } else {
    L(`> ❌ **${crossFailed} divergence(s) entre Budget et FinCalcResult. Voir tableau ci-dessus.**`);
  }
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const totalChecks = checks.length + crossChecks.length;
  const totalPassed = passed + crossPassed;
  const totalFailed = failed + crossFailed;

  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-budget-output.md");
  writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`\n✅ Diagnostic écrit dans : ${outputPath}`);
  console.log(`   Checks : ${totalPassed}/${totalChecks} OK${totalFailed > 0 ? ` · ${totalFailed} KO` : ""}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  prisma.$disconnect();
  process.exit(1);
});
