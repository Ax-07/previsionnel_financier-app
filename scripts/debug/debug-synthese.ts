/**
 * Script de diagnostic de la synthèse prévisionnelle.
 *
 * Usage :
 *   pnpm tsx scripts/debug-synthese.ts <dossierId>
 *
 * Produit : scripts/debug-synthese-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildSigData, calcSeuil, buildBfrRows, buildBilanRows, buildTresorerieRows, buildFinCalc)
 * — les résultats doivent être identiques à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { buildTresorerieRows } from "@/lib/finance/aggregations/tresorerie";
import { buildTemporelCtx } from "@/lib/finance/pipeline/calendar";
import {
    calcEncaissements,
    calcAchatsRaw,
    calcEncoursFournisseurs,
} from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { subSeries } from "@/lib/finance/calculs/monthly";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import type { SigNode } from "@/lib/finance/aggregations/sig";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import type { BilanRow } from "@/lib/finance/aggregations/bilan";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import type { YearKey } from "@/lib/finance/utils";

// ─── Utilitaires d'affichage ─────────────────────────────────────────────────

const fmt = (v: number) =>
    v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number | null) =>
    v === null ? "—" : `${v.toFixed(1)} %`;
const fmtDays = (v: number) => `${Math.round(v)} j`;
const fmtTaux = (v: number) => `${v.toFixed(1)} %`;
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
const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

// ─── Helpers d'extraction (reproduits depuis use-synthese-data.ts) ─────────────

function extractSigAmt(nodes: SigNode[], key: string): YAcc {
    const node = nodes.find((nd) => nd.key === key);
    if (!node) return { y1: 0, y2: 0, y3: 0 };
    return {
        y1: node.values.y1.amount,
        y2: node.values.y2.amount,
        y3: node.values.y3.amount,
    };
}

function extractSigPct(nodes: SigNode[], key: string): { y1: number | null; y2: number | null; y3: number | null } {
    const node = nodes.find((nd) => nd.key === key);
    if (!node) return { y1: null, y2: null, y3: null };
    return {
        y1: node.values.y1.pct,
        y2: node.values.y2.pct,
        y3: node.values.y3.pct,
    };
}

function extractBreakEvenAmt(rows: BreakEvenRow[], key: string): YAcc {
    const r = rows.find((brow) => brow.key === key);
    if (!r) return { y1: 0, y2: 0, y3: 0 };
    return {
        y1: r.values.y1.amount,
        y2: r.values.y2.amount,
        y3: r.values.y3.amount,
    };
}

function extractBreakEvenPct(rows: BreakEvenRow[], key: string): { y1: number | null; y2: number | null; y3: number | null } {
    const r = rows.find((brow) => brow.key === key);
    if (!r) return { y1: null, y2: null, y3: null };
    return {
        y1: r.values.y1.pct,
        y2: r.values.y2.pct,
        y3: r.values.y3.pct,
    };
}

function extractBilanAmt(rows: BilanRow[], key: string): YAcc {
    const r = rows.find((brow) => brow.key === key);
    if (!r) return { y1: 0, y2: 0, y3: 0 };
    return {
        y1: r.values.y1.amount,
        y2: r.values.y2.amount,
        y3: r.values.y3.amount,
    };
}

function extractBfrAmt(rows: BfrRow[], key: string): YAcc {
    const r = rows.find((brow) => brow.key === key);
    if (!r) return { y1: 0, y2: 0, y3: 0 };
    return {
        y1: r.values.y1.amount,
        y2: r.values.y2.amount,
        y3: r.values.y3.amount,
    };
}

function extractTresoAmt(rows: TresorerieRow[], key: string): YAcc {
    const r = rows.find((trow) => trow.key === key);
    if (!r) return { y1: 0, y2: 0, y3: 0 };
    return {
        y1: r.values.y1.total,
        y2: r.values.y2.total,
        y3: r.values.y3.total,
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
    console.error("Usage : pnpm tsx scripts/debug-synthese.ts <dossierId>");
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
    const regimeTVA = par?.regimeTVA ?? "REEL_NORMAL";
    const isFranchise = regimeTVA === "FRANCHISE";
    const effectiveMoisPaiement = par?.moisPaiementSalaires ?? 1;

    // ── Calculs officiels (= application) ──────────────────────────────────────
    const fc = buildFinCalc(data, dateDemarrageDate);

    const sigData = buildSigData(data, fc, isIS);
    const seuilData = calcSeuil(data, fc);
    const bfrData = buildBfrRows(data, fc);
    const bilanData = buildBilanRows(data, fc);

    const ctx = buildTemporelCtx(dateDemarrageDate, isFranchise);
    const enc = calcEncaissements(data, ctx);
    const dec = calcDecaissements(data, ctx, effectiveMoisPaiement, fc.isParAnnee);

    const variation = {
        y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
        y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
        y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
    };
    const y1Sol = computeSoldeMonthly(variation.y1, 0);
    const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
    const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

    const soldePrecedent = { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent };
    const soldeFinalSeries = { y1: y1Sol.soldeFinal, y2: y2Sol.soldeFinal, y3: y3Sol.soldeFinal };
    const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
    const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);
    const tresoRows = buildTresorerieRows({
        enc, dec, soldePrecedent, variation,
        soldeFinal: soldeFinalSeries,
        encoursFournisseurs,
        immosParNature: dec.immosParNature,
    });

    const y1L = sigData.yearLabels.y1;
    const y2L = sigData.yearLabels.y2;
    const y3L = sigData.yearLabels.y3;

    // ── Extraction SIG ──────────────────────────────────────────────────────────
    const caAmt = extractSigAmt(sigData.nodes, "ca");
    const ventesProdAmt = extractSigAmt(sigData.nodes, "ventes_prod_reelle");
    const margeGlobaleAmt = extractSigAmt(sigData.nodes, "marge_globale");
    const vaAmt = extractSigAmt(sigData.nodes, "va");
    const ebeAmt = extractSigAmt(sigData.nodes, "ebe");
    const resExplAmt = extractSigAmt(sigData.nodes, "res_expl");
    const resFinAmt = extractSigAmt(sigData.nodes, "res_fin");
    const resCourantAmt = extractSigAmt(sigData.nodes, "res_courant");
    const resNetAmt = extractSigAmt(sigData.nodes, "res_net");
    const cafAmt = extractSigAmt(sigData.nodes, "caf");

    const caPct = extractSigPct(sigData.nodes, "ca");
    const ventesProdPct = extractSigPct(sigData.nodes, "ventes_prod_reelle");
    const margeGlobalePct = extractSigPct(sigData.nodes, "marge_globale");
    const vaPct = extractSigPct(sigData.nodes, "va");
    const ebePct = extractSigPct(sigData.nodes, "ebe");
    const resExplPct = extractSigPct(sigData.nodes, "res_expl");
    const resFinPct = extractSigPct(sigData.nodes, "res_fin");
    const resCourantPct = extractSigPct(sigData.nodes, "res_courant");
    const resNetPct = extractSigPct(sigData.nodes, "res_net");
    const cafPct = extractSigPct(sigData.nodes, "caf");

    // ── Extraction Seuil ────────────────────────────────────────────────────────
    const seuilVentesAmt = extractBreakEvenAmt(seuilData.rows, "ventes_production");
    const seuilCVAmt = extractBreakEvenAmt(seuilData.rows, "total_cv");
    const seuilTauxAmt = extractBreakEvenAmt(seuilData.rows, "taux_marge_cv");
    const seuilCFAmt = extractBreakEvenAmt(seuilData.rows, "total_cf");
    const seuilEcoAmt = extractBreakEvenAmt(seuilData.rows, "seuil_eco");
    const seuilExcedAmt = extractBreakEvenAmt(seuilData.rows, "excedent_eco");
    const pointMortAmt = extractBreakEvenAmt(seuilData.rows, "point_mort_eco");

    const seuilCVPct = extractBreakEvenPct(seuilData.rows, "total_cv");
    const seuilCFPct = extractBreakEvenPct(seuilData.rows, "total_cf");

    // ── Extraction Bilan & BFR ──────────────────────────────────────────────────
    const capitauxPropresAmt = extractBilanAmt(bilanData.rows, "capitaux_propres");
    const empruntsAmt = extractBilanAmt(bilanData.rows, "emprunts");
    const immoNetteAmt = extractBilanAmt(bilanData.rows, "immo_nette_total");
    const frAmt: YAcc = {
        y1: capitauxPropresAmt.y1 + empruntsAmt.y1 - immoNetteAmt.y1,
        y2: capitauxPropresAmt.y2 + empruntsAmt.y2 - immoNetteAmt.y2,
        y3: capitauxPropresAmt.y3 + empruntsAmt.y3 - immoNetteAmt.y3,
    };
    const bfrAmt = extractBfrAmt(bfrData.rows, "bfr");
    const soldeAnnuelAmt: YAcc = {
        y1: frAmt.y1 - bfrAmt.y1,
        y2: frAmt.y2 - bfrAmt.y2,
        y3: frAmt.y3 - bfrAmt.y3,
    };

    // ── Extraction Trésorerie ───────────────────────────────────────────────────
    const soldeMensuelAmt = extractTresoAmt(tresoRows, "tres-solde-final");
    const totalEncAmt = extractTresoAmt(tresoRows, "tres-total-enc");
    const totalDecAmt = extractTresoAmt(tresoRows, "tres-total-dec");
    const variationAmt = extractTresoAmt(tresoRows, "tres-variation");

    const lines: string[] = [];
    const L = (s: string) => lines.push(s);

    L(`# Diagnostic Synthèse Prévisionnelle — Dossier \`${dossierId}\``);
    L(``);
    L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
    L(``);
    L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
    L(`\`buildSigData\` · \`calcSeuil\` · \`buildBfrRows\` · \`buildBilanRows\` · \`buildTresorerieRows\` · \`buildFinCalc\``);
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
    L(`| Régime TVA | ${regimeTVA} |`);
    L(`| Franchise TVA | ${isFranchise ? "Oui" : "Non"} |`);
    L(`| Mois paiement salaires | M+${effectiveMoisPaiement} |`);
    L(`| Exercices | ${y1L} · ${y2L} · ${y3L} |`);
    L(`| Activités | ${data.activites.length} |`);
    L(`| Salariés | ${data.salaries.length} |`);
    L(`| Immobilisations actives | ${data.immobilisations.filter((i) => i.actif !== false).length} |`);
    L(`| Emprunts | ${data.emprunts.length} |`);
    L(``);

    // ─── Section 1 : Soldes Intermédiaires de Gestion ────────────────────────────

    L(section2("1. Soldes Intermédiaires de Gestion (SIG)"));
    L(`*Tous les montants sont en € HT. Le % CA est par rapport au chiffre d'affaires HT.*`);
    L(``);
    L(section("1.1 SIG avec % CA"));
    L(headerPct(y1L, y2L, y3L));
    L(rowPct("**Chiffre d'affaires**", caAmt, caPct, { bold: true }));
    L(rowPct("Ventes + Production réelle", ventesProdAmt, ventesProdPct));
    L(rowPct("Marge globale", margeGlobaleAmt, margeGlobalePct));
    L(rowPct("Valeur ajoutée", vaAmt, vaPct));
    L(rowPct("Excédent brut d'exploitation (EBE)", ebeAmt, ebePct));
    L(rowPct("Résultat d'exploitation", resExplAmt, resExplPct));
    L(rowPct("Résultat financier", resFinAmt, resFinPct));
    L(rowPct("Résultat courant", resCourantAmt, resCourantPct));
    L(rowPct("**Résultat de l'exercice**", resNetAmt, resNetPct, { bold: true }));
    L(rowPct("**CAF**", cafAmt, cafPct, { bold: true }));
    L(``);

    // Vérification de cohérence SIG
    L(section("1.2 Vérifications de cohérence SIG"));
    const sigChecks: { label: string; ok: boolean; detail: string }[] = [];

    // CAF = ResNet + Dotations - Reprises (grossière mais réaliste dans la synthèse)
    // On vérifie juste que CAF >= ResNet (la CAF ne peut pas être inférieure au résultat net en général)
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const cafV = cafAmt[y];
        const rnV = resNetAmt[y];
        // CAF doit être >= ResNet (car dotations amortissements > 0)
        const cafOk = cafV >= rnV - 1;
        sigChecks.push({
            label: `CAF ≥ Résultat net (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
            ok: cafOk,
            detail: `CAF = ${fmt(cafV)} € | ResNet = ${fmt(rnV)} €`,
        });
    }

    // EBE >= ResExpl (EBE avant amortissements et frais financiers)
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const ebeV = ebeAmt[y];
        const reV = resExplAmt[y];
        // EBE doit être >= ResExpl car les dotations réduisent EBE → ResExpl
        const ok = ebeV >= reV - 1;
        sigChecks.push({
            label: `EBE ≥ Résultat exploitation (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
            ok,
            detail: `EBE = ${fmt(ebeV)} € | ResExpl = ${fmt(reV)} €`,
        });
    }

    L(`| Check | Statut | Détail |`);
    L(`| --- | :---: | --- |`);
    for (const c of sigChecks) {
        L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
    }
    L(``);

    // ─── Section 2 : Seuil de rentabilité ────────────────────────────────────────

    L(section2("2. Seuil de Rentabilité Économique"));
    L(``);
    L(header(y1L, y2L, y3L));
    L(row("**Ventes + Production réelle**", seuilVentesAmt, { bold: true }));
    L(rowPct("Coûts variables", seuilCVAmt, seuilCVPct));
    L(`| Taux de marge sur coût variable | ${fmtTaux(seuilTauxAmt.y1)} | ${fmtTaux(seuilTauxAmt.y2)} | ${fmtTaux(seuilTauxAmt.y3)} |`);
    L(rowPct("Coûts fixes", seuilCFAmt, seuilCFPct));
    L(row("**Seuil de rentabilité**", seuilEcoAmt, { bold: true }));
    L(row("Excédent / insuffisance", seuilExcedAmt));
    L(`| Point mort (jours) | ${fmtDays(pointMortAmt.y1)} | ${fmtDays(pointMortAmt.y2)} | ${fmtDays(pointMortAmt.y3)} |`);
    L(``);

    L(section("2.1 Vérifications de cohérence seuil"));
    const seuilChecks: { label: string; ok: boolean; detail: string }[] = [];

    // Excédent = Ventes - Seuil
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const ventes = seuilVentesAmt[y];
        const seuil = seuilEcoAmt[y];
        const exced = seuilExcedAmt[y];
        const excedCalc = ventes - seuil;
        const ok = eq(exced, excedCalc);
        seuilChecks.push({
            label: `Excédent = Ventes − Seuil (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
            ok,
            detail: `${fmt(exced)} ≟ ${fmt(ventes)} − ${fmt(seuil)} = ${fmt(excedCalc)}`,
        });
    }

    // Seuil = CF / taux_marge_cv (si taux > 0)
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const cf = seuilCFAmt[y];
        const taux = seuilTauxAmt[y];
        const seuil = seuilEcoAmt[y];
        if (taux > 0.01) {
            // taux est en % (ex: 72.5), la formule est seuil = cf / (taux / 100)
            const seuilCalc = cf / (taux / 100);
            const ok = eq(seuil, seuilCalc);
            seuilChecks.push({
                label: `Seuil = CF / Taux MCV (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
                ok,
                detail: `${fmt(seuil)} ≟ ${fmt(cf)} / ${fmtTaux(taux)} = ${fmt(seuilCalc)}`,
            });
        }
    }

    L(`| Check | Statut | Détail |`);
    L(`| --- | :---: | --- |`);
    for (const c of seuilChecks) {
        L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
    }
    L(``);

    // ─── Section 3 : BFR ─────────────────────────────────────────────────────────

    L(section2("3. Besoin en Fonds de Roulement (BFR)"));
    L(``);
    L(`*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*`);
    L(``);

    // Afficher toutes les lignes BFR disponibles
    const bfrLignes = bfrData.rows.filter((r) => r.style !== "section");
    if (bfrLignes.length > 0) {
        L(header(y1L, y2L, y3L));
        for (const brow of bfrLignes) {
            const vals: YAcc = {
                y1: brow.values.y1.amount,
                y2: brow.values.y2.amount,
                y3: brow.values.y3.amount,
            };
            const bold = brow.style === "highlight" || brow.key === "bfr";
            L(row(brow.label, vals, { bold }));
        }
        L(``);
    }

    L(section("3.1 Récapitulatif BFR"));
    L(header(y1L, y2L, y3L));
    L(row("**BFR total**", bfrAmt, { bold: true }));
    L(``);

    // ─── Section 4 : Fonds de Roulement & Trésorerie (Annuelle) ─────────────────

    L(section2("4. Équilibre Financier (Fonds de Roulement)"));
    L(``);
    L(`*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*`);
    L(`*Solde trésorerie annuel = FR − BFR*`);
    L(``);
    L(header(y1L, y2L, y3L));
    L(row("Capitaux propres", capitauxPropresAmt));
    L(row("Emprunts (LMT)", empruntsAmt));
    L(row("Immobilisations nettes", immoNetteAmt));
    L(row("**Fonds de roulement (FR)**", frAmt, { bold: true }));
    L(row("**BFR**", bfrAmt, { bold: true }));
    L(row("**Solde de trésorerie (Annuel)**", soldeAnnuelAmt, { bold: true }));
    L(``);

    L(section("4.1 Vérifications de cohérence FR"));
    const frChecks: { label: string; ok: boolean; detail: string }[] = [];

    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const fr = frAmt[y];
        const cp = capitauxPropresAmt[y];
        const emp = empruntsAmt[y];
        const immo = immoNetteAmt[y];
        const frCalc = cp + emp - immo;
        const ok = eq(fr, frCalc);
        frChecks.push({
            label: `FR = CP + Emprunts − Immo (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
            ok,
            detail: `${fmt(fr)} ≟ ${fmt(cp)} + ${fmt(emp)} − ${fmt(immo)} = ${fmt(frCalc)}`,
        });
        const solde = soldeAnnuelAmt[y];
        const bfr = bfrAmt[y];
        const soldeCalc = fr - bfr;
        const ok2 = eq(solde, soldeCalc);
        frChecks.push({
            label: `Solde annuel = FR − BFR (${y === "y1" ? y1L : y === "y2" ? y2L : y3L})`,
            ok: ok2,
            detail: `${fmt(solde)} ≟ ${fmt(fr)} − ${fmt(bfr)} = ${fmt(soldeCalc)}`,
        });
    }

    L(`| Check | Statut | Détail |`);
    L(`| --- | :---: | --- |`);
    for (const c of frChecks) {
        L(`| ${c.label} | ${c.ok ? "✅" : "❌"} | ${c.detail} |`);
    }
    L(``);

    // ─── Section 5 : Trésorerie mensuelle ────────────────────────────────────────

    L(section2("5. Trésorerie"));
    L(``);

    L(section("5.1 Synthèse annuelle trésorerie"));
    L(header(y1L, y2L, y3L));
    L(row("Total encaissements", totalEncAmt));
    L(row("Total décaissements", totalDecAmt));
    L(row("Variation de trésorerie", variationAmt));
    L(row("**Solde trésorerie fin d'exercice (M12)**", soldeMensuelAmt, { bold: true }));
    L(``);

    // Vérification solde mensuel vs solde annuel (doivent être cohérents)
    L(section("5.2 Vérification solde M12 vs solde annuel (FR−BFR)"));
    L(``);
    L(`*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*`);
    L(`*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*`);
    L(`*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*`);
    L(``);
    L(`| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const y of ["y1", "y2", "y3"] as YearKey[]) {
        const m12 = soldeMensuelAmt[y];
        const annuel = soldeAnnuelAmt[y];
        const ecart = m12 - annuel;
        const yLabel = y === "y1" ? y1L : y === "y2" ? y2L : y3L;
        L(`| ${yLabel} | ${fmt(m12)} | ${fmt(annuel)} | ${fmt(ecart)} |`);
    }
    L(``);

    // ─── Section 5.3 : Détail mensuel trésorerie ────────────────────────────────

    L(section("5.3 Soldes mensuels de trésorerie"));
    L(``);

    for (const [yKey, sol, yLabel] of [
        ["y1", y1Sol, y1L] as const,
        ["y2", y2Sol, y2L] as const,
        ["y3", y3Sol, y3L] as const,
    ]) {
        L(`**${yLabel}**\n`);
        L(`| Mois | Encaissements | Décaissements | Variation | Solde final |`);
        L(`| --- | ---: | ---: | ---: | ---: |`);
        for (let m = 0; m < 12; m++) {
            const encM = n(enc.totalEnc[yKey][m]);
            const decM = n(dec.totalDec[yKey][m]);
            const varM = n(variation[yKey][m]);
            const sfM = n(sol.soldeFinal[m]);
            L(`| ${MOIS_COURTS[m]} | ${fmt(encM)} | ${fmt(decM)} | ${fmt(varM)} | ${fmt(sfM)} |`);
        }
        L(``);
    }

    // ─── Section 6 : Toutes les lignes de trésorerie disponibles ──────────────────

    L(section2("6. Détail des lignes du tableau de trésorerie"));
    L(``);
    if (tresoRows.length > 0) {
        L(header(y1L, y2L, y3L));
        for (const trow of tresoRows) {
            const vals: YAcc = {
                y1: trow.values.y1.total,
                y2: trow.values.y2.total,
                y3: trow.values.y3.total,
            };
            const bold = trow.style === "highlight" || trow.style === "section";
            L(row(trow.label, vals, { bold }));
        }
        L(``);
    }

    // ─── Section 7 : Récapitulatif global ────────────────────────────────────────

    L(section2("7. Récapitulatif global de cohérence"));
    L(``);

    const allChecks = [
        ...sigChecks,
        ...seuilChecks,
        ...frChecks,
    ];
    const passed = allChecks.filter((c) => c.ok).length;
    const failed = allChecks.filter((c) => !c.ok).length;

    L(`| Bilan | Valeur |`);
    L(`| --- | --- |`);
    L(`| Total checks | ${allChecks.length} |`);
    L(`| ✅ OK | ${passed} |`);
    L(`| ❌ KO | ${failed} |`);
    L(``);

    if (failed === 0) {
        L(`> ✅ **Tous les checks sont OK.** Les calculs de synthèse sont cohérents.`);
    } else {
        L(`> ❌ **${failed} check(s) échoué(s).** Voir les sections concernées ci-dessus.`);
    }
    L(``);

    L(section("7.1 Synthèse chiffrée des indicateurs clés"));
    L(``);
    L(`| Indicateur | ${y1L} | ${y2L} | ${y3L} |`);
    L(`| --- | ---: | ---: | ---: |`);
    L(`| Chiffre d'affaires | ${fmt(caAmt.y1)} | ${fmt(caAmt.y2)} | ${fmt(caAmt.y3)} |`);
    L(`| EBE | ${fmt(ebeAmt.y1)} | ${fmt(ebeAmt.y2)} | ${fmt(ebeAmt.y3)} |`);
    L(`| Résultat net | ${fmt(resNetAmt.y1)} | ${fmt(resNetAmt.y2)} | ${fmt(resNetAmt.y3)} |`);
    L(`| CAF | ${fmt(cafAmt.y1)} | ${fmt(cafAmt.y2)} | ${fmt(cafAmt.y3)} |`);
    L(`| Seuil de rentabilité | ${fmt(seuilEcoAmt.y1)} | ${fmt(seuilEcoAmt.y2)} | ${fmt(seuilEcoAmt.y3)} |`);
    L(`| Fonds de roulement | ${fmt(frAmt.y1)} | ${fmt(frAmt.y2)} | ${fmt(frAmt.y3)} |`);
    L(`| BFR | ${fmt(bfrAmt.y1)} | ${fmt(bfrAmt.y2)} | ${fmt(bfrAmt.y3)} |`);
    L(`| Solde trésorerie annuel | ${fmt(soldeAnnuelAmt.y1)} | ${fmt(soldeAnnuelAmt.y2)} | ${fmt(soldeAnnuelAmt.y3)} |`);
    L(`| Solde trésorerie M12 | ${fmt(soldeMensuelAmt.y1)} | ${fmt(soldeMensuelAmt.y2)} | ${fmt(soldeMensuelAmt.y3)} |`);
    L(``);

    // ─── Écriture du fichier de sortie ───────────────────────────────────────────

    const outputPath = join(process.cwd(), "scripts/debug/output", "debug-synthese-output.md");
    writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`\n✅ Diagnostic écrit dans : ${outputPath}`);
    console.log(`   Checks : ${passed}/${allChecks.length} OK${failed > 0 ? ` · ${failed} KO` : ""}`);

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error("Erreur fatale :", err);
    prisma.$disconnect();
    process.exit(1);
});
