/**
 * Script de diagnostic de la Capacité d'Autofinancement (CAF).
 *
 * Usage :
 *   pnpm tsx scripts/debug-caf.ts <dossierId>
 *
 * Produit : scripts/debug-caf-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildCafRows, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildCafRows } from "@/lib/finance/aggregations/caf";
import type { CafRow } from "@/lib/finance/aggregations/caf";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };

function section2(title: string): string {
  return `\n## ${title}\n`;
}
function sectionH(title: string): string {
  return `\n### ${title}\n`;
}

// ─── Extraction d'une ligne par clé ──────────────────────────────────────────

function findRow(rows: CafRow[], key: string): CafRow | undefined {
  for (const row of rows) {
    if (row.key === key) return row;
    if (row.children) {
      const found = findRow(row.children, key);
      if (found) return found;
    }
  }
  return undefined;
}

function rowAmt(rows: CafRow[], key: string): YAcc {
  const row = findRow(rows, key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ─── Rendu d'une ligne CafRow ─────────────────────────────────────────────────

function renderRow(
  row: CafRow,
  lines: string[],
  depth: number,
  y1L: string,
  y2L: string,
  y3L: string,
) {
  const L = (s: string) => lines.push(s);
  const indent = "\\  ".repeat(depth);
  const bold = row.style === "highlight" || row.style === "subtotal";
  const p = bold ? "**" : "";
  const sign = row.sign ? `${row.sign} ` : "";
  const label = `${indent}${sign}${row.label}`;
  const v1 = row.values.y1.amount;
  const v2 = row.values.y2.amount;
  const v3 = row.values.y3.amount;
  L(`| ${p}${label}${p} | ${fmt(v1)} | ${fmt(v2)} | ${fmt(v3)} |`);
  if (row.children) {
    for (const child of row.children) {
      renderRow(child, lines, depth + 1, y1L, y2L, y3L);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-caf.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const { dateDemarrage: dateDemarrageDate } = data;

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const cafData = buildCafRows(data, fc);

  const { yearLabels, rows } = cafData;
  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const moisDebut = dateDemarrageDate.getMonth();

  L(`# Diagnostic CAF (Capacité d'Autofinancement) — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildCafRows\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Mois de début | ${MOIS_COURTS[moisDebut]} (${moisDebut + 1}) |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(`| Provisions | ${data.provisions.length} |`);
  L(`| Reprises sur produits | ${data.reprisesProduits.length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(``);

  // ─── Section 1 : Tableau CAF complet ─────────────────────────────────────────

  L(section2("1. Tableau CAF complet"));
  L(``);
  L(`| Désignation | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  for (const row of rows) {
    renderRow(row, lines, 0, y1L, y2L, y3L);
  }
  L(``);

  // ─── Section 2 : Vérifications de cohérence ──────────────────────────────────

  L(section2("2. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  function chk(label: string, a: number, b: number) {
    checks.push({ label, ok: eq(a, b), detail: `${fmt(a)} ≟ ${fmt(b)}` });
  }

  function chk3(
    labelFn: (y: string) => string,
    aFn: (y: YearKey) => number,
    bFn: (y: YearKey) => number,
  ) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      chk(labelFn(yLabel), aFn(y), bFn(y));
    }
  }

  const resNetV       = rowAmt(rows, "res_net");
  const dotAmortV     = rowAmt(rows, "dotations_amort");
  const dotProvV      = rowAmt(rows, "dotations_prov");
  const reprisesV     = rowAmt(rows, "reprises");
  const cafBruteV     = rowAmt(rows, "caf_brute");
  const remboursCapV  = rowAmt(rows, "remboursement_capital");
  const autofinV      = rowAmt(rows, "autofinancement");

  // CAF = ResNet + Dot.amort + Dot.prov − Reprises
  chk3(
    (y) => `CAF = Résultat net + Dot.amort + Dot.prov − Reprises (${y})`,
    (y) => cafBruteV[y],
    (y) => resNetV[y] + dotAmortV[y] + dotProvV[y] - reprisesV[y],
  );

  // Autofinancement = CAF − Remboursement capital
  chk3(
    (y) => `Autofinancement = CAF − Remboursement capital (${y})`,
    (y) => autofinV[y],
    (y) => cafBruteV[y] - remboursCapV[y],
  );

  // Dot.amort : somme des enfants = parent
  const dotAmortRow = findRow(rows, "dotations_amort");
  if (dotAmortRow?.children && dotAmortRow.children.length > 0) {
    chk3(
      (y) => `Dot.amort total = Σ par immobilisation (${y})`,
      (y) => dotAmortV[y],
      (y) => (dotAmortRow.children ?? []).reduce((s, c) => s + c.values[y as YearKey].amount, 0),
    );
  }

  // Dot.prov : somme des enfants = parent
  const dotProvRow = findRow(rows, "dotations_prov");
  if (dotProvRow?.children && dotProvRow.children.length > 0) {
    chk3(
      (y) => `Dot.prov total = Σ par provision (${y})`,
      (y) => dotProvV[y],
      (y) => (dotProvRow.children ?? []).reduce((s, c) => s + c.values[y as YearKey].amount, 0),
    );
  }

  // Reprises : somme des enfants = parent
  const reprisesRow = findRow(rows, "reprises");
  if (reprisesRow?.children && reprisesRow.children.length > 0) {
    chk3(
      (y) => `Reprises total = Σ par reprise (${y})`,
      (y) => reprisesV[y],
      (y) => (reprisesRow.children ?? []).reduce((s, c) => s + c.values[y as YearKey].amount, 0),
    );
  }

  // Remboursement capital : somme des enfants = parent
  const remboursRow = findRow(rows, "remboursement_capital");
  if (remboursRow?.children && remboursRow.children.length > 0) {
    chk3(
      (y) => `Remboursement capital total = Σ par emprunt (${y})`,
      (y) => remboursCapV[y],
      (y) => (remboursRow.children ?? []).reduce((s, c) => s + c.values[y as YearKey].amount, 0),
    );
  }

  // ── Cohérence avec FinCalcResult ─────────────────────────────────────────────

  const fcRows: { key: string; label: string; fcVal: YAcc }[] = [
    { key: "res_net",              label: "Résultat net",          fcVal: fc.resNet },
    { key: "dotations_amort",      label: "Dot. amortissements",   fcVal: fc.dotationsAmort },
    { key: "dotations_prov",       label: "Dot. provisions",       fcVal: fc.dotationsProvisions },
    { key: "reprises",             label: "Reprises",              fcVal: fc.reprises },
    { key: "caf_brute",            label: "CAF brute",             fcVal: fc.caf },
    { key: "remboursement_capital",label: "Remboursement capital", fcVal: fc.capitalRembourse },
    { key: "autofinancement",      label: "Autofinancement net",   fcVal: fc.autofinancement },
  ];

  for (const { key, label, fcVal } of fcRows) {
    const v = rowAmt(rows, key);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      chk(`${label} — CafRows vs FinCalc (${yLabel})`, v[y], fcVal[y]);
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

  // ─── Section 3 : Détail par immobilisation ────────────────────────────────────

  L(section2("3. Détail dotations par immobilisation"));
  L(``);

  if (fc.dotationsParImmoAcc.length > 0) {
    L(`| Immobilisation | Nature | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | --- | ---: | ---: | ---: |`);
    for (const d of fc.dotationsParImmoAcc) {
      L(`| ${d.immo.libelle} | ${d.immo.nature} | ${fmt(d.values.y1)} | ${fmt(d.values.y2)} | ${fmt(d.values.y3)} |`);
    }
    L(``);
    L(`| **Dot. amort. totales** | | **${fmt(dotAmortV.y1)}** | **${fmt(dotAmortV.y2)}** | **${fmt(dotAmortV.y3)}** |`);
  } else {
    L(`*Aucune immobilisation avec dotation.*`);
  }
  L(``);

  // ─── Section 4 : Détail provisions ───────────────────────────────────────────

  L(section2("4. Détail provisions & reprises"));
  L(``);

  if (data.provisions.length > 0) {
    L(sectionH("4.1 Dotations aux provisions"));
    L(`| Provision | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const p of data.provisions) {
      const v1 = Number(p.montantN ?? 0);
      const v2 = Number(p.montantN1 ?? 0);
      const v3 = Number(p.montantN2 ?? 0);
      if (v1 === 0 && v2 === 0 && v3 === 0) continue;
      L(`| ${p.libelle} | ${fmt(v1)} | ${fmt(v2)} | ${fmt(v3)} |`);
    }
    L(`| **Total** | **${fmt(dotProvV.y1)}** | **${fmt(dotProvV.y2)}** | **${fmt(dotProvV.y3)}** |`);
    L(``);
  }

  if (data.reprisesProduits.length > 0) {
    L(sectionH("4.2 Reprises sur provisions"));
    L(`| Reprise | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const r of data.reprisesProduits) {
      const v1 = Number(r.montantN ?? 0);
      const v2 = Number(r.montantN1 ?? 0);
      const v3 = Number(r.montantN2 ?? 0);
      if (v1 === 0 && v2 === 0 && v3 === 0) continue;
      L(`| ${r.libelle} | ${fmt(v1)} | ${fmt(v2)} | ${fmt(v3)} |`);
    }
    L(`| **Total** | **${fmt(reprisesV.y1)}** | **${fmt(reprisesV.y2)}** | **${fmt(reprisesV.y3)}** |`);
    L(``);
  }

  // ─── Section 5 : Détail emprunts — remboursement capital ─────────────────────

  L(section2("5. Remboursement capital par emprunt"));
  L(``);

  if (fc.capitalRembourseParEmprunt.length > 0) {
    L(`| Emprunt | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const e of fc.capitalRembourseParEmprunt) {
      L(`| ${e.emprunt.libelle} | ${fmt(e.values.y1)} | ${fmt(e.values.y2)} | ${fmt(e.values.y3)} |`);
    }
    L(`| **Total** | **${fmt(remboursCapV.y1)}** | **${fmt(remboursCapV.y2)}** | **${fmt(remboursCapV.y3)}** |`);
  } else {
    L(`*Aucun emprunt avec remboursement de capital.*`);
  }
  L(``);

  // ─── Section 6 : Récapitulatif ────────────────────────────────────────────────

  L(section2("6. Récapitulatif"));
  L(``);
  L(`| Bilan | Valeur |`);
  L(`| --- | --- |`);
  L(`| Total checks | ${checks.length} |`);
  L(`| ✅ OK | ${passed} |`);
  L(`| ❌ KO | ${failed} |`);
  L(``);

  if (failed === 0) {
    L(`> ✅ **Tous les checks sont OK.** Les calculs de la CAF sont cohérents.`);
  } else {
    L(`> ❌ **${failed} check(s) échoué(s).** Voir la section 2 pour les détails.`);
  }
  L(``);

  L(sectionH("6.1 Indicateurs clés"));
  L(``);
  L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  L(`| Résultat net | ${fmt(resNetV.y1)} | ${fmt(resNetV.y2)} | ${fmt(resNetV.y3)} |`);
  L(`| + Dot. amortissements | ${fmt(dotAmortV.y1)} | ${fmt(dotAmortV.y2)} | ${fmt(dotAmortV.y3)} |`);
  L(`| + Dot. provisions | ${fmt(dotProvV.y1)} | ${fmt(dotProvV.y2)} | ${fmt(dotProvV.y3)} |`);
  L(`| − Reprises | ${fmt(reprisesV.y1)} | ${fmt(reprisesV.y2)} | ${fmt(reprisesV.y3)} |`);
  L(`| **= CAF brute** | **${fmt(cafBruteV.y1)}** | **${fmt(cafBruteV.y2)}** | **${fmt(cafBruteV.y3)}** |`);
  L(`| − Remboursement capital | ${fmt(remboursCapV.y1)} | ${fmt(remboursCapV.y2)} | ${fmt(remboursCapV.y3)} |`);
  L(`| **= Autofinancement net** | **${fmt(autofinV.y1)}** | **${fmt(autofinV.y2)}** | **${fmt(autofinV.y3)}** |`);
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-caf-output.md");
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
