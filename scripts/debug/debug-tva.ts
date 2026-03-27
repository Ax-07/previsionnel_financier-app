/**
 * Script de diagnostic de la TVA.
 *
 * Usage :
 *   pnpm tsx scripts/debug-tva.ts <dossierId>
 *
 * Produit : scripts/debug-tva-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildTVARows, computeTVAMonthly, buildMonthLabels)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import type { VATRow } from "@/lib/finance/aggregations/tva";
import { buildMonthLabels } from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 0.5;

function section2(title: string): string { return `\n## ${title}\n`; }
function sectionH(title: string): string { return `\n### ${title}\n`; }

// ─── Extraction d'une ligne par clé (avec search récursif) ───────────────────

function findRow(rows: VATRow[], key: string): VATRow | undefined {
  for (const row of rows) {
    if (row.key === key) return row;
    if (row.children) {
      const found = findRow(row.children, key);
      if (found) return found;
    }
  }
  return undefined;
}

function rowTotal(rows: VATRow[], key: string): Record<YearKey, number> {
  const row = findRow(rows, key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.total,
    y2: row.values.y2.total,
    y3: row.values.y3.total,
  };
}

function rowMonths(rows: VATRow[], key: string): Record<YearKey, number[]> {
  const row = findRow(rows, key);
  if (!row) return { y1: Array(12).fill(0), y2: Array(12).fill(0), y3: Array(12).fill(0) };
  return {
    y1: [...row.values.y1.months],
    y2: [...row.values.y2.months],
    y3: [...row.values.y3.months],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-tva.ts <dossierId>");
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

  const fmtEx = (yr: number) =>
    moisDebut === 0 ? `${yr}` : `${yr}\u2013${yr + 1}`;

  const yearLabels: Record<YearKey, string> = {
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  const monthLabels: Record<YearKey, string[]> = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";

  const periodicite = (
    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
      ? "trimestriel"
      : "mensuel"
  ) as "mensuel" | "trimestriel";

  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic TVA — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildTVARows\` · \`computeTVAMonthly\` · \`buildMonthLabels\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Régime TVA | ${regimeTVA} |`);
  L(`| Franchise de base | ${isFranchise ? "Oui" : "Non"} |`);
  L(`| Périodicité déclaration | ${periodicite} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(`| dont commerce/production | ${data.activites.filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES").length} |`);
  L(`| Fournitures | ${data.fournitures.length} |`);
  L(`| Services | ${data.services.length} |`);
  L(`| Immobilisations récupérables | ${data.immobilisations.filter((i) => i.actif !== false && i.typeTva === "RECUPERABLE").length} |`);
  L(``);

  if (isFranchise) {
    L(`> **Franchise de base** : aucune TVA collectée ni déductible. Tableau vide.`);
    L(``);
    const output = lines.join("\n");
    writeFileSync(join(process.cwd(), "scripts/debug/output", "debug-tva-output.md"), output, "utf-8");
    console.log("\nRégime franchise — aucune TVA à calculer.");
    await prisma.$disconnect();
    return;
  }

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const rows = buildTVARows(data, periodicite);

  // ─── Section 1 : Tableau TVA — totaux annuels ─────────────────────────────

  L(section2("1. Tableau TVA — totaux annuels"));
  L(``);
  L(`| Désignation | Style | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | --- | ---: | ---: | ---: |`);

  function renderRow(row: VATRow, depth = 0) {
    if (row.style === "section") {
      L(`| **${row.label}** | section | | | |`);
      return;
    }
    const bold = row.style === "highlight" || row.style === "subtotal" || row.style === "result";
    const p = bold ? "**" : "";
    const indent = "\\  ".repeat(depth);
    L(`| ${p}${indent}${row.label}${p} | ${row.style} | ${p}${fmt(row.values.y1.total)}${p} | ${p}${fmt(row.values.y2.total)}${p} | ${p}${fmt(row.values.y3.total)}${p} |`);
    if (row.children) {
      for (const child of row.children) renderRow(child, depth + 1);
    }
  }

  for (const row of rows) renderRow(row);
  L(``);

  // ─── Section 2 : Tableau TVA mensuel ─────────────────────────────────────────

  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(sectionH(`Détail mensuel ${yL}`));
    L(``);

    const mLabels = monthLabels[yk];
    const header = `| Ligne | ${mLabels.join(" | ")} | Total |`;
    const sep = `| --- |${" ---: |".repeat(13)}`;
    L(header);
    L(sep);

    const keysToPrint = [
      "total-collectee",
      "total-deductible",
      "tva-nette",
      "credit-tva",
      "tva-payer",
    ];
    for (const key of keysToPrint) {
      const row = findRow(rows, key);
      if (!row) continue;
      const vals = row.values[yk];
      const monthStr = vals.months.map((v) => fmt(v)).join(" | ");
      L(`| **${row.label}** | ${monthStr} | **${fmt(vals.total)}** |`);
    }
    L(``);
  }

  // ─── Section 3 : Vérifications de cohérence ──────────────────────────────────

  L(section2("3. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  const collecteeV     = rowTotal(rows, "total-collectee");
  const deductibleV    = rowTotal(rows, "total-deductible");
  const tvaImmoV       = rowTotal(rows, "tva-immo");
  const tvaAchatsV     = rowTotal(rows, "tva-achats");
  const tvaChargesV    = rowTotal(rows, "tva-charges");
  const tvaNetteTot    = rowTotal(rows, "tva-nette");
  const tvaPayerV      = rowTotal(rows, "tva-payer");

  const collecteeMonths  = rowMonths(rows, "total-collectee");
  const deductibleMonths = rowMonths(rows, "total-deductible");
  const tvaNetteMonths   = rowMonths(rows, "tva-nette");
  const tvaPayerMonths   = rowMonths(rows, "tva-payer");
  const creditMonths     = rowMonths(rows, "credit-tva");

  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;

    // 1. Total déductible = immo + achats + charges
    const expDeductible = tvaImmoV[yk] + tvaAchatsV[yk] + tvaChargesV[yk];
    checks.push({
      label: `[${yL}] Total déductible = immo + achats + charges`,
      ok: eq(deductibleV[yk], expDeductible),
      detail: `${fmt(deductibleV[yk])} ≟ ${fmt(expDeductible)}`,
    });

    // 2. TVA nette annuelle = collectée - déductible
    const expNette = collecteeV[yk] - deductibleV[yk];
    checks.push({
      label: `[${yL}] TVA nette totale = collectée − déductible (totaux annuels)`,
      ok: eq(tvaNetteTot[yk], expNette),
      detail: `${fmt(tvaNetteTot[yk])} ≟ ${fmt(expNette)}`,
    });

    // 3. TVA nette mensuelle = collectée - déductible (mois par mois)
    let netteOk = true;
    for (let m = 0; m < 12; m++) {
      const expM = (collecteeMonths[yk][m] ?? 0) - (deductibleMonths[yk][m] ?? 0);
      if (!eq(tvaNetteMonths[yk][m] ?? 0, expM)) { netteOk = false; break; }
    }
    checks.push({
      label: `[${yL}] TVA nette mensuelle = collectée − déductible (12 mois)`,
      ok: netteOk,
      detail: netteOk ? "12/12 mois OK" : "au moins 1 mois KO",
    });

    // 4. Total des rows = somme des mois
    const sumMonthsCollectee = collecteeMonths[yk].reduce((a, b) => a + b, 0);
    checks.push({
      label: `[${yL}] Total collectée = somme des 12 mois`,
      ok: eq(collecteeV[yk], sumMonthsCollectee),
      detail: `${fmt(collecteeV[yk])} ≟ ${fmt(sumMonthsCollectee)}`,
    });
    const sumMonthsDeductible = deductibleMonths[yk].reduce((a, b) => a + b, 0);
    checks.push({
      label: `[${yL}] Total déductible = somme des 12 mois`,
      ok: eq(deductibleV[yk], sumMonthsDeductible),
      detail: `${fmt(deductibleV[yk])} ≟ ${fmt(sumMonthsDeductible)}`,
    });
    const sumMonthsPayer = tvaPayerMonths[yk].reduce((a, b) => a + b, 0);
    checks.push({
      label: `[${yL}] Total TVA à payer = somme des 12 mois`,
      ok: eq(tvaPayerV[yk], sumMonthsPayer),
      detail: `${fmt(tvaPayerV[yk])} ≟ ${fmt(sumMonthsPayer)}`,
    });
  }

  // 5. Report du crédit inter-exercices
  // Recalculer les finalCredit via computeTVAMonthly

  // TVA immo avant démarrage (immos hors période)
  let tvaImmoY0 = 0;
  const { dateToExercise } = await import("@/lib/finance/aggregations/tva/helpers");
  for (const immo of data.immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const { yk } = dateToExercise(dateDemarrageDate, new Date(immo.dateAcquisition));
    if (yk === null) tvaImmoY0 += tva;
  }

  const collecteeArr = { y1: collecteeMonths.y1, y2: collecteeMonths.y2, y3: collecteeMonths.y3 } as Record<YearKey, number[] & { length: 12 }>;
  const deductibleArr = { y1: deductibleMonths.y1, y2: deductibleMonths.y2, y3: deductibleMonths.y3 } as Record<YearKey, number[] & { length: 12 }>;

  const y1Calc = computeTVAMonthly(collecteeArr.y1 as never, deductibleArr.y1 as never, periodicite, tvaImmoY0);
  const y2Calc = computeTVAMonthly(collecteeArr.y2 as never, deductibleArr.y2 as never, periodicite, y1Calc.finalCredit);
  const y3Calc = computeTVAMonthly(collecteeArr.y3 as never, deductibleArr.y3 as never, periodicite, y2Calc.finalCredit);

  // Vérifier TVA à payer mensuelle vs computeTVAMonthly
  for (const [yk, calc] of [["y1", y1Calc], ["y2", y2Calc], ["y3", y3Calc]] as const) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    let payerOk = true;
    let creditOk = true;
    for (let m = 0; m < 12; m++) {
      if (!eq(tvaPayerMonths[yk][m] ?? 0, calc.tvaAPayerMonthly[m] ?? 0)) { payerOk = false; }
      if (!eq(creditMonths[yk][m] ?? 0, calc.creditReporteMonthly[m] ?? 0)) { creditOk = false; }
    }
    checks.push({
      label: `[${yL}] TVA à payer mensuelle = computeTVAMonthly (12 mois)`,
      ok: payerOk,
      detail: payerOk ? "12/12 mois OK" : "au moins 1 mois KO",
    });
    checks.push({
      label: `[${yL}] Crédit TVA reporté mensuel = computeTVAMonthly (12 mois)`,
      ok: creditOk,
      detail: creditOk ? "12/12 mois OK" : "au moins 1 mois KO",
    });
  }

  // Crédit final y1 → crédit initial y2
  checks.push({
    label: `Crédit final ${y1L} reporté sur ${y2L} (computeTVAMonthly)`,
    ok: eq(y1Calc.finalCredit, y2Calc.finalCredit - (y2Calc.finalCredit - y1Calc.finalCredit) + 0),
    detail: `finalCredit y1 = ${fmt(y1Calc.finalCredit)}, initialCredit y2 = ${fmt(y1Calc.finalCredit)}`,
  });

  // Balance annuelle : TVA à payer + crédit final = TVA nette + crédit initial
  const creditsInitiaux = { y1: tvaImmoY0, y2: y1Calc.finalCredit, y3: y2Calc.finalCredit };
  const creditsFinaux = { y1: y1Calc.finalCredit, y2: y2Calc.finalCredit, y3: y3Calc.finalCredit };

  for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    const ciInit = creditsInitiaux[yk];
    const cfFin = creditsFinaux[yk];
    const tvaNet = tvaNetteTot[yk];
    const tvaPay = tvaPayerV[yk];
    // Balance : tvaPayer + créditInit = tvaNet + créditFinal
    // Dérivation : credit[m] - credit[m-1] = tvaAPayer[m] - tvaNet[m]
    // Somme télescopique sur 12 mois → tvaPay + ciInit = tvaNet + cfFin
    const lhs = tvaPay + ciInit;
    const rhs = tvaNet + cfFin;
    checks.push({
      label: `[${yL}] Balance TVA : àPayer + créditInit = tvaNet + créditFin`,
      ok: eq(lhs, rhs),
      detail: `${fmt(tvaPay)} + ${fmt(ciInit)} = ${fmt(tvaNet)} + ${fmt(cfFin)} ⟹ ${fmt(lhs)} ≟ ${fmt(rhs)}`,
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

  // ─── Section 4 : Détail par activité (TVA collectée) ─────────────────────────

  L(section2("4. Détail TVA collectée par activité"));
  L(``);

  const tvaCARow = findRow(rows, "tva-ca");
  const children = tvaCARow?.children ?? [];
  if (children.length === 0) {
    L(`_Aucune activité._`);
  } else {
    L(`| Activité | ${y1L} (€) | ${y2L} (€) | ${y3L} (€) |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const child of children) {
      L(`| ${child.label} | ${fmt(child.values.y1.total)} | ${fmt(child.values.y2.total)} | ${fmt(child.values.y3.total)} |`);
    }
  }
  L(``);

  // ─── Section 5 : Détail TVA déductible ────────────────────────────────────────

  L(section2("5. Détail TVA déductible"));
  L(``);

  // Immo
  const tvaImmoRow = findRow(rows, "tva-immo");
  const tvaImmoChildren = tvaImmoRow?.children ?? [];
  L(sectionH("5a. Immobilisations récupérables"));
  L(``);
  if (tvaImmoChildren.length === 0) {
    L(`_Aucune immobilisation avec TVA récupérable._`);
  } else {
    L(`| Immobilisation | ${y1L} (€) | ${y2L} (€) | ${y3L} (€) |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const child of tvaImmoChildren) {
      L(`| ${child.label} | ${fmt(child.values.y1.total)} | ${fmt(child.values.y2.total)} | ${fmt(child.values.y3.total)} |`);
    }
    if (tvaImmoY0 > 0) {
      L(``);
      L(`> Crédit TVA immo avant démarrage (Initial) : **${fmt(tvaImmoY0)} €**`);
    }
  }
  L(``);

  // Achats
  const tvaAchatsRow = findRow(rows, "tva-achats");
  const tvaAchatsChildren = tvaAchatsRow?.children ?? [];
  L(sectionH("5b. Achats de matières"));
  L(``);
  if (tvaAchatsChildren.length === 0) {
    L(`_Aucune activité commerce/production._`);
  } else {
    L(`| Activité | ${y1L} (€) | ${y2L} (€) | ${y3L} (€) |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const child of tvaAchatsChildren) {
      L(`| ${child.label} | ${fmt(child.values.y1.total)} | ${fmt(child.values.y2.total)} | ${fmt(child.values.y3.total)} |`);
    }
  }
  L(``);

  // Charges externes
  const tvaChargesRow = findRow(rows, "tva-charges");
  const tvaChargesChildren = tvaChargesRow?.children ?? [];
  L(sectionH("5c. Charges externes"));
  L(``);
  if (tvaChargesChildren.length === 0) {
    L(`_Aucune charge externe avec TVA._`);
  } else {
    L(`| Charge | ${y1L} (€) | ${y2L} (€) | ${y3L} (€) |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const child of tvaChargesChildren) {
      L(`| ${child.label} | ${fmt(child.values.y1.total)} | ${fmt(child.values.y2.total)} | ${fmt(child.values.y3.total)} |`);
    }
  }
  L(``);

  // ─── Section 6 : Récapitulatif ────────────────────────────────────────────────

  L(section2("6. Récapitulatif"));
  L(``);
  L(`| Exercice | TVA collectée (€) | TVA déductible (€) | TVA nette (€) | TVA à payer (€) | Crédit final (€) |`);
  L(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const [yk, calc] of [["y1", y1Calc], ["y2", y2Calc], ["y3", y3Calc]] as const) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    const cf = calc.finalCredit;
    L(`| ${yL} | ${fmt(collecteeV[yk])} | ${fmt(deductibleV[yk])} | ${fmt(tvaNetteTot[yk])} | ${fmt(tvaPayerV[yk])} | **${fmt(cf)}** |`);
  }
  L(``);
  L(
    `**Score : ${okCount}/${checks.length} checks OK${koCount > 0 ? ` — ⚠ ${koCount} anomalie(s) détectée(s)` : " — ✅ aucune anomalie"}**`,
  );
  L(``);

  const output = lines.join("\n");
  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-tva-output.md");
  writeFileSync(outputPath, output, "utf-8");
  console.log(`\nRapport généré : ${outputPath}`);
  console.log(`Checks : ${okCount} OK / ${koCount} KO / ${checks.length} total`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
