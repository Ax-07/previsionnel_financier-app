/**
 * Script de diagnostic du Tableau de Financement.
 *
 * Usage :
 *   pnpm tsx scripts/debug-tableau-financement.ts <dossierId>
 *
 * Produit : scripts/debug-tableau-financement-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildTableauFinancementRows, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildTableauFinancementRows } from "@/lib/finance/aggregations/tableau-financement";
import type { TfRow as FinRow } from "@/lib/finance/aggregations/tableau-financement";
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

function rowAmt(rows: FinRow[], key: string): Record<FinKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y0: 0, y1: 0, y2: 0, y3: 0 };
  return {
    y0: row.values.y0.amount,
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ─── Rendu d'une ligne FinRow ─────────────────────────────────────────────────

function renderFinRow(row: FinRow, lines: string[]) {
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
  console.error("Usage : pnpm tsx scripts/debug-tableau-financement.ts <dossierId>");
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
  const tfData = buildTableauFinancementRows(data, fc);
  const { yearLabels, rows } = tfData;

  const y0L = "Initial";
  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  // toKey partagé pour les sections détail
  const toKey = buildToKeyY0(dateDemarrageDate, fc.exBorne1, fc.exBorne2, fc.exBorne3);

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Tableau de Financement — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildTableauFinancementRows\` · \`buildFinCalc\``);
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
  L(``);

  // ─── Section 1 : Tableau de financement complet ───────────────────────────────

  L(section2("1. Tableau de financement complet"));
  L(``);
  L(`| Désignation | ${y0L} | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const row of rows) {
    renderFinRow(row, lines);
  }
  L(``);

  // ─── Section 2 : Vérifications de cohérence ──────────────────────────────────

  L(section2("2. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  // Extraire les valeurs depuis le tableau UI
  const apportsCapitalV   = rowAmt(rows, "apports_capital");
  const apportsCCV        = rowAmt(rows, "apports_cc");
  const nouveauxEmpruntsV = rowAmt(rows, "nouveaux_emprunts");
  const subventionsInvestV = rowAmt(rows, "subventions_invest");
  const cafV              = rowAmt(rows, "caf");
  const totalRessourcesV  = rowAmt(rows, "total_ressources");
  const immoIncorpV       = rowAmt(rows, "immo_incorporelles");
  const immoCorpV         = rowAmt(rows, "immo_corporelles");
  const totalImmoV        = rowAmt(rows, "total_immo");
  const rembCapitalV      = rowAmt(rows, "remboursement_capital");
  const totalEmploisV     = rowAmt(rows, "total_emplois");
  const variationFRV      = rowAmt(rows, "variation_fr");
  const fondsRoulementV   = rowAmt(rows, "fonds_roulement");

  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;

    // 1. Total ressources = apports K + apports CC + nouveaux emprunts + CAF + subv invest
    const expRess =
      apportsCapitalV[yk] + apportsCCV[yk] + nouveauxEmpruntsV[yk] + cafV[yk] + subventionsInvestV[yk];
    checks.push({
      label: `[${yL}] Total ressources = apports K + apports CC + emprunts + CAF + subv invest`,
      ok: eq(totalRessourcesV[yk], expRess),
      detail: `${fmt(totalRessourcesV[yk])} ≟ ${fmt(expRess)}`,
    });

    // 2. Total immo = incorporelles + corporelles
    const expImmo = immoIncorpV[yk] + immoCorpV[yk];
    checks.push({
      label: `[${yL}] Total immo = incorporelles + corporelles`,
      ok: eq(totalImmoV[yk], expImmo),
      detail: `${fmt(totalImmoV[yk])} ≟ ${fmt(expImmo)}`,
    });

    // 3. Total emplois = total immo + remboursement capital
    const expEmplois = totalImmoV[yk] + rembCapitalV[yk];
    checks.push({
      label: `[${yL}] Total emplois = total immo + remb. capital`,
      ok: eq(totalEmploisV[yk], expEmplois),
      detail: `${fmt(totalEmploisV[yk])} ≟ ${fmt(expEmplois)}`,
    });

    // 4. Variation FR = total ressources − total emplois
    const expVariFR = totalRessourcesV[yk] - totalEmploisV[yk];
    checks.push({
      label: `[${yL}] Variation FR = total ressources − total emplois`,
      ok: eq(variationFRV[yk], expVariFR),
      detail: `${fmt(variationFRV[yk])} ≟ ${fmt(expVariFR)}`,
    });
  }

  // 5. Fonds de roulement cumulatif
  checks.push({
    label: `FR Initial = variation FR Initial`,
    ok: eq(fondsRoulementV.y0, variationFRV.y0),
    detail: `${fmt(fondsRoulementV.y0)} ≟ ${fmt(variationFRV.y0)}`,
  });
  checks.push({
    label: `FR ${y1L} = FR Initial + variation ${y1L}`,
    ok: eq(fondsRoulementV.y1, fondsRoulementV.y0 + variationFRV.y1),
    detail: `${fmt(fondsRoulementV.y1)} ≟ ${fmt(fondsRoulementV.y0 + variationFRV.y1)}`,
  });
  checks.push({
    label: `FR ${y2L} = FR ${y1L} + variation ${y2L}`,
    ok: eq(fondsRoulementV.y2, fondsRoulementV.y1 + variationFRV.y2),
    detail: `${fmt(fondsRoulementV.y2)} ≟ ${fmt(fondsRoulementV.y1 + variationFRV.y2)}`,
  });
  checks.push({
    label: `FR ${y3L} = FR ${y2L} + variation ${y3L}`,
    ok: eq(fondsRoulementV.y3, fondsRoulementV.y2 + variationFRV.y3),
    detail: `${fmt(fondsRoulementV.y3)} ≟ ${fmt(fondsRoulementV.y2 + variationFRV.y3)}`,
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
        : kSouscr === "y0"
          ? y0L
          : kSouscr === "y1"
            ? y1L
            : kSouscr === "y2"
              ? y2L
              : y3L;
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

    // Récap des emprunts par exercice (total)
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

  // ─── Section 5 : Détail des immobilisations ────────────────────────────────

  L(section2("5. Détail des immobilisations"));
  L(``);

  const immoActives = data.immobilisations.filter((i) => i.actif !== false);
  if (immoActives.length === 0) {
    L(`_Aucune immobilisation active._`);
  } else {
    L(`| Libellé | Nature | Montant HT (€) | Date acquisition | Exercice |`);
    L(`| --- | --- | ---: | --- | --- |`);
    for (const immo of immoActives) {
      const k = toKey(immo.dateAcquisition);
      const yL = !k
        ? "hors période"
        : k === "y0"
          ? y0L
          : k === "y1"
            ? y1L
            : k === "y2"
              ? y2L
              : y3L;
      L(
        `| ${immo.libelle ?? "—"} | ${immo.nature} | ${fmt(n(immo.montantHT))} | ${new Date(immo.dateAcquisition).toLocaleDateString("fr-FR")} | ${yL} |`,
      );
    }
  }
  L(``);

  L(sectionH("5b. Totaux immo par nature et exercice"));
  L(``);
  L(`| Exercice | Incorporelles (€) | Corporelles (€) | Total (€) |`);
  L(`| --- | ---: | ---: | ---: |`);
  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(
      `| ${yL} | ${fmt(immoIncorpV[yk])} | ${fmt(immoCorpV[yk])} | **${fmt(totalImmoV[yk])}** |`,
    );
  }
  L(``);

  // ─── Section 6 : Récapitulatif ────────────────────────────────────────────────

  L(section2("6. Récapitulatif"));
  L(``);
  L(
    `| Exercice | Total ressources (€) | Total emplois (€) | Variation FR (€) | Fonds de roulement (€) |`,
  );
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const yk of ["y0", "y1", "y2", "y3"] as FinKey[]) {
    const yL = yk === "y0" ? y0L : yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
    L(
      `| ${yL} | ${fmt(totalRessourcesV[yk])} | ${fmt(totalEmploisV[yk])} | ${fmt(variationFRV[yk])} | **${fmt(fondsRoulementV[yk])}** |`,
    );
  }
  L(``);
  L(
    `**Score : ${okCount}/${checks.length} checks OK${koCount > 0 ? ` — ⚠ ${koCount} anomalie(s) détectée(s)` : " — ✅ aucune anomalie"}**`,
  );
  L(``);

  const output = lines.join("\n");
  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-tableau-financement-output.md");
  writeFileSync(outputPath, output, "utf-8");
  console.log(`\nRapport généré : ${outputPath}`);
  console.log(`Checks : ${okCount} OK / ${koCount} KO / ${checks.length} total`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
