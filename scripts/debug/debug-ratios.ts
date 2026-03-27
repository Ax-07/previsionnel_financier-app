/**
 * Script de diagnostic des Ratios financiers.
 *
 * Usage :
 *   pnpm tsx scripts/debug-ratios.ts <dossierId>
 *
 * Produit : scripts/debug-ratios-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildRatiosRows, calcBfr, calcImmosBilan, calcApportsCumulatifs,
 *  calcEmpruntsPassif, calcTresorerieBilan, calcCapitauxPropres, buildFinCalc)
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
import {
  calcImmosBilan,
  calcApportsCumulatifs,
  calcEmpruntsPassif,
  calcTresorerieBilan,
  calcCapitauxPropres,
} from "@/lib/finance/calculs/bilan";
import { buildRatiosRows } from "@/lib/finance/aggregations/ratios";
import type { RatioRow } from "@/lib/finance/aggregations/ratios";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function fmt(v: number | null, decimals = 2): string {
  if (v === null) return "—";
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtEur(v: number): string {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Division sécurisée — renvoie null si dénominateur ≈ 0 */
function safeDiv(num: number, den: number): number | null {
  return Math.abs(den) < 0.001 ? null : num / den;
}

function eqRatio(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 0.01;
}

function section2(title: string): string { return `\n## ${title}\n`; }
function sectionH(title: string): string { return `\n### ${title}\n`; }

// ─── Extraction d'une ligne par clé ──────────────────────────────────────────

