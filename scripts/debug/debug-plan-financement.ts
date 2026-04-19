/**
 * Script de diagnostic du Plan de Financement.
 *
 * Usage :
 *   pnpm tsx scripts/debug-plan-financement.ts <dossierId>
 *
 * Produit : scripts/debug-plan-financement-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildPlanFinancementRows, calcBfr, buildFinCalc)
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
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import type { PfRow } from "@/lib/finance/aggregations/plan-financement";
import { buildToKeyY0 } from "@/lib/finance/aggregations/helpers/financement-helpers";
import { n } from "@/lib/finance/utils";
import type { YearKey4 as FinKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

function section2(title: string): string { return `\n## ${title}\n`; }
function sectionH(title: string): string { return `\n### ${title}\n`; }

// ─── Extraction d'une ligne par clé ──────────────────────────────────────────

function rowAmt(rows: PfRow[], key: string): Record<FinKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y0: 0, y1: 0, y2: 0, y3: 0 };
  return {
    y0: row.values.y0.amount,
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ─── Rendu d'une ligne PfRow ──────────────────────────────────────────────────

function renderPfRow(row: PfRow, lines: string[]) {
  if (row.style === "section") {
    lines.push(`| **${row.label}** | | | | |`);
    return;
  }
  const bold = row.style === "highlight" || row.style === "subtotal";
  const p = bold ? "**" : "";
  const sign = row.sign ? `${row.sign} ` : "";
  const v = row.values;
  lines.push(
    `| ${p}${sign}${row.label}${p} | ${p}${fmt(v.y0.amount)}${p} | ${p}${fmt(v.y1.amount)}${p} | ${p}${fmt(v.y2.amount)}${p} | ${p}${fmt(v.y3.amount)}${p} |`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-plan-financement.ts <dossierId>");
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
  const bfrCalc = calcBfr(data, fc);
  const pfData = buildPlanFinancementRows(data, fc);
  const { yearLabels, rows } = pfData;

  const y0L = "Initial";
  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  const toKey = buildToKeyY0(dateDemarrageDate, fc.exBorne1, fc.exBorne2, fc.exBorne3);

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Plan de Financement — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildPlanFinancementRows\` · \`calcBfr\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Exercices | ${y0L} · ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Apports | ${data.apports.length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
  L(`| Subventions | ${data.subventions.length} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(``);

  // ─── Section 1 : Plan de financement complet ──────────────────────────────────

  L(section2("1. Plan de financement complet"));
  L(``);
  L(`| Désignation | ${y0L} | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const row of rows) {
    renderPfRow(row, lines);
  }
  L(``);

  // ─── Section 2 : Vérifications de cohérence ──────────────────────────────────

  L(section2("2. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  // Extraire les valeurs depuis le tableau UI
  const immoIncorpV       = rowAmt(rows, "immo_incorporelles");
  const immoCorpV         = rowAmt(rows, "immo_corporelles");
  const totalImmoV        = rowAmt(rows, "total_immo");
  const variationBFRV     = rowAmt(rows, "variation_bfr");
  const rembCapitalV      = rowAmt(rows, "remboursement_capital");
  const totalBesoinsV     = rowAmt(rows, "total_besoins");
  const apportsCapitalV   = rowAmt(rows, "apports_capital");
  const apportsCCV        = rowAmt(rows, "apports_cc");
  const nouveauxEmpruntsV = rowAmt(rows, "nouveaux_emprunts");
  const subventionsInvestV = rowAmt(rows, "subventions_invest");
  const cafV              = rowAmt(rows, "caf");
  const totalRessourcesV  = rowAmt(rows, "total_ressources");
  const variationTresoV   = rowAmt(rows, "variation_tresorerie");
  const soldeTresoV       = rowAmt(rows, "solde_tresorerie");

  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;

    // 1. Total immo = incorporelles + corporelles
    const expImmo = immoIncorpV[yk] + immoCorpV[yk];
    checks.push({
      label: `[${yL}] Total immo = incorporelles + corporelles`,
      ok: eq(totalImmoV[yk], expImmo),
      detail: `${fmt(totalImmoV[yk])} ≟ ${fmt(expImmo)}`,
    });

    // 2. Total besoins = total immo + variation BFR + remb capital
    const expBesoins = totalImmoV[yk] + variationBFRV[yk] + rembCapitalV[yk];
    checks.push({
      label: `[${yL}] Total besoins = immo + variation BFR + remb. capital`,
      ok: eq(totalBesoinsV[yk], expBesoins),
      detail: `${fmt(totalBesoinsV[yk])} ≟ ${fmt(expBesoins)}`,
    });

    // 3. Total ressources = apports K + apports CC + emprunts + CAF + subv invest
    const expRess =
      apportsCapitalV[yk] + apportsCCV[yk] + nouveauxEmpruntsV[yk] + cafV[yk] + subventionsInvestV[yk];
    checks.push({
      label: `[${yL}] Total ressources = apports K + apports CC + emprunts + CAF + subv invest`,
      ok: eq(totalRessourcesV[yk], expRess),
      detail: `${fmt(totalRessourcesV[yk])} ≟ ${fmt(expRess)}`,
    });

    // 4. Variation trésorerie = total ressources − total besoins
    const expVarTreso = totalRessourcesV[yk] - totalBesoinsV[yk];
    checks.push({
      label: `[${yL}] Variation trésorerie = total ressources − total besoins`,
      ok: eq(variationTresoV[yk], expVarTreso),
      detail: `${fmt(variationTresoV[yk])} ≟ ${fmt(expVarTreso)}`,
    });
  }

  // 5. Solde trésorerie cumulatif
  checks.push({
    label: `Solde trésorerie Initial = variation tréso Initial`,
    ok: eq(soldeTresoV.y0, variationTresoV.y0),
    detail: `${fmt(soldeTresoV.y0)} ≟ ${fmt(variationTresoV.y0)}`,
  });
  checks.push({
    label: `Solde tréso ${y1L} = solde Initial + variation ${y1L}`,
    ok: eq(soldeTresoV.y1, soldeTresoV.y0 + variationTresoV.y1),
    detail: `${fmt(soldeTresoV.y1)} ≟ ${fmt(soldeTresoV.y0 + variationTresoV.y1)}`,
  });
  checks.push({
    label: `Solde tréso ${y2L} = solde ${y1L} + variation ${y2L}`,
    ok: eq(soldeTresoV.y2, soldeTresoV.y1 + variationTresoV.y2),
    detail: `${fmt(soldeTresoV.y2)} ≟ ${fmt(soldeTresoV.y1 + variationTresoV.y2)}`,
  });
  checks.push({
    label: `Solde tréso ${y3L} = solde ${y2L} + variation ${y3L}`,
    ok: eq(soldeTresoV.y3, soldeTresoV.y2 + variationTresoV.y3),
    detail: `${fmt(soldeTresoV.y3)} ≟ ${fmt(soldeTresoV.y2 + variationTresoV.y3)}`,
  });

  // 6. CAF cohérente avec fc.caf
  checks.push({
    label: `CAF Initial = 0 (aucune CAF avant démarrage)`,
    ok: eq(cafV.y0, 0),
    detail: `${fmt(cafV.y0)} ≟ 0,00`,
  });
  for (const yk of ["y1", "y2", "y3"] as ("y1" | "y2" | "y3")[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    checks.push({
      label: `CAF [${yL}] = fc.caf.${yk}`,
      ok: eq(cafV[yk], fc.caf[yk]),
      detail: `${fmt(cafV[yk])} ≟ ${fmt(fc.caf[yk])}`,
    });
  }

  // 7. Remboursement capital cohérent avec fc.capitalRembourse
  for (const yk of ["y1", "y2", "y3"] as ("y1" | "y2" | "y3")[]) {
    const yL = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    checks.push({
      label: `Remb. capital [${yL}] = fc.capitalRembourse.${yk}`,
      ok: eq(rembCapitalV[yk], fc.capitalRembourse[yk]),
      detail: `${fmt(rembCapitalV[yk])} ≟ ${fmt(fc.capitalRembourse[yk])}`,
    });
  }

  // 8. Variation BFR cohérente avec calcBfr
  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    checks.push({
      label: `Variation BFR [${yL}] = calcBfr.variationBFR.${yk}`,
      ok: eq(variationBFRV[yk], bfrCalc.variationBFR[yk]),
      detail: `${fmt(variationBFRV[yk])} ≟ ${fmt(bfrCalc.variationBFR[yk])}`,
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

  // ─── Section 3 : Détail des apports ──────────────────────────────────────────

  L(section2("3. Détail des apports"));
  L(``);

  if (data.apports.length === 0) {
    L(`_Aucun apport._`);
  } else {
    L(`| Libellé | Type | Montant (€) | Date | Exercice |`);
    L(`| --- | --- | ---: | --- | --- |`);
    for (const apport of data.apports) {
      const k = toKey(apport.dateApport);
      const yL = !k ? "hors période" : k === "y0" ? y0L : k === "y1" ? y1L : k === "y2" ? y2L : y3L;
      L(
        `| ${apport.libelle ?? "—"} | ${apport.type} | ${fmt(n(apport.montant))} | ${new Date(apport.dateApport).toLocaleDateString("fr-FR")} | ${yL} |`,
      );
    }
  }
  L(``);

  if (data.subventions.length > 0) {
    L(sectionH("3b. Subventions"));
    L(``);
    L(`| Libellé | Type | Montant (€) | Date | Exercice |`);
    L(`| --- | --- | ---: | --- | --- |`);
    for (const subv of data.subventions) {
      const dateRef = subv.dateEncaissement ?? subv.dateObtention;
      const k = dateRef ? toKey(dateRef) : null;
      const yL = !k ? "hors période" : k === "y0" ? y0L : k === "y1" ? y1L : k === "y2" ? y2L : y3L;
      const dateStr = dateRef ? new Date(dateRef).toLocaleDateString("fr-FR") : "—";
      L(
        `| ${subv.libelle ?? "—"} | ${subv.type} | ${fmt(n(subv.montant))} | ${dateStr} | ${yL} |`,
      );
    }
    L(``);
  }

  // ─── Section 4 : Détail des emprunts ─────────────────────────────────────────

  L(section2("4. Détail des emprunts"));
  L(``);

  if (data.emprunts.length === 0) {
    L(`_Aucun emprunt._`);
  } else {
    for (const emprunt of data.emprunts) {
      L(sectionH(`${emprunt.libelle ?? "Emprunt"} — ${fmt(n(emprunt.montant))} €`));
      L(``);
      const kSouscr = toKey(emprunt.dateDéblocage);
      const yLSouscr = !kSouscr
        ? "hors période"
        : kSouscr === "y0" ? y0L : kSouscr === "y1" ? y1L : kSouscr === "y2" ? y2L : y3L;
      L(
        `- Montant souscrit : **${fmt(n(emprunt.montant))} €** (${yLSouscr} – ${new Date(emprunt.dateDéblocage).toLocaleDateString("fr-FR")})`,
      );
      L(``);

      // Capital remboursé par exercice
      const rembByEx: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
      for (const ligne of emprunt.lignesEcheancier) {
        const k = toKey(ligne.dateEcheance);
        if (k) rembByEx[k] += n(ligne.capitalRembourse);
      }
      const totalRemb = rembByEx.y0 + rembByEx.y1 + rembByEx.y2 + rembByEx.y3;

      L(`| Exercice | Capital remboursé (€) |`);
      L(`| --- | ---: |`);
      for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
        const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
        L(`| ${yL} | ${fmt(rembByEx[yk])} |`);
      }
      L(`| **Total** | **${fmt(totalRemb)}** |`);
      L(``);
    }

    L(sectionH("Récapitulatif emprunts par exercice"));
    L(``);
    L(`| Exercice | Souscriptions (€) | Remboursements capital (€) |`);
    L(`| --- | ---: | ---: |`);
    for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
      const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
      L(`| ${yL} | ${fmt(nouveauxEmpruntsV[yk])} | ${fmt(rembCapitalV[yk])} |`);
    }
    L(``);
  }

  // ─── Section 5 : Variation BFR ────────────────────────────────────────────────

  L(section2("5. Variation BFR (depuis calcBfr)"));
  L(``);
  L(`| Exercice | BFR (€) | Variation BFR (€) |`);
  L(`| --- | ---: | ---: |`);
  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(`| ${yL} | ${fmt(bfrCalc.bfr[yk])} | ${fmt(bfrCalc.variationBFR[yk])} |`);
  }
  L(``);

  // ─── Section 6 : Récapitulatif ────────────────────────────────────────────────

  L(section2("6. Récapitulatif"));
  L(``);
  L(
    `| Exercice | Total besoins (€) | Total ressources (€) | Variation tréso (€) | Solde tréso (€) |`,
  );
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(
      `| ${yL} | ${fmt(totalBesoinsV[yk])} | ${fmt(totalRessourcesV[yk])} | ${fmt(variationTresoV[yk])} | **${fmt(soldeTresoV[yk])}** |`,
    );
  }
  L(``);
  L(
    `**Score : ${okCount}/${checks.length} checks OK${koCount > 0 ? ` — ⚠ ${koCount} anomalie(s) détectée(s)` : " — ✅ aucune anomalie"}**`,
  );
  L(``);

  const output = lines.join("\n");
  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-plan-financement-output.md");
  writeFileSync(outputPath, output, "utf-8");
  console.log(`\nRapport généré : ${outputPath}`);
  console.log(`Checks : ${okCount} OK / ${koCount} KO / ${checks.length} total`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
