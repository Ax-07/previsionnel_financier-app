/**
 * Script de diagnostic du compte de résultat prévisionnel.
 *
 * Usage :
 *   pnpm tsx scripts/debug-compte-de-resultat.ts <dossierId>
 *
 * Produit : scripts/debug-compte-de-resultat-output.md
 *
 * Toutes les valeurs sont calculées avec les MÊMES fonctions que l'application
 * (buildCompteResultatRows, buildFinCalc) — les résultats doivent être identiques
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
import { buildCompteResultatRows, buildDrilldownRows } from "@/lib/finance/aggregations/compte-resultat";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number | null) =>
  v === null ? "—" : `${v.toFixed(1)} %`;
const eq = (a: number, b: number) => Math.abs(a - b) < 1;

type YAcc = { y1: number; y2: number; y3: number };
const zero: YAcc = { y1: 0, y2: 0, y3: 0 };


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
const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug-compte-de-resultat.ts <dossierId>");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const data = await fetchScenarioData(dossierId);
  console.log("Données chargées. Calculs en cours…");

  const { dateDemarrage: dateDemarrageDate, immobilisations } = data;

  const immobilisationsActives = immobilisations.filter((i) => i.actif !== false);
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth();

  const par = data.scenario.parametres;
  const isIS = (par?.regimeFiscal ?? "IS") === "IS";

  // ── Calculs officiels (= application) ──────────────────────────────────────
  const fc = buildFinCalc(data, dateDemarrageDate);
  const d = fc.filteredData;
  const crData = buildCompteResultatRows(d, fc, isIS);
  const rows = buildDrilldownRows(d, fc);

  const y1L = crData.yearLabels.y1;
  const y2L = crData.yearLabels.y2;
  const y3L = crData.yearLabels.y3;

  // Calcul pct CA
  const pctCa = (v: number, y: "y1" | "y2" | "y3"): number | null => {
    const ca = fc.ca[y];
    if (!ca) return null;
    return (v / ca) * 100;
  };
  const pctAcc = (v: YAcc): { y1: number | null; y2: number | null; y3: number | null } => ({
    y1: pctCa(v.y1, "y1"),
    y2: pctCa(v.y2, "y2"),
    y3: pctCa(v.y3, "y3"),
  });

  const lines: string[] = [];
  const L = (s: string) => lines.push(s);

  L(`# Diagnostic Compte de Résultat — Dossier \`${dossierId}\``);
  L(``);
  L(`> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**`);
  L(``);
  L(`Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :`);
  L(`\`buildCompteResultatRows\` · \`buildDrilldownRows\` · \`buildFinCalc\``);
  L(``);
  L(`Exercices : **${y1L}** · **${y2L}** · **${y3L}**`);
  L(`Régime fiscal : **${par?.regimeFiscal ?? "IS"}** (IS = ${isIS ? "oui" : "non"})`);
  L(``);

  // ── 0. DONNÉES SAISIES ─────────────────────────────────────────────────────
  L(section2("Données saisies"));
  L(`> Snapshot de toutes les hypothèses saisies — données brutes stockées en base. \`✅\` = actif · \`❌\` = inactif`);
  L(``);
  const moisLabels0 = Array.from({length: 12}, (_, i) => MOIS_COURTS[(moisDebut + i) % 12]);

  // Paramètres généraux
  {
    L(`### Paramètres généraux`);
    L(``);
    L(`| Paramètre | Valeur |`);
    L(`| --- | --- |`);
    L(`| Date de démarrage | ${dateDemarrageDate.toLocaleDateString("fr-FR")} |`);
    L(`| Durée projection | ${data.dureeProjection} exercices |`);
    L(`| Régime fiscal | \`${par?.regimeFiscal ?? "IS"}\` |`);
    L(`| Taux IS normal | ${par?.tauxIs ?? "—"} % |`);
    L(`| Taux IS réduit | ${par?.tauxIsReduit ?? "—"} % · Plafond : ${par?.plafondIsReduit != null ? fmt(n(par.plafondIsReduit)) : "—"} € |`);
    L(`| Régime TVA | \`${par?.regimeTVA ?? "REEL_NORMAL"}\` |`);
    L(`| Mois paiement salaires | ${par?.moisPaiementSalaires ?? 1} |`);
    L(`| Régime social TNS | \`${par?.tnsRegimeSocial ?? "—"}\` |`);
    L(`| Mode calcul TNS | \`${par?.tnsModeCalcul ?? "—"}\` |`);
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
      L(`| ✓ | Libellé | Type | TVA CA % | Tx marge % | N | N+1 | N+2 |`);
      L(`| :---: | --- | --- | ---: | ---: | ---: | ---: | ---: |`);
      for (const a of acts0) {
        const ok = a.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${a.libelle} | ${a.typeActivite} | ${n(a.tauxTVA)} % | ${n(a.tauxMarge)} % | ${fmt(n(a.montantN))} | ${fmt(n(a.montantN1))} | ${fmt(n(a.montantN2))} |`);
      }
      // Saisonnalité CA non-uniforme
      const isUniform = (pcts: number[]) => pcts.slice(0, 12).every(p => Math.abs(p - 100 / 12) < 0.6);
      const actsAvecSaison = acts0.filter(a => {
        if (!a.saisonnaliteCA) return false;
        const raw = a.saisonnaliteCA as Record<string, number[]>;
        const pcts = raw["N"] ?? raw["N1"] ?? raw["N2"];
        return Array.isArray(pcts) && pcts.length >= 12 && !isUniform(pcts as number[]);
      });
      if (actsAvecSaison.length > 0) {
        L(``);
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
    L(`| ✓ | Libellé | Taux comm. % | TVA comm. % | N | N+1 | N+2 |`);
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
      L(`| ✓ | Libellé | Catégorie | Fréq. | TVA % | N | N+1 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | ---: | ---: | ---: |`);
      for (const c of allChargesExpl) {
        const ok = c.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${c.libelle} | ${c.categorie} | ${c.frequence} | ${n(c.tauxTVA)} % | ${fmt(n(c.montantN))} | ${fmt(n(c.montantN1))} | ${fmt(n(c.montantN2))} |`);
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
      L(`| ✓ | Libellé | Brut N | Cot. sal. % | Cot. pat. % | Coût N | Brut N+1 | Coût N+1 | Brut N+2 | Coût N+2 |`);
      L(`| :---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
      for (const s of data.salaries) {
        const ok = s.actif !== false ? "✅" : "❌";
        const cp = n(s.tauxCotPat) / 100;
        const mn = n(s.montantN); const mn1 = n(s.montantN1); const mn2 = n(s.montantN2);
        L(`| ${ok} | ${s.libelle} | ${fmt(mn)} | ${n(s.tauxCotSal)} % | ${n(s.tauxCotPat)} % | ${fmt(mn * (1 + cp))} | ${fmt(mn1)} | ${fmt(mn1 * (1 + cp))} | ${fmt(mn2)} | ${fmt(mn2 * (1 + cp))} |`);
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
      L(`| ✓ | Libellé | N | N+1 | N+2 |`);
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
      L(`| ✓ | Libellé | Nature | Mode amort. | Date acq. | Montant HT | Durée |`);
      L(`| :---: | --- | --- | --- | --- | ---: | ---: |`);
      for (const i of immobilisations) {
        const ok = i.actif !== false ? "✅" : "❌";
        const dAcq = new Date(String(i.dateAcquisition)).toLocaleDateString("fr-FR");
        L(`| ${ok} | ${i.libelle} | ${i.nature} | ${i.modeAmortissement ?? "LINEAIRE"} | ${dAcq} | ${fmt(n(i.montantHT))} | ${i.dureeAmortissement ?? 0} ans |`);
      }
    }
    L(``);
  }

  // Provisions
  if (data.provisions.length > 0) {
    L(`### Provisions / dotations`);
    L(``);
    L(`| ✓ | Libellé | N | N+1 | N+2 |`);
    L(`| :---: | --- | ---: | ---: | ---: |`);
    for (const p of data.provisions) {
      const ok = p.actif !== false ? "✅" : "❌";
      L(`| ${ok} | ${p.libelle} | ${fmt(n(p.montantN))} | ${fmt(n(p.montantN1))} | ${fmt(n(p.montantN2))} |`);
    }
    L(``);
  }

  // Charges gestion courante + financières + exceptionnelles
  {
    const allAutresCharges = [
      ...data.chargesGestionCourante.map((c) => ({ ...c, _cat: "Gestion courante" })),
      ...data.chargesFinancieres.map((c) => ({ ...c, _cat: "Financière" })),
      ...data.chargesExceptionnelles.map((c) => ({ ...c, _cat: "Exceptionnelle" })),
    ];
    if (allAutresCharges.length > 0) {
      L(`### Autres charges datées`);
      L(``);
      L(`| ✓ | Catégorie | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const c of allAutresCharges) {
        const ok = c.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${c._cat} | ${c.libelle} | ${c.dateN ?? "—"} | ${fmt(n(c.montantN))} | ${c.dateN1 ?? "—"} | ${fmt(n(c.montantN1))} | ${c.dateN2 ?? "—"} | ${fmt(n(c.montantN2))} |`);
      }
      L(``);
    }
  }

  // Reprises sur provisions
  if (data.reprisesProduits.length > 0) {
    L(`### Reprises sur provisions`);
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
    const allAutresProduits = [
      ...data.gestionCouranteProduits.map((p) => ({ ...p, _cat: "Gestion courante" })),
      ...data.financiersProduits.map((p) => ({ ...p, _cat: "Financier" })),
      ...data.exceptionnelsProduits.map((p) => ({ ...p, _cat: "Exceptionnel" })),
      ...data.transfertsProduits.map((p) => ({ ...p, _cat: "Transfert de charges" })),
    ];
    if (allAutresProduits.length > 0) {
      L(`### Autres produits datés`);
      L(``);
      L(`| ✓ | Catégorie | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |`);
      L(`| :---: | --- | --- | --- | ---: | --- | ---: | --- | ---: |`);
      for (const p of allAutresProduits) {
        const ok = p.actif !== false ? "✅" : "❌";
        L(`| ${ok} | ${p._cat} | ${p.libelle} | ${p.dateN ?? "—"} | ${fmt(n(p.montantN))} | ${p.dateN1 ?? "—"} | ${fmt(n(p.montantN1))} | ${p.dateN2 ?? "—"} | ${fmt(n(p.montantN2))} |`);
      }
      L(``);
    }
  }

  // Emprunts
  {
    L(`### Emprunts`);
    L(``);
    if (data.emprunts.length === 0) {
      L(`> *(aucun)*`);
    } else {
      L(`| Libellé | Montant | Taux % | Assur. % | Durée | Déblocage | Différé |`);
      L(`| --- | ---: | ---: | ---: | ---: | --- | :--- |`);
      for (const e of data.emprunts) {
        const dDeb = new Date(String(e.dateDéblocage)).toLocaleDateString("fr-FR");
        const differe = e.dureeDiffereEnMois > 0 ? `${e.dureeDiffereEnMois} mois (${e.typeDiffere})` : "—";
        L(`| ${e.libelle} | ${fmt(n(e.montant))} | ${n(e.tauxAnnuel)} % | ${n(e.tauxAssurance)} % | ${e.dureeEnMois} mois | ${dDeb} | ${differe} |`);
      }
    }
    L(``);
  }

  // ── 1. COMPTE DE RÉSULTAT OFFICIEL (= écran) ───────────────────────────────
  L(section2("Données calculées"));
  L(`> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.`);
  L(``);

  // ── 1a. Vue synthétique ────────────────────────────────────────────────────
  L(section("Compte de résultat — Synthèse (= écran)"));
  L(headerPct(y1L, y2L, y3L));

  // Produits d'exploitation
  L(`| **PRODUITS D'EXPLOITATION** | | | | | | |`);
  L(rowPct("Chiffre d'affaires",         fc.ca,                     pctAcc(fc.ca),                     { bold: true }));
  if (fc.commissionsTotal.y1 || fc.commissionsTotal.y2 || fc.commissionsTotal.y3)
    L(rowPct("Commissions",              fc.commissionsTotal,        pctAcc(fc.commissionsTotal)));
  if (fc.prodImmo.y1 || fc.prodImmo.y2 || fc.prodImmo.y3)
    L(rowPct("Productions immobilisées", fc.prodImmo,                pctAcc(fc.prodImmo)));
  if (fc.subventions.y1 || fc.subventions.y2 || fc.subventions.y3)
    L(rowPct("Subventions d'exploitation", fc.subventions,           pctAcc(fc.subventions)));
  if (fc.reprises.y1 || fc.reprises.y2 || fc.reprises.y3)
    L(rowPct("Reprises sur provisions",  fc.reprises,                pctAcc(fc.reprises)));
  if (fc.transferts.y1 || fc.transferts.y2 || fc.transferts.y3)
    L(rowPct("Transferts de charges",    fc.transferts,              pctAcc(fc.transferts)));
  if (fc.autresProdGestion.y1 || fc.autresProdGestion.y2 || fc.autresProdGestion.y3)
    L(rowPct("Autres produits gestion",  fc.autresProdGestion,       pctAcc(fc.autresProdGestion)));
  L(rowPct("**= Total produits exploitation**", fc.totalProduitsExpl, pctAcc(fc.totalProduitsExpl), { bold: true }));

  L(``);
  L(sepPct());

  // Charges d'exploitation
  L(`| **CHARGES D'EXPLOITATION** | | | | | | |`);
  if (fc.achatsEffectues.y1 || fc.achatsEffectues.y2 || fc.achatsEffectues.y3)
    L(rowPct("Achats effectués",          fc.achatsEffectues,         pctAcc(fc.achatsEffectues)));
  const varStockDisplay: YAcc = { y1: -fc.varStock.y1, y2: -fc.varStock.y2, y3: -fc.varStock.y3 };
  if (varStockDisplay.y1 || varStockDisplay.y2 || varStockDisplay.y3)
    L(rowPct("Variation de stocks",       varStockDisplay,            pctAcc(varStockDisplay)));
  if (fc.achatsConsommes.y1 || fc.achatsConsommes.y2 || fc.achatsConsommes.y3)
    L(rowPct("  dont Achats consommés",   fc.achatsConsommes,         pctAcc(fc.achatsConsommes)));
  if (fc.fournitures.y1 || fc.fournitures.y2 || fc.fournitures.y3)
    L(rowPct("Fournitures consommables",  fc.fournitures,             pctAcc(fc.fournitures)));
  if (fc.services.y1 || fc.services.y2 || fc.services.y3)
    L(rowPct("Services extérieurs",       fc.services,                pctAcc(fc.services)));
  const chargesExtTot: YAcc = {
    y1: fc.achatsEffectues.y1 - fc.varStock.y1 + fc.fournitures.y1 + fc.services.y1,
    y2: fc.achatsEffectues.y2 - fc.varStock.y2 + fc.fournitures.y2 + fc.services.y2,
    y3: fc.achatsEffectues.y3 - fc.varStock.y3 + fc.fournitures.y3 + fc.services.y3,
  };
  L(rowPct("**= Charges externes (Total)**", chargesExtTot,          pctAcc(chargesExtTot),            { bold: true }));
  L(rowPct("Impôts et taxes",               fc.impotsTaxes,           pctAcc(fc.impotsTaxes)));
  L(rowPct("Salaires bruts (salariés)",     fc.chargesPersonnel.salairesBruts, pctAcc(fc.chargesPersonnel.salairesBruts)));
  L(rowPct("Charges sociales (salariés)",   fc.chargesPersonnel.chargesPatronales, pctAcc(fc.chargesPersonnel.chargesPatronales)));
  L(rowPct("Rémunération dirigeant",        fc.chargesPersonnel.remuDirigeant, pctAcc(fc.chargesPersonnel.remuDirigeant)));
  if (fc.chargesPersonnel.cotisationsTNSTotal.y1 || fc.chargesPersonnel.cotisationsTNSTotal.y2 || fc.chargesPersonnel.cotisationsTNSTotal.y3)
    L(rowPct("Cotisations TNS",             fc.chargesPersonnel.cotisationsTNSTotal, pctAcc(fc.chargesPersonnel.cotisationsTNSTotal)));
  if (fc.chargesPersonnel.taxesSalairesTotal.y1 || fc.chargesPersonnel.taxesSalairesTotal.y2 || fc.chargesPersonnel.taxesSalairesTotal.y3)
    L(rowPct("Taxes salaires",              fc.chargesPersonnel.taxesSalairesTotal, pctAcc(fc.chargesPersonnel.taxesSalairesTotal)));
  L(rowPct("**= Charges personnel (Total)**", fc.chargesPersonnel.total, pctAcc(fc.chargesPersonnel.total), { bold: true }));
  L(rowPct("Dotations aux amortissements", fc.dotationsAmort,          pctAcc(fc.dotationsAmort)));
  if (fc.dotationsProvisions.y1 || fc.dotationsProvisions.y2 || fc.dotationsProvisions.y3)
    L(rowPct("Dotations sur provisions",    fc.dotationsProvisions,    pctAcc(fc.dotationsProvisions)));
  if (fc.autresChargesGestion.y1 || fc.autresChargesGestion.y2 || fc.autresChargesGestion.y3)
    L(rowPct("Autres charges gestion",      fc.autresChargesGestion,   pctAcc(fc.autresChargesGestion)));
  const totalChargesExpl: YAcc = {
    y1: fc.totalProduitsExpl.y1 - fc.resExpl.y1,
    y2: fc.totalProduitsExpl.y2 - fc.resExpl.y2,
    y3: fc.totalProduitsExpl.y3 - fc.resExpl.y3,
  };
  L(rowPct("**= Total charges exploitation**", totalChargesExpl,      pctAcc(totalChargesExpl),         { bold: true }));

  L(``);
  L(sepPct());
  L(rowPct("**= Résultat d'exploitation**", fc.resExpl,               pctAcc(fc.resExpl),               { bold: true }));

  L(``);
  L(sepPct());

  // Résultat financier
  L(`| **RÉSULTAT FINANCIER** | | | | | | |`);
  if (fc.produitsFinanciers.y1 || fc.produitsFinanciers.y2 || fc.produitsFinanciers.y3)
    L(rowPct("Produits financiers",       fc.produitsFinanciers,      pctAcc(fc.produitsFinanciers)));
  const chargesFinTotal: YAcc = {
    y1: fc.interetsEmprunts.y1 + fc.fraisDossierEmprunts.y1 + fc.autresChargesFinancieres.y1,
    y2: fc.interetsEmprunts.y2 + fc.fraisDossierEmprunts.y2 + fc.autresChargesFinancieres.y2,
    y3: fc.interetsEmprunts.y3 + fc.fraisDossierEmprunts.y3 + fc.autresChargesFinancieres.y3,
  };
  if (chargesFinTotal.y1 || chargesFinTotal.y2 || chargesFinTotal.y3) {
    L(rowPct("Charges financières (Total)", chargesFinTotal,          pctAcc(chargesFinTotal)));
    if (fc.interetsEmprunts.y1 || fc.interetsEmprunts.y2 || fc.interetsEmprunts.y3)
      L(rowPct("  dont Intérêts emprunts",  fc.interetsEmprunts,      pctAcc(fc.interetsEmprunts)));
    if (fc.fraisDossierEmprunts.y1 || fc.fraisDossierEmprunts.y2 || fc.fraisDossierEmprunts.y3)
      L(rowPct("  dont Frais dossier",      fc.fraisDossierEmprunts,  pctAcc(fc.fraisDossierEmprunts)));
    if (fc.autresChargesFinancieres.y1 || fc.autresChargesFinancieres.y2 || fc.autresChargesFinancieres.y3)
      L(rowPct("  dont Autres ch. fin.",    fc.autresChargesFinancieres, pctAcc(fc.autresChargesFinancieres)));
  }
  L(rowPct("**= Résultat financier**",    fc.resFin,                  pctAcc(fc.resFin),                { bold: true }));
  L(rowPct("**= Résultat courant**",      fc.resCourant,              pctAcc(fc.resCourant),            { bold: true }));

  L(``);
  L(sepPct());

  // Résultat exceptionnel
  const produitsExcep: YAcc = {
    y1: rows.prodExcepRows.reduce((s, r) => s + r.montantN, 0),
    y2: rows.prodExcepRows.reduce((s, r) => s + r.montantN1, 0),
    y3: rows.prodExcepRows.reduce((s, r) => s + r.montantN2, 0),
  };
  const chargesExcep: YAcc = {
    y1: rows.chargesExcepRows.reduce((s, r) => s + r.montantN, 0),
    y2: rows.chargesExcepRows.reduce((s, r) => s + r.montantN1, 0),
    y3: rows.chargesExcepRows.reduce((s, r) => s + r.montantN2, 0),
  };
  if (produitsExcep.y1 || produitsExcep.y2 || produitsExcep.y3 || chargesExcep.y1 || chargesExcep.y2 || chargesExcep.y3) {
    L(`| **RÉSULTAT EXCEPTIONNEL** | | | | | | |`);
    if (produitsExcep.y1 || produitsExcep.y2 || produitsExcep.y3)
      L(rowPct("Produits exceptionnels",   produitsExcep,             pctAcc(produitsExcep)));
    if (chargesExcep.y1 || chargesExcep.y2 || chargesExcep.y3)
      L(rowPct("Charges exceptionnelles",  chargesExcep,              pctAcc(chargesExcep)));
    L(rowPct("**= Résultat exceptionnel**", fc.resExcep,              pctAcc(fc.resExcep),              { bold: true }));
    L(``);
    L(sepPct());
  }

  if (fc.ajustementNet.y1 || fc.ajustementNet.y2 || fc.ajustementNet.y3)
    L(rowPct("Ajustement fiscal net",      fc.ajustementNet,          pctAcc(fc.ajustementNet)));
  if (isIS)
    L(rowPct("— IS",                       fc.isParAnnee,             pctAcc(fc.isParAnnee)));
  L(rowPct("**= Résultat net**",           fc.resNet,                 pctAcc(fc.resNet),                { bold: true }));
  L(``);

  // ── 1b. Vérifications de cohérence ────────────────────────────────────────
  L(section("Vérifications de cohérence"));

  // ResExpl recalculé
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
  const resExplOk = eq(resExplEcart.y1, 0) && eq(resExplEcart.y2, 0) && eq(resExplEcart.y3, 0);

  L(header(y1L, y2L, y3L));
  L(row("Total produits expl. (fc)",                   fc.totalProduitsExpl));
  L(row("Total charges expl. (recalc)",                totalChargesExpl));
  L(row("ResExpl (fc)",                                fc.resExpl));
  L(row("ResExpl recalculé (Prod − Charges)",          resExplRecalc));
  L(row("**Écart ResExpl**",                           resExplEcart,
    { bold: true, note: resExplOk ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ResFin recalculé
  const resFinRecalc: YAcc = {
    y1: fc.produitsFinanciers.y1 - chargesFinTotal.y1,
    y2: fc.produitsFinanciers.y2 - chargesFinTotal.y2,
    y3: fc.produitsFinanciers.y3 - chargesFinTotal.y3,
  };
  const resFinEcart: YAcc = {
    y1: fc.resFin.y1 - resFinRecalc.y1,
    y2: fc.resFin.y2 - resFinRecalc.y2,
    y3: fc.resFin.y3 - resFinRecalc.y3,
  };
  const resFinOk = eq(resFinEcart.y1, 0) && eq(resFinEcart.y2, 0) && eq(resFinEcart.y3, 0);
  L(row("ProduitsFinanciers (fc)",                     fc.produitsFinanciers));
  L(row("ChargesFinancières (Intérêts+Frais+Autres)",  chargesFinTotal));
  L(row("ResFin (fc)",                                 fc.resFin));
  L(row("ResFin recalculé (ProdFin − ChargesFin)",     resFinRecalc));
  L(row("**Écart ResFin**",                            resFinEcart,
    { bold: true, note: resFinOk ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ResCourant = ResExpl + ResFin
  const resCourantRecalc: YAcc = {
    y1: fc.resExpl.y1 + fc.resFin.y1,
    y2: fc.resExpl.y2 + fc.resFin.y2,
    y3: fc.resExpl.y3 + fc.resFin.y3,
  };
  const resCourantEcart: YAcc = {
    y1: fc.resCourant.y1 - resCourantRecalc.y1,
    y2: fc.resCourant.y2 - resCourantRecalc.y2,
    y3: fc.resCourant.y3 - resCourantRecalc.y3,
  };
  const resCourantOk = eq(resCourantEcart.y1, 0) && eq(resCourantEcart.y2, 0) && eq(resCourantEcart.y3, 0);
  L(row("ResExpl (fc)",                                fc.resExpl));
  L(row("ResFin (fc)",                                 fc.resFin));
  L(row("ResCourant (fc)",                             fc.resCourant));
  L(row("ResCourant recalculé (ResExpl + ResFin)",     resCourantRecalc));
  L(row("**Écart ResCourant**",                        resCourantEcart,
    { bold: true, note: resCourantOk ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ResNet = ResCourant + ResExcep + AjustNet − IS
  const resNetRecalc: YAcc = {
    y1: fc.resCourant.y1 + fc.resExcep.y1 + fc.ajustementNet.y1 - fc.isParAnnee.y1,
    y2: fc.resCourant.y2 + fc.resExcep.y2 + fc.ajustementNet.y2 - fc.isParAnnee.y2,
    y3: fc.resCourant.y3 + fc.resExcep.y3 + fc.ajustementNet.y3 - fc.isParAnnee.y3,
  };
  const resNetEcart: YAcc = {
    y1: fc.resNet.y1 - resNetRecalc.y1,
    y2: fc.resNet.y2 - resNetRecalc.y2,
    y3: fc.resNet.y3 - resNetRecalc.y3,
  };
  const resNetOk = eq(resNetEcart.y1, 0) && eq(resNetEcart.y2, 0) && eq(resNetEcart.y3, 0);
  L(row("ResCourant (fc)",                             fc.resCourant));
  L(row("ResExcep (fc)",                               fc.resExcep));
  if (fc.ajustementNet.y1 || fc.ajustementNet.y2 || fc.ajustementNet.y3)
    L(row("AjustementNet (fc)",                        fc.ajustementNet));
  if (isIS)
    L(row("IS (fc)",                                   fc.isParAnnee));
  L(row("ResNet (fc)",                                 fc.resNet));
  L(row("ResNet recalculé",                            resNetRecalc));
  L(row("**Écart ResNet**",                            resNetEcart,
    { bold: true, note: resNetOk ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ── 2. DÉTAIL PAR LIGNE — PRODUITS ────────────────────────────────────────
  L(section("Détail Produits d'exploitation"));

  // CA par activité
  L(`#### CA par activité`);
  L(``);
  L(header(y1L, y2L, y3L));
  let totalCA: YAcc = { ...zero };
  for (const r of rows.caRows) {
    totalCA = { y1: totalCA.y1 + r.montantN, y2: totalCA.y2 + r.montantN1, y3: totalCA.y3 + r.montantN2 };
    L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
  }
  L(row("**= Total CA**", totalCA, { bold: true }));
  L(row("fc.ca", fc.ca, { note: eq(totalCA.y1, fc.ca.y1) && eq(totalCA.y2, fc.ca.y2) && eq(totalCA.y3, fc.ca.y3) ? "✅" : "❌ ÉCART" }));
  L(``);

  if (rows.commissionRows.length > 0) {
    L(`#### Commissions`);
    L(``);
    L(header(y1L, y2L, y3L));
    for (const r of rows.commissionRows) {
      L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
    }
    L(row("**= Total commissions**", fc.commissionsTotal, { bold: true }));
    L(``);
  }

  // ── 3. DÉTAIL PAR LIGNE — ACHATS / CHARGES ────────────────────────────────
  L(section("Détail Achats et Charges d'exploitation"));

  // Achats effectués par activité
  L(`#### Achats effectués par activité`);
  L(``);
  L(`> Achats effectués = Achats consommés + Variation de stocks + Achats ponctuels`);
  L(``);
  L(header(y1L, y2L, y3L));
  let totalAchats: YAcc = { ...zero };
  for (const r of rows.achatsRows) {
    totalAchats = { y1: totalAchats.y1 + r.montantN, y2: totalAchats.y2 + r.montantN1, y3: totalAchats.y3 + r.montantN2 };
    L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
  }
  L(row("**Σ achats lignes drill-down**", totalAchats, { bold: true }));
  L(row("fc.achatsEffectues", fc.achatsEffectues,
    { note: eq(totalAchats.y1, fc.achatsEffectues.y1) && eq(totalAchats.y2, fc.achatsEffectues.y2) && eq(totalAchats.y3, fc.achatsEffectues.y3) ? "✅" : "❌ ÉCART" }));
  L(row("fc.achatsConsommes (HT)", fc.achatsConsommes));
  L(row("fc.varStock (nette)", fc.varStock));
  L(row("fc.achatsEffectues (= consommés + ΔStock)", fc.achatsEffectues));
  L(``);

  // Fournitures par ligne
  if (rows.fournituresRows.length > 0) {
    L(`#### Fournitures consommables`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totF: YAcc = { ...zero };
    for (const r of rows.fournituresRows) {
      totF = { y1: totF.y1 + r.montantN, y2: totF.y2 + r.montantN1, y3: totF.y3 + r.montantN2 };
      L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
    }
    L(row("**Σ fournitures**", totF, { bold: true }));
    L(row("fc.fournitures", fc.fournitures,
      { note: eq(totF.y1, fc.fournitures.y1) && eq(totF.y2, fc.fournitures.y2) && eq(totF.y3, fc.fournitures.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  // Services par ligne
  if (rows.servicesRows.length > 0) {
    L(`#### Services extérieurs`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totS: YAcc = { ...zero };
    for (const r of rows.servicesRows) {
      totS = { y1: totS.y1 + r.montantN, y2: totS.y2 + r.montantN1, y3: totS.y3 + r.montantN2 };
      L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
    }
    L(row("**Σ services**", totS, { bold: true }));
    L(row("fc.services", fc.services,
      { note: eq(totS.y1, fc.services.y1) && eq(totS.y2, fc.services.y2) && eq(totS.y3, fc.services.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  // Impôts et taxes
  if (rows.impotsRows.length > 0) {
    L(`#### Impôts et taxes`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totI: YAcc = { ...zero };
    for (const r of rows.impotsRows) {
      totI = { y1: totI.y1 + r.montantN, y2: totI.y2 + r.montantN1, y3: totI.y3 + r.montantN2 };
      L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
    }
    L(row("**Σ impôts et taxes**", totI, { bold: true }));
    L(row("fc.impotsTaxes", fc.impotsTaxes,
      { note: eq(totI.y1, fc.impotsTaxes.y1) && eq(totI.y2, fc.impotsTaxes.y2) && eq(totI.y3, fc.impotsTaxes.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  // ── 4. DÉTAIL CHARGES DE PERSONNEL ────────────────────────────────────────
  L(section("Détail Charges de personnel"));
  L(header(y1L, y2L, y3L));

  // Salariés
  let totSalBrut: YAcc = { ...zero };
  let totCotPat: YAcc = { ...zero };
  for (const s of data.salaries.filter(s => s.actif !== false)) {
    const cp = n(s.tauxCotPat) / 100;
    const mn = n(s.montantN); const mn1 = n(s.montantN1); const mn2 = n(s.montantN2);
    totSalBrut = { y1: totSalBrut.y1 + mn, y2: totSalBrut.y2 + mn1, y3: totSalBrut.y3 + mn2 };
    totCotPat  = { y1: totCotPat.y1 + mn * cp, y2: totCotPat.y2 + mn1 * cp, y3: totCotPat.y3 + mn2 * cp };
  }
  L(row("Salaires bruts (Σ salariés)", totSalBrut));
  L(row("fc.salairesBruts", fc.chargesPersonnel.salairesBruts,
    { note: eq(totSalBrut.y1, fc.chargesPersonnel.salairesBruts.y1) && eq(totSalBrut.y2, fc.chargesPersonnel.salairesBruts.y2) && eq(totSalBrut.y3, fc.chargesPersonnel.salairesBruts.y3) ? "✅" : "❌ ÉCART" }));
  L(row("Charges patronales recalc (Σ brut × taux)", totCotPat));
  L(row("fc.chargesPatronales", fc.chargesPersonnel.chargesPatronales,
    { note: eq(totCotPat.y1, fc.chargesPersonnel.chargesPatronales.y1) && eq(totCotPat.y2, fc.chargesPersonnel.chargesPatronales.y2) && eq(totCotPat.y3, fc.chargesPersonnel.chargesPatronales.y3) ? "✅" : "❌ ÉCART" }));

  // Dirigeants
  let totDirigeant: YAcc = { ...zero };
  for (const d of data.dirigeants.filter(d => d.actif !== false)) {
    totDirigeant = { y1: totDirigeant.y1 + n(d.montantN), y2: totDirigeant.y2 + n(d.montantN1), y3: totDirigeant.y3 + n(d.montantN2) };
  }
  if (totDirigeant.y1 || totDirigeant.y2 || totDirigeant.y3) {
    L(row("Rémunérations dirigeants (Σ)", totDirigeant));
    L(row("fc.remuDirigeant", fc.chargesPersonnel.remuDirigeant,
      { note: eq(totDirigeant.y1, fc.chargesPersonnel.remuDirigeant.y1) && eq(totDirigeant.y2, fc.chargesPersonnel.remuDirigeant.y2) && eq(totDirigeant.y3, fc.chargesPersonnel.remuDirigeant.y3) ? "✅" : "❌ ÉCART" }));
  }

  // Cotisations TNS
  let totCotTNS: YAcc = { ...zero };
  for (const c of data.cotisationsTNS.filter(c => c.actif !== false)) {
    totCotTNS = { y1: totCotTNS.y1 + n(c.montantN), y2: totCotTNS.y2 + n(c.montantN1), y3: totCotTNS.y3 + n(c.montantN2) };
  }
  if (totCotTNS.y1 || totCotTNS.y2 || totCotTNS.y3) {
    L(row("Cotisations TNS (Σ)", totCotTNS));
    L(row("fc.cotisationsTNSTotal", fc.chargesPersonnel.cotisationsTNSTotal,
      { note: eq(totCotTNS.y1, fc.chargesPersonnel.cotisationsTNSTotal.y1) && eq(totCotTNS.y2, fc.chargesPersonnel.cotisationsTNSTotal.y2) && eq(totCotTNS.y3, fc.chargesPersonnel.cotisationsTNSTotal.y3) ? "✅" : "❌ ÉCART" }));
  }

  // Taxes salaires
  if (fc.chargesPersonnel.taxesSalairesTotal.y1 || fc.chargesPersonnel.taxesSalairesTotal.y2 || fc.chargesPersonnel.taxesSalairesTotal.y3) {
    L(row("fc.taxesSalairesTotal", fc.chargesPersonnel.taxesSalairesTotal));
  }

  L(row("**= fc.chargesPersonnel.total**", fc.chargesPersonnel.total, { bold: true }));

  // Vérification total personnel
  const personnelRecalc: YAcc = {
    y1: fc.chargesPersonnel.salairesBruts.y1 + fc.chargesPersonnel.chargesPatronales.y1 + fc.chargesPersonnel.remuDirigeant.y1 + fc.chargesPersonnel.cotisationsTNSTotal.y1 + fc.chargesPersonnel.taxesSalairesTotal.y1,
    y2: fc.chargesPersonnel.salairesBruts.y2 + fc.chargesPersonnel.chargesPatronales.y2 + fc.chargesPersonnel.remuDirigeant.y2 + fc.chargesPersonnel.cotisationsTNSTotal.y2 + fc.chargesPersonnel.taxesSalairesTotal.y2,
    y3: fc.chargesPersonnel.salairesBruts.y3 + fc.chargesPersonnel.chargesPatronales.y3 + fc.chargesPersonnel.remuDirigeant.y3 + fc.chargesPersonnel.cotisationsTNSTotal.y3 + fc.chargesPersonnel.taxesSalairesTotal.y3,
  };
  const personnelEcart: YAcc = {
    y1: fc.chargesPersonnel.total.y1 - personnelRecalc.y1,
    y2: fc.chargesPersonnel.total.y2 - personnelRecalc.y2,
    y3: fc.chargesPersonnel.total.y3 - personnelRecalc.y3,
  };
  const personnelOk = eq(personnelEcart.y1, 0) && eq(personnelEcart.y2, 0) && eq(personnelEcart.y3, 0);
  L(row("Personnel recalculé (Σ composantes)", personnelRecalc));
  L(row("**Écart personnel**", personnelEcart,
    { bold: true, note: personnelOk ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ── 5. DÉTAIL AMORTISSEMENTS ───────────────────────────────────────────────
  L(section("Détail dotations aux amortissements"));
  L(`> Méthode : \`distribuerAmortParExercice\` — respecte AUCUN / LINEAIRE / DEGRESSIF.`);
  L(``);
  L(`| Libellé | Nature | Mode | Durée | Montant HT | Dot ${y1L} | Dot ${y2L} | Dot ${y3L} |`);
  L(`| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |`);
  const dotManuel: YAcc = { ...zero };
  const dotParNatureManuel: Record<string, YAcc> = {
    CORPOREL:   { ...zero },
    INCORPOREL: { ...zero },
    FINANCIER:  { ...zero },
  };
  for (const immo of immobilisationsActives) {
    const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const mode = String(immo.modeAmortissement ?? "LINEAIRE");
    dotManuel.y1 += dot.y1;
    dotManuel.y2 += dot.y2;
    dotManuel.y3 += dot.y3;
    const nature = immo.nature as string;
    if (dotParNatureManuel[nature]) {
      dotParNatureManuel[nature]!.y1 += dot.y1;
      dotParNatureManuel[nature]!.y2 += dot.y2;
      dotParNatureManuel[nature]!.y3 += dot.y3;
    }
    L(`| ${immo.libelle} | ${nature} | ${mode} | ${immo.dureeAmortissement ?? 0} ans | ${fmt(n(immo.montantHT))} | ${fmt(dot.y1)} | ${fmt(dot.y2)} | ${fmt(dot.y3)} |`);
  }
  L(``);
  L(header(y1L, y2L, y3L));
  L(row("Σ distribuerAmort (recalc)", dotManuel));
  L(row("fc.dotationsAmort", fc.dotationsAmort,
    { note: eq(dotManuel.y1, fc.dotationsAmort.y1) && eq(dotManuel.y2, fc.dotationsAmort.y2) && eq(dotManuel.y3, fc.dotationsAmort.y3) ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  if (dotParNatureManuel["CORPOREL"] && (dotParNatureManuel["CORPOREL"].y1 || dotParNatureManuel["CORPOREL"].y2 || dotParNatureManuel["CORPOREL"].y3))
    L(row("  dont Corporel", dotParNatureManuel["CORPOREL"]!));
  if (dotParNatureManuel["INCORPOREL"] && (dotParNatureManuel["INCORPOREL"].y1 || dotParNatureManuel["INCORPOREL"].y2 || dotParNatureManuel["INCORPOREL"].y3))
    L(row("  dont Incorporel", dotParNatureManuel["INCORPOREL"]!));
  if (dotParNatureManuel["FINANCIER"] && (dotParNatureManuel["FINANCIER"].y1 || dotParNatureManuel["FINANCIER"].y2 || dotParNatureManuel["FINANCIER"].y3))
    L(row("  dont Financier", dotParNatureManuel["FINANCIER"]!));
  L(``);

  // ── 6. DÉTAIL CHARGES FINANCIÈRES (PAR EMPRUNT) ────────────────────────────
  L(section("Détail charges financières (par emprunt)"));
  L(`> Intérêts + assurances affectés par exercice via l'échéancier.`);
  L(``);

  // Intérêts + assurances
  if (rows.interetsParEmprunt.length > 0) {
    L(`#### Intérêts et assurances`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totInterets: YAcc = { ...zero };
    for (const e of rows.interetsParEmprunt) {
      totInterets = { y1: totInterets.y1 + e.y1, y2: totInterets.y2 + e.y2, y3: totInterets.y3 + e.y3 };
      L(row(e.libelle, { y1: e.y1, y2: e.y2, y3: e.y3 }));
    }
    L(row("**Σ intérêts emprunts**", totInterets, { bold: true }));
    L(row("fc.interetsEmprunts", fc.interetsEmprunts,
      { note: eq(totInterets.y1, fc.interetsEmprunts.y1) && eq(totInterets.y2, fc.interetsEmprunts.y2) && eq(totInterets.y3, fc.interetsEmprunts.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  // Frais de dossier
  if (rows.fraisDossierParEmprunt.length > 0) {
    L(`#### Frais de dossier`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totFrais: YAcc = { ...zero };
    for (const e of rows.fraisDossierParEmprunt) {
      totFrais = { y1: totFrais.y1 + e.y1, y2: totFrais.y2 + e.y2, y3: totFrais.y3 + e.y3 };
      L(row(e.libelle, { y1: e.y1, y2: e.y2, y3: e.y3 }));
    }
    L(row("**Σ frais de dossier**", totFrais, { bold: true }));
    L(row("fc.fraisDossierEmprunts", fc.fraisDossierEmprunts,
      { note: eq(totFrais.y1, fc.fraisDossierEmprunts.y1) && eq(totFrais.y2, fc.fraisDossierEmprunts.y2) && eq(totFrais.y3, fc.fraisDossierEmprunts.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  // Autres charges financières (saisie manuelle)
  if (rows.autresChargesFinRows.length > 0) {
    L(`#### Autres charges financières (saisie manuelle)`);
    L(``);
    L(header(y1L, y2L, y3L));
    let totAutresFin: YAcc = { ...zero };
    for (const r of rows.autresChargesFinRows) {
      totAutresFin = { y1: totAutresFin.y1 + r.montantN, y2: totAutresFin.y2 + r.montantN1, y3: totAutresFin.y3 + r.montantN2 };
      L(row(r.libelle, { y1: r.montantN, y2: r.montantN1, y3: r.montantN2 }));
    }
    L(row("**Σ autres charges fin.**", totAutresFin, { bold: true }));
    L(row("fc.autresChargesFinancieres", fc.autresChargesFinancieres,
      { note: eq(totAutresFin.y1, fc.autresChargesFinancieres.y1) && eq(totAutresFin.y2, fc.autresChargesFinancieres.y2) && eq(totAutresFin.y3, fc.autresChargesFinancieres.y3) ? "✅" : "❌ ÉCART" }));
    L(``);
  }

  L(header(y1L, y2L, y3L));
  L(row("**= Charges financières (Total)**", chargesFinTotal, { bold: true }));
  L(row("fc.interetsEmprunts",       fc.interetsEmprunts));
  L(row("fc.fraisDossierEmprunts",   fc.fraisDossierEmprunts));
  L(row("fc.autresChargesFinancieres", fc.autresChargesFinancieres));
  L(``);

  // ── 7. IS — DÉTAIL DU CALCUL ──────────────────────────────────────────────
  if (isIS) {
    L(section("IS — Détail du calcul"));
    L(header(y1L, y2L, y3L));
    L(row("Résultat courant",                         fc.resCourant));
    L(row("Résultat exceptionnel",                    fc.resExcep));
    if (fc.ajustementNet.y1 || fc.ajustementNet.y2 || fc.ajustementNet.y3)
      L(row("Ajustement fiscal net",                  fc.ajustementNet));
    const baseImposable: YAcc = {
      y1: fc.resCourant.y1 + fc.resExcep.y1 + fc.ajustementNet.y1,
      y2: fc.resCourant.y2 + fc.resExcep.y2 + fc.ajustementNet.y2,
      y3: fc.resCourant.y3 + fc.resExcep.y3 + fc.ajustementNet.y3,
    };
    L(row("**Base imposable avant IS**",               baseImposable, { bold: true }));
    L(row("IS calculé (fc.isParAnnee)",                fc.isParAnnee));
    L(row("**Résultat net**",                          fc.resNet, { bold: true }));
    const isRecalcCheck: YAcc = {
      y1: baseImposable.y1 - fc.isParAnnee.y1,
      y2: baseImposable.y2 - fc.isParAnnee.y2,
      y3: baseImposable.y3 - fc.isParAnnee.y3,
    };
    const isResNetEcart: YAcc = {
      y1: fc.resNet.y1 - isRecalcCheck.y1,
      y2: fc.resNet.y2 - isRecalcCheck.y2,
      y3: fc.resNet.y3 - isRecalcCheck.y3,
    };
    L(row("Base − IS (= ResNet attendu)", isRecalcCheck));
    L(row("**Écart (fc.resNet vs base−IS)**", isResNetEcart,
      { bold: true, note: eq(isResNetEcart.y1, 0) && eq(isResNetEcart.y2, 0) && eq(isResNetEcart.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE" }));
    L(``);
  }

  // ── 8. CAF — CAPACITÉ D'AUTOFINANCEMENT ────────────────────────────────────
  L(section("Capacité d'autofinancement (CAF)"));
  L(`> CAF = Résultat net + Dotations amort + Dotations provisions − Reprises − PlusValues immo`);
  L(``);
  L(header(y1L, y2L, y3L));
  L(row("Résultat net (fc)",                           fc.resNet));
  L(row("+ Dotations amortissements",                  fc.dotationsAmort));
  if (fc.dotationsProvisions.y1 || fc.dotationsProvisions.y2 || fc.dotationsProvisions.y3)
    L(row("+ Dotations provisions",                    fc.dotationsProvisions));
  if (fc.reprises.y1 || fc.reprises.y2 || fc.reprises.y3)
    L(row("− Reprises sur provisions",                 { y1: -fc.reprises.y1, y2: -fc.reprises.y2, y3: -fc.reprises.y3 }));
  L(row("**= CAF (fc)**",                              fc.caf, { bold: true }));
  const cafRecalc: YAcc = {
    y1: fc.resNet.y1 + fc.dotationsAmort.y1 + fc.dotationsProvisions.y1 - fc.reprises.y1,
    y2: fc.resNet.y2 + fc.dotationsAmort.y2 + fc.dotationsProvisions.y2 - fc.reprises.y2,
    y3: fc.resNet.y3 + fc.dotationsAmort.y3 + fc.dotationsProvisions.y3 - fc.reprises.y3,
  };
  L(row("CAF recalculée (ResNet+AmortDot+ProvDot−Reprises)", cafRecalc));
  const cafEcart: YAcc = {
    y1: fc.caf.y1 - cafRecalc.y1,
    y2: fc.caf.y2 - cafRecalc.y2,
    y3: fc.caf.y3 - cafRecalc.y3,
  };
  L(row("**Écart CAF**", cafEcart,
    { bold: true, note: eq(cafEcart.y1, 0) && eq(cafEcart.y2, 0) && eq(cafEcart.y3, 0) ? "✅ Cohérent" : "❌ DIVERGENCE" }));
  L(``);

  // ── 9. RÉCAPITULATIF DES VÉRIFICATIONS ────────────────────────────────────
  L(section("Récapitulatif des vérifications"));
  L(`| Test | ${y1L} | ${y2L} | ${y3L} | Statut |`);
  L(`| --- | ---: | ---: | ---: | :---: |`);

  const ecartDotAmort: YAcc = {
    y1: dotManuel.y1 - fc.dotationsAmort.y1,
    y2: dotManuel.y2 - fc.dotationsAmort.y2,
    y3: dotManuel.y3 - fc.dotationsAmort.y3,
  };
  const dotAmortOk = eq(ecartDotAmort.y1, 0) && eq(ecartDotAmort.y2, 0) && eq(ecartDotAmort.y3, 0);

  const ecartCATotal: YAcc = {
    y1: totalCA.y1 - fc.ca.y1,
    y2: totalCA.y2 - fc.ca.y2,
    y3: totalCA.y3 - fc.ca.y3,
  };
  const caOk = eq(ecartCATotal.y1, 0) && eq(ecartCATotal.y2, 0) && eq(ecartCATotal.y3, 0);

  const ecartAchatsTotal: YAcc = {
    y1: totalAchats.y1 - fc.achatsEffectues.y1,
    y2: totalAchats.y2 - fc.achatsEffectues.y2,
    y3: totalAchats.y3 - fc.achatsEffectues.y3,
  };
  const achatsOk = eq(ecartAchatsTotal.y1, 0) && eq(ecartAchatsTotal.y2, 0) && eq(ecartAchatsTotal.y3, 0);

  const tests: [string, YAcc, boolean][] = [
    ["CA Σ activités vs fc.ca",                  ecartCATotal,     caOk],
    ["Achats Σ lignes vs fc.achatsEffectues",     ecartAchatsTotal, achatsOk],
    ["Personnel Σ composantes vs fc.total",        personnelEcart,   personnelOk],
    ["Dotations amort Σ immos vs fc.dotationsAmort", ecartDotAmort, dotAmortOk],
    ["ResExpl (fc vs recalc)",                    resExplEcart,     resExplOk],
    ["ResFin (fc vs recalc)",                     resFinEcart,      resFinOk],
    ["ResCourant (fc vs recalc)",                 resCourantEcart,  resCourantOk],
    ["ResNet (fc vs recalc)",                     resNetEcart,      resNetOk],
    ["CAF (fc vs recalc)",                        cafEcart,         eq(cafEcart.y1, 0) && eq(cafEcart.y2, 0) && eq(cafEcart.y3, 0)],
  ];

  for (const [label, ecart, ok] of tests) {
    L(`| ${label} | ${fmt(ecart.y1)} | ${fmt(ecart.y2)} | ${fmt(ecart.y3)} | ${ok ? "✅" : "❌"} |`);
  }
  L(``);

  const allOk = tests.every(([, , ok]) => ok);
  if (allOk) {
    L(`> ✅ **Tous les tests sont cohérents.** Le compte de résultat est valide.`);
  } else {
    L(`> ❌ **Des divergences ont été détectées.** Vérifier les lignes marquées ❌ ci-dessus.`);
  }
  L(``);

  // ── Écriture du fichier ────────────────────────────────────────────────────
  const outPath = join(process.cwd(), "scripts/debug/output", "debug-compte-de-resultat-output.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`\nFichier généré : ${outPath}`);
  console.log(`Tests : ${tests.filter(([, , ok]) => ok).length}/${tests.length} OK`);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
