/**
 * Script de diagnostic du Besoin en Fonds de Roulement (BFR).
 *
 * Usage :
 *   pnpm tsx scripts/debug-bfr.ts <dossierId>
 *
 * Produit : scripts/debug-bfr-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (calcBfr, buildBfrRows, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import { n } from "@/lib/finance/utils";
import type { YearKey4 as YearKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc4 = { y0: number; y1: number; y2: number; y3: number };

function section2(title: string): string { return `\n## ${title}\n`; }
function sectionH(title: string): string { return `\n### ${title}\n`; }

// ─── Extraction d'une ligne par clé ──────────────────────────────────────────

function findRow(rows: BfrRow[], key: string): BfrRow | undefined {
  for (const row of rows) {
    if (row.key === key) return row;
    if (row.children) {
      const found = findRow(row.children, key);
      if (found) return found;
    }
  }
  return undefined;
}

function rowAmt(rows: BfrRow[], key: string): YAcc4 {
  const row = findRow(rows, key);
  if (!row) return { y0: 0, y1: 0, y2: 0, y3: 0 };
  return {
    y0: row.values.y0.amount,
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ─── Rendu d'une ligne BfrRow ─────────────────────────────────────────────────

function renderBfrRow(row: BfrRow, lines: string[], depth: number) {
  const L = (s: string) => lines.push(s);
  if (row.style === "section") {
    L(`| **${row.label}** | | | | |`);
    return;
  }
  const bold = row.style === "highlight" || row.style === "subtotal";
  const p = bold ? "**" : "";
  const sign = row.sign ? `${row.sign} ` : "";
  const indent = "\\  ".repeat(depth);
  const label = `${indent}${sign}${row.label}`;
  const v = row.values;
  L(`| ${p}${label}${p} | ${fmt(v.y0.amount)} | ${fmt(v.y1.amount)} | ${fmt(v.y2.amount)} | ${fmt(v.y3.amount)} |`);
  if (row.children) {
    for (const child of row.children) {
      renderBfrRow(child, lines, depth + 1);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-bfr.ts <dossierId>");
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
  const bfrCalc = calcBfr(data, fc);
  const bfrData = buildBfrRows(data, fc);

  const { yearLabels, rows } = bfrData;
  const y0L = "Initial";
  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const moisDebut = dateDemarrageDate.getMonth();

  const isIS = data.isIS ?? false;
  const periodicite = (data.scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
    ? "trimestriel" : "mensuel";
  const regimeTVA = data.scenario.parametres?.regimeTVA ?? "NORMAL";
  const delaiPaie = Math.max(0, n(data.scenario.parametres?.moisPaiementSalaires ?? 1));

  L(`# Diagnostic BFR (Besoin en Fonds de Roulement) — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`calcBfr\` · \`buildBfrRows\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Mois de début | ${MOIS_COURTS[moisDebut]} (${moisDebut + 1}) |`);
  L(`| Régime fiscal | ${isIS ? "IS" : "IR"} |`);
  L(`| Régime TVA | ${regimeTVA} |`);
  L(`| Périodicité TVA | ${periodicite} |`);
  L(`| Délai paiement salaires | ${delaiPaie} mois |`);
  L(`| Exercices | ${y0L} · ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(`| dont commerce/production | ${data.activites.filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES").length} |`);
  L(`| Fournitures & services actifs | ${[...data.fournitures, ...data.services].filter((c) => c.actif !== false).length} |`);
  L(`| Salariés | ${data.salaries.length} |`);
  L(`| Dirigeants | ${data.dirigeants.length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(``);

  // ─── Section 1 : Tableau BFR complet ─────────────────────────────────────────

  L(section2("1. Tableau BFR complet"));
  L(``);
  L(`| Désignation | ${y0L} | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const row of rows) {
    renderBfrRow(row, lines, 0);
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
    for (const y of ["y0", "y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y0" ? y0L : y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const a = aFn(y);
      const b = bFn(y);
      checks.push({ label: labelFn(yLabel), ok: eq(a, b), detail: `${fmt(a)} ≟ ${fmt(b)}` });
    }
  }

  // Extraire les valeurs depuis les rows UI
  const stocksV     = rowAmt(rows, "stocks");
  const creditTVAV  = rowAmt(rows, "credit_tva");
  const totalBesV   = rowAmt(rows, "total_besoins");
  const dettFournV  = rowAmt(rows, "dettes_fournisseurs");
  const dettChExtV  = rowAmt(rows, "dettes_charges_ext");
  const dettImpV    = rowAmt(rows, "dettes_impots");
  const dettPersV   = rowAmt(rows, "dettes_personnel");
  const tvaPayerV   = rowAmt(rows, "tva_a_payer");
  const dettISV     = rowAmt(rows, "dettes_is");
  const totalResV   = rowAmt(rows, "total_ressources");
  const variaBFRV   = rowAmt(rows, "variation_bfr");
  const bfrV        = rowAmt(rows, "bfr");

  // Les valeurs brutes de calcBfr (sans la couche UI buildBfrRows)
  const {
    stocksMatieres: bfrStocks,
    creditTVA: bfrCreditTVA,
    totalBesoins: bfrTotalBes,
    dettesFournisseurs: bfrDettFourn,
    dettesChargesExternes: bfrDettChExt,
    dettesImpots: bfrDettImp,
    dettesPersonnel: bfrDettPers,
    tvaAPayer: bfrTvaPayer,
    dettesIS: bfrDettIS,
    totalRessources: bfrTotalRes,
    bfr: bfrBfr,
    variationBFR: bfrVarBFR,
  } = bfrCalc;

  // ── Cohérence buildBfrRows vs calcBfr ──────────────────────────────────────

  chk3(
    (y) => `Stocks (UI) = calcBfr.stocksMatieres (${y})`,
    (y) => stocksV[y],
    (y) => bfrStocks[y],
  );
  chk3(
    (y) => `Crédit TVA (UI) = calcBfr.creditTVA (${y})`,
    (y) => creditTVAV[y],
    (y) => bfrCreditTVA[y],
  );
  chk3(
    (y) => `Total besoins (UI) = calcBfr.totalBesoins (${y})`,
    (y) => totalBesV[y],
    (y) => bfrTotalBes[y],
  );
  chk3(
    (y) => `Dettes fourn. (UI) = calcBfr.dettesFournisseurs (${y})`,
    (y) => dettFournV[y],
    (y) => bfrDettFourn[y],
  );
  chk3(
    (y) => `Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (${y})`,
    (y) => dettChExtV[y],
    (y) => bfrDettChExt[y],
  );
  chk3(
    (y) => `Dettes impôts (UI) = calcBfr.dettesImpots (${y})`,
    (y) => dettImpV[y],
    (y) => bfrDettImp[y],
  );
  chk3(
    (y) => `Dettes personnel (UI) = calcBfr.dettesPersonnel (${y})`,
    (y) => dettPersV[y],
    (y) => bfrDettPers[y],
  );
  chk3(
    (y) => `TVA à payer (UI) = calcBfr.tvaAPayer (${y})`,
    (y) => tvaPayerV[y],
    (y) => bfrTvaPayer[y],
  );
  if (isIS) {
    chk3(
      (y) => `Dettes IS (UI) = calcBfr.dettesIS (${y})`,
      (y) => dettISV[y],
      (y) => bfrDettIS[y],
    );
  }
  chk3(
    (y) => `Total ressources (UI) = calcBfr.totalRessources (${y})`,
    (y) => totalResV[y],
    (y) => bfrTotalRes[y],
  );
  chk3(
    (y) => `BFR (UI) = calcBfr.bfr (${y})`,
    (y) => bfrV[y],
    (y) => bfrBfr[y],
  );
  chk3(
    (y) => `VariationBFR (UI) = calcBfr.variationBFR (${y})`,
    (y) => variaBFRV[y],
    (y) => bfrVarBFR[y],
  );

  // ── Formules métier ────────────────────────────────────────────────────────

  // Total besoins = Stocks + CréditTVA  (y0 ne contient pas de créances clients)
  chk3(
    (y) => `Total besoins = Stocks + CréditTVA (${y}) [y0 seulement]`,
    (y) => y === "y0" ? totalBesV[y] : totalBesV[y],
    (y) => y === "y0"
      ? stocksV[y] + creditTVAV[y]
      : stocksV[y] + creditTVAV[y], // créances clients absent de rows mais dans calcBfr
  );

  // Total ressources = somme des dettes
  chk3(
    (y) => `Total ressources = Σ dettes (${y})`,
    (y) => totalResV[y],
    (y) =>
      dettFournV[y] + dettChExtV[y] + dettImpV[y] + dettPersV[y] +
      tvaPayerV[y] + (isIS ? dettISV[y] : 0),
  );

  // BFR = Total besoins − Total ressources
  chk3(
    (y) => `BFR = Total besoins − Total ressources (${y})`,
    (y) => bfrV[y],
    (y) => totalBesV[y] - totalResV[y],
  );

  // Variation BFR
  chk3(
    (y) => `Variation BFR (${y})`,
    (y) => variaBFRV[y],
    (y) => {
      if (y === "y0") return bfrV.y0;
      if (y === "y1") return bfrV.y1 - bfrV.y0;
      if (y === "y2") return bfrV.y2 - bfrV.y1;
      return bfrV.y3 - bfrV.y2;
    },
  );

  // Cohérence stocks avec FinCalcResult
  chk3(
    (y) => `Stocks (BFR y1-y3) = fc.stockFinal (${y})`,
    (y) => y === "y0" ? stocksV[y] : stocksV[y],
    (y) => {
      if (y === "y0") return stocksV[y]; // pas de fc.stockFinal pour y0
      return fc.stockFinal[y as "y1" | "y2" | "y3"];
    },
  );

  // Drill-down stocks : somme des enfants = parent
  const stocksRow = findRow(rows, "stocks");
  if (stocksRow?.children && stocksRow.children.length > 0) {
    for (const y of ["y1", "y2", "y3"] as ("y1" | "y2" | "y3")[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const sumChildren = stocksRow.children.reduce((s, c) => s + c.values[y].amount, 0);
      const parent = stocksRow.values[y].amount;
      checks.push({
        label: `Stocks total = Σ par activité (${yLabel})`,
        ok: eq(sumChildren, parent),
        detail: `${fmt(sumChildren)} ≟ ${fmt(parent)}`,
      });
    }
  }

  // Drill-down dettes fournisseurs : somme des enfants = parent
  const dettFournRow = findRow(rows, "dettes_fournisseurs");
  if (dettFournRow?.children && dettFournRow.children.length > 0) {
    for (const y of ["y1", "y2", "y3"] as ("y1" | "y2" | "y3")[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const sumChildren = dettFournRow.children.reduce((s, c) => s + c.values[y].amount, 0);
      const parent = dettFournRow.values[y].amount;
      checks.push({
        label: `Dettes fourn. total = Σ par activité (${yLabel})`,
        ok: eq(sumChildren, parent),
        detail: `${fmt(sumChildren)} ≟ ${fmt(parent)}`,
      });
    }
  }

  // Drill-down dettes charges ext : somme des enfants = parent
  const dettChExtRow = findRow(rows, "dettes_charges_ext");
  if (dettChExtRow?.children && dettChExtRow.children.length > 0) {
    for (const y of ["y1", "y2", "y3"] as ("y1" | "y2" | "y3")[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      const sumChildren = dettChExtRow.children.reduce((s, c) => s + c.values[y].amount, 0);
      const parent = dettChExtRow.values[y].amount;
      checks.push({
        label: `Dettes charges ext. total = Σ par charge (${yLabel})`,
        ok: eq(sumChildren, parent),
        detail: `${fmt(sumChildren)} ≟ ${fmt(parent)}`,
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

  // ─── Section 3 : Détail par activité ─────────────────────────────────────────

  L(section2("3. Détail par activité — Achats & stocks"));
  L(``);

  const actifsAchats = bfrCalc.achatsRows;
  if (actifsAchats.length > 0) {
    L(`| Activité | Coef | Jours stock | Jours fourn. | Stock y1 | Stock y2 | Stock y3 | Dette fourn. y1 | Dette fourn. y2 | Dette fourn. y3 |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
    for (const r of actifsAchats) {
      L(`| ${r.libelle} | ${(r.coef * 100).toFixed(1)} % | ${r.joursStock} j | ${r.joursFournisseur} j | ${fmt(r.m11StockY1)} | ${fmt(r.m11StockY2)} | ${fmt(r.m11StockY3)} | ${fmt(r.m11FournY1)} | ${fmt(r.m11FournY2)} | ${fmt(r.m11FournY3)} |`);
    }
    L(`| **Total** | | | | **${fmt(bfrCalc.stocksMatieres.y1)}** | **${fmt(bfrCalc.stocksMatieres.y2)}** | **${fmt(bfrCalc.stocksMatieres.y3)}** | **${fmt(bfrCalc.dettesFournisseurs.y1)}** | **${fmt(bfrCalc.dettesFournisseurs.y2)}** | **${fmt(bfrCalc.dettesFournisseurs.y3)}** |`);
  } else {
    L(`*Aucune activité commerce/production avec achats.*`);
  }
  L(``);

  // ─── Section 4 : Détail charges externes ─────────────────────────────────────

  L(section2("4. Détail charges externes — Dettes fin d'exercice"));
  L(``);

  const chargesExtRows = bfrCalc.chargesExtRows;
  if (chargesExtRows.length > 0) {
    L(`| Charge | Délai (j) | TVA | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: |`);
    for (const r of chargesExtRows) {
      L(`| ${r.libelle} | ${r.delaiReglement} j | ${r.tauxTVA} % | ${fmt(r.m11ChargeY1)} | ${fmt(r.m11ChargeY2)} | ${fmt(r.m11ChargeY3)} |`);
    }
    L(`| **Total** | | | **${fmt(bfrCalc.dettesChargesExternes.y1)}** | **${fmt(bfrCalc.dettesChargesExternes.y2)}** | **${fmt(bfrCalc.dettesChargesExternes.y3)}** |`);
  } else {
    L(`*Aucune charge externe active.*`);
  }
  L(``);

  // ─── Section 5 : Récapitulatif ────────────────────────────────────────────────

  L(section2("5. Récapitulatif"));
  L(``);
  L(`| Bilan | Valeur |`);
  L(`| --- | --- |`);
  L(`| Total checks | ${checks.length} |`);
  L(`| ✅ OK | ${passed} |`);
  L(`| ❌ KO | ${failed} |`);
  L(``);

  if (failed === 0) {
    L(`> ✅ **Tous les checks sont OK.** Les calculs du BFR sont cohérents.`);
  } else {
    L(`> ❌ **${failed} check(s) échoué(s).** Voir la section 2 pour les détails.`);
  }
  L(``);

  L(sectionH("5.1 Indicateurs clés"));
  L(``);
  L(`| Indicateur | ${y0L} | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: | ---: |`);
  L(`| Stocks de matières | ${fmt(stocksV.y0)} | ${fmt(stocksV.y1)} | ${fmt(stocksV.y2)} | ${fmt(stocksV.y3)} |`);
  L(`| Crédit de TVA | ${fmt(creditTVAV.y0)} | ${fmt(creditTVAV.y1)} | ${fmt(creditTVAV.y2)} | ${fmt(creditTVAV.y3)} |`);
  L(`| **Total besoins** | **${fmt(totalBesV.y0)}** | **${fmt(totalBesV.y1)}** | **${fmt(totalBesV.y2)}** | **${fmt(totalBesV.y3)}** |`);
  L(`| Dettes fournisseurs | ${fmt(dettFournV.y0)} | ${fmt(dettFournV.y1)} | ${fmt(dettFournV.y2)} | ${fmt(dettFournV.y3)} |`);
  L(`| Dettes charges ext. | ${fmt(dettChExtV.y0)} | ${fmt(dettChExtV.y1)} | ${fmt(dettChExtV.y2)} | ${fmt(dettChExtV.y3)} |`);
  L(`| Dettes impôts | ${fmt(dettImpV.y0)} | ${fmt(dettImpV.y1)} | ${fmt(dettImpV.y2)} | ${fmt(dettImpV.y3)} |`);
  L(`| Dettes personnel | ${fmt(dettPersV.y0)} | ${fmt(dettPersV.y1)} | ${fmt(dettPersV.y2)} | ${fmt(dettPersV.y3)} |`);
  L(`| TVA à payer | ${fmt(tvaPayerV.y0)} | ${fmt(tvaPayerV.y1)} | ${fmt(tvaPayerV.y2)} | ${fmt(tvaPayerV.y3)} |`);
  if (isIS) {
    L(`| Dettes IS | ${fmt(dettISV.y0)} | ${fmt(dettISV.y1)} | ${fmt(dettISV.y2)} | ${fmt(dettISV.y3)} |`);
  }
  L(`| **Total ressources** | **${fmt(totalResV.y0)}** | **${fmt(totalResV.y1)}** | **${fmt(totalResV.y2)}** | **${fmt(totalResV.y3)}** |`);
  L(`| **BFR** | **${fmt(bfrV.y0)}** | **${fmt(bfrV.y1)}** | **${fmt(bfrV.y2)}** | **${fmt(bfrV.y3)}** |`);
  L(`| Variation BFR | ${fmt(variaBFRV.y0)} | ${fmt(variaBFRV.y1)} | ${fmt(variaBFRV.y2)} | ${fmt(variaBFRV.y3)} |`);
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-bfr-output.md");
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
