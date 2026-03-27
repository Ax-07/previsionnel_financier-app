/**
 * Script de diagnostic du Seuil de Rentabilité.
 *
 * Usage :
 *   pnpm tsx scripts/debug-seuil.ts <dossierId>
 *
 * Produit : scripts/debug-seuil-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (calcSeuil, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmtEur = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number | null) =>
  v === null ? "—" : `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
const fmtJ = (v: number) =>
  `${Math.round(v).toLocaleString("fr-FR")} j`;

const eq = (a: number, b: number, tol = 1) => Math.abs(a - b) < tol;
const eqPct = (a: number, b: number) => Math.abs(a - b) < 0.01;

type YAcc = { y1: number; y2: number; y3: number };

function section2(title: string): string {
  return `\n## ${title}\n`;
}
function sectionH(title: string): string {
  return `\n### ${title}\n`;
}

// ─── Extraction d'une ligne par clé ──────────────────────────────────────────

function findRow(rows: BreakEvenRow[], key: string): BreakEvenRow | undefined {
  return rows.find((r) => r.key === key);
}

function rowAmt(rows: BreakEvenRow[], key: string): YAcc {
  const row = findRow(rows, key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

// ─── Rendu d'une ligne BreakEvenRow ──────────────────────────────────────────

function renderBreakEvenRow(row: BreakEvenRow): string {
  const bold = row.style === "highlight" || row.style === "subtotal";
  const p = bold ? "**" : "";
  const sign = row.sign ? `${row.sign} ` : "";
  const label = `${row.style === "indent" ? "\\  " : ""}${sign}${row.label}`;

  const fmtVal = (y: YearKey) => {
    const v = row.values[y];
    if (row.key === "taux_marge_cv") return fmtPct(v.amount);
    if (row.key === "point_mort_eco" || row.key === "point_mort_fin") return fmtJ(v.amount);
    const eur = fmtEur(v.amount);
    if (row.showPct && v.pct !== null) return `${eur} *(${fmtPct(v.pct)})*`;
    return eur;
  };

  return `| ${p}${label}${p} | ${fmtVal("y1")} | ${fmtVal("y2")} | ${fmtVal("y3")} |`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-seuil.ts <dossierId>");
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
  const seuilData = calcSeuil(data, fc);

  const { yearLabels, rows } = seuilData;
  const y1L = yearLabels.y1;
  const y2L = yearLabels.y2;
  const y3L = yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const moisDebut = dateDemarrageDate.getMonth();

  const isIS = data.isIS ?? (data.scenario.parametres?.regimeFiscal ?? "IS") === "IS";

  L(`# Diagnostic Seuil de Rentabilité — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`calcSeuil\` · \`buildFinCalc\``);
  L(``);

  // ─── Section 0 : Paramètres généraux ─────────────────────────────────────────

  L(section2("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
  L(`| Mois de début | ${MOIS_COURTS[moisDebut]} (${moisDebut + 1}) |`);
  L(`| Régime fiscal | ${isIS ? "IS" : "IR"} |`);
  L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
  L(`| Activités actives | ${data.activites.filter((a) => a.actif !== false).length} |`);
  L(`| Subventions exploitation | ${data.subventionsExploitation.filter((s) => s.actif !== false).length} |`);
  L(`| Emprunts | ${data.emprunts.length} |`);
  L(``);

  // ─── Section 1 : Tableau seuil de rentabilité complet ────────────────────────

  L(section2("1. Tableau Seuil de Rentabilité complet"));
  L(``);
  L(`*Montants en € — colonne % exprimée en % des Ventes+Production*`);
  L(``);
  L(`| Désignation | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  for (const row of rows) {
    if (row.style === "separator") { L(``); continue; }
    if (row.style === "section") { L(`| **${row.label}** | | | |`); continue; }
    L(renderBreakEvenRow(row));
  }
  L(``);

  // ─── Section 2 : Vérifications de cohérence ──────────────────────────────────

  L(section2("2. Vérifications de cohérence"));
  L(``);

  type Check = { label: string; ok: boolean; detail: string };
  const checks: Check[] = [];

  function chk(label: string, a: number, b: number, isPct = false) {
    const ok = isPct ? eqPct(a, b) : eq(a, b);
    checks.push({ label, ok, detail: isPct ? `${fmtPct(a)} ≟ ${fmtPct(b)}` : `${fmtEur(a)} ≟ ${fmtEur(b)}` });
  }
  function chkJ(label: string, a: number, b: number) {
    checks.push({ label, ok: Math.abs(a - b) < 2, detail: `${fmtJ(a)} ≟ ${fmtJ(b)}` });
  }

  function chk3(
    labelFn: (y: string) => string,
    aFn: (y: YearKey) => number,
    bFn: (y: YearKey) => number,
    isPct = false,
  ) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      chk(labelFn(yLabel), aFn(y), bFn(y), isPct);
    }
  }

  function chk3J(labelFn: (y: string) => string, aFn: (y: YearKey) => number, bFn: (y: YearKey) => number) {
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
      const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
      chkJ(labelFn(yLabel), aFn(y), bFn(y));
    }
  }

  const vpV      = rowAmt(rows, "ventes_production");
  const achatsCVV = rowAmt(rows, "achats_consommes");
  const totalCVV  = rowAmt(rows, "total_cv");
  const margeCVV  = rowAmt(rows, "marge_cv");
  const tauxMCVV  = rowAmt(rows, "taux_marge_cv");
  const chExtV    = rowAmt(rows, "charges_ext");
  const chPersV   = rowAmt(rows, "charges_pers");
  const dotV      = rowAmt(rows, "dotations");
  const impotV    = rowAmt(rows, "impots_taxes");
  const totalCFV  = rowAmt(rows, "total_cf");
  const resultatV = rowAmt(rows, "resultat");
  const seuilEcoV = rowAmt(rows, "seuil_eco");
  const excEcoV   = rowAmt(rows, "excedent_eco");
  const pmEcoV    = rowAmt(rows, "point_mort_eco");
  const rembCapV  = rowAmt(rows, "remboursement_capital");
  const isV       = rowAmt(rows, "is_annee");
  const seuilFinV = rowAmt(rows, "seuil_fin");
  const excFinV   = rowAmt(rows, "excedent_fin");
  const pmFinV    = rowAmt(rows, "point_mort_fin");

  // Total CV = achats consommés
  chk3(
    (y) => `Total CV = Achats consommés (${y})`,
    (y) => totalCVV[y],
    (y) => achatsCVV[y],
  );

  // Marge sur coût variable = Ventes production − Total CV
  chk3(
    (y) => `Marge CV = Ventes+Prod − Total CV (${y})`,
    (y) => margeCVV[y],
    (y) => vpV[y] - totalCVV[y],
  );

  // Taux marge CV = (Marge CV / Ventes prod) × 100
  chk3(
    (y) => `Taux marge CV = Marge CV / Ventes+Prod × 100 (${y})`,
    (y) => tauxMCVV[y],
    (y) => vpV[y] > 0 ? (margeCVV[y] / vpV[y]) * 100 : 0,
    true,
  );

  // Total CF = Charges ext + Charges pers + Dotations + Impôts/taxes
  chk3(
    (y) => `Total CF = Charges ext + Pers + Dot + Impôts (${y})`,
    (y) => totalCFV[y],
    (y) => chExtV[y] + chPersV[y] + dotV[y] + impotV[y],
  );

  // Résultat = Ventes prod − Total CV − Total CF
  chk3(
    (y) => `Résultat = Ventes+Prod − Total CV − Total CF (${y})`,
    (y) => resultatV[y],
    (y) => vpV[y] - totalCVV[y] - totalCFV[y],
  );

  // Seuil éco = Total CF / Taux MCV
  chk3(
    (y) => `Seuil éco = Total CF / Taux MCV (${y})`,
    (y) => seuilEcoV[y],
    (y) => tauxMCVV[y] !== 0 ? totalCFV[y] / (tauxMCVV[y] / 100) : 0,
  );

  // Excédent éco = Ventes prod − Seuil éco
  chk3(
    (y) => `Excédent éco = Ventes+Prod − Seuil éco (${y})`,
    (y) => excEcoV[y],
    (y) => vpV[y] - seuilEcoV[y],
  );

  // Point mort éco = (Seuil éco / Ventes prod) × 365
  chk3J(
    (y) => `Point mort éco = Seuil éco / Ventes+Prod × 365 (${y})`,
    (y) => pmEcoV[y],
    (y) => vpV[y] > 0 ? Math.round((seuilEcoV[y] / vpV[y]) * 365) : 0,
  );

  // Seuil fin = (Total CF + Remb capital + IS) / Taux MCV
  chk3(
    (y) => `Seuil fin = (Total CF + Remb + IS) / Taux MCV (${y})`,
    (y) => seuilFinV[y],
    (y) => tauxMCVV[y] !== 0 ? (totalCFV[y] + rembCapV[y] + isV[y]) / (tauxMCVV[y] / 100) : 0,
  );

  // Excédent fin = Ventes prod − Seuil fin
  chk3(
    (y) => `Excédent fin = Ventes+Prod − Seuil fin (${y})`,
    (y) => excFinV[y],
    (y) => vpV[y] - seuilFinV[y],
  );

  // Point mort fin = (Seuil fin / Ventes prod) × 365
  chk3J(
    (y) => `Point mort fin = Seuil fin / Ventes+Prod × 365 (${y})`,
    (y) => pmFinV[y],
    (y) => vpV[y] > 0 ? Math.round((seuilFinV[y] / vpV[y]) * 365) : 0,
  );

  // ── Cohérence avec FinCalcResult ─────────────────────────────────────────────
  chk3(
    (y) => `Charges ext (seuil) = fournitures + services (FC) (${y})`,
    (y) => chExtV[y],
    (y) => fc.fournitures[y as YearKey] + fc.services[y as YearKey],
  );
  chk3(
    (y) => `Charges pers (seuil) = chargesPersonnel.total (FC) (${y})`,
    (y) => chPersV[y],
    (y) => fc.chargesPersonnel.total[y as YearKey],
  );
  chk3(
    (y) => `Dotations (seuil) = dotAmort + dotProv (FC) (${y})`,
    (y) => dotV[y],
    (y) => fc.dotationsAmort[y as YearKey] + fc.dotationsProvisions[y as YearKey],
  );
  chk3(
    (y) => `Impôts/taxes (seuil) = impotsTaxes (FC) (${y})`,
    (y) => impotV[y],
    (y) => fc.impotsTaxes[y as YearKey],
  );
  chk3(
    (y) => `Remb. capital (seuil) = capitalRembourse (FC) (${y})`,
    (y) => rembCapV[y],
    (y) => fc.capitalRembourse[y as YearKey],
  );
  if (isIS) {
    chk3(
      (y) => `IS (seuil) = isParAnnee (FC) (${y})`,
      (y) => isV[y],
      (y) => fc.isParAnnee[y as YearKey],
    );
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;

  L(`| Check | Statut | Détail |`);
  L(`| --- | :---: | --- |`);
  for (const c of checks) {
    L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
  }
  L(``);

  // ─── Section 3 : Détail par activité (base d'activité) ───────────────────────

  L(section2("3. Détail par activité — Base d'activité"));
  L(``);

  const activitesActives = data.activites.filter((a) => a.actif !== false);
  if (activitesActives.length > 0) {
    L(`| Activité | Type | Taux marge | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | --- | ---: | ---: | ---: | ---: |`);
    for (const a of activitesActives) {
      L(`| ${a.libelle} | ${a.typeActivite} | ${fmtPct(n(a.tauxMarge))} | ${fmtEur(n(a.montantN))} | ${fmtEur(n(a.montantN1))} | ${fmtEur(n(a.montantN2))} |`);
    }

    const subventions = data.subventionsExploitation.filter((s) => s.actif !== false);
    const subTotY1 = subventions.reduce((s, sv) => s + n(sv.montantN), 0);
    const subTotY2 = subventions.reduce((s, sv) => s + n(sv.montantN1), 0);
    const subTotY3 = subventions.reduce((s, sv) => s + n(sv.montantN2), 0);

    if (subTotY1 !== 0 || subTotY2 !== 0 || subTotY3 !== 0) {
      L(`| **Subventions d'exploitation** | — | — | ${fmtEur(subTotY1)} | ${fmtEur(subTotY2)} | ${fmtEur(subTotY3)} |`);
    }
    L(`| **Ventes + Production totale** | | | **${fmtEur(vpV.y1)}** | **${fmtEur(vpV.y2)}** | **${fmtEur(vpV.y3)}** |`);
  } else {
    L(`*Aucune activité active.*`);
  }
  L(``);

  // ─── Section 4 : Récapitulatif ────────────────────────────────────────────────

  L(section2("4. Récapitulatif"));
  L(``);
  L(`| Bilan | Valeur |`);
  L(`| --- | --- |`);
  L(`| Total checks | ${checks.length} |`);
  L(`| ✅ OK | ${passed} |`);
  L(`| ❌ KO | ${failed} |`);
  L(``);

  if (failed === 0) {
    L(`> ✅ **Tous les checks sont OK.** Les calculs du seuil de rentabilité sont cohérents.`);
  } else {
    L(`> ❌ **${failed} check(s) échoué(s).** Voir la section 2 pour les détails.`);
  }
  L(``);

  L(sectionH("4.1 Indicateurs clés"));
  L(``);
  L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
  L(`| --- | ---: | ---: | ---: |`);
  L(`| Ventes + Production | ${fmtEur(vpV.y1)} | ${fmtEur(vpV.y2)} | ${fmtEur(vpV.y3)} |`);
  L(`| Coûts variables | ${fmtEur(totalCVV.y1)} | ${fmtEur(totalCVV.y2)} | ${fmtEur(totalCVV.y3)} |`);
  L(`| **Marge sur coût variable** | **${fmtEur(margeCVV.y1)}** | **${fmtEur(margeCVV.y2)}** | **${fmtEur(margeCVV.y3)}** |`);
  L(`| Taux de marge / CV | ${fmtPct(tauxMCVV.y1)} | ${fmtPct(tauxMCVV.y2)} | ${fmtPct(tauxMCVV.y3)} |`);
  L(`| Coûts fixes | ${fmtEur(totalCFV.y1)} | ${fmtEur(totalCFV.y2)} | ${fmtEur(totalCFV.y3)} |`);
  L(`| **Résultat courant** | **${fmtEur(resultatV.y1)}** | **${fmtEur(resultatV.y2)}** | **${fmtEur(resultatV.y3)}** |`);
  L(`| **Seuil éco** | **${fmtEur(seuilEcoV.y1)}** | **${fmtEur(seuilEcoV.y2)}** | **${fmtEur(seuilEcoV.y3)}** |`);
  L(`| Excédent éco | ${fmtEur(excEcoV.y1)} | ${fmtEur(excEcoV.y2)} | ${fmtEur(excEcoV.y3)} |`);
  L(`| Point mort éco | ${fmtJ(pmEcoV.y1)} | ${fmtJ(pmEcoV.y2)} | ${fmtJ(pmEcoV.y3)} |`);
  L(`| **Seuil fin** | **${fmtEur(seuilFinV.y1)}** | **${fmtEur(seuilFinV.y2)}** | **${fmtEur(seuilFinV.y3)}** |`);
  L(`| Excédent fin | ${fmtEur(excFinV.y1)} | ${fmtEur(excFinV.y2)} | ${fmtEur(excFinV.y3)} |`);
  L(`| Point mort fin | ${fmtJ(pmFinV.y1)} | ${fmtJ(pmFinV.y2)} | ${fmtJ(pmFinV.y3)} |`);
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-seuil-output.md");
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
