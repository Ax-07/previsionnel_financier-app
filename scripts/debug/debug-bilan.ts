/**
 * Script de diagnostic du bilan prévisionnel.
 *
 * Usage :
 *   pnpm tsx scripts/debug-bilan.ts <dossierId>
 *
 * Produit : scripts/debug-bilan-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildBilanRows, calcBfr, buildFinCalc) — les résultats doivent être identiques
 * à ce qui est affiché à l'écran.
 */

// Charger les variables d'environnement (.env / .env.local) avant tout import Prisma
import "dotenv/config";

import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  calcImmosBilan,
  calcApportsCumulatifs,
  calcEmpruntsPassif,
} from "@/lib/finance/calculs/bilan";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import { buildTemporelCtx } from "@/lib/finance/pipeline/calendar";
import { calcEncaissements } from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { subSeries } from "@/lib/finance/calculs/monthly";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };
/** Somme les 12 valeurs mensuelles d'une série. */
const sumSerie = (s: readonly number[]) => s.reduce((a, b) => a + (b ?? 0), 0);

function row(
  label: string,
  v: YAcc,
  { note, bold }: { note?: string; bold?: boolean } = {},
): string {
  const prefix = bold ? "**" : "";
  const suffix = bold ? "**" : "";
  return `| ${prefix}${label}${suffix} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |${note ? ` *${note}*` : ""}`;
}
function sep(): string {
  return `| --- | ---: | ---: | ---: |`;
}
function header(y1: string, y2: string, y3: string): string {
  return `| Désignation | ${y1} | ${y2} | ${y3} |\n${sep()}`;
}
// 4-column variants (avec colonne Initial / y0)
type YAcc4H = { y0: number; y1: number; y2: number; y3: number };
function row4(
  label: string,
  v: YAcc4H,
  { note, bold }: { note?: string; bold?: boolean } = {},
): string {
  const p = bold ? "**" : "";
  return `| ${p}${label}${p} | ${fmt(v.y0)} | ${fmt(v.y1)} | ${fmt(v.y2)} | ${fmt(v.y3)} |${note ? ` *${note}*` : ""}`;
}
function sep4(): string {
  return `| --- | ---: | ---: | ---: | ---: |`;
}
function header4(y1: string, y2: string, y3: string): string {
  return `| Désignation | Initial | ${y1} | ${y2} | ${y3} |\n${sep4()}`;
}
function section(title: string): string {
  return `\n### ${title}\n`;
}
function section2(title: string): string {
  return `\n## ${title}\n`;
}
/** Labels de mois courts en français */
const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-bilan.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const {
    dateDemarrage: dateDemarrageDate,
    apports,
    emprunts,
    immobilisations,
  } = data;

  const immobilisationsActives = immobilisations.filter((i) => i.actif !== false);
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth();

  // Bornes d'exercice (identique à makeExerciceHelpers)
  const exBorne1 = new Date(anneeDebut + 1, moisDebut, 1);
  const exBorne2 = new Date(anneeDebut + 2, moisDebut, 1);
  const exBorne3 = new Date(anneeDebut + 3, moisDebut, 1);

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const bilan = buildBilanRows(data, fc);   // même fonction que l'app
  const bfr = calcBfr(data, fc);            // même fonction que l'app

  const y1L = bilan.yearLabels.y1;
  const y2L = bilan.yearLabels.y2;
  const y3L = bilan.yearLabels.y3;

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Bilan — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildBilanRows\` · \`calcBfr\` · \`buildFinCalc\``);
  L(``);
  L(`Exercices : **${y1L}** · **${y2L}** · **${y3L}**`);
  L(``);

  // ── 0. DONNÉES SAISIES ─────────────────────────────────────────────────────
  L(section2("Données saisies"));
  L(`> Snapshot de toutes les hypothèses saisies — données brutes stockées en base. \`✅\` = actif · \`❌\` = inactif`);
  L(``);
  const moisLabels0 = Array.from({length: 12}, (_, i) => MOIS_COURTS[(moisDebut + i) % 12]);

  // Paramètres généraux
  {
    const par0 = data.scenario.parametres;
    L(`### Paramètres généraux`);
    L(``);
    L(`| Paramètre | Valeur |`);
    L(`| --- | --- |`);
    L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
    L(`| Durée projection | ${data.dureeProjection} exercices |`);
    L(`| Régime fiscal | \`${par0?.regimeFiscal ?? "IS"}\` |`);
    L(`| Taux IS normal | ${par0?.tauxIs ?? "—"} % |`);
    L(`| Taux IS réduit | ${par0?.tauxIsReduit ?? "—"} % · Plafond : ${par0?.plafondIsReduit != null ? fmt(n(par0.plafondIsReduit)) : "—"} € |`);
    L(`| Régime TVA | \`${par0?.regimeTVA ?? "REEL_NORMAL"}\` |`);
    L(`| Périodicité TVA | \`${par0?.periodiciteDeclarationTVA ?? "MENSUEL"}\` |`);
    L(`| Taux TVA standard | ${par0?.tauxTvaStandard ?? 20} % |`);
    L(`| Mois paiement salaires | ${par0?.moisPaiementSalaires ?? 1} |`);
    L(`| Régime social TNS | \`${par0?.tnsRegimeSocial ?? "—"}\` |`);
    L(`| Mode calcul TNS | \`${par0?.tnsModeCalcul ?? "—"}\` |`);
    L(``);
  }

  // Activités
  {
    L(`### Activités`);
    L(``);
    const acts0 = data.activites;
    if (acts0.length === 0) {
      L(`> *(aucune)*`);
    } else {
      L(`| ✓ | Libellé | Type | TVA CA | Tx marge | TVA ach. | Stock j | Cli. j | Fourn. j | CA N | CA N+1 | CA N+2 |`);
      L(`| :---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
      for (const a of acts0) {
        const ok = a.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${a.libelle} | ${a.typeActivite} | ${n(a.tauxTVA)} % | ${n(a.tauxMarge)} % | ${n(a.tvaAchats)} % | ${a.stocks ?? 0} | ${a.reglementClients ?? 0} | ${a.reglementFournisseurs ?? 0} | ${fmt(n(a.montantN))} | ${fmt(n(a.montantN1))} | ${fmt(n(a.montantN2))} |`);
      }
      L(``);
      // Saisonnalité CA détaillée pour les activités non-uniformes
      const isUniform = (pcts: number[]) => pcts.slice(0, 12).every(p => Math.abs(p - 100 / 12) < 0.6);
      const actsAvecSaison = acts0.filter(a => {
        if (!a.saisonnaliteCA) return false;
        const raw = a.saisonnaliteCA as Record<string, number[]>;
        const pcts = raw["N"] ?? raw["N1"] ?? raw["N2"];
        return Array.isArray(pcts) && pcts.length >= 12 && !isUniform(pcts as number[]);
      });
      if (actsAvecSaison.length > 0) {
        L(`#### Saisonnalité CA (activités non-uniformes)`);
        L(``);
        const hdrS = `| Exercice | ${moisLabels0.join(" | ")} | **Total** |`;
        const sepS = `| :--- | ${Array(12).fill("---:").join(" | ")} | ---: |`;
        for (const a of actsAvecSaison) {
          L(`**${a.libelle}**`);
          L(``);
          L(hdrS);
          L(sepS);
          const raw = a.saisonnaliteCA as Record<string, number[]>;
          for (const [key, label, montant] of [
            ["N",  y1L, n(a.montantN)],
            ["N1", y2L, n(a.montantN1)],
            ["N2", y3L, n(a.montantN2)],
          ] as [string, string, number][]) {
            const pcts = raw[key];
            if (Array.isArray(pcts) && pcts.length >= 12) {
              const cells = (pcts as number[]).slice(0, 12).map(p => `${p.toFixed(1)} %`);
              const tot = (pcts as number[]).slice(0, 12).reduce((s, p) => s + p, 0);
              L(`| ${label} % | ${cells.join(" | ")} | **${tot.toFixed(1)} %** |`);
              const mts = (pcts as number[]).slice(0, 12).map(p => fmt(montant * p / 100));
              const sumMts = (pcts as number[]).slice(0, 12).reduce((s, p) => s + montant * p / 100, 0);
              L(`| ${label} € | ${mts.join(" | ")} | **${fmt(sumMts)}** |`);
            }
          }
          L(``);
        }
      }
    }
    L(``);
  }

  // Commissions sur activités
  if (data.activiteCommissions.length > 0) {
    L(`### Commissions sur activités`);
    L(``);
    L(`| ✓ | Libellé | Taux comm. | TVA comm. | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: | ---: | ---: |`);
    for (const c of data.activiteCommissions) {
      const ok = c.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${c.libelle} | ${n(c.tauxCommission)} % | ${n(c.tvaCommission)} % | ${fmt(n(c.montantN))} | ${fmt(n(c.montantN1))} | ${fmt(n(c.montantN2))} |`);
    }
    L(``);
  }

  // Subventions d'exploitation
  if (data.subventionsExploitation.length > 0) {
    L(`### Subventions d'exploitation`);
    L(``);
    L(`| ✓ | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
    L(`| :---: | --- | --- | ---: | --- | ---: | --- | ---: |`);
    for (const s of data.subventionsExploitation) {
      const ok = s.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${s.libelle} | ${s.dateN ?? "—"} | ${fmt(n(s.montantN))} | ${s.dateN1 ?? "—"} | ${fmt(n(s.montantN1))} | ${s.dateN2 ?? "—"} | ${fmt(n(s.montantN2))} |`);
    }
    L(``);
  }

  // Productions immobilisées
  if (data.productionsImmobilisees.length > 0) {
    L(`### Productions immobilisées`);
    L(``);
    L(`| ✓ | Libellé | Nature | Amort. | Durée | Différé | Date | Montant |`);
    L(`| :---: | --- | --- | --- | ---: | ---: | --- | ---: |`);
    for (const p of data.productionsImmobilisees) {
      const ok = p.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${p.libelle} | ${p.nature} | ${p.amortissement} | ${p.duree ?? 0} ans | ${p.differe ?? 0} mois | ${p.date || "—"} | ${fmt(n(p.montant))} |`);
    }
    L(``);
  }

  // Charges d'exploitation (fournitures + services)
  {
    const allChargesExpl = [...data.fournitures, ...data.services];
    L(`### Charges d'exploitation`);
    L(``);
    if (allChargesExpl.length === 0) {
      L(`> *(aucune)*`);
    } else {
      L(`| ✓ | Libellé | Catégorie | Fréq. | Délai j | TVA % | N | N+1 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |`);
      for (const c of allChargesExpl) {
        const ok = c.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${c.libelle} | ${c.categorie} | ${c.frequence} | ${c.delaiReglement} | ${n(c.tauxTVA)} % | ${fmt(n(c.montantN))} | ${fmt(n(c.montantN1))} | ${fmt(n(c.montantN2))} |`);
      }
      L(``);
      // Détail saisonnalité pour les charges PERSONNALISEE ou mode POURCENTAGE_CA
      const chargesPersonnalisees = allChargesExpl.filter(c => {
        if (c.frequence === "PERSONNALISEE") return true;
        const dc = c.detailCalc as Record<string, unknown> | null;
        return dc?.["modeCalc"] === "POURCENTAGE_CA";
      });
      if (chargesPersonnalisees.length > 0) {
        L(`#### Détail saisonnalité charges personnalisées`);
        L(``);
        const hdrS = `| Exercice | ${moisLabels0.join(" | ")} | **Total** |`;
        const sepS = `| :--- | ${Array(12).fill("---:").join(" | ")} | ---: |`;
        for (const c of chargesPersonnalisees) {
          const detail = c.detailCalc as Record<string, unknown> | null;
          const saison = detail?.["saisonnaliteCA"] as Record<string, number[]> | null | undefined;
          L(`**${c.libelle}** *(${c.frequence})*`);
          L(``);
          if (saison && typeof saison === "object") {
            L(hdrS);
            L(sepS);
            for (const [key, label, montant] of [
              ["N",  y1L, n(c.montantN)],
              ["N1", y2L, n(c.montantN1)],
              ["N2", y3L, n(c.montantN2)],
            ] as [string, string, number][]) {
              const pcts = saison[key];
              if (Array.isArray(pcts) && pcts.length >= 12) {
                const cells = (pcts as number[]).slice(0, 12).map(p => `${p.toFixed(1)} %`);
                const tot = (pcts as number[]).slice(0, 12).reduce((s, p) => s + p, 0);
                L(`| ${label} % | ${cells.join(" | ")} | **${tot.toFixed(1)} %** |`);
                const mts = (pcts as number[]).slice(0, 12).map(p => fmt(montant * p / 100));
                const sumMts = (pcts as number[]).slice(0, 12).reduce((s, p) => s + montant * p / 100, 0);
                L(`| ${label} € | ${mts.join(" | ")} | **${fmt(sumMts)}** |`);
              }
            }
          } else {
            L(`> *Fréquence PERSONNALISEE sans saisonnalité définie — répartition uniforme appliquée.*`);
            L(`> N : ${fmt(n(c.montantN))} · N+1 : ${fmt(n(c.montantN1))} · N+2 : ${fmt(n(c.montantN2))}`);
          }
          L(``);
        }
      }
    }
    L(``);
  }

  // Impôts et taxes
  {
    L(`### Impôts et taxes`);
    L(``);
    if (data.impotsTaxes.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| ✓ | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const t of data.impotsTaxes) {
        const ok = t.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${t.libelle} | ${t.dateN ?? "—"} | ${fmt(n(t.montantN))} | ${t.dateN1 ?? "—"} | ${fmt(n(t.montantN1))} | ${t.dateN2 ?? "—"} | ${fmt(n(t.montantN2))} |`);
      }
    }
    L(``);
  }

  // Personnel — salariés
  {
    L(`### Personnel — Salariés`);
    L(``);
    if (data.salaries.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| ✓ | Libellé | Brut N | Évo N+1 | Brut N+1 | Évo N+2 | Brut N+2 | Cot. sal. % | Cot. pat. % | Coût N | Coût N+1 | Coût N+2 | Taux fixe | Commis. | Prime | CP |`);
      L(`| :---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: | :---: | :---: |`);
      for (const s of data.salaries) {
        const ok = s.actif !== false ? "✅" : "❌";
        const cp = n(s.tauxCotPat) / 100;
        const mn = n(s.montantN); const mn1 = n(s.montantN1); const mn2 = n(s.montantN2);
        const evo1 = `${n(s.evolutionN1)} %`; const evo2 = `${n(s.evolutionN2)} %`;
        const tf = `${n(s.tauxFixe)} %`;
        const comm = (s as Record<string, unknown>)["hasCommission"] ? "✅" : "—";
        const prime = (s as Record<string, unknown>)["hasPrime"] ? "✅" : "—";
        const cp2 = (s as Record<string, unknown>)["cotisationConges"] ? "✅" : "—";
        L(`| ${ok} | ${s.libelle} | ${fmt(mn)} | ${evo1} | ${fmt(mn1)} | ${evo2} | ${fmt(mn2)} | ${n(s.tauxCotSal)} % | ${n(s.tauxCotPat)} % | ${fmt(mn * (1 + cp))} | ${fmt(mn1 * (1 + cp))} | ${fmt(mn2 * (1 + cp))} | ${tf} | ${comm} | ${prime} | ${cp2} |`);
      }
      L(``);

      // Détail mensuel par salarié
      type DetailMensuel = { effectif: number[]; brutIndividuel: number[] };
      function parseDetail(json: unknown): DetailMensuel | null {
        if (!json || typeof json !== "object") return null;
        const obj = json as Record<string, unknown>;
        if (!Array.isArray(obj["effectif"]) || !Array.isArray(obj["brutIndividuel"])) return null;
        if ((obj["effectif"] as unknown[]).length < 12 || (obj["brutIndividuel"] as unknown[]).length < 12) return null;
        return { effectif: obj["effectif"] as number[], brutIndividuel: obj["brutIndividuel"] as number[] };
      }
      const salAvecDetail = data.salaries.filter(s => {
        const r = s as Record<string, unknown>;
        return parseDetail(r["detailMensuelN"]) || parseDetail(r["detailMensuelN1"]) || parseDetail(r["detailMensuelN2"]);
      });
      if (salAvecDetail.length > 0) {
        L(`#### Détail mensuel salariés`);
        L(``);
        const hdrM = `| Exercice | ${moisLabels0.join(" | ")} | **Total** |`;
        const sepM = `| :--- | ${Array(12).fill("---:").join(" | ")} | ---: |`;
        for (const s of salAvecDetail) {
          const r = s as Record<string, unknown>;
          L(`**${s.libelle}** *(brut annuel N : ${fmt(n(s.montantN))} — coût N : ${fmt(n(s.montantN) * (1 + n(s.tauxCotPat) / 100))})*`);
          L(hdrM); L(sepM);
          for (const [key, label, montant] of [
            ["detailMensuelN",  y1L, n(s.montantN)],
            ["detailMensuelN1", y2L, n(s.montantN1)],
            ["detailMensuelN2", y3L, n(s.montantN2)],
          ] as [string, string, number][]) {
            const d = parseDetail(r[key]);
            if (d) {
              // Pivoter selon moisDebut (calendaire → relatif exercice)
              const eff   = Array.from({length: 12}, (_, i) => d.effectif[(moisDebut + i) % 12]!);
              const brut  = Array.from({length: 12}, (_, i) => d.brutIndividuel[(moisDebut + i) % 12]!);
              const total = Array.from({length: 12}, (_, i) => eff[i]! * brut[i]!);
              const sumTotal = total.reduce((a, b) => a + b, 0);
              const multiEff = eff.some(e => e > 1);
              if (multiEff) {
                L(`| ${label} Eff. | ${eff.map(e => e.toFixed(0)).join(" | ")} | **${eff.reduce((a,b) => a+b,0).toFixed(0)}** |`);
              }
              L(`| ${label} Brut/pers. | ${brut.map(b => fmt(b)).join(" | ")} | **—** |`);
              L(`| ${label} Brut total | ${total.map(t => fmt(t)).join(" | ")} | **${fmt(sumTotal)}** |`);
              // Vérif cohérence vs montantN
              const ecart = Math.abs(sumTotal - montant);
              if (ecart > 1 && montant > 0) {
                L(`> ⚠️ Écart détail/annuel : ${fmt(sumTotal)} vs ${fmt(montant)} (Δ ${fmt(ecart)})`);
              }
            } else {
              L(`| ${label} | *(répartition uniforme — ${fmt(montant / 12)}/mois)* | | | | | | | | | | | | **${fmt(montant)}** |`);
            }
          }
          L(``);
        }
      }
    }
    L(``);
  }

  // Personnel — dirigeants
  {
    L(`### Personnel — Dirigeants`);
    L(``);
    if (data.dirigeants.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| ✓ | Libellé | Rémunération N | N+1 | N+2 |`);
      L(`| :---: | --- | ---: | ---: | ---: |`);
      for (const d of data.dirigeants) {
        const ok = d.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${d.libelle} | ${fmt(n(d.montantN))} | ${fmt(n(d.montantN1))} | ${fmt(n(d.montantN2))} |`);
      }
    }
    L(``);
  }

  // Personnel — cotisations TNS
  if (data.cotisationsTNS.length > 0) {
    L(`### Personnel — Cotisations TNS`);
    L(``);
    L(`| ✓ | Libellé | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: |`);
    for (const c of data.cotisationsTNS) {
      const ok = c.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${c.libelle} | ${fmt(n(c.montantN))} | ${fmt(n(c.montantN1))} | ${fmt(n(c.montantN2))} |`);
    }
    L(``);
  }

  // Personnel — taxes sur salaires
  if (data.taxesSalaires.length > 0) {
    L(`### Personnel — Taxes sur salaires`);
    L(``);
    L(`| ✓ | Libellé | Taux % | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: | ---: |`);
    for (const t of data.taxesSalaires) {
      const ok = t.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${t.libelle} | ${n(t.taux)} % | ${fmt(n(t.montantN))} | ${fmt(n(t.montantN1))} | ${fmt(n(t.montantN2))} |`);
    }
    L(``);
  }

  // Immobilisations
  {
    L(`### Immobilisations`);
    L(``);
    if (immobilisations.length === 0) {
      L(`> *(aucune)*`);
    } else {
      L(`| ✓ | Libellé | Nature | Mode amort. | Date acq. | Montant HT | TVA % | Durée | Différé |`);
      L(`| :---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: |`);
      for (const i of immobilisations) {
        const ok = i.actif !== false ? "✅" : "❌";
        const dAcq = new Date(String(i.dateAcquisition)).toLocaleDateString("fr-FR");
        L(`| ${ok} | ${i.libelle} | ${i.nature} | ${i.modeAmortissement ?? "LINEAIRE"} | ${dAcq} | ${fmt(n(i.montantHT))} | ${n(i.tauxTVA)} % | ${i.dureeAmortissement ?? 0} ans | ${i.differe ?? 0} mois |`);
      }
    }
    L(``);
  }

  // Provisions / dotations
  if (data.provisions.length > 0) {
    L(`### Autres charges — Provisions / dotations`);
    L(``);
    L(`| ✓ | Libellé | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: |`);
    for (const p of data.provisions) {
      const ok = p.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${p.libelle} | ${fmt(n(p.montantN))} | ${fmt(n(p.montantN1))} | ${fmt(n(p.montantN2))} |`);
    }
    L(``);
  }

  // Autres charges datées (gestion courante + financières + exceptionnelles)
  {
    const allAutresCharges0 = [
      ...data.chargesGestionCourante.map((c) => ({ ...c, _cat: "Gestion courante" })),
      ...data.chargesFinancieres.map((c) => ({ ...c, _cat: "Financière" })),
      ...data.chargesExceptionnelles.map((c) => ({ ...c, _cat: "Exceptionnelle" })),
    ];
    if (allAutresCharges0.length > 0) {
      L(`### Autres charges datées`);
      L(``);
      L(`| ✓ | Catégorie | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const c of allAutresCharges0) {
        const ok = c.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${c._cat} | ${c.libelle} | ${c.dateN ?? "—"} | ${fmt(n(c.montantN))} | ${c.dateN1 ?? "—"} | ${fmt(n(c.montantN1))} | ${c.dateN2 ?? "—"} | ${fmt(n(c.montantN2))} |`);
      }
      L(``);
    }
  }

  // Reprises sur provisions
  if (data.reprisesProduits.length > 0) {
    L(`### Autres produits — Reprises sur provisions`);
    L(``);
    L(`| ✓ | Libellé | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: |`);
    for (const r of data.reprisesProduits) {
      const ok = r.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${r.libelle} | ${fmt(n(r.montantN))} | ${fmt(n(r.montantN1))} | ${fmt(n(r.montantN2))} |`);
    }
    L(``);
  }

  // Autres produits datés
  {
    const allAutresProduits0 = [
      ...data.gestionCouranteProduits.map((p) => ({ ...p, _cat: "Gestion courante" })),
      ...data.financiersProduits.map((p) => ({ ...p, _cat: "Financier" })),
      ...data.exceptionnelsProduits.map((p) => ({ ...p, _cat: "Exceptionnel" })),
      ...data.transfertsProduits.map((p) => ({ ...p, _cat: "Transfert de charges" })),
    ];
    if (allAutresProduits0.length > 0) {
      L(`### Autres produits datés`);
      L(``);
      L(`| ✓ | Catégorie | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const p of allAutresProduits0) {
        const ok = p.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${p._cat} | ${p.libelle} | ${p.dateN ?? "—"} | ${fmt(n(p.montantN))} | ${p.dateN1 ?? "—"} | ${fmt(n(p.montantN1))} | ${p.dateN2 ?? "—"} | ${fmt(n(p.montantN2))} |`);
      }
      L(``);
    }
  }

  // Financement — apports
  {
    L(`### Financement — Apports`);
    L(``);
    if (apports.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| Type | Libellé | Montant | Date | Remboursable |`);
      L(`| --- | --- | ---: | --- | :---: |`);
      for (const a of apports) {
        const dApp = new Date(String(a.dateApport)).toLocaleDateString("fr-FR");
        L(`| ${a.type} | ${a.libelle} | ${fmt(n(a.montant))} | ${dApp} | ${a.remboursable ? "✅" : "—"} |`);
      }
    }
    L(``);
  }

  // Financement — emprunts
  {
    L(`### Financement — Emprunts`);
    L(``);
    if (emprunts.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| Libellé | Montant | Taux | Assur. | Durée | Déblocage | Différé | Type |`);
      L(`| --- | ---: | ---: | ---: | ---: | --- | :--- | --- |`);
      for (const e of emprunts) {
        const dDeb = new Date(String(e.dateDéblocage)).toLocaleDateString("fr-FR");
        const differe = e.dureeDiffereEnMois > 0 ? `${e.dureeDiffereEnMois} mois (${e.typeDiffere})` : "—";
        L(`| ${e.libelle} | ${fmt(n(e.montant))} | ${n(e.tauxAnnuel)} % | ${n(e.tauxAssurance)} % | ${e.dureeEnMois} mois | ${dDeb} | ${differe} | ${e.typeEmprunt} |`);
      }
    }
    L(``);
  }

  // Financement — subventions d'investissement
  if (data.subventions.length > 0) {
    L(`### Financement — Subventions d'investissement`);
    L(``);
    L(`| Libellé | Type | Montant | Date obtention | Date encaissement | Imposable |`);
    L(`| --- | --- | ---: | --- | --- | :---: |`);
    for (const s of data.subventions) {
      const dObt = s.dateObtention ? new Date(String(s.dateObtention)).toLocaleDateString("fr-FR") : "—";
      const dEnc = s.dateEncaissement ? new Date(String(s.dateEncaissement)).toLocaleDateString("fr-FR") : "—";
      L(`| ${s.libelle} | ${s.type} | ${fmt(n(s.montant))} | ${dObt} | ${dEnc} | ${s.imposable ? "✅" : "—"} |`);
    }
    L(``);
  }

  // Divers (encaissements + décaissements + remboursements CC)
  {
    const allDivers0 = [
      ...data.diversEncaissements.map((d) => ({ ...d, _type: "Encaissement" })),
      ...data.diversDecaissements.map((d) => ({ ...d, _type: "Décaissement" })),
      ...data.diversRemboursementsCC.map((d) => ({ ...d, _type: "Remb. CC" })),
    ];
    if (allDivers0.length > 0) {
      L(`### Divers`);
      L(``);
      L(`| ✓ | Type | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const d of allDivers0) {
        const ok = d.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${d._type} | ${d.libelle} | ${d.dateN ?? "—"} | ${fmt(n(d.montantN))} | ${d.dateN1 ?? "—"} | ${fmt(n(d.montantN1))} | ${d.dateN2 ?? "—"} | ${fmt(n(d.montantN2))} |`);
      }
      L(``);
    }
  }

  // Ajustements fiscaux
  if (data.ajustementsFiscaux.length > 0) {
    L(`### Ajustements fiscaux`);
    L(``);
    L(`| ✓ | Type | Libellé | N | N+1 | N+2 |`);
    L(`| :---: | --- | --- | ---: | ---: | ---: |`);
    for (const aj of data.ajustementsFiscaux) {
      const ok = aj.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${aj.type} | ${aj.libelle} | ${fmt(n(aj.montantN))} | ${fmt(n(aj.montantN1))} | ${fmt(n(aj.montantN2))} |`);
    }
    L(``);
  }

  // ── 1. BILAN OFFICIEL ──────────────────────────────────────────────────────
  L(section2("Données calculées"));
  L(`> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.`);
  L(``);
  L(section("Bilan officiel (= écran)"));
  L(header(y1L, y2L, y3L));
  for (const r of bilan.rows) {
    const v = r.values;
    const isSectionHeader = r.style === "section";
    if (isSectionHeader) {
      L(`| **${r.label}** | | | |`);
      continue;
    }
    const indent = r.indent ? "\u00a0".repeat(r.indent * 4) : "";
    const bold = r.style === "highlight" || r.style === "subtotal";
    L(row(`${indent}${r.label}`, { y1: v.y1.amount, y2: v.y2.amount, y3: v.y3.amount }, { bold }));
  }
  L(``);

  // ── 2. ÉQUILIBRE ───────────────────────────────────────────────────────────
  L(section("Équilibre du bilan"));
  const eqY1 = bilan.equilibre.y1 ? "✅ Équilibré" : "❌ Déséquilibré";
  const eqY2 = bilan.equilibre.y2 ? "✅ Équilibré" : "❌ Déséquilibré";
  const eqY3 = bilan.equilibre.y3 ? "✅ Équilibré" : "❌ Déséquilibré";
  L(`| Exercice | Statut |`);
  L(`| --- | --- |`);
  L(`| ${y1L} | ${eqY1} |`);
  L(`| ${y2L} | ${eqY2} |`);
  L(`| ${y3L} | ${eqY3} |`);
  L(``);

  // ── 3. BFR DÉTAIL ──────────────────────────────────────────────────────────
  L(section("BFR — Vue d'ensemble (= écran)"));
  L(header4(y1L, y2L, y3L));
  L(row4("Stocks matières", bfr.stocksMatieres));
  L(row4("Créances clients", bfr.creancesClients));
  L(row4("Crédit TVA", bfr.creditTVA));
  L(row4("**= Total Besoins**", bfr.totalBesoins, { bold: true }));
  L(row4("Dettes fournisseurs", bfr.dettesFournisseurs));
  L(row4("Dettes charges ext.", bfr.dettesChargesExternes));
  L(row4("Dettes impôts/taxes", bfr.dettesImpots));
  L(row4("Dettes personnel", bfr.dettesPersonnel));
  L(row4("TVA à payer", bfr.tvaAPayer));
  L(row4("Dettes IS", bfr.dettesIS));
  L(row4("**= Total Ressources**", bfr.totalRessources, { bold: true }));
  L(row4("**= BFR**", bfr.bfr, { bold: true }));
  L(row4("**Variation BFR**", bfr.variationBFR, { bold: true }));
  L(``);

  // ── 4. BFR — Détail achats / stocks par activité ──────────────────────────
  L(section("BFR — Détail Achats / Stocks par activité"));

  // 4a — Paramètres par activité
  L(`#### Paramètres`);
  L(``);
  L(`| Activité | Coef achat | TVA ach. % | Jours stock | Jours fourn. |`);
  L(`| --- | ---: | ---: | ---: | ---: |`);
  for (const r of bfr.achatsRows) {
    L(`| ${r.libelle} | ${r.coef.toFixed(4)} | ${r.tvaAchats} | ${r.joursStock} | ${r.joursFournisseur} |`);
  }
  L(``);

  // 4b — Achats HT consommés + ponctuels par activité
  L(`#### Achats HT consommés + ponctuels`);
  L(``);
  L(`> AchHT = CA × coef. StockInit = ponctuelN[0] → BFR initial (y0). PoncFlux N = ponctuelN[1..11].`);
  L(``);
  {
    const colN  = `${y1L}`;
    const colN1 = `${y2L}`;
    const colN2 = `${y3L}`;
    L(`| Activité | AchHT ${colN} | AchHT ${colN1} | AchHT ${colN2} | StockInit (y0) | PoncFlux ${colN} | PoncFlux ${colN1} | PoncFlux ${colN2} |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
    let totAchN = 0, totAchN1 = 0, totAchN2 = 0;
    let totPoncY0 = 0, totPoncFluxN = 0, totPoncFluxN1 = 0, totPoncFluxN2 = 0;
    for (const r of bfr.achatsRows) {
      const achN  = r.montantN  * r.coef;
      const achN1 = r.montantN1 * r.coef;
      const achN2 = r.montantN2 * r.coef;
      // ponctuelSommeY1 = Σ ponctuelN[0..11] ; hors M1 = somme - stockPonctuelY0
      const poncFluxN  = r.ponctuelSommeY1 - r.stockPonctuelY0;
      const poncFluxN1 = r.ponctuelSommeY2;
      const poncFluxN2 = r.ponctuelSommeY3;
      totAchN   += achN;  totAchN1  += achN1;  totAchN2  += achN2;
      totPoncY0 += r.stockPonctuelY0;
      totPoncFluxN += poncFluxN; totPoncFluxN1 += poncFluxN1; totPoncFluxN2 += poncFluxN2;
      L(`| ${r.libelle} | ${fmt(achN)} | ${fmt(achN1)} | ${fmt(achN2)} | ${fmt(r.stockPonctuelY0)} | ${fmt(poncFluxN)} | ${fmt(poncFluxN1)} | ${fmt(poncFluxN2)} |`);
    }
    L(`| **Total** | **${fmt(totAchN)}** | **${fmt(totAchN1)}** | **${fmt(totAchN2)}** | **${fmt(totPoncY0)}** | **${fmt(totPoncFluxN)}** | **${fmt(totPoncFluxN1)}** | **${fmt(totPoncFluxN2)}** |`);
  }
  L(``);

  // 4c — Stocks & Dettes fournisseurs en fin d'exercice
  L(`#### Stocks fin d'exercice & Dettes fournisseurs`);
  L(``);
  L(`> Stock = achatsConsoHT × joursStock/360 (formule annuelle). DetteFourn = (M12 HT + ΔStock/12) × coefTTC × délaiMois.`);
  L(``);
  {
    L(`| Activité | Stock y0 | Stock ${y1L} | Stock ${y2L} | Stock ${y3L} | DetteFourn ${y1L} | DetteFourn ${y2L} | DetteFourn ${y3L} |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
    let totSy0 = 0, totSy1 = 0, totSy2 = 0, totSy3 = 0;
    let totFy1 = 0, totFy2 = 0, totFy3 = 0;
    for (const r of bfr.achatsRows) {
      totSy0 += r.stockPonctuelY0;
      totSy1 += r.m11StockY1; totSy2 += r.m11StockY2; totSy3 += r.m11StockY3;
      totFy1 += r.m11FournY1; totFy2 += r.m11FournY2; totFy3 += r.m11FournY3;
      L(`| ${r.libelle} | ${fmt(r.stockPonctuelY0)} | ${fmt(r.m11StockY1)} | ${fmt(r.m11StockY2)} | ${fmt(r.m11StockY3)} | ${fmt(r.m11FournY1)} | ${fmt(r.m11FournY2)} | ${fmt(r.m11FournY3)} |`);
    }
    L(`| **Total** | **${fmt(totSy0)}** | **${fmt(totSy1)}** | **${fmt(totSy2)}** | **${fmt(totSy3)}** | **${fmt(totFy1)}** | **${fmt(totFy2)}** | **${fmt(totFy3)}** |`);
    L(`| *BFR stocksMatieres* | *${fmt(bfr.stocksMatieres.y0)}* | *${fmt(bfr.stocksMatieres.y1)}* | *${fmt(bfr.stocksMatieres.y2)}* | *${fmt(bfr.stocksMatieres.y3)}* | | | |`);
    L(`| *BFR dettesFournisseurs* | | *${fmt(bfr.dettesFournisseurs.y1)}* | *${fmt(bfr.dettesFournisseurs.y2)}* | *${fmt(bfr.dettesFournisseurs.y3)}* | | | |`);
  }
  L(``);

  // 4d — TVA déductible achats recalc par activité
  L(`#### TVA déductible achats (recalc par activité)`);
  L(``);
  L(`> TVA déd = (achatsConsoHT + ΔStock) × tvaAchats%.`);
  L(`> ΔStock Y1 = stockFin Y1 − 0 (SI = 0 hors ponctuel). ΔStock Y2 = stockFin Y2 − Y1. etc.`);
  L(`> Comparer le **Total recalc** au **Total moteur TVA** pour détecter les écarts.`);
  L(``);
  {
    L(`| Activité | TVADed ${y1L} | TVADed ${y2L} | TVADed ${y3L} |`);
    L(`| --- | ---: | ---: | ---: |`);
    let totTy1 = 0, totTy2 = 0, totTy3 = 0;
    for (const r of bfr.achatsRows) {
      const taux  = r.tvaAchats / 100;
      const achN  = r.montantN  * r.coef;
      const achN1 = r.montantN1 * r.coef;
      const achN2 = r.montantN2 * r.coef;
      const dSy1  =  r.m11StockY1;                       // ΔStock Y1 (SI = 0 hors ponctuel)
      const dSy2  =  r.m11StockY2 - r.m11StockY1;        // ΔStock Y2
      const dSy3  =  r.m11StockY3 - r.m11StockY2;        // ΔStock Y3
      const tvy1  = (achN  + dSy1) * taux;
      const tvy2  = (achN1 + dSy2) * taux;
      const tvy3  = (achN2 + dSy3) * taux;
      totTy1 += tvy1; totTy2 += tvy2; totTy3 += tvy3;
      L(`| ${r.libelle} | ${fmt(tvy1)} | ${fmt(tvy2)} | ${fmt(tvy3)} |`);
    }
    L(`| **Total recalc** | **${fmt(totTy1)}** | **${fmt(totTy2)}** | **${fmt(totTy3)}** |`);
  }
  L(``);

  // ── 5. BFR — Détail charges externes ──────────────────────────────────────
  L(section("BFR — Détail charges externes"));
  L(`| Libellé | MtN | MtN1 | MtN2 | Délai | TVA% | DetteY1 | DetteY2 | DetteY3 |`);
  L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
  for (const r of bfr.chargesExtRows) {
    L(`| ${r.libelle} | ${fmt(r.montantN)} | ${fmt(r.montantN1)} | ${fmt(r.montantN2)} | ${r.delaiReglement} | ${r.tauxTVA} | ${fmt(r.m11ChargeY1)} | ${fmt(r.m11ChargeY2)} | ${fmt(r.m11ChargeY3)} |`);
  }
  L(``);

  // ── 6. COMPTE DE RÉSULTAT ──────────────────────────────────────────────────
  L(section("Compte de résultat (fc)"));
  L(header(y1L, y2L, y3L));
  L(row("Chiffre d'affaires",                 fc.ca));
  L(row("Subventions",                         fc.subventions));
  L(row("Production immobilisée",              fc.prodImmo));
  L(row("Autres produits",                     fc.autresProdGestion));
  L(row("**= Total produits expl.**",          fc.totalProduitsExpl, { bold: true }));
  L(row("Achats consommés",                    fc.achatsConsommes));
  L(row("Charges externes",                    fc.chargesExternes));
  L(row("Impôts et taxes",                     fc.impotsTaxes));
  L(row("Charges personnel",                   fc.chargesPersonnel.total));
  L(row("Dotations amort.",                    fc.dotationsAmort));
  L(row("Dotations provisions",                fc.dotationsProvisions));
  L(row("Reprises",                            fc.reprises));
  L(row("Autres charges gestion",              fc.autresChargesGestion));
  L(row("**= Résultat exploitation**",         fc.resExpl, { bold: true }));
  L(row("Produits financiers",                 fc.produitsFinanciers));
  const chargesFi: YAcc = { y1: fc.interetsEmprunts.y1 + fc.fraisDossierEmprunts.y1 + fc.autresChargesFinancieres.y1, y2: fc.interetsEmprunts.y2 + fc.fraisDossierEmprunts.y2 + fc.autresChargesFinancieres.y2, y3: fc.interetsEmprunts.y3 + fc.fraisDossierEmprunts.y3 + fc.autresChargesFinancieres.y3 };
  L(row("Charges financières",                 chargesFi));
  L(row("**= Résultat financier**",            fc.resFin, { bold: true }));
  L(row("**= Résultat courant**",              fc.resCourant, { bold: true }));
  L(row("Résultat exceptionnel",               fc.resExcep));
  L(row("Ajustement net",                      fc.ajustementNet));
  L(row("− IS",                                fc.isParAnnee));
  L(row("**= Résultat net**",                  fc.resNet, { bold: true }));
  L(``);

  // Vérification cohérence CR
  const totalChargesExpl: YAcc = {
    y1: fc.achatsConsommes.y1 + fc.chargesExternes.y1 + fc.impotsTaxes.y1 + fc.chargesPersonnel.total.y1 + fc.dotationsAmort.y1 + fc.dotationsProvisions.y1 - fc.reprises.y1 + fc.autresChargesGestion.y1,
    y2: fc.achatsConsommes.y2 + fc.chargesExternes.y2 + fc.impotsTaxes.y2 + fc.chargesPersonnel.total.y2 + fc.dotationsAmort.y2 + fc.dotationsProvisions.y2 - fc.reprises.y2 + fc.autresChargesGestion.y2,
    y3: fc.achatsConsommes.y3 + fc.chargesExternes.y3 + fc.impotsTaxes.y3 + fc.chargesPersonnel.total.y3 + fc.dotationsAmort.y3 + fc.dotationsProvisions.y3 - fc.reprises.y3 + fc.autresChargesGestion.y3,
  };
  const resExplRecalc: YAcc = {
    y1: fc.totalProduitsExpl.y1 - totalChargesExpl.y1,
    y2: fc.totalProduitsExpl.y2 - totalChargesExpl.y2,
    y3: fc.totalProduitsExpl.y3 - totalChargesExpl.y3,
  };
  const resExplEcart: YAcc = {
    y1: fc.resExpl.y1 - resExplRecalc.y1,
    y2: fc.resExpl.y2 - resExplRecalc.y2,
    y3: fc.resExpl.y3 - resExplRecalc.y3,
  };
  L(section("Vérification compte de résultat"));
  L(header(y1L, y2L, y3L));
  L(row("ResExpl (fc)",                        fc.resExpl));
  L(row("ResExpl recalculé (Prod − Charges)",  resExplRecalc));
  L(row("Écart ResExpl",                       resExplEcart,
    { note: eq(resExplEcart.y1, 0) && eq(resExplEcart.y2, 0) && eq(resExplEcart.y3, 0) ? "✅" : "❌ ÉCART" }));
  L(row("ResNet (fc)",                         fc.resNet));
  L(``);

  // ── 7. DOTATIONS AMORTISSEMENT ─────────────────────────────────────────────
  L(section("Détail dotations amortissement (par immobilisation)"));
  L(`> Méthode : \`distribuerAmortParExercice\` — respecte AUCUN / LINEAIRE / DEGRESSIF.`);
  L(``);
  L(`| Libellé | Mode | Durée | Montant HT | Dot Y1 | Dot Y2 | Dot Y3 |`);
  L(`| --- | --- | ---: | ---: | ---: | ---: | ---: |`);
  const dotAmortManuel: YAcc = { ...zero };
  for (const immo of immobilisationsActives) {
    const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const mode = String(immo.modeAmortissement ?? "LINEAIRE");
    const dur  = n(immo.dureeAmortissement);
    const montant = n(immo.montantHT);
    dotAmortManuel.y1 += dot.y1;
    dotAmortManuel.y2 += dot.y2;
    dotAmortManuel.y3 += dot.y3;
    L(`| ${immo.libelle} | ${mode} | ${dur} | ${fmt(montant)} | ${fmt(dot.y1)} | ${fmt(dot.y2)} | ${fmt(dot.y3)} |`);
  }
  L(``);
  L(section("Cohérence dotations amort (distribuerAmortParExercice vs fc.dotationsAmort)"));
  L(header(y1L, y2L, y3L));
  const ecartDotAmort: YAcc = {
    y1: dotAmortManuel.y1 - fc.dotationsAmort.y1,
    y2: dotAmortManuel.y2 - fc.dotationsAmort.y2,
    y3: dotAmortManuel.y3 - fc.dotationsAmort.y3,
  };
  L(row("Σ distribuerAmort",                   dotAmortManuel));
  L(row("fc.dotationsAmort",                   fc.dotationsAmort));
  L(row("Écart",                               ecartDotAmort,
    { note: eq(ecartDotAmort.y1, 0) && eq(ecartDotAmort.y2, 0) && eq(ecartDotAmort.y3, 0)
        ? "✅ Cohérent"
        : "❌ DIVERGENCE" }));
  L(``);

  // ── 8. DÉTAIL IMMOBILISATIONS ──────────────────────────────────────────────
  L(section("Détail immobilisations actives"));
  L(`| Libellé | Nature | Date acq. | Montant HT | Durée | Actif |`);
  L(`| --- | --- | --- | ---: | ---: | --- |`);
  for (const immo of immobilisationsActives) {
    const dAcq = new Date(String(immo.dateAcquisition)).toLocaleDateString("fr-FR");
    L(`| ${immo.libelle} | ${immo.nature} | ${dAcq} | ${fmt(n(immo.montantHT))} | ${immo.dureeAmortissement ?? "—"} | ${immo.actif !== false ? "oui" : "non"} |`);
  }
  L(``);

  // ── 9. DÉTAIL EMPRUNTS ─────────────────────────────────────────────────────
  L(section("Détail emprunts"));
  L(`| Libellé | Montant initial | Date déblocage | Capital restant fin Y1 | fin Y2 | fin Y3 |`);
  L(`| --- | ---: | --- | ---: | ---: | ---: |`);
  for (const emprunt of emprunts) {
    const totalCapital = n(emprunt.montant);
    let rY1 = 0, rY2 = 0, rY3 = 0;
    for (const l of emprunt.lignesEcheancier) {
      const dl = new Date(String(l.dateEcheance));
      const cap = n(l.capitalRembourse);
      if (dl < exBorne1) rY1 += cap;
      if (dl < exBorne2) rY2 += cap;
      if (dl < exBorne3) rY3 += cap;
    }
    const dDeb = new Date(String(emprunt.dateDéblocage)).toLocaleDateString("fr-FR");
    L(`| ${emprunt.libelle} | ${fmt(totalCapital)} | ${dDeb} | ${fmt(Math.max(0, totalCapital - rY1))} | ${fmt(Math.max(0, totalCapital - rY2))} | ${fmt(Math.max(0, totalCapital - rY3))} |`);
  }
  L(``);

  // ── 11. TRÉSORERIE — COMPARAISON BILAN vs TABLEAU MENSUEL ──────────────────
  L(section("Trésorerie — Comparaison Bilan vs Tableau mensuel"));
  L(`> **But :** identifier pourquoi \`Disponibilités (bilan)\` peut différer du \`Solde fin (tableau mensuel)\`.`);
  L(`>`);
  L(`> - **Tableau mensuel** : cumule les flux TTC mois par mois (encaissements TTC − décaissements TTC).`);
  L(`> - **Bilan** : reconstruit la tréso via la formule économique : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes.`);
  L(`>`);
  L(`> Les deux doivent être égaux si les hypothèses sont cohérentes. Un écart signale une divergence de modélisation.`);
  L(``);

  // ── A. Tableau de trésorerie (calcul mensuel) ─────────────────────────────
  const regimeTVA = data.scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";
  const moisPaiement = data.scenario.parametres?.moisPaiementSalaires ?? 1;
  const ctx = buildTemporelCtx(dateDemarrageDate, isFranchise);
  const enc = calcEncaissements(data, ctx);
  const dec = calcDecaissements(data, ctx, moisPaiement, fc.isParAnnee, fc.tva);

  const varY1 = subSeries(enc.totalEnc.y1, dec.totalDec.y1);
  const varY2 = subSeries(enc.totalEnc.y2, dec.totalDec.y2);
  const varY3 = subSeries(enc.totalEnc.y3, dec.totalDec.y3);
  const y1Sol = computeSoldeMonthly(varY1, 0);
  const y2Sol = computeSoldeMonthly(varY2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(varY3, y2Sol.soldeFinal[11] ?? 0);

  const tresoTab: YAcc = {
    y1: y1Sol.soldeFinal[11] ?? 0,
    y2: y2Sol.soldeFinal[11] ?? 0,
    y3: y3Sol.soldeFinal[11] ?? 0,
  };

  const encTotal: YAcc = { y1: sumSerie(enc.totalEnc.y1), y2: sumSerie(enc.totalEnc.y2), y3: sumSerie(enc.totalEnc.y3) };
  const decTotal: YAcc = { y1: sumSerie(dec.totalDec.y1), y2: sumSerie(dec.totalDec.y2), y3: sumSerie(dec.totalDec.y3) };
  const varAnnuelle: YAcc = { y1: sumSerie(varY1), y2: sumSerie(varY2), y3: sumSerie(varY3) };
  const soldeDebutTab: YAcc = { y1: 0, y2: tresoTab.y1, y3: tresoTab.y2 };

  L(`#### A — Tableau de trésorerie (flux mensuels TTC)`);
  L(header(y1L, y2L, y3L));
  L(row("Enc. apports capital",
    { y1: sumSerie(enc.encApportsCapital.y1), y2: sumSerie(enc.encApportsCapital.y2), y3: sumSerie(enc.encApportsCapital.y3) }));
  L(row("Enc. apports CC",
    { y1: sumSerie(enc.encApportsCC.y1), y2: sumSerie(enc.encApportsCC.y2), y3: sumSerie(enc.encApportsCC.y3) }));
  L(row("Enc. emprunts débloqués",
    { y1: sumSerie(enc.encEmprunts.y1), y2: sumSerie(enc.encEmprunts.y2), y3: sumSerie(enc.encEmprunts.y3) }));
  L(row("Enc. production vendue (TTC)",
    { y1: sumSerie(enc.encProdVendue.y1), y2: sumSerie(enc.encProdVendue.y2), y3: sumSerie(enc.encProdVendue.y3) }));
  L(row("Enc. subventions exploitation",
    { y1: sumSerie(enc.encSubvExpl.y1), y2: sumSerie(enc.encSubvExpl.y2), y3: sumSerie(enc.encSubvExpl.y3) }));
  L(row("Enc. subventions investissement",
    { y1: sumSerie(enc.encSubvInvest.y1), y2: sumSerie(enc.encSubvInvest.y2), y3: sumSerie(enc.encSubvInvest.y3) }));
  L(row("Enc. divers",
    { y1: sumSerie(enc.encDivers.y1), y2: sumSerie(enc.encDivers.y2), y3: sumSerie(enc.encDivers.y3) }));
  L(row("**= Total encaissements**", encTotal, { bold: true }));
  L(row("Dec. immobilisations (TTC)",
    { y1: sumSerie(dec.decImmoTTC.y1), y2: sumSerie(dec.decImmoTTC.y2), y3: sumSerie(dec.decImmoTTC.y3) }));
  L(row("Dec. emprunts (capital + intérêts + frais)",
    { y1: sumSerie(dec.decEmprunts.y1), y2: sumSerie(dec.decEmprunts.y2), y3: sumSerie(dec.decEmprunts.y3) }));
  L(row("Dec. achats",
    { y1: sumSerie(dec.decAchats.y1), y2: sumSerie(dec.decAchats.y2), y3: sumSerie(dec.decAchats.y3) }));
  L(row("Dec. charges externes",
    { y1: sumSerie(dec.decChargesExt.y1), y2: sumSerie(dec.decChargesExt.y2), y3: sumSerie(dec.decChargesExt.y3) }));
  L(row("Dec. impôts et taxes",
    { y1: sumSerie(dec.decImpots.y1), y2: sumSerie(dec.decImpots.y2), y3: sumSerie(dec.decImpots.y3) }));
  L(row("Dec. personnel",
    { y1: sumSerie(dec.decPersonnel.y1), y2: sumSerie(dec.decPersonnel.y2), y3: sumSerie(dec.decPersonnel.y3) }));
  L(row("Dec. TVA nette (collectée − déductible)",
    { y1: sumSerie(dec.decTVA.y1), y2: sumSerie(dec.decTVA.y2), y3: sumSerie(dec.decTVA.y3) }));
  L(row("Dec. IS",
    { y1: sumSerie(dec.decIS.y1), y2: sumSerie(dec.decIS.y2), y3: sumSerie(dec.decIS.y3) }));
  L(row("Dec. divers",
    { y1: sumSerie(dec.decDivers.y1), y2: sumSerie(dec.decDivers.y2), y3: sumSerie(dec.decDivers.y3) }));
  L(row("**= Total décaissements**", decTotal, { bold: true }));
  L(row("Solde début d'exercice", soldeDebutTab));
  L(row("Variation nette (enc − dec)", varAnnuelle));
  L(row("**= Solde fin d'exercice (soldeFinal[11])**", tresoTab, { bold: true }));
  L(``);

  // ── B. Trésorerie bilan (formule cumulative) ──────────────────────────────
  const bilanImmos = calcImmosBilan(data, anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3, fc.dotationsParImmoAcc);
  const { apportsCapital: apCap, apportsCC: apCC } = calcApportsCumulatifs(data, exBorne1, exBorne2, exBorne3);
  const { empruntsDebloques: empDeb, remboursementsCumul: rembCumul } = calcEmpruntsPassif(data, exBorne1, exBorne2, exBorne3);

  const bfrBesoins: YAcc = {
    y1: bfr.stocksMatieres.y1 + bfr.creditTVA.y1 + bfr.creancesClients.y1,
    y2: bfr.stocksMatieres.y2 + bfr.creditTVA.y2 + bfr.creancesClients.y2,
    y3: bfr.stocksMatieres.y3 + bfr.creditTVA.y3 + bfr.creancesClients.y3,
  };
  const bfrRessources: YAcc = { y1: bfr.totalRessources.y1, y2: bfr.totalRessources.y2, y3: bfr.totalRessources.y3 };

  // Flux non-P&L cumulatifs (subventions hors prêt honneur + divers)
  const encNonPL: YAcc = { ...zero };
  const decNonPL: YAcc = { ...zero };
  for (const subv of data.subventions) {
    if (subv.type === "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (!d) continue;
    const dt = new Date(String(d));
    const m = n(subv.montant);
    if (dt < exBorne1) encNonPL.y1 += m;
    if (dt < exBorne2) encNonPL.y2 += m;
    if (dt < exBorne3) encNonPL.y3 += m;
  }
  for (const flux of data.diversEncaissements) {
    if (flux.dateN) { const dt = new Date(String(flux.dateN)); const m = n(flux.montantN); if (dt < exBorne1) encNonPL.y1 += m; if (dt < exBorne2) encNonPL.y2 += m; if (dt < exBorne3) encNonPL.y3 += m; }
    if (flux.dateN1) { const dt = new Date(String(flux.dateN1)); const m = n(flux.montantN1); if (dt < exBorne2) encNonPL.y2 += m; if (dt < exBorne3) encNonPL.y3 += m; }
    if (flux.dateN2) { const dt = new Date(String(flux.dateN2)); const m = n(flux.montantN2); if (dt < exBorne3) encNonPL.y3 += m; }
  }
  for (const flux of data.diversDecaissements) {
    if (flux.dateN) { const dt = new Date(String(flux.dateN)); const m = n(flux.montantN); if (dt < exBorne1) decNonPL.y1 += m; if (dt < exBorne2) decNonPL.y2 += m; if (dt < exBorne3) decNonPL.y3 += m; }
    if (flux.dateN1) { const dt = new Date(String(flux.dateN1)); const m = n(flux.montantN1); if (dt < exBorne2) decNonPL.y2 += m; if (dt < exBorne3) decNonPL.y3 += m; }
    if (flux.dateN2) { const dt = new Date(String(flux.dateN2)); const m = n(flux.montantN2); if (dt < exBorne3) decNonPL.y3 += m; }
  }

  const cafCumul: YAcc = {
    y1: fc.caf.y1,
    y2: fc.caf.y1 + fc.caf.y2,
    y3: fc.caf.y1 + fc.caf.y2 + fc.caf.y3,
  };

  const tresobilan_brute: YAcc = {
    y1: apCap.y1 + apCC.y1 + empDeb.y1 + cafCumul.y1 + encNonPL.y1 - decNonPL.y1 - bilanImmos.immoAcquises.y1 - bfrBesoins.y1 - rembCumul.y1,
    y2: apCap.y2 + apCC.y2 + empDeb.y2 + cafCumul.y2 + encNonPL.y2 - decNonPL.y2 - bilanImmos.immoAcquises.y2 - bfrBesoins.y2 - rembCumul.y2,
    y3: apCap.y3 + apCC.y3 + empDeb.y3 + cafCumul.y3 + encNonPL.y3 - decNonPL.y3 - bilanImmos.immoAcquises.y3 - bfrBesoins.y3 - rembCumul.y3,
  };
  const tresobilan_cor: YAcc = {
    y1: tresobilan_brute.y1 + bfrRessources.y1,
    y2: tresobilan_brute.y2 + bfrRessources.y2,
    y3: tresobilan_brute.y3 + bfrRessources.y3,
  };
  const tresoDisponibilites: YAcc = {
    y1: Math.max(0, tresobilan_cor.y1),
    y2: Math.max(0, tresobilan_cor.y2),
    y3: Math.max(0, tresobilan_cor.y3),
  };

  L(`#### B — Trésorerie bilan (formule cumulative économique)`);
  L(`> Formule : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes`);
  L(``);
  L(header(y1L, y2L, y3L));
  L(row("Apports capital cumulatifs", apCap));
  L(row("Apports CC cumulatifs", apCC));
  L(row("Emprunts débloqués cumulatifs", empDeb));
  L(row("+ CAF cumulatif", cafCumul));
  L(row("  dont: CAF Y1", { y1: fc.caf.y1, y2: fc.caf.y1, y3: fc.caf.y1 }));
  L(row("  dont: CAF Y2", { y1: 0, y2: fc.caf.y2, y3: fc.caf.y2 }));
  L(row("  dont: CAF Y3", { y1: 0, y2: 0, y3: fc.caf.y3 }));
  L(row("+ Enc. non-P&L cumulatifs (subv invest + divers)", encNonPL));
  L(row("− Dec. non-P&L cumulatifs (divers)", decNonPL));
  L(row("− Immos acquises cumulatives (HT)", bilanImmos.immoAcquises));
  L(row("− BFR besoins (stocks+crédit TVA+créances)", bfrBesoins));
  L(row("  dont: Stocks de matières", { y1: bfr.stocksMatieres.y1, y2: bfr.stocksMatieres.y2, y3: bfr.stocksMatieres.y3 }));
  L(row("  dont: Crédit de TVA", { y1: bfr.creditTVA.y1, y2: bfr.creditTVA.y2, y3: bfr.creditTVA.y3 }));
  L(row("  dont: Créances clients", { y1: bfr.creancesClients.y1, y2: bfr.creancesClients.y2, y3: bfr.creancesClients.y3 }));
  L(row("− Remboursements capital cumulatifs", rembCumul));
  L(row("**= Trésorerie brute**", tresobilan_brute, { bold: true }));
  L(row("+ BFR dettes expl. (totalRessources)", bfrRessources));
  L(row("  dont: Dettes fournisseurs", { y1: bfr.dettesFournisseurs.y1, y2: bfr.dettesFournisseurs.y2, y3: bfr.dettesFournisseurs.y3 }));
  L(row("  dont: Dettes charges ext.", { y1: bfr.dettesChargesExternes.y1, y2: bfr.dettesChargesExternes.y2, y3: bfr.dettesChargesExternes.y3 }));
  L(row("  dont: Dettes impôts/taxes", { y1: bfr.dettesImpots.y1, y2: bfr.dettesImpots.y2, y3: bfr.dettesImpots.y3 }));
  L(row("  dont: Dettes personnel", { y1: bfr.dettesPersonnel.y1, y2: bfr.dettesPersonnel.y2, y3: bfr.dettesPersonnel.y3 }));
  L(row("  dont: TVA à payer", { y1: bfr.tvaAPayer.y1, y2: bfr.tvaAPayer.y2, y3: bfr.tvaAPayer.y3 }));
  L(row("  dont: Dettes IS", { y1: bfr.dettesIS.y1, y2: bfr.dettesIS.y2, y3: bfr.dettesIS.y3 }));
  L(row("**= Tréso corrigée**", tresobilan_cor, { bold: true }));
  L(row("**= Disponibilités (bilan)**", tresoDisponibilites, { bold: true }));
  L(``);

  // ── C. Réconciliation ─────────────────────────────────────────────────────
  const ecartTreso: YAcc = {
    y1: tresoTab.y1 - tresoDisponibilites.y1,
    y2: tresoTab.y2 - tresoDisponibilites.y2,
    y3: tresoTab.y3 - tresoDisponibilites.y3,
  };
  const tresOk = eq(ecartTreso.y1, 0) && eq(ecartTreso.y2, 0) && eq(ecartTreso.y3, 0);

  L(`#### C — Réconciliation`);
  L(header(y1L, y2L, y3L));
  L(row("Tableau mensuel soldeFinal[11]", tresoTab));
  L(row("Bilan disponibilités", tresoDisponibilites));
  L(row("**Écart (Tab − Bilan)**", ecartTreso, {
    bold: true,
    note: tresOk ? "✅ Cohérent" : "❌ DIVERGENCE",
  }));
  L(``);

  if (!tresOk) {
    L(`> ⚠ **Pistes d'explication de l'écart :**`);
    L(`> - Immos décaissées **TTC** dans le tableau vs **HT** dans le bilan (TVA déductible sur immos comptée dans \`decTVA\`)`);
    L(`> - Délais clients non nuls → créances à l'actif réduisent le bilan mais pas encore reçues dans le tableau`);
    L(`> - Subventions d'exploitation dans le tableau, mais pas dans la CAF du bilan`);
    L(`> - Décalage des acomptes IS (trimestriels dans le tableau vs solde annuel dans le bilan)`);
    L(``);
    L(`**Analyse par composante :**`);
    L(``);
    // Immos : tableau (TTC) vs bilan (HT cumul)
    const decImmoAnn: YAcc = { y1: sumSerie(dec.decImmoTTC.y1), y2: sumSerie(dec.decImmoTTC.y2), y3: sumSerie(dec.decImmoTTC.y3) };
    const ecartImmo: YAcc = {
      y1: bilanImmos.immoAcquises.y1 - decImmoAnn.y1,
      y2: bilanImmos.immoAcquises.y2 - decImmoAnn.y2,
      y3: bilanImmos.immoAcquises.y3 - decImmoAnn.y3,
    };
    L(header(y1L, y2L, y3L));
    L(row("Bilan immoAcquises (HT cumul)", bilanImmos.immoAcquises));
    L(row("Tableau dec.immoTTC (TTC cumul)", decImmoAnn));
    L(row("Écart immo (Bilan−Tab)", ecartImmo,
      { note: eq(ecartImmo.y1, 0) && eq(ecartImmo.y2, 0) && eq(ecartImmo.y3, 0) ? "✅ OK" : "⚠ TVA sur immos" }));
    // CA HT vs enc prod TTC
    const encProdTTC: YAcc = { y1: sumSerie(enc.encProdVendue.y1), y2: sumSerie(enc.encProdVendue.y2), y3: sumSerie(enc.encProdVendue.y3) };
    const ecartTTCHT: YAcc = { y1: encProdTTC.y1 - fc.ca.y1, y2: encProdTTC.y2 - fc.ca.y2, y3: encProdTTC.y3 - fc.ca.y3 };
    L(row("Enc. production TTC (tableau)", encProdTTC));
    L(row("CA HT (fc.ca)", fc.ca));
    L(row("Écart enc prod TTC−HT (= TVA collectée dans tréso)", ecartTTCHT));
    // Subventions exploitation
    const encSubvExplAnn: YAcc = { y1: sumSerie(enc.encSubvExpl.y1), y2: sumSerie(enc.encSubvExpl.y2), y3: sumSerie(enc.encSubvExpl.y3) };
    L(row("Enc. subv. exploitation (tableau, non dans CAF bilan)", encSubvExplAnn));
    // IS cumulatif comparaison
    const decISAnn: YAcc = { y1: sumSerie(dec.decIS.y1), y2: sumSerie(dec.decIS.y2), y3: sumSerie(dec.decIS.y3) };
    const isAnnuel: YAcc = { y1: fc.isParAnnee.y1, y2: fc.isParAnnee.y2, y3: fc.isParAnnee.y3 };
    L(row("Dec. IS tableau (acomptes payés)", decISAnn));
    L(row("IS annuel (fc.isParAnnee)", isAnnuel));
    L(row("Écart IS (tab−annuel)", { y1: decISAnn.y1 - isAnnuel.y1, y2: decISAnn.y2 - isAnnuel.y2, y3: decISAnn.y3 - isAnnuel.y3 }));
    L(``);

    // ── Reconstitution analytique complète de l'écart ─────────────────────────
    // But : montrer comment chaque poste contribue à l'écart between tableau et bilan.
    // Formule identité : TrésoTableau = TrésorerieBilan si et seulement si tous
    // les postes sont réconciliés.
    //
    // Reconstitution "bilan par éléments" :
    //   TrésoTab = apports + emprunts + CA_TTC
    //            - immo_TTC - remb_emprunts
    //            - dec_achats_TTC_net - dec_chargesExt_TTC_net - dec_impots - dec_personnel_net - dec_TVA - dec_IS
    //
    // Formule bilan décomposée :
    //   TrésoBilan = apports + emprunts + (CA_HT - charges_expl_HT - dotations - IS) [= CAF]
    //              - immo_HT - remb_emprunt
    //              + dettes_fourn_HT + dettes_chargesExt_HT + dettes_IS + TVA_à_payer
    //              - stocks_HT - creditTVA - créances_clients
    //
    // L'écart proviendra de l'asymétrie TVA et BFR shifts.

    L(`#### D — Reconstitution analytique de l'écart`);
    L(``);
    L(`> Décomposition du tableau trésorerie par poste, comparé à la contribution bilan.`);
    L(`> Permet d'identifier quelle ligne crée l'écart résiduel.`);
    L(``);

    const decAchatsAnn: YAcc = { y1: sumSerie(dec.decAchats.y1), y2: sumSerie(dec.decAchats.y2), y3: sumSerie(dec.decAchats.y3) };
    const decChargesExtAnn: YAcc = { y1: sumSerie(dec.decChargesExt.y1), y2: sumSerie(dec.decChargesExt.y2), y3: sumSerie(dec.decChargesExt.y3) };
    const decPersonnelAnn: YAcc = { y1: sumSerie(dec.decPersonnel.y1), y2: sumSerie(dec.decPersonnel.y2), y3: sumSerie(dec.decPersonnel.y3) };
    const decTVAAnn: YAcc = { y1: sumSerie(dec.decTVA.y1), y2: sumSerie(dec.decTVA.y2), y3: sumSerie(dec.decTVA.y3) };

    // Contribution bilan par poste (en termes "tableau équivalent")
    // Achats contribution bilan = achatsConsommés_HT + ΔStocks_actif + TVA_déd_achats - dettes_fourn_HT
    const achatsConsoHT: YAcc = { y1: fc.achatsConsommes.y1, y2: fc.achatsConsommes.y2, y3: fc.achatsConsommes.y3 };
    const deltaSotcks: YAcc = {
      y1: bfr.stocksMatieres.y1 - 0, // SI = 0 en Y1
      y2: bfr.stocksMatieres.y2 - bfr.stocksMatieres.y1,
      y3: bfr.stocksMatieres.y3 - bfr.stocksMatieres.y2,
    };
    // TVA déd achats = Σ (achatsEffectués[a] × tauxTVA[a])
    // = Σ (consommes_a + sfFinal_a) × taux_a  (via identité télescopique de computeStocksAchatsSeries)
    // Utilise bfr.achatsRows dont m11StockY1 = sfFinal exact (avec ponctuels) — cohérent avec decaissements.ts
    // ⚠ Ne PAS utiliser la formule forfaitaire montantN × coef × joursStk / 360 :
    //   elle ignore l'effet des achats ponctuels initiaux sur le stock de clôture.
    const tvaDedAchatsAnn: YAcc = { y1: 0, y2: 0, y3: 0 };
    for (const r of bfr.achatsRows) {
      const taux = r.tvaAchats / 100;
      tvaDedAchatsAnn.y1 += (r.montantN  * r.coef + r.m11StockY1)                * taux;
      tvaDedAchatsAnn.y2 += (r.montantN1 * r.coef + r.m11StockY2 - r.m11StockY1) * taux;
      tvaDedAchatsAnn.y3 += (r.montantN2 * r.coef + r.m11StockY3 - r.m11StockY2) * taux;
    }
    const achatsBilanEquiv: YAcc = {
      y1: achatsConsoHT.y1 + deltaSotcks.y1 + tvaDedAchatsAnn.y1 - bfr.dettesFournisseurs.y1,
      y2: achatsConsoHT.y2 + deltaSotcks.y2 + tvaDedAchatsAnn.y2 - (bfr.dettesFournisseurs.y2 - bfr.dettesFournisseurs.y1),
      y3: achatsConsoHT.y3 + deltaSotcks.y3 + tvaDedAchatsAnn.y3 - (bfr.dettesFournisseurs.y3 - bfr.dettesFournisseurs.y2),
    };
    const ecartAchats: YAcc = { y1: decAchatsAnn.y1 - achatsBilanEquiv.y1, y2: decAchatsAnn.y2 - achatsBilanEquiv.y2, y3: decAchatsAnn.y3 - achatsBilanEquiv.y3 };

    // Charges ext contribution bilan = chargesExt_HT + TVA_déd_charges - dettes_chargesExt_delta
    const chargesExtHT: YAcc = { y1: fc.chargesExternes.y1, y2: fc.chargesExternes.y2, y3: fc.chargesExternes.y3 };
    // Recalcul TVA déd charges
    const tvaDedChargesAnn: YAcc = { y1: 0, y2: 0, y3: 0 };
    for (const c of [...data.fournitures, ...data.services].filter(c => c.actif !== false)) {
      tvaDedChargesAnn.y1 += n(c.montantN) * (n(c.tauxTVA ?? 20) / 100);
      tvaDedChargesAnn.y2 += n(c.montantN1) * (n(c.tauxTVA ?? 20) / 100);
      tvaDedChargesAnn.y3 += n(c.montantN2) * (n(c.tauxTVA ?? 20) / 100);
    }
    const chargesExtBilanEquiv: YAcc = {
      y1: chargesExtHT.y1 + tvaDedChargesAnn.y1 - bfr.dettesChargesExternes.y1,
      y2: chargesExtHT.y2 + tvaDedChargesAnn.y2 - (bfr.dettesChargesExternes.y2 - bfr.dettesChargesExternes.y1),
      y3: chargesExtHT.y3 + tvaDedChargesAnn.y3 - (bfr.dettesChargesExternes.y3 - bfr.dettesChargesExternes.y2),
    };
    const ecartChargesExt: YAcc = { y1: decChargesExtAnn.y1 - chargesExtBilanEquiv.y1, y2: decChargesExtAnn.y2 - chargesExtBilanEquiv.y2, y3: decChargesExtAnn.y3 - chargesExtBilanEquiv.y3 };

    // Personnel contribution bilan = chargesPersonnel_HT - dettes_personnel_delta
    const fcPersonnel: YAcc = { y1: fc.chargesPersonnel.total.y1, y2: fc.chargesPersonnel.total.y2, y3: fc.chargesPersonnel.total.y3 };
    const personnelBilanEquiv: YAcc = {
      y1: fcPersonnel.y1 - bfr.dettesPersonnel.y1,
      y2: fcPersonnel.y2 - (bfr.dettesPersonnel.y2 - bfr.dettesPersonnel.y1),
      y3: fcPersonnel.y3 - (bfr.dettesPersonnel.y3 - bfr.dettesPersonnel.y2),
    };
    const ecartPersonnel: YAcc = { y1: decPersonnelAnn.y1 - personnelBilanEquiv.y1, y2: decPersonnelAnn.y2 - personnelBilanEquiv.y2, y3: decPersonnelAnn.y3 - personnelBilanEquiv.y3 };

    // TVA contribution bilan = TVA_collectée - TVA_déductible_expl - creditTVA_delta + TVA_à_payer_delta
    const encProdTTC2: YAcc = { y1: sumSerie(enc.encProdVendue.y1), y2: sumSerie(enc.encProdVendue.y2), y3: sumSerie(enc.encProdVendue.y3) };
    const tvaCollecteeAnn: YAcc = { y1: encProdTTC2.y1 - fc.ca.y1, y2: encProdTTC2.y2 - fc.ca.y2, y3: encProdTTC2.y3 - fc.ca.y3 };
    const creditTVADelta: YAcc = {
      y1: bfr.creditTVA.y1 - 0,
      y2: bfr.creditTVA.y2 - bfr.creditTVA.y1,
      y3: bfr.creditTVA.y3 - bfr.creditTVA.y2,
    };
    // TVA sur immos = du tableau TVA
    const tvaImmoAnn: YAcc = { y1: 0, y2: 0, y3: 0 };
    for (const immo of data.immobilisations) {
      if (immo.actif === false) continue;
      if ((immo as Record<string, unknown>).typeTva !== "RECUPERABLE") continue;
      const tva = n(immo.montantHT) * (n((immo as Record<string, unknown>).tauxTVA ?? 0) / 100);
      if (tva <= 0) continue;
      const dateAcq = new Date(String(immo.dateAcquisition));
      if (dateAcq <= data.dateDemarrage) continue;
      const yk = fc.toExerciceKey(dateAcq);
      if (yk === "y1") tvaImmoAnn.y1 += tva;
      else if (yk === "y2") tvaImmoAnn.y2 += tva;
      else if (yk === "y3") tvaImmoAnn.y3 += tva;
    }
    const tvaBilanEquiv: YAcc = {
      y1: tvaCollecteeAnn.y1 - tvaDedAchatsAnn.y1 - tvaDedChargesAnn.y1 - tvaImmoAnn.y1 + creditTVADelta.y1 - bfr.tvaAPayer.y1,
      y2: tvaCollecteeAnn.y2 - tvaDedAchatsAnn.y2 - tvaDedChargesAnn.y2 - tvaImmoAnn.y2 + creditTVADelta.y2 - bfr.tvaAPayer.y2,
      y3: tvaCollecteeAnn.y3 - tvaDedAchatsAnn.y3 - tvaDedChargesAnn.y3 - tvaImmoAnn.y3 + creditTVADelta.y3 - bfr.tvaAPayer.y3,
    };
    const tvaBilanNet: YAcc = { y1: tvaBilanEquiv.y1 * -1, y2: tvaBilanEquiv.y2 * -1, y3: tvaBilanEquiv.y3 * -1 };
    const ecartTVA: YAcc = { y1: decTVAAnn.y1 - tvaBilanNet.y1, y2: decTVAAnn.y2 - tvaBilanNet.y2, y3: decTVAAnn.y3 - tvaBilanNet.y3 };

    L(header(y1L, y2L, y3L));
    L(row("Dec. achats tab", decAchatsAnn));
    L(row("  Achats contrib bilan (consoHT+ΔSt+TVA-ΔDettes)", achatsBilanEquiv));
    L(row("  → Écart achats (tab − bilan)", ecartAchats, { note: eq(ecartAchats.y1,0)&&eq(ecartAchats.y2,0)&&eq(ecartAchats.y3,0)?"✅":"❌" }));
    L(row("Dec. charges ext tab", decChargesExtAnn));
    L(row("  ChargesExt contrib bilan (HT+TVA-ΔDettes)", chargesExtBilanEquiv));
    L(row("  → Écart charges ext (tab − bilan)", ecartChargesExt, { note: eq(ecartChargesExt.y1,0)&&eq(ecartChargesExt.y2,0)&&eq(ecartChargesExt.y3,0)?"✅":"❌" }));
    L(row("Dec. personnel tab", decPersonnelAnn));
    L(row("  Personnel contrib bilan (HT-ΔDettes)", personnelBilanEquiv));
    L(row("  → Écart personnel (tab − bilan)", ecartPersonnel, { note: eq(ecartPersonnel.y1,0)&&eq(ecartPersonnel.y2,0)&&eq(ecartPersonnel.y3,0)?"✅":"❌" }));
    L(row("Dec. TVA net tab", decTVAAnn));
    L(row("  TVA contrib bilan (coll-ded-ΔCrédit+ΔPayer)", tvaBilanNet));
    L(row("  → Écart TVA (tab − bilan)", ecartTVA, { note: eq(ecartTVA.y1,0)&&eq(ecartTVA.y2,0)&&eq(ecartTVA.y3,0)?"✅":"❌" }));
    L(row("  Achats consoHT (fc)", achatsConsoHT));
    L(row("  ΔStocks (BFR besoins)", deltaSotcks));
    L(row("  TVA déd achats (recalc)", tvaDedAchatsAnn));
    L(row("  ChargesExt HT (fc)", chargesExtHT));
    L(row("  TVA déd charges (recalc)", tvaDedChargesAnn));
    L(row("  TVA déd immos (recalc)", tvaImmoAnn));
    L(row("  TVA collectée (enc TTC-HT)", tvaCollecteeAnn));
    L(row("  ΔCrédit TVA BFR", creditTVADelta));
    L(``);
  }

  // ── 10. DÉTAIL APPORTS ─────────────────────────────────────────────────────
  L(section("Détail apports"));
  L(`| Type | Montant | Date apport |`);
  L(`| --- | ---: | --- |`);
  for (const apport of apports) {
    const dApp = new Date(String(apport.dateApport)).toLocaleDateString("fr-FR");
    L(`| ${apport.type} | ${fmt(n(apport.montant))} | ${dApp} |`);
  }
  L(``);

  // ── 12. TABLEAU DE TVA ────────────────────────────────────────────────────
  L(section("Tableau de TVA"));
  const periodicite = ((data.scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
    ? "trimestriel"
    : "mensuel") as "mensuel" | "trimestriel";

  L(`> **Régime TVA :** ${regimeTVA}  |  **Périodicité déclaration :** ${periodicite}`);
  L(``);

  if (isFranchise) {
    L(`> ℹ **Franchise de TVA** — aucun calcul TVA applicable.`);
    L(``);
  } else {
    const tvaRows = buildTVARows(data, fc);
    const findRow = (key: string) => tvaRows.find((r) => r.key === key);

    const rowCA       = findRow("tva-ca");
    const rowCollectee = findRow("total-collectee");
    const rowImmo     = findRow("tva-immo");
    const rowAchats   = findRow("tva-achats");
    const rowCharges  = findRow("tva-charges");
    const rowDeductible = findRow("total-deductible");
    const rowNette    = findRow("tva-nette");
    const rowCredit   = findRow("credit-tva");
    const rowPayer    = findRow("tva-payer");

    const toAcc = (r: ReturnType<typeof findRow>): YAcc => ({
      y1: r?.values.y1.total ?? 0,
      y2: r?.values.y2.total ?? 0,
      y3: r?.values.y3.total ?? 0,
    });

    // ── A. Synthèse annuelle ──────────────────────────────────────────────────
    L(`#### A — Synthèse annuelle`);
    L(``);
    L(header(y1L, y2L, y3L));
    L(row("TVA collectée sur CA", toAcc(rowCA)));
    L(row("Total TVA collectée", toAcc(rowCollectee), { bold: true }));
    L(sep());
    L(row("TVA déductible sur immos", toAcc(rowImmo)));
    L(row("TVA déductible sur achats matières", toAcc(rowAchats)));
    L(row("TVA déductible sur charges ext.", toAcc(rowCharges)));
    L(row("Total TVA déductible", toAcc(rowDeductible), { bold: true }));
    L(sep());
    L(row("TVA nette annuelle (∑)", toAcc(rowNette)));
    L(row("Crédit TVA fin exercice (M12 reporté)", {
      y1: rowCredit?.values.y1.months[11] ?? 0,
      y2: rowCredit?.values.y2.months[11] ?? 0,
      y3: rowCredit?.values.y3.months[11] ?? 0,
    }));
    L(row("TVA à payer annuelle (∑)", toAcc(rowPayer), { bold: true }));
    L(``);

    // ── B. Cohérence avec le BFR ──────────────────────────────────────────────
    L(`#### B — Cohérence TVA tableau vs BFR`);
    L(``);
    L(`> Le BFR utilise la valeur de fin d'exercice (M12) : TVA à payer = dette passif ; crédit TVA = actif circulant.`);
    L(``);
    const tvaPayerM12: YAcc = {
      y1: rowPayer?.values.y1.months[11] ?? 0,
      y2: rowPayer?.values.y2.months[11] ?? 0,
      y3: rowPayer?.values.y3.months[11] ?? 0,
    };
    const creditM12: YAcc = {
      y1: rowCredit?.values.y1.months[11] ?? 0,
      y2: rowCredit?.values.y2.months[11] ?? 0,
      y3: rowCredit?.values.y3.months[11] ?? 0,
    };
    const tvaPayerBFR: YAcc = { y1: bfr.tvaAPayer.y1, y2: bfr.tvaAPayer.y2, y3: bfr.tvaAPayer.y3 };
    const creditTVABFR: YAcc = { y1: bfr.creditTVA.y1, y2: bfr.creditTVA.y2, y3: bfr.creditTVA.y3 };
    const ecartTVAPayer: YAcc = {
      y1: tvaPayerBFR.y1 - tvaPayerM12.y1,
      y2: tvaPayerBFR.y2 - tvaPayerM12.y2,
      y3: tvaPayerBFR.y3 - tvaPayerM12.y3,
    };
    const ecartCreditTVA: YAcc = {
      y1: creditTVABFR.y1 - creditM12.y1,
      y2: creditTVABFR.y2 - creditM12.y2,
      y3: creditTVABFR.y3 - creditM12.y3,
    };
    L(header(y1L, y2L, y3L));
    L(row("TVA à payer M12 (tableau TVA)", tvaPayerM12));
    L(row("TVA à payer BFR (bfr.tvaAPayer)", tvaPayerBFR));
    L(row("Écart TVA à payer", ecartTVAPayer, {
      note: eq(ecartTVAPayer.y1, 0) && eq(ecartTVAPayer.y2, 0) && eq(ecartTVAPayer.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE",
    }));
    L(row("Crédit TVA M12 (tableau TVA)", creditM12));
    L(row("Crédit TVA BFR (bfr.creditTVA)", creditTVABFR));
    L(row("Écart crédit TVA", ecartCreditTVA, {
      note: eq(ecartCreditTVA.y1, 0) && eq(ecartCreditTVA.y2, 0) && eq(ecartCreditTVA.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE",
    }));
    L(``);

    // ── C. Cohérence avec le tableau de trésorerie ────────────────────────────
    L(`#### C — Cohérence TVA décaissée vs tableau de trésorerie`);
    L(``);
    L(`> Identité : \`decTVA = tvaAPayerAnnuel − ΔDettes TVA\``);
    L(`> où \`ΔDettes TVA = tvaM12_fin − tvaM12_debut\` (variation de la dette TVA bilan entre clôture et ouverture de l'exercice).`);
    L(`> La TVA de M12 est décaissée en début d'exercice suivant — elle n'est pas dans le flux de l'exercice courant.`);
    L(``);
    const decTVAAnn: YAcc = { y1: sumSerie(dec.decTVA.y1), y2: sumSerie(dec.decTVA.y2), y3: sumSerie(dec.decTVA.y3) };
    // ΔDettes TVA = tvaAPayer M12 fin − tvaAPayer M12 début (= 0 en Y1 car pas de dette TVA en y0)
    const deltaDetteTVA: YAcc = {
      y1: tvaPayerM12.y1 - 0,
      y2: tvaPayerM12.y2 - tvaPayerM12.y1,
      y3: tvaPayerM12.y3 - tvaPayerM12.y2,
    };
    // TVA à décaisser dans l'exercice = TVA à payer annuelle − TVA restant à décaisser fin d'exercice + TVA entrante début
    const tvaADecaisser: YAcc = {
      y1: toAcc(rowPayer).y1 - deltaDetteTVA.y1,
      y2: toAcc(rowPayer).y2 - deltaDetteTVA.y2,
      y3: toAcc(rowPayer).y3 - deltaDetteTVA.y3,
    };
    const ecartDecTVA: YAcc = {
      y1: decTVAAnn.y1 - tvaADecaisser.y1,
      y2: decTVAAnn.y2 - tvaADecaisser.y2,
      y3: decTVAAnn.y3 - tvaADecaisser.y3,
    };
    L(header(y1L, y2L, y3L));
    L(row("TVA à payer ∑ annuel (tableau TVA)", toAcc(rowPayer)));
    L(row("− TVA restant à décaisser M12 fin exercice", tvaPayerM12));
    L(row("+ TVA en attente M12 exercice précédent", { y1: 0, y2: tvaPayerM12.y1, y3: tvaPayerM12.y2 }));
    L(row("= TVA à décaisser dans l'exercice (attendu)", tvaADecaisser, { bold: true }));
    L(row("TVA décaissée (dec.decTVA ∑)", decTVAAnn, { bold: true }));
    L(row("Écart", ecartDecTVA, {
      note: eq(ecartDecTVA.y1, 0) && eq(ecartDecTVA.y2, 0) && eq(ecartDecTVA.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE",
    }));
    L(``);

    // ── D. Détail mensuel ─────────────────────────────────────────────────────
    L(`#### D — Détail mensuel`);
    L(``);
    const mFmt = (v: number) => (v === 0 ? "—" : fmt(v));
    for (const yk of ["y1", "y2", "y3"] as const) {
      const exLabel = yk === "y1" ? y1L : yk === "y2" ? y2L : y3L;
      const mNames = ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12"];
      L(`**${exLabel}**`);
      L(``);
      L(`| Désignation | ${mNames.join(" | ")} | Total |`);
      L(`| --- | ${mNames.map(() => "---:").join(" | ")} | ---: |`);
      const mRow = (lbl: string, r: ReturnType<typeof findRow>) => {
        const vals = r?.values[yk].months ?? (Array(12).fill(0) as number[]);
        const total = r?.values[yk].total ?? 0;
        return `| ${lbl} | ${vals.map(mFmt).join(" | ")} | ${mFmt(total)} |`;
      };
      L(mRow("TVA collectée CA", rowCA));
      L(mRow("TVA déductible immos", rowImmo));
      L(mRow("TVA déductible achats", rowAchats));
      L(mRow("TVA déductible charges ext.", rowCharges));
      L(mRow("TVA nette", rowNette));
      L(mRow("Crédit TVA reporté", rowCredit));
      L(mRow("TVA à payer", rowPayer));
      L(``);
    }
  }

  // ── 13. VÉRIFICATION CAF ─────────────────────────────────────────────────────
  L(section("Vérification CAF (= Résultat net + Dotations − Reprises)"));
  const cafRecalc: YAcc = {
    y1: fc.resNet.y1 + fc.dotationsAmort.y1 + fc.dotationsProvisions.y1 - fc.reprises.y1,
    y2: fc.resNet.y2 + fc.dotationsAmort.y2 + fc.dotationsProvisions.y2 - fc.reprises.y2,
    y3: fc.resNet.y3 + fc.dotationsAmort.y3 + fc.dotationsProvisions.y3 - fc.reprises.y3,
  };
  const cafEcart: YAcc = {
    y1: fc.caf.y1 - cafRecalc.y1,
    y2: fc.caf.y2 - cafRecalc.y2,
    y3: fc.caf.y3 - cafRecalc.y3,
  };
  L(header(y1L, y2L, y3L));
  L(row("Résultat net", fc.resNet));
  L(row("+ Dotations amortissements", fc.dotationsAmort));
  L(row("+ Dotations provisions", fc.dotationsProvisions));
  L(row("− Reprises sur provisions", fc.reprises));
  L(row("= CAF recalculée", cafRecalc, { bold: true }));
  L(row("CAF officielle (fc.caf)", fc.caf));
  L(row("Écart", cafEcart, {
    note: eq(cafEcart.y1, 0) && eq(cafEcart.y2, 0) && eq(cafEcart.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE",
  }));
  L(``);

  // ── 14. SIG — SOLDES INTERMÉDIAIRES DE GESTION ───────────────────────────────
  L(section("SIG — Soldes Intermédiaires de Gestion"));
  L(`> Valeurs issues de **fc** — même moteur que l'application.`);
  L(``);
  const pct = (v: number, base: number) =>
    base === 0 ? "—" : `${(v / base * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  const margeNette: YAcc = {
    y1: fc.ca.y1 - fc.achatsConsommes.y1,
    y2: fc.ca.y2 - fc.achatsConsommes.y2,
    y3: fc.ca.y3 - fc.achatsConsommes.y3,
  };
  L(header(y1L, y2L, y3L));
  L(row("CA HT", fc.ca));
  L(row("− Achats consommés", fc.achatsConsommes));
  L(row("= Marge brute", margeNette, { bold: true,
    note: `tx: ${pct(margeNette.y1, fc.ca.y1)} / ${pct(margeNette.y2, fc.ca.y2)} / ${pct(margeNette.y3, fc.ca.y3)}` }));
  L(row("+ Production immobilisée", fc.prodImmo));
  L(row("+ Transferts de charges", fc.transferts));
  L(row("+ Autres produits exploitation", fc.autresProdGestion));
  L(row("− Charges externes", fc.chargesExternes));
  L(row("= Valeur Ajoutée (VA)", fc.valeurAjoutee, { bold: true,
    note: `tx: ${pct(fc.valeurAjoutee.y1, fc.ca.y1)} / ${pct(fc.valeurAjoutee.y2, fc.ca.y2)} / ${pct(fc.valeurAjoutee.y3, fc.ca.y3)}` }));
  L(row("+ Subventions exploitation", fc.subventions));
  L(row("− Impôts et taxes", fc.impotsTaxes));
  L(row("− Charges de personnel", fc.chargesPersonnel.total));
  L(row("= EBE", fc.ebe, { bold: true,
    note: `tx: ${pct(fc.ebe.y1, fc.ca.y1)} / ${pct(fc.ebe.y2, fc.ca.y2)} / ${pct(fc.ebe.y3, fc.ca.y3)}` }));
  L(row("− Dotations amortissements", fc.dotationsAmort));
  L(row("− Dotations provisions", fc.dotationsProvisions));
  L(row("+ Reprises sur provisions", fc.reprises));
  L(row("± Autres charges/produits gestion net", {
    y1: fc.autresChargesGestion.y1 * -1,
    y2: fc.autresChargesGestion.y2 * -1,
    y3: fc.autresChargesGestion.y3 * -1,
  }));
  L(row("= Résultat d'exploitation (REX)", fc.resExpl, { bold: true,
    note: `tx: ${pct(fc.resExpl.y1, fc.ca.y1)} / ${pct(fc.resExpl.y2, fc.ca.y2)} / ${pct(fc.resExpl.y3, fc.ca.y3)}` }));
  L(row("+ Produits financiers", fc.produitsFinanciers));
  L(row("− Charges financières", {
    y1: fc.interetsEmprunts.y1 + fc.fraisDossierEmprunts.y1 + fc.autresChargesFinancieres.y1,
    y2: fc.interetsEmprunts.y2 + fc.fraisDossierEmprunts.y2 + fc.autresChargesFinancieres.y2,
    y3: fc.interetsEmprunts.y3 + fc.fraisDossierEmprunts.y3 + fc.autresChargesFinancieres.y3,
  }));
  L(row("= Résultat financier", fc.resFin, { bold: true }));
  L(row("= Résultat courant (RCB)", fc.resCourant, { bold: true }));
  L(row("+ Résultat exceptionnel", fc.resExcep));
  L(row("+/− Ajustements nets", fc.ajustementNet));
  L(row("− IS", fc.isParAnnee));
  L(row("= Résultat net", fc.resNet, { bold: true,
    note: `tx: ${pct(fc.resNet.y1, fc.ca.y1)} / ${pct(fc.resNet.y2, fc.ca.y2)} / ${pct(fc.resNet.y3, fc.ca.y3)}` }));
  L(row("CAF", fc.caf, { bold: true,
    note: `tx: ${pct(fc.caf.y1, fc.ca.y1)} / ${pct(fc.caf.y2, fc.ca.y2)} / ${pct(fc.caf.y3, fc.ca.y3)}` }));
  L(``);

  // ── 15. DÉTAIL ACTIVITÉS ─────────────────────────────────────────────────────
  L(section("Détail activités (hypothèses saisies)"));
  const activitesActives15 = data.activites.filter((a) => a.actif !== false);
  L(`| Libellé | Type | Tx marge | TVA CA | TVA ach. | Stock j | Cli. j | Fourn. j | CA N | CA N+1 | CA N+2 |`);
  L(`| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
  for (const a of activitesActives15) {
    L(`| ${a.libelle} | ${a.typeActivite} | ${n(a.tauxMarge)} % | ${n(a.tauxTVA)} % | ${n(a.tvaAchats)} % | ${a.stocks ?? 0} | ${a.reglementClients ?? 0} | ${a.reglementFournisseurs ?? 0} | ${fmt(n(a.montantN))} | ${fmt(n(a.montantN1))} | ${fmt(n(a.montantN2))} |`);
  }
  L(``);
  const sumActivites = (f: (a: (typeof activitesActives15)[0]) => number) =>
    activitesActives15.reduce((s, a) => s + f(a), 0);
  L(header(y1L, y2L, y3L));
  L(row("CA total activités actives (saisie)", {
    y1: sumActivites((a) => n(a.montantN)),
    y2: sumActivites((a) => n(a.montantN1)),
    y3: sumActivites((a) => n(a.montantN2)),
  }));
  L(row("CA total (fc.ca)", fc.ca));
  L(``);

  // ── 16. DÉTAIL PERSONNEL ─────────────────────────────────────────────────────
  L(section("Détail personnel (hypothèses saisies vs fc)"));

  L(`#### Salariés`);
  if (data.salaries.filter((s) => s.actif !== false).length === 0) {
    L(`> *(aucun)*`);
  } else {
    L(`| Libellé | Brut N | Côt. Pat. | Coût N | Brut N+1 | Coût N+1 | Brut N+2 | Coût N+2 |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
    for (const s of data.salaries.filter((s) => s.actif !== false)) {
      const cp = n(s.tauxCotPat) / 100;
      const mn = n(s.montantN); const mn1 = n(s.montantN1); const mn2 = n(s.montantN2);
      L(`| ${s.libelle} | ${fmt(mn)} | ${n(s.tauxCotPat)} % | ${fmt(mn * (1 + cp))} | ${fmt(mn1)} | ${fmt(mn1 * (1 + cp))} | ${fmt(mn2)} | ${fmt(mn2 * (1 + cp))} |`);
    }
  }
  L(``);

  L(`#### Dirigeants`);
  if (data.dirigeants.filter((d) => d.actif !== false).length === 0) {
    L(`> *(aucun)*`);
  } else {
    L(`| Libellé | Rémunération N | N+1 | N+2 |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const d of data.dirigeants.filter((d) => d.actif !== false)) {
      L(`| ${d.libelle} | ${fmt(n(d.montantN))} | ${fmt(n(d.montantN1))} | ${fmt(n(d.montantN2))} |`);
    }
  }
  L(``);

  L(`#### Cotisations TNS`);
  if (data.cotisationsTNS.filter((c) => c.actif !== false).length === 0) {
    L(`> *(aucun)*`);
  } else {
    L(`| Libellé | N | N+1 | N+2 |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const c of data.cotisationsTNS.filter((c) => c.actif !== false)) {
      L(`| ${c.libelle} | ${fmt(n(c.montantN))} | ${fmt(n(c.montantN1))} | ${fmt(n(c.montantN2))} |`);
    }
  }
  L(``);

  L(`#### Taxes sur salaires`);
  if (data.taxesSalaires.length === 0) {
    L(`> *(aucune)*`);
  } else {
    L(`| Libellé | N | N+1 | N+2 |`);
    L(`| --- | ---: | ---: | ---: |`);
    for (const t of data.taxesSalaires) {
      L(`| ${t.libelle} | ${fmt(n(t.montantN))} | ${fmt(n(t.montantN1))} | ${fmt(n(t.montantN2))} |`);
    }
  }
  L(``);

  L(`#### Récapitulatif fc.chargesPersonnel`);
  L(header(y1L, y2L, y3L));
  L(row("Salaires bruts", fc.chargesPersonnel.salairesBruts));
  L(row("+ Charges patronales", fc.chargesPersonnel.chargesPatronales));
  L(row("+ Rémunération dirigeant", fc.chargesPersonnel.remuDirigeant));
  L(row("+ Cotisations TNS total", fc.chargesPersonnel.cotisationsTNSTotal));
  L(row("+ Taxes salaires total", fc.chargesPersonnel.taxesSalairesTotal));
  L(row("= Total charges personnel", fc.chargesPersonnel.total, { bold: true }));
  L(``);

  // ── 17. PLAN DE FINANCEMENT ───────────────────────────────────────────────────
  L(section("Plan de financement (= écran)"));
  const pf = buildPlanFinancementRows(data, fc);
  for (const r of pf.rows) {
    if (r.style === "section") {
      L(``);
      L(`**${r.label}**`);
      L(``);
      L(`| Désignation | Initial | ${y1L} | ${y2L} | ${y3L} |`);
      L(`| --- | ---: | ---: | ---: | ---: |`);
      continue;
    }
    const bold = r.style === "highlight";
    const tag = bold ? "**" : "";
    const amt = (k: "y0" | "y1" | "y2" | "y3") => fmt(r.values[k].amount);
    L(`| ${tag}${r.sign ? r.sign + " " : ""}${r.label}${tag} | ${amt("y0")} | ${amt("y1")} | ${amt("y2")} | ${amt("y3")} |`);
  }
  L(``);
  const pfBesoins = pf.rows.find((r) => r.key === "total_besoins");
  const pfRessources = pf.rows.find((r) => r.key === "total_ressources");
  const pfVariation = pf.rows.find((r) => r.key === "variation_tresorerie");
  if (pfBesoins && pfRessources && pfVariation) {
    // Par construction : Ressources − Besoins = Variation de trésorerie (ce n'est pas un déséquilibre)
    // Le vrai contrôle (solde tréso = bilan) est effectué au check #11.
    const pfEcart = (k: "y0" | "y1" | "y2" | "y3") =>
      pfRessources.values[k].amount - pfBesoins.values[k].amount;
    L(`| **= Variation de trésorerie (Ressources − Besoins)** | ${fmt(pfEcart("y0"))} | ${fmt(pfEcart("y1"))} | ${fmt(pfEcart("y2"))} | ${fmt(pfEcart("y3"))} | _(= par construction)_ |`);
  }
  L(``);

  // ── 18. ÉCHÉANCIER EMPRUNTS ───────────────────────────────────────────────────
  L(section("Échéancier emprunts (par exercice)"));
  for (const emprunt of emprunts) {
    const dateDeb = new Date(String(emprunt["dateDéblocage"])).toLocaleDateString("fr-FR");
    L(`#### ${emprunt.libelle}`);
    L(`> Montant : **${fmt(n(emprunt.montant))} €** · Taux : **${n(emprunt.tauxAnnuel)} %** · Durée : **${emprunt.dureeEnMois} mois** · Déblocage : **${dateDeb}** · ${emprunt.periodicite} · ${emprunt.typeEmprunt}`);
    L(``);
    const lignes = [...emprunt.lignesEcheancier].sort((a, b) => a.moisNumero - b.moisNumero);
    const fraisDossier = lignes.find((l) => l.moisNumero === 0);
    const lignesAmort = lignes.filter((l) => l.moisNumero > 0);
    const grouped: Record<"y1" | "y2" | "y3" | "hors", typeof lignesAmort> =
      { y1: [], y2: [], y3: [], hors: [] };
    for (const ligne of lignesAmort) {
      const exKey = fc.toExerciceKey(new Date(String(ligne.dateEcheance)));
      if (exKey === "y1") grouped.y1.push(ligne);
      else if (exKey === "y2") grouped.y2.push(ligne);
      else if (exKey === "y3") grouped.y3.push(ligne);
      else grouped.hors.push(ligne);
    }
    L(`| Exercice | Cap. remboursé | Intérêts | Assurance | Total mensualités | Cap. restant fin |`);
    L(`| --- | ---: | ---: | ---: | ---: | ---: |`);
    if (fraisDossier && n(fraisDossier.mensualiteTotale) !== 0) {
      L(`| Initial (frais dossier) | — | — | — | ${fmt(n(fraisDossier.mensualiteTotale))} | ${fmt(n(emprunt.montant))} |`);
    }
    for (const [exLabel, exLignes] of [
      [y1L, grouped.y1], [y2L, grouped.y2], [y3L, grouped.y3],
    ] as [string, typeof lignesAmort][]) {
      if (exLignes.length === 0) continue;
      const totCap = exLignes.reduce((s, l) => s + n(l.capitalRembourse), 0);
      const totInt = exLignes.reduce((s, l) => s + n(l.interesMois), 0);
      const totAss = exLignes.reduce((s, l) => s + n(l.assuranceMois), 0);
      const totMens = exLignes.reduce((s, l) => s + n(l.mensualiteTotale), 0);
      const capFin = n(exLignes[exLignes.length - 1]!.capitalRestantFin);
      L(`| ${exLabel} | ${fmt(totCap)} | ${fmt(totInt)} | ${fmt(totAss)} | ${fmt(totMens)} | ${fmt(capFin)} |`);
    }
    if (grouped.hors.length > 0) {
      const totCap = grouped.hors.reduce((s, l) => s + n(l.capitalRembourse), 0);
      const totInt = grouped.hors.reduce((s, l) => s + n(l.interesMois), 0);
      const totMens = grouped.hors.reduce((s, l) => s + n(l.mensualiteTotale), 0);
      L(`| Hors projection | ${fmt(totCap)} | ${fmt(totInt)} | — | ${fmt(totMens)} | — |`);
    }
    // Totaux sur toute la durée
    const totGlobalCap = lignesAmort.reduce((s, l) => s + n(l.capitalRembourse), 0);
    const totGlobalInt = lignesAmort.reduce((s, l) => s + n(l.interesMois), 0);
    const totGlobalAss = lignesAmort.reduce((s, l) => s + n(l.assuranceMois), 0);
    const totGlobalMens = lignesAmort.reduce((s, l) => s + n(l.mensualiteTotale), 0);
    L(`| **Total durée emprunts** | **${fmt(totGlobalCap)}** | **${fmt(totGlobalInt)}** | **${fmt(totGlobalAss)}** | **${fmt(totGlobalMens)}** | **0,00** |`);
    L(``);
  }
  L(``);

  // ── CONCLUSION ─────────────────────────────────────────────────────────────────
  L(section("Conclusion"));
  L(``);
  L(`> Synthèse de toutes les vérifications de cohérence effectuées dans ce rapport.`);
  L(`> **✅ = cohérent · ❌ = divergence à investiguer · ⚠ = anomalie à analyser**`);
  L(``);

  // ── Check 1 — Bilan équilibré ───────────────────────────────────────────────
  const ckBilanY1 = bilan.equilibre.y1;
  const ckBilanY2 = bilan.equilibre.y2;
  const ckBilanY3 = bilan.equilibre.y3;
  const ckBilanGlobal = ckBilanY1 && ckBilanY2 && ckBilanY3;

  // ── Check 2 — Résultat exploitation ────────────────────────────────────────
  const ckResExpl = eq(resExplEcart.y1, 0) && eq(resExplEcart.y2, 0) && eq(resExplEcart.y3, 0);

  // ── Check 3 — CAF ───────────────────────────────────────────────────────────
  const ckCaf = eq(cafEcart.y1, 0) && eq(cafEcart.y2, 0) && eq(cafEcart.y3, 0);

  // ── Check 4 — Dotations amortissements ─────────────────────────────────────
  const ckDotAmort = eq(ecartDotAmort.y1, 0) && eq(ecartDotAmort.y2, 0) && eq(ecartDotAmort.y3, 0);

  // ── Check 5/6/7 — TVA ───────────────────────────────────────────────────────
  let ckTVAPayer = true, ckCreditTVA = true, ckDecTVA = true;
  let ecartTVAPayerConc: YAcc = zero;
  let ecartCreditTVAConc: YAcc = zero;
  let ecartDecTVAConc: YAcc = zero;
  if (!isFranchise) {
    const tvaRowsConc = buildTVARows(data, fc);
    const findC = (key: string) => tvaRowsConc.find((r) => r.key === key);
    const rowPayerC = findC("tva-payer");
    const rowCreditC = findC("credit-tva");
    ecartTVAPayerConc = {
      y1: bfr.tvaAPayer.y1 - (rowPayerC?.values.y1.months[11] ?? 0),
      y2: bfr.tvaAPayer.y2 - (rowPayerC?.values.y2.months[11] ?? 0),
      y3: bfr.tvaAPayer.y3 - (rowPayerC?.values.y3.months[11] ?? 0),
    };
    ecartCreditTVAConc = {
      y1: bfr.creditTVA.y1 - (rowCreditC?.values.y1.months[11] ?? 0),
      y2: bfr.creditTVA.y2 - (rowCreditC?.values.y2.months[11] ?? 0),
      y3: bfr.creditTVA.y3 - (rowCreditC?.values.y3.months[11] ?? 0),
    };
    const decTVAAnnConc: YAcc = {
      y1: sumSerie(dec.decTVA.y1),
      y2: sumSerie(dec.decTVA.y2),
      y3: sumSerie(dec.decTVA.y3),
    };
    // Identité : decTVA = tvaAPayerAnnuel − ΔDettes TVA
    // ΔDettes TVA = tvaM12_fin − tvaM12_debut (variation de la dette passif TVA entre ouverture et clôture)
    const tvaPayerM12Conc: YAcc = {
      y1: rowPayerC?.values.y1.months[11] ?? 0,
      y2: rowPayerC?.values.y2.months[11] ?? 0,
      y3: rowPayerC?.values.y3.months[11] ?? 0,
    };
    const tvaADecaisserConc: YAcc = {
      y1: (rowPayerC?.values.y1.total ?? 0) - tvaPayerM12Conc.y1,
      y2: (rowPayerC?.values.y2.total ?? 0) - (tvaPayerM12Conc.y2 - tvaPayerM12Conc.y1),
      y3: (rowPayerC?.values.y3.total ?? 0) - (tvaPayerM12Conc.y3 - tvaPayerM12Conc.y2),
    };
    ecartDecTVAConc = {
      y1: decTVAAnnConc.y1 - tvaADecaisserConc.y1,
      y2: decTVAAnnConc.y2 - tvaADecaisserConc.y2,
      y3: decTVAAnnConc.y3 - tvaADecaisserConc.y3,
    };
    ckTVAPayer = eq(ecartTVAPayerConc.y1, 0) && eq(ecartTVAPayerConc.y2, 0) && eq(ecartTVAPayerConc.y3, 0);
    ckCreditTVA = eq(ecartCreditTVAConc.y1, 0) && eq(ecartCreditTVAConc.y2, 0) && eq(ecartCreditTVAConc.y3, 0);
    ckDecTVA = eq(ecartDecTVAConc.y1, 0) && eq(ecartDecTVAConc.y2, 0) && eq(ecartDecTVAConc.y3, 0);
  }

  // ── Check 8 — Trésorerie tableau mensuel = bilan ────────────────────────────
  const ckTreso = tresOk;

  // ── Check 9 — Capital emprunts bilan = échéancier ───────────────────────────
  const capitalBilanY1 = empDeb.y1 - rembCumul.y1;
  const capitalBilanY2 = empDeb.y2 - rembCumul.y2;
  const capitalBilanY3 = empDeb.y3 - rembCumul.y3;
  let capEchY1 = 0, capEchY2 = 0, capEchY3 = 0;
  for (const emp of emprunts) {
    const total = n(emp.montant);
    let r1 = 0, r2 = 0, r3 = 0;
    for (const l of emp.lignesEcheancier) {
      const dl = new Date(String(l.dateEcheance));
      const cap = n(l.capitalRembourse);
      if (dl < exBorne1) r1 += cap;
      if (dl < exBorne2) r2 += cap;
      if (dl < exBorne3) r3 += cap;
    }
    capEchY1 += Math.max(0, total - r1);
    capEchY2 += Math.max(0, total - r2);
    capEchY3 += Math.max(0, total - r3);
  }
  const ecartEmprunts: YAcc = {
    y1: capitalBilanY1 - capEchY1,
    y2: capitalBilanY2 - capEchY2,
    y3: capitalBilanY3 - capEchY3,
  };
  const ckEmprunts = eq(ecartEmprunts.y1, 0) && eq(ecartEmprunts.y2, 0) && eq(ecartEmprunts.y3, 0);

  // ── Check 10 — CA activités saisies = fc.ca ─────────────────────────────────
  const ecartCA: YAcc = {
    y1: sumActivites((a) => n(a.montantN)) - fc.ca.y1,
    y2: sumActivites((a) => n(a.montantN1)) - fc.ca.y2,
    y3: sumActivites((a) => n(a.montantN2)) - fc.ca.y3,
  };
  const ckCA = eq(ecartCA.y1, 0) && eq(ecartCA.y2, 0) && eq(ecartCA.y3, 0);

  // ── Check 11 — Plan financement solde tréso = bilan disponibilités ──────────
  const pfSoldeRow = pf.rows.find((r) => r.key === "solde_tresorerie");
  const ecartPF: YAcc = {
    y1: (pfSoldeRow?.values.y1.amount ?? 0) - tresoDisponibilites.y1,
    y2: (pfSoldeRow?.values.y2.amount ?? 0) - tresoDisponibilites.y2,
    y3: (pfSoldeRow?.values.y3.amount ?? 0) - tresoDisponibilites.y3,
  };
  const ckPF = pfSoldeRow !== undefined && eq(ecartPF.y1, 0) && eq(ecartPF.y2, 0) && eq(ecartPF.y3, 0);

  // ── Tableau récapitulatif ───────────────────────────────────────────────────
  const st = (ok: boolean) => (ok ? "✅" : "❌");
  const ef = (v: number) => (eq(v, 0) ? "—" : fmt(v));
  const tvaStatus = (ok: boolean) => (isFranchise ? "ℹ Franchise" : st(ok));
  const tvaEf = (v: number) => (isFranchise ? "—" : ef(v));

  L(`#### Récapitulatif des vérifications de cohérence`);
  L(``);
  L(`| # | Vérification | Statut | Écart ${y1L} | Écart ${y2L} | Écart ${y3L} |`);
  L(`| --- | --- | :---: | ---: | ---: | ---: |`);
  L(`| 1 | Bilan actif = passif | ${ckBilanY1 ? "✅" : "❌"} / ${ckBilanY2 ? "✅" : "❌"} / ${ckBilanY3 ? "✅" : "❌"} | — | — | — |`);
  L(`| 2 | Résultat exploitation (fc = recalculé) | ${st(ckResExpl)} | ${ef(resExplEcart.y1)} | ${ef(resExplEcart.y2)} | ${ef(resExplEcart.y3)} |`);
  L(`| 3 | CAF (fc = ResNet + Dotations − Reprises) | ${st(ckCaf)} | ${ef(cafEcart.y1)} | ${ef(cafEcart.y2)} | ${ef(cafEcart.y3)} |`);
  L(`| 4 | Dotations amort (distribuerAmort = fc) | ${st(ckDotAmort)} | ${ef(ecartDotAmort.y1)} | ${ef(ecartDotAmort.y2)} | ${ef(ecartDotAmort.y3)} |`);
  L(`| 5 | TVA à payer BFR = tableau TVA M12 | ${tvaStatus(ckTVAPayer)} | ${tvaEf(ecartTVAPayerConc.y1)} | ${tvaEf(ecartTVAPayerConc.y2)} | ${tvaEf(ecartTVAPayerConc.y3)} |`);
  L(`| 6 | Crédit TVA BFR = tableau TVA M12 | ${tvaStatus(ckCreditTVA)} | ${tvaEf(ecartCreditTVAConc.y1)} | ${tvaEf(ecartCreditTVAConc.y2)} | ${tvaEf(ecartCreditTVAConc.y3)} |`);
  L(`| 7 | TVA décaissée = tvaAnnuel − ΔDettes TVA | ${tvaStatus(ckDecTVA)} | ${tvaEf(ecartDecTVAConc.y1)} | ${tvaEf(ecartDecTVAConc.y2)} | ${tvaEf(ecartDecTVAConc.y3)} |`);
  L(`| 8 | Trésorerie tableau mensuel = bilan | ${st(ckTreso)} | ${ef(ecartTreso.y1)} | ${ef(ecartTreso.y2)} | ${ef(ecartTreso.y3)} |`);
  L(`| 9 | Capital emprunts bilan = échéancier | ${st(ckEmprunts)} | ${ef(ecartEmprunts.y1)} | ${ef(ecartEmprunts.y2)} | ${ef(ecartEmprunts.y3)} |`);
  L(`| 10 | CA activités saisies = fc.ca | ${st(ckCA)} | ${ef(ecartCA.y1)} | ${ef(ecartCA.y2)} | ${ef(ecartCA.y3)} |`);
  L(`| 11 | Plan financement solde tréso = bilan | ${pfSoldeRow ? st(ckPF) : "⚠ Clé introuvable"} | ${ef(ecartPF.y1)} | ${ef(ecartPF.y2)} | ${ef(ecartPF.y3)} |`);
  L(``);

  // ── Divergences ─────────────────────────────────────────────────────────────
  const allOk = ckBilanGlobal && ckResExpl && ckCaf && ckDotAmort
    && (isFranchise || (ckTVAPayer && ckCreditTVA && ckDecTVA))
    && ckTreso && ckEmprunts && ckCA && ckPF;

  if (allOk) {
    L(`#### ✅ Aucune divergence détectée`);
    L(``);
    L(`Toutes les vérifications de cohérence passent. La modélisation est cohérente.`);
  } else {
    L(`#### ❌ Divergences à investiguer`);
    L(``);
    if (!ckBilanGlobal) {
      const exErreurs = [!ckBilanY1 ? y1L : null, !ckBilanY2 ? y2L : null, !ckBilanY3 ? y3L : null]
        .filter(Boolean).join(", ");
      L(`- **[1] Bilan déséquilibré** sur ${exErreurs} — actif ≠ passif. Consultez la section *Bilan officiel* et *Équilibre du bilan*.`);
    }
    if (!ckResExpl) {
      L(`- **[2] Résultat exploitation incohérent** — la somme Produits − Charges diffère de \`fc.resExpl\`. Vérifier les agrégations dans \`buildFinCalc\` (achatsConsommes, chargesExternes, impotsTaxes, chargesPersonnel, dotations).`);
    }
    if (!ckCaf) {
      L(`- **[3] CAF incohérente** — \`fc.caf\` diffère de ResNet + Dotations − Reprises. Vérifier \`calculs/caf.ts\`.`);
    }
    if (!ckDotAmort) {
      L(`- **[4] Dotations amortissements incohérentes** — divergence entre \`distribuerAmortParExercice\` (recalcul manuel) et \`fc.dotationsAmort\` (moteur). Vérifier \`calculs/amortissements.ts\`.`);
    }
    if (!isFranchise && !ckTVAPayer) {
      L(`- **[5] TVA à payer BFR ≠ tableau TVA M12** (écarts : Y1=${fmt(ecartTVAPayerConc.y1)} · Y2=${fmt(ecartTVAPayerConc.y2)} · Y3=${fmt(ecartTVAPayerConc.y3)}) — le passif BFR ne correspond pas à la dette TVA du moteur. Vérifier \`calculs/bfr.ts\` champ \`tvaAPayer\` et \`aggregations/tva\`.`);
    }
    if (!isFranchise && !ckCreditTVA) {
      L(`- **[6] Crédit TVA BFR ≠ tableau TVA M12** (écarts : Y1=${fmt(ecartCreditTVAConc.y1)} · Y2=${fmt(ecartCreditTVAConc.y2)} · Y3=${fmt(ecartCreditTVAConc.y3)}) — l'actif circulant BFR ne correspond pas au crédit TVA calculé. Vérifier \`calculs/bfr.ts\` champ \`creditTVA\` et \`aggregations/tva\`.`);
    }
    if (!isFranchise && !ckDecTVA) {
      L(`- **[7] TVA décaissée incohérente** (écarts : Y1=${fmt(ecartDecTVAConc.y1)} · Y2=${fmt(ecartDecTVAConc.y2)} · Y3=${fmt(ecartDecTVAConc.y3)}) — le décaissement TVA devrait égaler tvaAnnuel − ΔDettes TVA (variation M12). Vérifier \`calculs/decaissements.ts\`.`);
    }
    if (!ckTreso) {
      L(`- **[8] Trésorerie divergente** (écarts : Y1=${fmt(ecartTreso.y1)} · Y2=${fmt(ecartTreso.y2)} · Y3=${fmt(ecartTreso.y3)}) — le tableau mensuel TTC et la formule bilan ne convergent pas. Causes probables : TVA sur immos décaissée TTC vs bilan HT, subventions exploitation hors P&L, décalage acomptes IS. Voir section *Trésorerie — Comparaison*.`);
    }
    if (!ckEmprunts) {
      L(`- **[9] Capital emprunts bilan ≠ échéancier** (écarts : Y1=${fmt(ecartEmprunts.y1)} · Y2=${fmt(ecartEmprunts.y2)} · Y3=${fmt(ecartEmprunts.y3)}) — les capitaux restants du passif bilan divergent de l'échéancier saisi. Vérifier \`calcEmpruntsPassif\` et les lignes d'échéancier.`);
    }
    if (!ckCA) {
      L(`- **[10] CA activités saisies ≠ fc.ca** (écarts : Y1=${fmt(ecartCA.y1)} · Y2=${fmt(ecartCA.y2)} · Y3=${fmt(ecartCA.y3)}) — la somme des montants des activités actives diffère du CA calculé. Vérifier la logique d'agrégation dans \`buildFinCalc\`.`);
    }
    if (!ckPF) {
      L(`- **[11] Plan de financement incohérent** (écarts : Y1=${fmt(ecartPF.y1)} · Y2=${fmt(ecartPF.y2)} · Y3=${fmt(ecartPF.y3)}) — le solde de trésorerie du plan diffère des disponibilités bilan. Vérifier \`aggregations/plan-financement.ts\`.`);
    }
  }
  L(``);

  // ── Points de vigilance (anomalies structurelles) ───────────────────────────
  L(`#### Points de vigilance`);
  L(``);
  const vigilances: string[] = [];

  // Trésorerie mensuelle négative
  if (tresoTab.y1 < -1) vigilances.push(`Trésorerie tableau Y1 négative : **${fmt(tresoTab.y1)} €** — risque de découvert non couvert.`);
  if (tresoTab.y2 < -1) vigilances.push(`Trésorerie tableau Y2 négative : **${fmt(tresoTab.y2)} €** — risque de découvert non couvert.`);
  if (tresoTab.y3 < -1) vigilances.push(`Trésorerie tableau Y3 négative : **${fmt(tresoTab.y3)} €** — risque de découvert non couvert.`);

  // CA nul
  if (fc.ca.y1 === 0) vigilances.push(`CA nul sur ${y1L} — vérifier que des activités actives sont saisies.`);
  if (fc.ca.y2 === 0) vigilances.push(`CA nul sur ${y2L} — vérifier que des activités actives sont saisies.`);
  if (fc.ca.y3 === 0) vigilances.push(`CA nul sur ${y3L} — vérifier que des activités actives sont saisies.`);

  // Résultat net négatif
  if (fc.resNet.y1 < 0) vigilances.push(`Résultat net négatif sur ${y1L} : **${fmt(fc.resNet.y1)} €**.`);
  if (fc.resNet.y2 < 0) vigilances.push(`Résultat net négatif sur ${y2L} : **${fmt(fc.resNet.y2)} €**.`);
  if (fc.resNet.y3 < 0) vigilances.push(`Résultat net négatif sur ${y3L} : **${fmt(fc.resNet.y3)} €**.`);

  // Immobilisations avec durée > 0 mais mode AUCUN → amortissement silencieusement ignoré
  for (const immo of immobilisationsActives) {
    const mode = String(immo.modeAmortissement ?? "LINEAIRE");
    const dur  = n(immo.dureeAmortissement);
    if (dur > 0 && mode === "AUCUN") {
      vigilances.push(`Immobilisation **${immo.libelle}** : durée = ${dur} ans mais mode = AUCUN → aucun amortissement généré (oubli probable).`);
    }
    if ((dur === 0 || immo.dureeAmortissement == null) && mode !== "AUCUN") {
      vigilances.push(`Immobilisation **${immo.libelle}** : mode = ${mode} mais durée = 0 → aucun amortissement généré (durée manquante ?).`);
    }
  }

  // Charges financières sans emprunt (ou vice-versa)
  if (emprunts.length === 0 && (fc.interetsEmprunts.y1 + fc.interetsEmprunts.y2 + fc.interetsEmprunts.y3) > 1) {
    vigilances.push(`Intérêts d'emprunts détectés (${fmt(fc.interetsEmprunts.y1 + fc.interetsEmprunts.y2 + fc.interetsEmprunts.y3)} €) mais aucun emprunt saisi.`);
  }
  if (emprunts.length > 0 && (fc.interetsEmprunts.y1 + fc.interetsEmprunts.y2 + fc.interetsEmprunts.y3) < 1) {
    vigilances.push(`Des emprunts sont saisis mais aucun intérêt n'est calculé — vérifier les taux et les échéanciers.`);
  }

  // Aucun apport
  if (apports.length === 0) vigilances.push(`Aucun apport saisi — vérifier si le financement en fonds propres est complet.`);

  // Aucune immobilisation
  if (immobilisationsActives.length === 0) vigilances.push(`Aucune immobilisation active — vérifier si les investissements initiaux sont saisis.`);

  // BFR initial élevé (> total immobilisations — signal d'alerte)
  const bfrInitial = bfr.bfr.y0;
  const totalImmos = immobilisationsActives.reduce((s, i) => s + n(i.montantHT), 0);
  if (bfrInitial > totalImmos && totalImmos > 0) {
    vigilances.push(`BFR initial (**${fmt(bfrInitial)} €**) supérieur au total des immobilisations (**${fmt(totalImmos)} €**) — proportion inhabituelle.`);
  }

  // Divergence trésorerie notable (> 500€)
  if (!ckTreso && (Math.abs(ecartTreso.y1) > 500 || Math.abs(ecartTreso.y2) > 500 || Math.abs(ecartTreso.y3) > 500)) {
    vigilances.push(`La divergence trésorerie (check #8) dépasse 500 € — vérifier le traitement de la TVA sur immobilisations dans le tableau mensuel vs le bilan.`);
  }

  if (vigilances.length === 0) {
    L(`Aucun point de vigilance identifié.`);
  } else {
    for (const v of vigilances) {
      L(`- ⚠ ${v}`);
    }
  }
  L(``);

  // ─── Écriture fichier ──────────────────────────────────────────────────────
  const outputPath = join(process.cwd(), "scripts/debug/output", "debug-bilan-output.md");
  writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`\n✅ Fichier créé : ${outputPath}`);
  const statusY1 = bilan.equilibre.y1 ? "✅" : "❌";
  const statusY2 = bilan.equilibre.y2 ? "✅" : "❌";
  const statusY3 = bilan.equilibre.y3 ? "✅" : "❌";
  console.log(`   Équilibre Y1=${statusY1}  Y2=${statusY2}  Y3=${statusY3}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Erreur :", err);
  await prisma.$disconnect().catch(() => void 0);
  process.exit(1);
});
