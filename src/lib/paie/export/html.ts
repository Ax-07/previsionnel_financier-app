/**
 * Générateur HTML pur (TypeScript sans React) pour le bulletin de paie.
 *
 * - Utilisé par la route API `/api/simulateur-paie/export-pdf` (route handler Next.js 15)
 *   pour éviter tout import de `react-dom/server` interdit dans le contexte App Router.
 * - Le composant React `BulletinPdfTemplate.tsx` reste disponible pour la prévisualisation
 *   côté client.
 */

import type { SimulationInput, SimulationResultat, LigneCotisation } from "@/lib/paie/types";
import { CONVENTION_CATALOG } from "@/lib/paie/conventions/catalog";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\u00a0€";
}

function pct(v: number): string {
  return (v * 100).toFixed(4) + "\u00a0%";
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FAMILLE_LABELS: Record<string, string> = {
  assurance_maladie: "Santé",
  assurance_vieillesse: "Assurance vieillesse",
  allocations_familiales: "Allocations familiales",
  assurance_chomage: "Retraite et prévoyance",
  ags: "Garantie salaires (AGS)",
  fnal: "Logement (FNAL)",
  csa: "Solidarité autonomie",
  dialogue_social: "Dialogue social",
  csg_deductible: "CSG déductible",
  csg_non_deductible: "CSG / CRDS non déductible",
  crds: "CRDS",
  at_mp: "Accidents du travail / maladies professionnelles",
  versement_mobilite: "Versement mobilité",
  retraite_complementaire: "Retraite complémentaire (Agirc-Arrco)",
  ceg: "Contribution équilibre général (CEG)",
  cet: "Contribution temporaire (CET)",
  apec: "APEC",  prevoyance_prevoyance: "Prévoyance (Convention collective)",
  prevoyance_mutuelle: "Mutuelle (Convention collective)",  exoneration: "Exonérations",
  rgdu: "Réduction générale (RGDU)",
};

function groupByFamille(lignes: LigneCotisation[]): Map<string, LigneCotisation[]> {
  const map = new Map<string, LigneCotisation[]>();
  for (const ligne of lignes) {
    const arr = map.get(ligne.famille);
    if (arr) arr.push(ligne);
    else map.set(ligne.famille, [ligne]);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .bulletin { max-width: 800px; margin: 0 auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #1a56d5; }
  .header-title { font-size: 18px; font-weight: 700; color: #1a56d5; }
  .header-meta { font-size: 10px; color: #555; text-align: right; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 6px; padding: 3px 6px; background: #f0f4ff; border-left: 3px solid #1a56d5; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #555; text-align: right; padding: 4px 6px; border-bottom: 1px solid #ddd; background: #f9f9f9; }
  th:first-child { text-align: left; }
  td { font-size: 10px; padding: 3px 6px; border-bottom: 1px dotted #eee; text-align: right; vertical-align: top; }
  td:first-child { text-align: left; }
  tr.famille-header td { font-size: 10px; font-weight: 700; background: #f5f5f5; padding: 4px 6px; border-bottom: 1px solid #ddd; }
  tr.exo .montant-sal { color: #16a34a; }
  tr.totaux td { font-weight: 700; border-top: 2px solid #111; background: #f0f4ff; }
  .recap { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .recap-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
  .recap-box .label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
  .recap-box .value { font-size: 16px; font-weight: 700; color: #111; margin-top: 2px; }
  .recap-box.accent { border-color: #1a56d5; background: #f0f4ff; }
  .recap-box.accent .value { color: #1a56d5; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9px; color: #888; text-align: center; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Générateur principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère un document HTML complet représentant le bulletin de paie simulé.
 * Peut être retourné directement depuis un route handler sans React.
 */
export function buildBulletinHtml(
  input: SimulationInput,
  resultat: SimulationResultat,
): string {
  const { salarié, entreprise } = input;
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const millesime = escHtml(input.millesime ?? "2026");

  const lignesNormales = resultat.lignes.filter(
    (l) => l.famille !== "exoneration" && l.famille !== "rgdu",
  );
  const lignesExoneration = resultat.lignes.filter(
    (l) => l.famille === "exoneration" || l.famille === "rgdu",
  );
  const groupes = groupByFamille(lignesNormales);

  // ── Section cotisations ──────────────────────────────────────────────────
  let rowsCotisations = "";
  for (const [famille, lignes] of groupes.entries()) {
    rowsCotisations += `<tr class="famille-header"><td colspan="7">${escHtml(FAMILLE_LABELS[famille] ?? famille)}</td></tr>`;
    for (const l of lignes) {
      rowsCotisations += `
        <tr>
          <td>${escHtml(l.libelle)}</td>
          <td>${escHtml(l.organisme)}</td>
          <td>${eur(l.assiette)}</td>
          <td>${pct(l.tauxSalarie)}</td>
          <td>${eur(l.montantSalarie)}</td>
          <td>${pct(l.tauxEmployeur)}</td>
          <td>${eur(l.montantEmployeur)}</td>
        </tr>`;
    }
  }

  if (lignesExoneration.length > 0) {
    rowsCotisations += `<tr class="famille-header"><td colspan="7">Exonérations et réductions</td></tr>`;
    for (const l of lignesExoneration) {
      rowsCotisations += `
        <tr class="exo">
          <td>${escHtml(l.libelle)}</td>
          <td>${escHtml(l.organisme)}</td>
          <td>${eur(l.assiette)}</td>
          <td>—</td>
          <td class="montant-sal">${eur(l.montantSalarie)}</td>
          <td>—</td>
          <td style="color:#16a34a">${eur(l.montantEmployeur)}</td>
        </tr>`;
    }
  }

  rowsCotisations += `
    <tr class="totaux">
      <td colspan="4">Total cotisations</td>
      <td>${eur(resultat.totalCotisationsSalariales)}</td>
      <td></td>
      <td>${eur(resultat.totalCotisationsPatronales)}</td>
    </tr>`;

  // ── Section Net et fiscalité ─────────────────────────────────────────────
  const avantagesEnNatureVal = salarié.avantagesEnNature ?? 0;
  const avantagesDeductRow = avantagesEnNatureVal > 0
    ? `<tr><td style="color:#dc2626">Avantages en nature</td><td style="color:#dc2626">&minus;${eur(avantagesEnNatureVal)}</td><td></td><td></td></tr>`
    : "";
  const exoHSIRRow = resultat.exonerationHSIR > 0
    ? `<tr><td style="color:#dc2626">Exonération HS / IR <span style="font-size:9px;color:#d97706">(art. 81q CGI)</span></td><td style="color:#dc2626">&minus;${eur(resultat.exonerationHSIR)}</td><td></td><td></td></tr>`
    : "";
  const pasRow = resultat.pas > 0
    ? `<tr><td style="color:#dc2626">Prélèvement à la source${salarié.tauxPAS != null ? ` (${pct(salarié.tauxPAS)})` : ""}</td><td style="color:#dc2626">&minus;${eur(resultat.pas)}</td><td></td><td></td></tr>`
    : "";
  const netSection = `<div class="section">
    <div class="section-title">Net et fiscalité</div>
    <table><tbody>
      <tr><td>Net social</td><td style="font-weight:600">${eur(resultat.netSocial)}</td><td></td><td></td></tr>
      ${avantagesDeductRow}
      ${exoHSIRRow}
      <tr><td style="color:#555">Net imposable</td><td style="color:#555">${eur(resultat.netImposable)}</td><td></td><td></td></tr>
      ${pasRow}
      <tr style="border-top:2px solid #111;background:#f0f4ff"><td style="font-weight:700">Net à payer</td><td style="font-weight:700;color:#1a56d5">${eur(resultat.netAPayer)}</td><td></td><td></td></tr>
    </tbody></table>
  </div>`;

  // ── Lignes rémunération optionnelles ────────────────────────────────────
  const hsSupVal = salarié.heuresSupplementaires ?? 0;
  const heuresNormales = Math.min(salarié.heuresContrat, 151.66669);
  const tauxHoraire = salarié.brutMensuel > 0 ? salarié.brutMensuel / heuresNormales : 0;
  let hsSup = "";
  if (hsSupVal > 0) {
    if (resultat.heuresSupLignes && resultat.heuresSupLignes.length > 0) {
      hsSup = resultat.heuresSupLignes
        .map(l => `<tr><td>${escHtml(l.label)}<br/><span style="font-size:9px;color:#888">${l.heures.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} h &times; ${(100 + l.tauxMajoration * 100).toFixed(0)} % &times; ${eur(tauxHoraire)}/h</span></td><td>${eur(l.montant)}</td><td></td><td></td></tr>`)
        .join("");
    } else {
      hsSup = `<tr><td>Heures supplémentaires</td><td>${eur(resultat.heuresSup ?? 0)}</td><td></td><td></td></tr>`;
    }
  }
  const primes =
    (salarié.primesSoumises ?? 0) > 0
      ? `<tr><td>Primes soumises</td><td>${eur(salarié.primesSoumises ?? 0)}</td><td></td><td></td></tr>`
      : "";
  const avantages =
    (salarié.avantagesEnNature ?? 0) > 0
      ? `<tr><td>Avantages en nature</td><td>${eur(salarié.avantagesEnNature ?? 0)}</td><td></td><td></td></tr>`
      : "";
  // ── Convention collective ───────────────────────────────────────────
  const convMeta = salarié.conventionCode ? CONVENTION_CATALOG.get(salarié.conventionCode) : undefined;
  const convRow = convMeta
    ? `<tr><td>Convention collective</td><td colspan="3">IDCC ${escHtml(salarié.conventionCode ?? "")} — ${escHtml(convMeta.label)}${
        convMeta.statut === "partial" ? " <span style='color:#d97706'>(impl. partielle)</span>" : ""
      }</td></tr>`
    : "";
  const convHeader = convMeta
    ? ` — <strong>CCN IDCC ${escHtml(salarié.conventionCode ?? "")} — ${escHtml(convMeta.label)}</strong>`
    : "";
  // ── Prorata ──────────────────────────────────────────────────────────────
  const prorataLine =
    resultat.facteurProrata < 1
      ? `<div style="margin-top:2px;color:#d97706">Prorata : ${(resultat.facteurProrata * 100).toFixed(1)} %</div>`
      : "";

  // ── Mobilité ────────────────────────────────────────────────────────────
  const mobilite =
    (entreprise.tauxMobilite ?? 0) > 0
      ? `<td>Versement mobilité</td><td>${((entreprise.tauxMobilite ?? 0) * 100).toFixed(3)} %</td>`
      : `<td></td><td></td>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bulletin de paie simulé — ${dateStr}</title>
  <style>${PRINT_CSS}</style>
  <script>window.addEventListener('load', function(){ window.print(); });</script>
</head>
<body>
<div class="bulletin">

  <div class="header">
    <div>
      <div class="header-title">Bulletin de paie simulé</div>
      <div class="header-meta" style="text-align:left;margin-top:4px">
        Millésime ${millesime} — Régime général${salarié.alsaceMoselle ? " + Alsace-Moselle" : ""}${convHeader}
      </div>
    </div>
    <div class="header-meta">
      <div>Généré le ${dateStr}</div>
      <div style="margin-top:2px">Moteur v2.0.0</div>
      ${prorataLine}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Paramètres</div>
    <table><tbody>
      <tr>
        <td>Statut</td><td>${salarié.statut === "cadre" ? "Cadre" : "Non-cadre"}</td>
        <td>Type de contrat</td><td>${escHtml(salarié.typeContrat.toUpperCase())}</td>
      </tr>
      <tr>
        <td>Heures / mois</td><td>${salarié.heuresContrat.toFixed(2)} h</td>
        <td>Effectif entreprise</td><td>${entreprise.effectif} salariés</td>
      </tr>
      <tr>
        <td>Taux AT/MP</td><td>${(entreprise.tauxATMP * 100).toFixed(3)} %</td>
        ${mobilite}
      </tr>
      ${convRow}
    </tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Rémunération brute</div>
    <table><tbody>
      <tr>
        <td>Salaire de base</td><td>${eur(salarié.brutMensuel)}</td>
        <td>Brut soumis</td><td>${eur(resultat.brutSoumis)}</td>
      </tr>
      ${hsSup}
      ${primes}
      ${avantages}
    </tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Cotisations sociales</div>
    <table>
      <thead>
        <tr>
          <th>Nature de la cotisation</th>
          <th>Organisme</th>
          <th>Assiette</th>
          <th>Taux sal.</th>
          <th>Montant sal.</th>
          <th>Taux pat.</th>
          <th>Montant pat.</th>
        </tr>
      </thead>
      <tbody>${rowsCotisations}</tbody>
    </table>
  </div>

  ${netSection}

  <div class="section">
    <div class="section-title">Récapitulatif</div>
    <div class="recap">
      <div class="recap-box accent">
        <div class="label">Net à payer</div>
        <div class="value">${eur(resultat.netAPayer)}</div>
      </div>
      <div class="recap-box">
        <div class="label">Coût total employeur</div>
        <div class="value">${eur(resultat.coutEmployeur)}</div>
      </div>
      <div class="recap-box">
        <div class="label">Charges patronales / brut</div>
        <div class="value">${resultat.tauxCotisationsPatronalesEffectif.toFixed(2)} %</div>
      </div>
      <div class="recap-box">
        <div class="label">RGDU (réduction employeur)</div>
        <div class="value" style="color:#16a34a">${eur(Math.abs(resultat.montantRGDU))}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Simulation à titre indicatif — Paramètres réglementaires ${millesime} —
    Moteur de calcul v2.0.0 — Ne pas utiliser comme bulletin officiel
  </div>

</div>
</body>
</html>`;
}
