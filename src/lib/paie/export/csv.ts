/**
 * Export CSV des lignes de cotisations d'un bulletin de paie.
 *
 * Format : colonnes séparées par des points-virgules (compatible Excel FR).
 * Encodage : UTF-8 avec BOM pour compatibilité Excel Windows.
 *
 * Colonnes exportées :
 *   Code | Libellé | Famille | Organisme | Assiette | Tranche |
 *   Taux salarié (%) | Taux employeur (%) | Montant salarié (€) | Montant employeur (€) | Déductible
 */

import type { SimulationResultat, SimulationInput, LigneCotisation } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const SEP = ";";
const EOL = "\r\n";
const BOM = "\uFEFF"; // UTF-8 BOM — requis pour Excel FR

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeCsv(v: string | number | boolean): string {
  const s = String(v);
  // Encadrer de guillemets si la valeur contient le séparateur, des guillemets ou des sauts de ligne
  if (s.includes(SEP) || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtEur(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

function fmtPct(v: number): string {
  return (v * 100).toFixed(4).replace(".", ",");
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération du CSV
// ─────────────────────────────────────────────────────────────────────────────

function buildHeader(): string {
  const cols = [
    "Code",
    "Libellé",
    "Famille",
    "Organisme",
    "Assiette (€)",
    "Tranche",
    "Taux salarié (%)",
    "Taux employeur (%)",
    "Montant salarié (€)",
    "Montant employeur (€)",
    "Déductible",
  ];
  return cols.map(escapeCsv).join(SEP);
}

function buildLigneRow(l: LigneCotisation): string {
  return [
    l.code,
    l.libelle,
    l.famille,
    l.organisme,
    fmtEur(l.assiette),
    l.tranche,
    fmtPct(l.tauxSalarie),
    fmtPct(l.tauxEmployeur),
    fmtEur(l.montantSalarie),
    fmtEur(l.montantEmployeur),
    l.deductible ? "Oui" : "Non",
  ]
    .map(escapeCsv)
    .join(SEP);
}

function buildTotauxRows(resultat: SimulationResultat): string {
  const lignesSep = `${SEP.repeat(10)}` + EOL;
  const rows = [
    lignesSep,
    ["TOTAL SALARIAL", "", "", "", "", "", "", "", fmtEur(resultat.totalCotisationsSalariales), "", ""]
      .map(escapeCsv).join(SEP),
    ["TOTAL PATRONAL (brut)", "", "", "", "", "", "", "", "", fmtEur(resultat.totalCotisationsPatronales), ""]
      .map(escapeCsv).join(SEP),
    ...(resultat.montantRGDU > 0
      ? [["RGDU (réduction)", "", "", "", "", "", "", "", "", fmtEur(-resultat.montantRGDU), ""]
          .map(escapeCsv).join(SEP)]
      : []),
    EOL,
    ["BRUT SOUMIS", "", "", "", fmtEur(resultat.brutSoumis), "", "", "", "", "", ""]
      .map(escapeCsv).join(SEP),
    ["NET À PAYER", "", "", "", "", "", "", "", "", "", ""]
      .concat([fmtEur(resultat.netAPayer)])
      .slice(0, 1)
      .concat(["", "", "", "", "", "", "", "", fmtEur(resultat.netAPayer), ""])
      .map(escapeCsv).join(SEP),
    ["COÛT EMPLOYEUR", "", "", "", "", "", "", "", "", fmtEur(resultat.coutEmployeur), ""]
      .map(escapeCsv).join(SEP),
  ];
  return rows.join(EOL);
}

/**
 * Génère le contenu CSV complet d'un bulletin.
 *
 * @param input    - Paramètres d'entrée de la simulation
 * @param resultat - Résultat calculé
 */
export function buildBulletinCSV(
  input: SimulationInput,
  resultat: SimulationResultat,
): string {
  const metaRows = [
    `Bulletin de paie simulateur — millésime ${input.millesime ?? "2026"}`,
    `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
    `Brut saisi : ${fmtEur(input.salarié.brutMensuel)} €`,
    "",
  ].join(EOL);

  const header = buildHeader();
  const lignesRows = resultat.lignes.map(buildLigneRow).join(EOL);
  const totaux = buildTotauxRows(resultat);

  return BOM + metaRows + header + EOL + lignesRows + EOL + totaux;
}

// ─────────────────────────────────────────────────────────────────────────────
// Téléchargement côté client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère et télécharge le bulletin au format CSV côté navigateur.
 *
 * @param input    - Paramètres de la simulation
 * @param resultat - Résultat calculé
 * @param filename - Nom du fichier sans extension (défaut : "bulletin-paie")
 */
export function downloadBulletinCSV(
  input: SimulationInput,
  resultat: SimulationResultat,
  filename = "bulletin-paie",
): void {
  const csv = buildBulletinCSV(input, resultat);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
