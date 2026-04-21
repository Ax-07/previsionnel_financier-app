/**
 * Script de diagnostic des données de saisie.
 *
 * Récupère TOUS les champs renseignés par l'utilisateur pour un dossier
 * et les présente dans un rapport Markdown structuré.
 *
 * Usage :
 *   pnpm tsx scripts/debug/debug-saisie.ts <dossierId>
 *
 * Produit : scripts/debug/output/debug-saisie-output.md
 */

import "dotenv/config";

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/pipeline/build";
import { buildMonthlyCalc, buildMonthLabels } from "@/lib/finance/calculs/monthly";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmtM = (v: unknown) => {
  const num = Number(v ?? 0);
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const pct = (v: unknown) => `${Number(v ?? 0).toFixed(2)} %`;
const d = (v: unknown) => (v ? new Date(v as string).toLocaleDateString("fr-FR") : "—");
const bool = (v: unknown) => (v ? "Oui" : "Non");
const s = (v: unknown) => String(v ?? "—");
const int = (v: unknown) => String(Number(v ?? 0));

function section(title: string): string { return `\n## ${title}\n`; }
function sectionH(title: string): string { return `\n### ${title}\n`; }
function badge(count: number): string { return count === 0 ? "_(vide)_" : `**${count}** ligne(s)`; }

type Row = Record<string, string>;

function mdTable(headers: string[], rows: Row[]): string[] {
  if (rows.length === 0) return ["_Aucune donnée._", ""];
  const lines: string[] = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${headers.map((h) => row[h] ?? "—").join(" | ")} |`);
  }
  lines.push("");
  return lines;
}

/** Crée une table markdown mensuelle (12 mois + ligne Total). */
function mkMonthTable(
  monthLabels: string[],
  columns: { header: string; series: readonly number[] }[],
): string[] {
  if (columns.length === 0) return ["_Aucune série disponible._", ""];
  const out: string[] = [];
  out.push(`| Mois | ${columns.map((c) => c.header).join(" | ")} | Total |`);
  out.push(`| --- |${" ---: |".repeat(columns.length)} ---: |`);
  const colTotals = columns.map(() => 0);
  for (let i = 0; i < 12; i++) {
    const rowVals = columns.map((c) => c.series[i] ?? 0);
    rowVals.forEach((v, ci) => { colTotals[ci]! += v; });
    const rowTotal = rowVals.reduce((s, v) => s + v, 0);
    out.push(`| ${monthLabels[i]} | ${rowVals.map(fmtM).join(" | ")} | ${fmtM(rowTotal)} |`);
  }
  const grandTotal = colTotals.reduce((s, v) => s + v, 0);
  out.push(`| **Total** | ${colTotals.map(fmtM).join(" | ")} | **${fmtM(grandTotal)}** |`);
  out.push("");
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug/debug-saisie.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calcul des séries mensuelles…");

  // 2-pass IS : d'abord buildFinCalc pour isParAnnee, puis buildMonthlyCalc pour mc
  const finCalc = buildFinCalc(data, data.dateDemarrage);
  const fd = finCalc.filteredData;
  const mc = buildMonthlyCalc(fd, data.dateDemarrage, finCalc.isParAnnee);

  const { dateDemarrage: dateDem, scenario, isIS } = data;
  const p = scenario.parametres;
  const anneeDebut = dateDem.getFullYear();
  const moisDebut = dateDem.getMonth(); // 0-based (0=Jan, 4=Mai…)
  const y1Labels = buildMonthLabels(moisDebut, anneeDebut);
  const y2Labels = buildMonthLabels(moisDebut, anneeDebut + 1);
  const y3Labels = buildMonthLabels(moisDebut, anneeDebut + 2);
  const yks = [
    { yk: "y1" as const, labels: y1Labels, exLabel: finCalc.yearLabels.y1 },
    { yk: "y2" as const, labels: y2Labels, exLabel: finCalc.yearLabels.y2 },
    { yk: "y3" as const, labels: y3Labels, exLabel: finCalc.yearLabels.y3 },
  ];

  console.log("Génération du rapport…");

  const lines: string[] = [];
  const L = (str: string) => lines.push(str);
  const Ls = (arr: string[]) => arr.forEach((s) => lines.push(s));

  // Compteur pour récapitulatif final
  const stats: { section: string; count: number }[] = [];
  const stat = (sec: string, count: number) => stats.push({ section: sec, count });

  L(`# Données de saisie — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont issues directement de la base de données via \`fetchScenarioData\`.`);
  L(``);

  // ─── 0. Paramètres du dossier & scénario ─────────────────────────────────────

  L(section("0. Paramètres généraux"));
  L(`| Paramètre | Valeur |`);
  L(`| --- | --- |`);
  L(`| Dossier ID | \`${dossierId}\` |`);
  L(`| Scénario ID | \`${data.scenarioId}\` |`);
  L(`| Date de démarrage | ${dateDem.toLocaleDateString("fr-FR")} |`);
  L(`| Durée projection | ${data.dureeProjection} an(s) |`);
  L(`| Régime fiscal | ${p?.regimeFiscal ?? "IS"} |`);
  L(`| Taux IS normal | ${pct(p?.tauxIs ?? 25)} |`);
  L(`| Taux IS réduit | ${pct(p?.tauxIsReduit ?? 15)} |`);
  L(`| Plafond IS réduit | ${fmtM(p?.plafondIsReduit ?? 42500)} € |`);
  L(`| Régime TVA | ${p?.regimeTVA ?? "REEL_NORMAL"} |`);
  L(`| Périodicité déclaration TVA | ${p?.periodiciteDeclarationTVA ?? "mensuel"} |`);
  L(`| Taux TVA standard | ${pct(p?.tauxTvaStandard ?? 20)} |`);
  L(`| Mois de paiement des salaires | ${int(p?.moisPaiementSalaires ?? 1)} |`);
  L(`| Régime social TNS | ${p?.tnsRegimeSocial ?? "—"} |`);
  L(`| Mode de calcul TNS | ${p?.tnsModeCalcul ?? "—"} |`);
  L(``);

  // ─── 1. Activités (CA) ───────────────────────────────────────────────────────

  L(section("1. Activités — Chiffre d'affaires"));
  stat("Activités CA", data.activites.length);

  const actHeaders = ["Libellé", "Type", "Actif", "Hyp.", `HT N (${anneeDebut})`, `HT N+1`, `HT N+2`, "TVA", "Fréq.", "Règl. clients", "Taux marge", "TVA achats", "J. stock", "J. fourn."];
  Ls(mdTable(actHeaders, data.activites.map((a) => ({
    "Libellé": a.libelle,
    "Type": a.typeActivite,
    "Actif": bool(a.actif),
    "Hyp.": a.hypothese,
    [`HT N (${anneeDebut})`]: fmtM(a.montantN),
    "HT N+1": fmtM(a.montantN1),
    "HT N+2": fmtM(a.montantN2),
    "TVA": pct(a.tauxTVA),
    "Fréq.": a.frequence,
    "Règl. clients": a.reglementClients ? `${a.reglementClients} j` : "—",
    "Taux marge": pct(a.tauxMarge),
    "TVA achats": pct(a.tvaAchats),
    "J. stock": a.stocks ? `${a.stocks} j` : "—",
    "J. fourn.": a.reglementFournisseurs ? `${a.reglementFournisseurs} j` : "—",
  }))));

  // Saisonnalités CA (JsonValue = tableau de 12 coefficients)
  for (const act of data.activites) {
    const saison = Array.isArray(act.saisonnaliteCA) ? (act.saisonnaliteCA as unknown[]) : null;
    if (!saison || saison.length === 0) continue;
    L(sectionH(`Saisonnalité CA — ${act.libelle}`));
    L(`| Jan | Fév | Mar | Avr | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc |`);
    L(`|${" ---: |".repeat(12)}`);
    const row = saison.map((v) => `${Number(v).toFixed(1)} %`);
    L(`| ${row.join(" | ")} |`);
    L(``);
  }

  // ─── 2. Commissions ──────────────────────────────────────────────────────────

  L(section(`2. Commissions — ${badge(data.activiteCommissions.length)}`));
  stat("Commissions", data.activiteCommissions.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", `N (${anneeDebut})`, "N+1", "N+2", "Calcul", "Taux", "TVA comm."],
    data.activiteCommissions.map((c) => ({
      "Libellé": c.libelle,
      "Actif": bool(c.actif),
      "Hyp.": c.hypothese,
      [`N (${anneeDebut})`]: fmtM(c.montantN),
      "N+1": fmtM(c.montantN1),
      "N+2": fmtM(c.montantN2),
      "Calcul": c.calculCommission,
      "Taux": pct(c.tauxCommission),
      "TVA comm.": pct(c.tvaCommission),
    })),
  ));

  // ─── 3. Subventions d'exploitation ───────────────────────────────────────────

  L(section(`3. Subventions d'exploitation — ${badge(data.subventionsExploitation.length)}`));
  stat("Subventions exploitation", data.subventionsExploitation.length);
  Ls(mdTable(
    ["Libellé", "Actif", `Date N`, `Montant N`, `Date N+1`, `Montant N+1`, `Date N+2`, `Montant N+2`],
    data.subventionsExploitation.map((s) => {
      const sv = s as Record<string, unknown>;
      return {
        "Libellé": String(sv.libelle ?? ""),
        "Actif": bool(sv.actif),
        "Date N": s.dateN ?? "—",
        "Montant N": fmtM(sv.montantN),
        "Date N+1": s.dateN1 ?? "—",
        "Montant N+1": fmtM(sv.montantN1),
        "Date N+2": s.dateN2 ?? "—",
        "Montant N+2": fmtM(sv.montantN2),
      };
    }),
  ));

  // ─── 4. Productions immobilisées ─────────────────────────────────────────────

  L(section(`4. Productions immobilisées — ${badge(data.productionsImmobilisees.length)}`));
  stat("Productions immobilisées", data.productionsImmobilisees.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Nature", "Date", "Montant (€)", "Amort.", "Durée", "Différé"],
    data.productionsImmobilisees.map((pi) => ({
      "Libellé": pi.libelle,
      "Actif": bool(pi.actif),
      "Nature": pi.nature,
      "Date": pi.date || "—",
      "Montant (€)": fmtM(pi.montant),
      "Amort.": pi.amortissement,
      "Durée": pi.duree ? `${pi.duree} ans` : "—",
      "Différé": pi.differe ? `${pi.differe} mois` : "—",
    })),
  ));

  // ─── 5. Fournitures & Consommables ───────────────────────────────────────────

  L(section(`5. Fournitures & Consommables — ${badge(data.fournitures.length)}`));
  stat("Fournitures & Consommables", data.fournitures.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", `N (${anneeDebut})`, "Évol. N+1", "N+1", "Évol. N+2", "N+2", "TVA", "Fréq.", "Délai (j)"],
    data.fournitures.map((f) => ({
      "Libellé": f.libelle,
      "Actif": bool(f.actif),
      "Hyp.": f.hypothese,
      [`N (${anneeDebut})`]: fmtM(f.montantN),
      "Évol. N+1": pct(f.evolutionN1),
      "N+1": fmtM(f.montantN1),
      "Évol. N+2": pct(f.evolutionN2),
      "N+2": fmtM(f.montantN2),
      "TVA": pct(f.tauxTVA),
      "Fréq.": f.frequence,
      "Délai (j)": int(f.delaiReglement),
    })),
  ));

  // ─── 6. Services extérieurs ──────────────────────────────────────────────────

  L(section(`6. Services extérieurs — ${badge(data.services.length)}`));
  stat("Services extérieurs", data.services.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", `N (${anneeDebut})`, "Évol. N+1", "N+1", "Évol. N+2", "N+2", "TVA", "Fréq.", "Délai (j)"],
    data.services.map((sv) => ({
      "Libellé": sv.libelle,
      "Actif": bool(sv.actif),
      "Hyp.": sv.hypothese,
      [`N (${anneeDebut})`]: fmtM(sv.montantN),
      "Évol. N+1": pct(sv.evolutionN1),
      "N+1": fmtM(sv.montantN1),
      "Évol. N+2": pct(sv.evolutionN2),
      "N+2": fmtM(sv.montantN2),
      "TVA": pct(sv.tauxTVA),
      "Fréq.": sv.frequence,
      "Délai (j)": int(sv.delaiReglement),
    })),
  ));

  // ─── 7. Impôts & Taxes ───────────────────────────────────────────────────────

  L(section(`7. Impôts & Taxes — ${badge(data.impotsTaxes.length)}`));
  stat("Impôts & Taxes", data.impotsTaxes.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", "Date N", `Montant N (${anneeDebut})`, "Date N+1", "Montant N+1", "Date N+2", "Montant N+2", "CFE", "Base CFE", "Taux CFE"],
    data.impotsTaxes.map((it) => ({
      "Libellé": it.libelle,
      "Actif": bool(it.actif),
      "Hyp.": it.hypothese,
      "Date N": it.dateN ?? "—",
      [`Montant N (${anneeDebut})`]: fmtM(it.montantN),
      "Date N+1": it.dateN1 ?? "—",
      "Montant N+1": fmtM(it.montantN1),
      "Date N+2": it.dateN2 ?? "—",
      "Montant N+2": fmtM(it.montantN2),
      "CFE": bool(it.isCFE),
      "Base CFE": it.baseImposableCFE ? fmtM(it.baseImposableCFE) : "—",
      "Taux CFE": it.tauxCFE ? pct(it.tauxCFE) : "—",
    })),
  ));

  // ─── 8. Salariés ─────────────────────────────────────────────────────────────

  L(section(`8. Salariés — ${badge(data.salaries.length)}`));
  stat("Salariés", data.salaries.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", `Brut N (${anneeDebut})`, "Évol.N+1", "Brut N+1", "Évol.N+2", "Brut N+2", "Taux sal.", "Taux pat.", "Fixe %"],
    data.salaries.map((sal) => ({
      "Libellé": sal.libelle,
      "Actif": bool(sal.actif),
      "Hyp.": sal.hypothese,
      [`Brut N (${anneeDebut})`]: fmtM(sal.montantN),
      "Évol.N+1": pct(sal.evolutionN1),
      "Brut N+1": fmtM(sal.montantN1),
      "Évol.N+2": pct(sal.evolutionN2),
      "Brut N+2": fmtM(sal.montantN2),
      "Taux sal.": pct(sal.tauxCotSal),
      "Taux pat.": pct(sal.tauxCotPat),
      "Fixe %": pct(sal.tauxFixe),
    })),
  ));

  // ─── 9. Dirigeants ───────────────────────────────────────────────────────────

  L(section(`9. Dirigeants — ${badge(data.dirigeants.length)}`));
  stat("Dirigeants", data.dirigeants.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Hyp.", `Rémun. N (${anneeDebut})`, "Évol.N+1", "Rémun. N+1", "Évol.N+2", "Rémun. N+2", "Exonération TNS", "Conjoint", "Fixe %"],
    data.dirigeants.map((d) => ({
      "Libellé": d.libelle,
      "Actif": bool(d.actif),
      "Hyp.": d.hypothese,
      [`Rémun. N (${anneeDebut})`]: fmtM(d.montantN),
      "Évol.N+1": pct(d.evolutionN1),
      "Rémun. N+1": fmtM(d.montantN1),
      "Évol.N+2": pct(d.evolutionN2),
      "Rémun. N+2": fmtM(d.montantN2),
      "Exonération TNS": d.exonerationTNS ?? "—",
      "Conjoint": bool(d.conjointCollaborateur),
      "Fixe %": pct(d.tauxFixe),
    })),
  ));

  // ─── 10. Cotisations TNS ─────────────────────────────────────────────────────

  L(section(`10. Cotisations TNS — ${badge(data.cotisationsTNS.length)}`));
  stat("Cotisations TNS", data.cotisationsTNS.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Auto", `N (${anneeDebut})`, "N+1", "N+2"],
    data.cotisationsTNS.map((c) => ({
      "Libellé": c.libelle,
      "Actif": bool(c.actif),
      "Auto": bool(c.calcAuto),
      [`N (${anneeDebut})`]: fmtM(c.montantN),
      "N+1": fmtM(c.montantN1),
      "N+2": fmtM(c.montantN2),
    })),
  ));

  // ─── 11. Taxes sur salaires ───────────────────────────────────────────────────

  L(section(`11. Taxes assises sur les salaires — ${badge(data.taxesSalaires.length)}`));
  stat("Taxes salaires", data.taxesSalaires.length);
  Ls(mdTable(
    ["Libellé", "Hyp.", "Auto", "Taux", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.taxesSalaires.map((t) => ({
      "Libellé": t.libelle,
      "Hyp.": t.hypothese,
      "Auto": bool(t.calcAuto),
      "Taux": pct(t.taux),
      "Date N": t.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(t.montantN),
      "Date N+1": t.dateN1 ?? "—",
      "N+1": fmtM(t.montantN1),
      "Date N+2": t.dateN2 ?? "—",
      "N+2": fmtM(t.montantN2),
    })),
  ));

  // ─── 12. Immobilisations ─────────────────────────────────────────────────────

  L(section(`12. Immobilisations — ${badge(data.immobilisations.length)}`));
  stat("Immobilisations", data.immobilisations.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Nature", "Date acquis.", "Montant HT (€)", "TVA", "Type TVA", "Durée amort.", "Mode amort.", "Différé", "Renouvellement"],
    data.immobilisations.map((im) => ({
      "Libellé": im.libelle,
      "Actif": bool(im.actif),
      "Nature": im.nature,
      "Date acquis.": d(im.dateAcquisition),
      "Montant HT (€)": fmtM(im.montantHT),
      "TVA": pct(im.tauxTVA),
      "Type TVA": im.typeTva,
      "Durée amort.": `${im.dureeAmortissement} ans`,
      "Mode amort.": im.modeAmortissement,
      "Différé": im.differe ? `${im.differe} mois` : "—",
      "Renouvellement": im.renouvellement ? `Oui (${im.periodeRenouvellement ?? "?"}a)` : "Non",
    })),
  ));

  // Plan d'amortissement synthétique
  if (data.immobilisations.some((im) => im.lignesAmortissement.length > 0)) {
    L(sectionH("Tableau d'amortissement synthétique"));
    L(``);
    L(`| Immobilisation | Exercice | Val. brute début (€) | Dotation (€) | Amort. cumulé (€) | Val. nette (€) |`);
    L(`| --- | --- | ---: | ---: | ---: | ---: |`);
    for (const im of data.immobilisations) {
      for (const la of im.lignesAmortissement.filter((l) => l.mois === null)) {
        L(`| ${im.libelle} | ${la.annee} | ${fmtM(la.valeurBruteDebut)} | ${fmtM(la.dotationAnnuelle)} | ${fmtM(la.amortissementCumule)} | ${fmtM(la.valeurNette)} |`);
      }
    }
    L(``);
  }

  // ─── 13. Provisions ──────────────────────────────────────────────────────────

  L(section(`13. Provisions — ${badge(data.provisions.length)}`));
  stat("Provisions", data.provisions.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Nature", `N (${anneeDebut})`, "N+1", "N+2"],
    data.provisions.map((pv) => ({
      "Libellé": pv.libelle,
      "Actif": bool(pv.actif),
      "Nature": s(pv.nature),
      [`N (${anneeDebut})`]: fmtM(pv.montantN),
      "N+1": fmtM(pv.montantN1),
      "N+2": fmtM(pv.montantN2),
    })),
  ));

  // ─── 14. Charges financières ──────────────────────────────────────────────────

  L(section(`14. Charges financières — ${badge(data.chargesFinancieres.length)}`));
  stat("Charges financières", data.chargesFinancieres.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2", "TVA"],
    data.chargesFinancieres.map((c) => ({
      "Libellé": c.libelle,
      "Actif": bool(c.actif),
      "Date N": c.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(c.montantN),
      "Date N+1": c.dateN1 ?? "—",
      "N+1": fmtM(c.montantN1),
      "Date N+2": c.dateN2 ?? "—",
      "N+2": fmtM(c.montantN2),
      "TVA": pct(c.tauxTVA),
    })),
  ));

  // ─── 15. Charges exceptionnelles ─────────────────────────────────────────────

  L(section(`15. Charges exceptionnelles — ${badge(data.chargesExceptionnelles.length)}`));
  stat("Charges exceptionnelles", data.chargesExceptionnelles.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2", "TVA"],
    data.chargesExceptionnelles.map((c) => ({
      "Libellé": c.libelle,
      "Actif": bool(c.actif),
      "Date N": c.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(c.montantN),
      "Date N+1": c.dateN1 ?? "—",
      "N+1": fmtM(c.montantN1),
      "Date N+2": c.dateN2 ?? "—",
      "N+2": fmtM(c.montantN2),
      "TVA": pct(c.tauxTVA),
    })),
  ));

  // ─── 16. Charges de gestion courante ─────────────────────────────────────────

  L(section(`16. Charges de gestion courante — ${badge(data.chargesGestionCourante.length)}`));
  stat("Charges gestion courante", data.chargesGestionCourante.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2", "TVA"],
    data.chargesGestionCourante.map((c) => ({
      "Libellé": c.libelle,
      "Actif": bool(c.actif),
      "Date N": c.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(c.montantN),
      "Date N+1": c.dateN1 ?? "—",
      "N+1": fmtM(c.montantN1),
      "Date N+2": c.dateN2 ?? "—",
      "N+2": fmtM(c.montantN2),
      "TVA": pct(c.tauxTVA),
    })),
  ));

  // ─── 17. Reprises sur provisions ─────────────────────────────────────────────

  L(section(`17. Reprises sur provisions — ${badge(data.reprisesProduits.length)}`));
  stat("Reprises sur provisions", data.reprisesProduits.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Nature", `N (${anneeDebut})`, "N+1", "N+2"],
    data.reprisesProduits.map((r) => ({
      "Libellé": r.libelle,
      "Actif": bool(r.actif),
      "Nature": s(r.nature),
      [`N (${anneeDebut})`]: fmtM(r.montantN),
      "N+1": fmtM(r.montantN1),
      "N+2": fmtM(r.montantN2),
    })),
  ));

  // ─── 18. Produits financiers ──────────────────────────────────────────────────

  L(section(`18. Produits financiers — ${badge(data.financiersProduits.length)}`));
  stat("Produits financiers", data.financiersProduits.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.financiersProduits.map((p) => ({
      "Libellé": p.libelle,
      "Actif": bool(p.actif),
      "Date N": p.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(p.montantN),
      "Date N+1": p.dateN1 ?? "—",
      "N+1": fmtM(p.montantN1),
      "Date N+2": p.dateN2 ?? "—",
      "N+2": fmtM(p.montantN2),
    })),
  ));

  // ─── 19. Produits exceptionnels ───────────────────────────────────────────────

  L(section(`19. Produits exceptionnels — ${badge(data.exceptionnelsProduits.length)}`));
  stat("Produits exceptionnels", data.exceptionnelsProduits.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.exceptionnelsProduits.map((p) => ({
      "Libellé": p.libelle,
      "Actif": bool(p.actif),
      "Date N": p.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(p.montantN),
      "Date N+1": p.dateN1 ?? "—",
      "N+1": fmtM(p.montantN1),
      "Date N+2": p.dateN2 ?? "—",
      "N+2": fmtM(p.montantN2),
    })),
  ));

  // ─── 20. Transferts de charges ────────────────────────────────────────────────

  L(section(`20. Transferts de charges — ${badge(data.transfertsProduits.length)}`));
  stat("Transferts de charges", data.transfertsProduits.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.transfertsProduits.map((p) => ({
      "Libellé": p.libelle,
      "Actif": bool(p.actif),
      "Date N": p.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(p.montantN),
      "Date N+1": p.dateN1 ?? "—",
      "N+1": fmtM(p.montantN1),
      "Date N+2": p.dateN2 ?? "—",
      "N+2": fmtM(p.montantN2),
    })),
  ));

  // ─── 21. Produits de gestion courante ─────────────────────────────────────────

  L(section(`21. Produits de gestion courante — ${badge(data.gestionCouranteProduits.length)}`));
  stat("Produits gestion courante", data.gestionCouranteProduits.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.gestionCouranteProduits.map((p) => ({
      "Libellé": p.libelle,
      "Actif": bool(p.actif),
      "Date N": p.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(p.montantN),
      "Date N+1": p.dateN1 ?? "—",
      "N+1": fmtM(p.montantN1),
      "Date N+2": p.dateN2 ?? "—",
      "N+2": fmtM(p.montantN2),
    })),
  ));

  // ─── 22. Emprunts ─────────────────────────────────────────────────────────────

  L(section(`22. Emprunts — ${badge(data.emprunts.length)}`));
  stat("Emprunts", data.emprunts.length);
  Ls(mdTable(
    ["Libellé", "Type", "Montant (€)", "Taux annuel", "Taux assur.", "Durée (mois)", "Périodicité", "Date déblocage", "Différé", "Durée diff.", "Mode remb.", "Frais doss."],
    data.emprunts.map((e) => ({
      "Libellé": e.libelle,
      "Type": e.typeEmprunt,
      "Montant (€)": fmtM(e.montant),
      "Taux annuel": pct(e.tauxAnnuel),
      "Taux assur.": pct(e.tauxAssurance),
      "Durée (mois)": int(e.dureeEnMois),
      "Périodicité": e.periodicite,
      "Date déblocage": d(e.dateDéblocage ?? (e as Record<string, unknown>)["dat\u00e9D\u00e9blocage"]),
      "Différé": e.typeDiffere ?? (e as Record<string, unknown>)["typeDiff\u00e9r\u00e9"] ?? "—",
      "Durée diff.": int(e.dureeDiffereEnMois ?? (e as Record<string, unknown>)["dur\u00e9eDiff\u00e9reEnMois"]),
      "Mode remb.": e.modaliteRemboursement,
      "Frais doss.": fmtM(e.fraisDossier),
    })),
  ));

  // Échéanciers résumés (3 premières et 3 dernières lignes par emprunt)
  for (const emprunt of data.emprunts) {
    if (emprunt.lignesEcheancier.length === 0) continue;
    L(sectionH(`Échéancier — ${emprunt.libelle}`));
    L(`> ${emprunt.lignesEcheancier.length} lignes · ${int(emprunt.dureeEnMois)} mois`);
    L(``);
    L(`| Mois | Date éch. | Cap. début (€) | Intérêts (€) | Assur. (€) | Cap. remb. (€) | Mensualité (€) | Cap. fin (€) |`);
    L(`| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |`);
    const lines3 = [
      ...emprunt.lignesEcheancier.slice(0, 3),
      ...(emprunt.lignesEcheancier.length > 6 ? [null] : []),
      ...emprunt.lignesEcheancier.slice(-3),
    ];
    for (const le of lines3) {
      if (le === null) { L(`| … | … | … | … | … | … | … | … |`); continue; }
      L(`| ${le.moisNumero} | ${d(le.dateEcheance)} | ${fmtM(le.capitalRestantDebut)} | ${fmtM(le.interesMois)} | ${fmtM(le.assuranceMois)} | ${fmtM(le.capitalRembourse)} | ${fmtM(le.mensualiteTotale)} | ${fmtM(le.capitalRestantFin)} |`);
    }
    L(``);
  }

  // ─── 23. Apports ─────────────────────────────────────────────────────────────

  L(section(`23. Apports — ${badge(data.apports.length)}`));
  stat("Apports", data.apports.length);
  Ls(mdTable(
    ["Libellé", "Type", "Montant (€)", "Date apport", "Remboursable"],
    data.apports.map((a) => ({
      "Libellé": a.libelle,
      "Type": a.type,
      "Montant (€)": fmtM(a.montant),
      "Date apport": d(a.dateApport),
      "Remboursable": bool(a.remboursable),
    })),
  ));

  // ─── 24. Subventions d'investissement ────────────────────────────────────────

  L(section(`24. Subventions d'investissement — ${badge(data.subventions.length)}`));
  stat("Subventions investissement", data.subventions.length);
  Ls(mdTable(
    ["Libellé", "Type", "Montant (€)", "Date obtention", "Date encaiss.", "Imposable"],
    data.subventions.map((sv) => ({
      "Libellé": sv.libelle,
      "Type": sv.type,
      "Montant (€)": fmtM(sv.montant),
      "Date obtention": d(sv.dateObtention),
      "Date encaiss.": d(sv.dateEncaissement),
      "Imposable": bool(sv.imposable),
    })),
  ));

  // ─── 25. Divers encaissements ─────────────────────────────────────────────────

  L(section(`25. Divers encaissements — ${badge(data.diversEncaissements.length)}`));
  stat("Divers encaissements", data.diversEncaissements.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.diversEncaissements.map((dv) => ({
      "Libellé": dv.libelle,
      "Actif": bool(dv.actif),
      "Date N": dv.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(dv.montantN),
      "Date N+1": dv.dateN1 ?? "—",
      "N+1": fmtM(dv.montantN1),
      "Date N+2": dv.dateN2 ?? "—",
      "N+2": fmtM(dv.montantN2),
    })),
  ));

  // ─── 26. Divers décaissements ─────────────────────────────────────────────────

  L(section(`26. Divers décaissements — ${badge(data.diversDecaissements.length)}`));
  stat("Divers décaissements", data.diversDecaissements.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.diversDecaissements.map((dv) => ({
      "Libellé": dv.libelle,
      "Actif": bool(dv.actif),
      "Date N": dv.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(dv.montantN),
      "Date N+1": dv.dateN1 ?? "—",
      "N+1": fmtM(dv.montantN1),
      "Date N+2": dv.dateN2 ?? "—",
      "N+2": fmtM(dv.montantN2),
    })),
  ));

  // ─── 27. Remboursements Compte Courant ────────────────────────────────────────

  L(section(`27. Remboursements Compte Courant — ${badge(data.diversRemboursementsCC.length)}`));
  stat("Remboursements CC", data.diversRemboursementsCC.length);
  Ls(mdTable(
    ["Libellé", "Actif", "Date N", `N (${anneeDebut})`, "Date N+1", "N+1", "Date N+2", "N+2"],
    data.diversRemboursementsCC.map((dv) => ({
      "Libellé": dv.libelle,
      "Actif": bool(dv.actif),
      "Date N": dv.dateN ?? "—",
      [`N (${anneeDebut})`]: fmtM(dv.montantN),
      "Date N+1": dv.dateN1 ?? "—",
      "N+1": fmtM(dv.montantN1),
      "Date N+2": dv.dateN2 ?? "—",
      "N+2": fmtM(dv.montantN2),
    })),
  ));

  // ─── 28. Paramètres IS ───────────────────────────────────────────────────────

  L(section("28. Paramètres IS"));
  if (!isIS || !data.parametresIS) {
    L(`_Non applicable (régime IR) ou non renseigné._`);
    L(``);
  } else {
    const pi = data.parametresIS;
    L(`| Paramètre | Valeur |`);
    L(`| --- | --- |`);
    Object.entries(pi)
      .filter(([k]) => !["id", "scenarioId", "createdAt", "updatedAt"].includes(k))
      .forEach(([k, v]) => L(`| ${k} | ${String(v ?? "—")} |`));
    L(``);
  }

  // ─── 29. Ajustements fiscaux ─────────────────────────────────────────────────

  L(section(`29. Ajustements fiscaux — ${badge(data.ajustementsFiscaux.length)}`));
  stat("Ajustements fiscaux", data.ajustementsFiscaux.length);
  if (data.ajustementsFiscaux.length > 0) {
    const first = data.ajustementsFiscaux[0] as Record<string, unknown>;
    const cols = Object.keys(first).filter((k) => !["id", "scenarioId", "createdAt", "updatedAt"].includes(k));
    Ls(mdTable(
      cols,
      data.ajustementsFiscaux.map((aj) => {
        const row: Row = {};
        for (const col of cols) row[col] = String((aj as Record<string, unknown>)[col] ?? "—");
        return row;
      }),
    ));
  } else {
    L(`_Aucun ajustement fiscal._`);
    L(``);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTIE II — SÉRIES MENSUELLES CALCULÉES (2-pass IS)
  // ═══════════════════════════════════════════════════════════════════════════

  L(`\n---\n`);
  L(`# Partie II — Séries mensuelles calculées\n`);
  L(`> Générées par \`buildMonthlyCalc\` avec IS réel (2-pass). Valeurs en €.\n`);

  // ─── 31. CA mensuel par activité ─────────────────────────────────────────

  L(section("31. Séries mensuelles — CA par activité"));
  for (const { yk, labels, exLabel } of yks) {
    L(sectionH(`Exercice ${exLabel}`));
    if (mc.caByActivity.length === 0) { L("_Aucune activité._\n"); continue; }
    Ls(mkMonthTable(labels, mc.caByActivity.map((a) => ({
      header: a.libelle.slice(0, 30),
      series: a.series[yk],
    }))));
  }

  // ─── 32. Achats & variation de stocks par activité ──────────────────────

  L(section("32. Séries mensuelles — Achats & Variation de stock par activité"));
  for (const { yk, labels, exLabel } of yks) {
    if (mc.achatsByActivity.length > 0) {
      L(sectionH(`Exercice ${exLabel} — Achats`));
      Ls(mkMonthTable(labels, mc.achatsByActivity.map((a) => ({
        header: a.libelle.slice(0, 30),
        series: a.series[yk],
      }))));
    }
    const varNonZero = mc.varStockByActivity.filter((a) =>
      a.series[yk].some((v) => v !== 0),
    );
    if (varNonZero.length > 0) {
      L(sectionH(`Exercice ${exLabel} — Variation de stock`));
      Ls(mkMonthTable(labels, varNonZero.map((a) => ({
        header: a.libelle.slice(0, 30),
        series: a.series[yk],
      }))));
    }
  }

  // ─── 33. Charges d'exploitation mensuelle ────────────────────────────────

  L(section("33. Séries mensuelles — Charges d'exploitation"));
  for (const { yk, labels, exLabel } of yks) {
    L(sectionH(`Exercice ${exLabel}`));
    Ls(mkMonthTable(labels, [
      { header: "Fournitures", series: mc.fournitures[yk] },
      { header: "Services ext.", series: mc.services[yk] },
      { header: "Impôts & taxes", series: mc.impotsTaxes[yk] },
      { header: "Charges personnel", series: mc.chargesPersonnel[yk] },
    ]));
  }

  // ─── 34. Personnel — Détail mensuel ──────────────────────────────────────

  L(section("34. Séries mensuelles — Personnel (détail)"));
  for (const { yk, labels, exLabel } of yks) {
    L(sectionH(`Exercice ${exLabel}`));
    Ls(mkMonthTable(labels, [
      { header: "Salaires bruts", series: mc.salairesBruts[yk] },
      { header: "Ch. patronales", series: mc.chargesPatronales[yk] },
      { header: "Rémun. dirigeant", series: mc.remuDirigeant[yk] },
      { header: "Cotis. TNS", series: mc.cotisationsTNS[yk] },
      { header: "Taxes sal.", series: mc.taxesSalaires[yk] },
    ]));
  }

  // ─── 35. Amortissements mensuels par immobilisation ──────────────────────

  L(section("35. Séries mensuelles — Amortissements par immobilisation"));
  for (const { yk, labels, exLabel } of yks) {
    const amortCols = mc.dotationsParImmo.filter((d) =>
      d.series[yk].some((v) => v !== 0),
    );
    if (amortCols.length === 0) { continue; }
    L(sectionH(`Exercice ${exLabel}`));
    Ls(mkMonthTable(labels, amortCols.map((d) => ({
      header: `${d.immo.libelle.slice(0, 22)} (${d.immo.nature.charAt(0)})`,
      series: d.series[yk],
    }))));
  }

  // ─── 36. Résultats consolidés mensuels ───────────────────────────────────

  L(section("36. Séries mensuelles — Résultats consolidés"));
  for (const { yk, labels, exLabel } of yks) {
    L(sectionH(`Exercice ${exLabel}`));
    Ls(mkMonthTable(labels, [
      { header: "Subventions", series: mc.subventions[yk] },
      { header: "EBE", series: mc.ebe[yk] },
      { header: "Résult. expl.", series: mc.resExpl[yk] },
      { header: "Pdts fin.", series: mc.produitsFinanciers[yk] },
      { header: "Intérêts", series: mc.interetsEmprunts[yk] },
      { header: "Résult. courant", series: mc.resCourant[yk] },
      { header: "IS", series: mc.isSeries[yk] },
      { header: "Résult. net", series: mc.resNet[yk] },
      { header: "CAF", series: mc.caf[yk] },
    ]));
  }

  // ─── 30. Récapitulatif ────────────────────────────────────────────────────────

  L(section("30. Récapitulatif général"));
  L(``);
  const totalLignes = stats.reduce((s, st) => s + st.count, 0);
  const renseignees = stats.filter((s) => s.count > 0).length;

  L(`| Section | Nb lignes |`);
  L(`| --- | ---: |`);
  for (const st of stats) {
    L(`| ${st.section} | ${st.count === 0 ? "—" : st.count} |`);
  }
  L(`| **Total** | **${totalLignes}** |`);
  L(``);
  L(`> **${renseignees}/${stats.length}** sections renseignées · **${totalLignes}** lignes de saisie au total.`);
  L(``);

  // ─── Écriture du fichier de sortie ───────────────────────────────────────────

  const outDir = join(process.cwd(), "scripts/debug/output");
  mkdirSync(outDir, { recursive: true });
  const outputPath = join(outDir, "debug-saisie-output.md");
  writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`\n✅ Rapport généré : ${outputPath}`);
  console.log(`   ${renseignees}/${stats.length} sections · ${totalLignes} lignes de saisie`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  prisma.$disconnect();
  process.exit(1);
});