function rowVal(rows: RatioRow[], key: string): Record<YearKey, number | null> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: null, y2: null, y3: null };
  return {
    y1: row.values.y1.value,
    y2: row.values.y2.value,
    y3: row.values.y3.value,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-ratios.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const { dateDemarrage: dateDemarrageDate } = data;

  // ── Calculs officiels (= application) ────────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const ratiosData = buildRatiosRows(data, fc);
  const { yearLabels, rows } = ratiosData;

  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  // ── Recalcul des valeurs intermédiaires (pour les checks) ─────────────────────
  const bfr = calcBfr(data, fc);

  const achatsRows = bfr.achatsRows;
  const stocks = bfr.stocksMatieres;

  const achatsAnnuels = {
    y1: achatsRows.reduce((s: number, r) => s + r.montantN * r.coef, 0),
    y2: achatsRows.reduce((s: number, r) => s + r.montantN1 * r.coef, 0),
    y3: achatsRows.reduce((s: number, r) => s + r.montantN2 * r.coef, 0),
  };
  const achatsConsommes = {
    y1: achatsAnnuels.y1 - stocks.y1,
    y2: achatsAnnuels.y2 + stocks.y1 - stocks.y2,
    y3: achatsAnnuels.y3 + stocks.y2 - stocks.y3,
  };

  const immos = calcImmosBilan(
    data,
    fc.anneeDebut,
    fc.moisDebut,
    fc.exBorne1,
    fc.exBorne2,
    fc.exBorne3,
    fc.dotationsParImmoAcc,
  );
  const { apportsCapital, apportsCC } = calcApportsCumulatifs(data, fc.exBorne1, fc.exBorne2, fc.exBorne3);
  const { capitalRestantDu, empruntsDebloques, remboursementsCumul } = calcEmpruntsPassif(
    data,
    fc.exBorne1,
    fc.exBorne2,
    fc.exBorne3,
  );

  const stocksCumul = {
    y1: bfr.stocksMatieres.y1 + bfr.creditTVA.y1,
    y2: bfr.stocksMatieres.y2 + bfr.creditTVA.y2,
    y3: bfr.stocksMatieres.y3 + bfr.creditTVA.y3,
  };
  const { disponibilites, decouvert } = calcTresorerieBilan({
    caf: fc.caf,
    apportsCapital,
    apportsCC,
    empruntsDebloques,
    immoAcquises: immos.immoAcquises,
    stocksCumul,
    totalDettesExploitation: bfr.totalRessources,
    remboursementsCumul,
  });
  const tresorerie = {
    y1: disponibilites.y1 - decouvert.y1,
    y2: disponibilites.y2 - decouvert.y2,
    y3: disponibilites.y3 - decouvert.y3,
  };

  const immoNetteFin = immos.immoNette;
  const { capitauxPropres } = calcCapitauxPropres(apportsCapital, apportsCC, fc.resNet);

  const totalDettesExploitation = bfr.totalRessources;
  const totalDettes = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3,
  };
  const actifCirculant = {
    y1: stocks.y1 + Math.max(0, tresorerie.y1),
    y2: stocks.y2 + Math.max(0, tresorerie.y2),
    y3: stocks.y3 + Math.max(0, tresorerie.y3),
  };
  const totalActif = {
    y1: immoNetteFin.y1 + actifCirculant.y1,
    y2: immoNetteFin.y2 + actifCirculant.y2,
    y3: immoNetteFin.y3 + actifCirculant.y3,
  };

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Ratios financiers — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildRatiosRows\` · \`calcBfr\` · \`calcImmosBilan\` · \`calcApportsCumulatifs\``);
  L(`\`calcEmpruntsPassif\` · \`calcTresorerieBilan\` · \`calcCapitauxPropres\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(`| Apports | ${data.apports.length} |`);
  L(``);

  // ─── Section 1 : Tableau des ratios complet ───────────────────────────────────

  L(section2("1. Tableau des ratios complet"));
  L(``);
  L(`| Ratio | Unité | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | --- | ---: | ---: | ---: |`);
  for (const row of rows) {
    const v1 = fmt(row.values.y1.value, row.decimals);
    const v2 = fmt(row.values.y2.value, row.decimals);
    const v3 = fmt(row.values.y3.value, row.decimals);
    L(`| ${row.label} | ${row.unit} | ${v1} | ${v2} | ${v3} |`);
  }
  L(``);

  // ─── Section 2 : Valeurs intermédiaires ──────────────────────────────────────

  L(section2("2. Valeurs intermédiaires (bases de calcul)"));
  L(``);
  L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  L(`| Achats annuels bruts (€) | ${fmtEur(achatsAnnuels.y1)} | ${fmtEur(achatsAnnuels.y2)} | ${fmtEur(achatsAnnuels.y3)} |`);
  L(`| Achats consommés (€) | ${fmtEur(achatsConsommes.y1)} | ${fmtEur(achatsConsommes.y2)} | ${fmtEur(achatsConsommes.y3)} |`);
  L(`| Stocks matières (€) | ${fmtEur(stocks.y1)} | ${fmtEur(stocks.y2)} | ${fmtEur(stocks.y3)} |`);
  L(`| Dettes fournisseurs (€) | ${fmtEur(bfr.dettesFournisseurs.y1)} | ${fmtEur(bfr.dettesFournisseurs.y2)} | ${fmtEur(bfr.dettesFournisseurs.y3)} |`);
  L(`| Dettes exploitation (€) | ${fmtEur(totalDettesExploitation.y1)} | ${fmtEur(totalDettesExploitation.y2)} | ${fmtEur(totalDettesExploitation.y3)} |`);
  L(`| Capital restant dû (€) | ${fmtEur(capitalRestantDu.y1)} | ${fmtEur(capitalRestantDu.y2)} | ${fmtEur(capitalRestantDu.y3)} |`);
  L(`| Total dettes (€) | ${fmtEur(totalDettes.y1)} | ${fmtEur(totalDettes.y2)} | ${fmtEur(totalDettes.y3)} |`);
  L(`| Immo nette fin exercice (€) | ${fmtEur(immoNetteFin.y1)} | ${fmtEur(immoNetteFin.y2)} | ${fmtEur(immoNetteFin.y3)} |`);
  L(`| Trésorerie nette (€) | ${fmtEur(tresorerie.y1)} | ${fmtEur(tresorerie.y2)} | ${fmtEur(tresorerie.y3)} |`);
  L(`| Actif circulant (€) | ${fmtEur(actifCirculant.y1)} | ${fmtEur(actifCirculant.y2)} | ${fmtEur(actifCirculant.y3)} |`);
  L(`| Total actif (€) | ${fmtEur(totalActif.y1)} | ${fmtEur(totalActif.y2)} | ${fmtEur(totalActif.y3)} |`);
  L(`| Capitaux propres (€) | ${fmtEur(capitauxPropres.y1)} | ${fmtEur(capitauxPropres.y2)} | ${fmtEur(capitauxPropres.y3)} |`);
  L(`| CAF (€) | ${fmtEur(fc.caf.y1)} | ${fmtEur(fc.caf.y2)} | ${fmtEur(fc.caf.y3)} |`);
  L(``);

  // ─── Section 3 : Vérifications de cohérence ──────────────────────────────────

  L(section2("3. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  // Valeurs UI extraites
  const delaiStocksV         = rowVal(rows, "delai_stocks");
  const delaiFournisseursV   = rowVal(rows, "delai_fournisseurs");
  const autonomieLtV         = rowVal(rows, "autonomie_lt");
  const solvabiliteMtV       = rowVal(rows, "solvabilite_mt");
  const solvabiliteCtV       = rowVal(rows, "solvabilite_ct");
  const tauxEndettementV     = rowVal(rows, "taux_endettement");
  const capaciteRembV        = rowVal(rows, "capacite_remboursement");

  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;

    // 1. Délai des stocks = stocks × 365 / achatsConsommés
    const expDelaiStocks = safeDiv(stocks[yk] * 365, achatsConsommes[yk]);
    checks.push({
      label: `[${yL}] Délai stocks = stocks×365 / achatsConsommés`,
      ok: eqRatio(delaiStocksV[yk], expDelaiStocks),
      detail: `${fmt(delaiStocksV[yk], 1)} ≟ ${fmt(expDelaiStocks, 1)} j`,
    });

    // 2. Délai fournisseurs = dettesFournisseurs × 365 / achatsAnnuels
    const expDelaiFourn = safeDiv(bfr.dettesFournisseurs[yk] * 365, achatsAnnuels[yk]);
    checks.push({
      label: `[${yL}] Délai fournisseurs = dettesFourn×365 / achatsAnnuels`,
      ok: eqRatio(delaiFournisseursV[yk], expDelaiFourn),
      detail: `${fmt(delaiFournisseursV[yk], 1)} ≟ ${fmt(expDelaiFourn, 1)} j`,
    });

    // 3. Autonomie LT = capitauxPropres×100 / totalActif
    const expAutonomie = safeDiv(capitauxPropres[yk] * 100, totalActif[yk]);
    checks.push({
      label: `[${yL}] Autonomie LT = capitauxPropres×100 / totalActif`,
      ok: eqRatio(autonomieLtV[yk], expAutonomie),
      detail: `${fmt(autonomieLtV[yk], 1)} ≟ ${fmt(expAutonomie, 1)} %`,
    });

    // 4. Solvabilité MT = totalActif×100 / totalDettes
    const expSolvMt = safeDiv(totalActif[yk] * 100, totalDettes[yk]);
    checks.push({
      label: `[${yL}] Solvabilité MT = totalActif×100 / totalDettes`,
      ok: eqRatio(solvabiliteMtV[yk], expSolvMt),
      detail: `${fmt(solvabiliteMtV[yk], 1)} ≟ ${fmt(expSolvMt, 1)} %`,
    });

    // 5. Solvabilité CT = actifCirculant×100 / totalDettesExploitation
    const expSolvCt = safeDiv(actifCirculant[yk] * 100, totalDettesExploitation[yk]);
    checks.push({
      label: `[${yL}] Solvabilité CT = actifCirculant×100 / detteExpl`,
      ok: eqRatio(solvabiliteCtV[yk], expSolvCt),
      detail: `${fmt(solvabiliteCtV[yk], 1)} ≟ ${fmt(expSolvCt, 1)} %`,
    });

    // 6. Taux d'endettement = totalDettes×100 / capitauxPropres
    const expTauxEndet = safeDiv(totalDettes[yk] * 100, capitauxPropres[yk]);
    checks.push({
      label: `[${yL}] Taux endettement = totalDettes×100 / capitauxPropres`,
      ok: eqRatio(tauxEndettementV[yk], expTauxEndet),
      detail: `${fmt(tauxEndettementV[yk], 1)} ≟ ${fmt(expTauxEndet, 1)} %`,
    });

    // 7. Capacité de remboursement = capitalRestantDu / CAF
    const expCapRemb = safeDiv(capitalRestantDu[yk], fc.caf[yk]);
    checks.push({
      label: `[${yL}] Capacité remboursement = capitalRestantDu / CAF`,
      ok: eqRatio(capaciteRembV[yk], expCapRemb),
      detail: `${fmt(capaciteRembV[yk], 2)} ≟ ${fmt(expCapRemb, 2)} ans`,
    });
  }

  // Cohérence immo nette
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    checks.push({
      label: `[${yL}] Actif circulant = stocks + max(0, trésorerie)`,
      ok: Math.abs(actifCirculant[yk] - (stocks[yk] + Math.max(0, tresorerie[yk]))) < 1,
      detail: `${fmtEur(actifCirculant[yk])} ≟ ${fmtEur(stocks[yk] + Math.max(0, tresorerie[yk]))}`,
    });
    checks.push({
      label: `[${yL}] Total actif = immo nette + actif circulant`,
      ok: Math.abs(totalActif[yk] - (immoNetteFin[yk] + actifCirculant[yk])) < 1,
      detail: `${fmtEur(totalActif[yk])} ≟ ${fmtEur(immoNetteFin[yk] + actifCirculant[yk])}`,
    });
    checks.push({
      label: `[${yL}] Total dettes = capital restant dû + dettes exploitation`,
      ok: Math.abs(totalDettes[yk] - (capitalRestantDu[yk] + totalDettesExploitation[yk])) < 1,
      detail: `${fmtEur(totalDettes[yk])} ≟ ${fmtEur(capitalRestantDu[yk] + totalDettesExploitation[yk])}`,
    });
  }

  const okCount = checks.filter((c) => c.ok).length;
  const koCount = checks.filter((c) => !c.ok).length;

  L(`| # | Vérification | Statut | Détail |`);
  L(`| --- | --- | --- | --- |`);
  checks.forEach((c, i) => {
    L(`| ${i + 1} | ${c.label} | ${c.ok ? "✅" : "❌"} | \`${c.detail}\` |`);
  });
  L(``);
  L(`**Total : ${okCount} OK, ${koCount} KO sur ${checks.length} vérifications.**`);
  L(``);

  // ─── Section 4 : Détail achats / stocks par activité ─────────────────────────

  L(section2("4. Détail achats et stocks par activité"));
  L(``);

  if (bfr.achatsRows.length === 0) {
    L(`_Aucune activité commerce / production._`);
  } else {
    L(`| Activité | Coef TTC | Stock (j) | Montant N (€) | Montant N+1 (€) | Montant N+2 (€) |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: |`);
    for (const r of bfr.achatsRows) {
      L(
        `| ${r.libelle} | ${r.coef.toFixed(4)} | ${r.joursStock.toFixed(0)} | ${fmtEur(r.montantN)} | ${fmtEur(r.montantN1)} | ${fmtEur(r.montantN2)} |`,
      );
    }
  }
  L(``);
  L(sectionH("Achats annuels et consommés (récap)"));
  L(``);
  L(`| Exercice | Achats annuels bruts (€) | Stocks (€) | Achats consommés (€) |`);
  L(`| --- | ---: | ---: | ---: |`);
  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(`| ${yL} | ${fmtEur(achatsAnnuels[yk])} | ${fmtEur(stocks[yk])} | ${fmtEur(achatsConsommes[yk])} |`);
  }
  L(``);

  // ─── Section 5 : Récapitulatif ────────────────────────────────────────────────

  L(section2("5. Récapitulatif"));
  L(``);
  L(`| Ratio | Unité | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | --- | ---: | ---: | ---: |`);
  for (const row of rows) {
    L(
      `| **${row.label}** | ${row.unit} | **${fmt(row.values.y1.value, row.decimals)}** | **${fmt(row.values.y2.value, row.decimals)}** | **${fmt(row.values.y3.value, row.decimals)}** |`,
    );
  }
  L(``);
  L(
    `**Score : ${okCount}/${checks.length} checks OK${koCount > 0 ? ` — ⚠ ${koCount} anomalie(s) détectée(s)` : " — ✅ aucune anomalie"}**`,
  );
  L(``);

  const output = lines.join("\n");
  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-ratios-output.md");
  writeFileSync(outputPath, output, "utf-8");
  console.log(`\nRapport généré : ${outputPath}`);
  console.log(`Checks : ${okCount} OK / ${koCount} KO / ${checks.length} total`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
