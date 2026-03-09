"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey4 as TfYearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TfRowValue {
  amount: number;
}

export interface TfRow {
  key: string;
  label: string;
  /** signe affiché dans le libellé : "+", "−", "=" */
  sign: "+" | "−" | "=" | "";
  /** style de rendu */
  style: "normal" | "subtotal" | "highlight" | "section";
  /** masquer si toutes les valeurs sont nulles */
  hideIfZero?: boolean;
  values: Record<TfYearKey, TfRowValue>;
}

export interface TfData {
  yearLabels: Record<TfYearKey, string>;
  rows: TfRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function mkRow(
  key: string,
  label: string,
  sign: TfRow["sign"],
  style: TfRow["style"],
  vals: Record<TfYearKey, number>,
  hideIfZero?: boolean,
): TfRow {
  return {
    key,
    label,
    sign,
    style,
    hideIfZero,
    values: {
      y0: { amount: vals.y0 },
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
  };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchTableauFinancement(
  dossierId: string,
): Promise<TfData> {
  // ── 1. Infos dossier ────────────────────────────────────────────────────────
  const data = await fetchScenarioData(dossierId);
  const {
    dateDemarrage: dateDemarrageDate,
    apports,
    subventions,
    emprunts,
    immobilisations,
  } = data;
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth(); // 0-based

  // Bornes des exercices fiscaux (glissantes à partir de dateDemarrage)
  const exBorne1 = new Date(
    dateDemarrageDate.getFullYear() + 1,
    dateDemarrageDate.getMonth(),
    dateDemarrageDate.getDate(),
  );
  const exBorne2 = new Date(
    dateDemarrageDate.getFullYear() + 2,
    dateDemarrageDate.getMonth(),
    dateDemarrageDate.getDate(),
  );
  const exBorne3 = new Date(
    dateDemarrageDate.getFullYear() + 3,
    dateDemarrageDate.getMonth(),
    dateDemarrageDate.getDate(),
  );

  // Prorata pour répartir les dotations annuelles (année civile) entre exercices
  const pFin = moisDebut === 0 ? 0 : moisDebut / 12;
  const pDeb = 1 - pFin;

  const fmtEx = (start: number) =>
    moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;

  const yearLabels: Record<TfYearKey, string> = {
    y0: "Initial",
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  // ── 2. Scénario par défaut ──────────────────────────────────────────────────

  // ── 4. Helper : mapper une date vers une clé ───────────────────────────────
  // Les éléments datés au plus tard à dateDemarrage (apports, déblocage
  // d'emprunts, acquisitions) vont en y0 (Initial). Le reste de l'année N
  // et les échéances d'emprunt postérieures vont en y1, y2, y3.
  function toKey(date: Date | string): TfYearKey | null {
    const d = date instanceof Date ? date : new Date(date);
    if (d <= dateDemarrageDate) return "y0";
    if (d < exBorne1) return "y1";
    if (d < exBorne2) return "y2";
    if (d < exBorne3) return "y3";
    return null;
  }

  // ── 5. RESSOURCES ──────────────────────────────────────────────────────────

  // Apports en capital (CAPITAL, APPORT_NATURE)
  const apportsCapital: Record<TfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  // Apports en comptes courants (COMPTE_COURANT + prêts d'honneur)
  const apportsCC: Record<TfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

  for (const apport of apports) {
    const k = toKey(apport.dateApport);
    if (!k) continue;
    const montant = n(apport.montant);
    if (apport.type === "CAPITAL" || apport.type === "APPORT_NATURE") {
      apportsCapital[k] += montant;
    } else if (apport.type === "COMPTE_COURANT") {
      apportsCC[k] += montant;
    }
  }

  // Prêts d'honneur (subventions de type PRET_HONNEUR)
  for (const subv of subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const dateRef = subv.dateEncaissement ?? subv.dateObtention;
    if (!dateRef) continue;
    const k = toKey(dateRef);
    if (!k) continue;
    apportsCC[k] += n(subv.montant);
  }

  // Souscription d'emprunts (montant global ; date de déblocage)
  const nouveauxEmprunts: Record<TfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  // Remboursement capital (depuis écheancier)
  const remboursementCapital: Record<TfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

  for (const emprunt of emprunts) {
    const k = toKey(emprunt.dateDéblocage);
    if (k) nouveauxEmprunts[k] += n(emprunt.montant);

    for (const ligne of emprunt.lignesEcheancier) {
      const lk = toKey(ligne.dateEcheance);
      if (lk) remboursementCapital[lk] += n(ligne.capitalRembourse);
    }
  }

  // ── 6. CAF

  const fc = buildFinCalc(data, data.dateDemarrage);

  const caf: Record<TfYearKey, number> = {
    y0: 0,
    y1: fc.caf.y1,
    y2: fc.caf.y2,
    y3: fc.caf.y3,
  };

  // ── 7. EMPLOIS : Immobilisations ────────────────────────────────────────────
  const immoIncorporelles: Record<TfYearKey, number> = {
    y0: 0,
    y1: 0,
    y2: 0,
    y3: 0,
  };
  const immoCorporelles: Record<TfYearKey, number> = {
    y0: 0,
    y1: 0,
    y2: 0,
    y3: 0,
  };

  for (const immo of immobilisations) {
    const k = toKey(immo.dateAcquisition);
    if (!k) continue;
    const montant = n(immo.montantHT);
    if (immo.nature === "INCORPOREL") {
      immoIncorporelles[k] += montant;
    } else {
      // CORPOREL et FINANCIER dans corporelles
      immoCorporelles[k] += montant;
    }
  }

  const totalImmo: Record<TfYearKey, number> = {
    y0: immoIncorporelles.y0 + immoCorporelles.y0,
    y1: immoIncorporelles.y1 + immoCorporelles.y1,
    y2: immoIncorporelles.y2 + immoCorporelles.y2,
    y3: immoIncorporelles.y3 + immoCorporelles.y3,
  };

  // ── 8. Totaux & Fonds de roulement ──────────────────────────────────────────
  const totalRessources: Record<TfYearKey, number> = {
    y0: apportsCapital.y0 + apportsCC.y0 + nouveauxEmprunts.y0 + caf.y0,
    y1: apportsCapital.y1 + apportsCC.y1 + nouveauxEmprunts.y1 + caf.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + nouveauxEmprunts.y2 + caf.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + nouveauxEmprunts.y3 + caf.y3,
  };

  const totalEmplois: Record<TfYearKey, number> = {
    y0: totalImmo.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + remboursementCapital.y3,
  };

  const variationFR: Record<TfYearKey, number> = {
    y0: totalRessources.y0 - totalEmplois.y0,
    y1: totalRessources.y1 - totalEmplois.y1,
    y2: totalRessources.y2 - totalEmplois.y2,
    y3: totalRessources.y3 - totalEmplois.y3,
  };

  // FR cumulatif : sommation des variations
  const fondRoulement: Record<TfYearKey, number> = {
    y0: variationFR.y0,
    y1: variationFR.y0 + variationFR.y1,
    y2: variationFR.y0 + variationFR.y1 + variationFR.y2,
    y3: variationFR.y0 + variationFR.y1 + variationFR.y2 + variationFR.y3,
  };

  // ── 9. Construction des lignes ─────────────────────────────────────────────
  const rows: TfRow[] = [
    // ── Section Ressources ──
    mkRow("section_ressources", "RESSOURCES", "", "section", {
      y0: 0,
      y1: 0,
      y2: 0,
      y3: 0,
    }),
    mkRow(
      "apports_capital",
      "Apports en capital",
      "+",
      "normal",
      apportsCapital,
      true,
    ),
    mkRow(
      "apports_cc",
      "Apports en comptes courants",
      "+",
      "normal",
      apportsCC,
      true,
    ),
    mkRow(
      "nouveaux_emprunts",
      "Souscription d'emprunts",
      "+",
      "normal",
      nouveauxEmprunts,
      true,
    ),
    mkRow("caf", "Capacité d'autofinancement (CAF)", "+", "normal", caf, true),
    mkRow(
      "total_ressources",
      "Total des ressources",
      "=",
      "highlight",
      totalRessources,
    ),

    // ── Section Emplois ──
    mkRow("section_emplois", "EMPLOIS", "", "section", {
      y0: 0,
      y1: 0,
      y2: 0,
      y3: 0,
    }),
    mkRow(
      "immo_incorporelles",
      "Immobilisations incorporelles",
      "+",
      "normal",
      immoIncorporelles,
      true,
    ),
    mkRow(
      "immo_corporelles",
      "Immobilisations corporelles",
      "+",
      "normal",
      immoCorporelles,
      true,
    ),
    mkRow(
      "total_immo",
      "Total immobilisations",
      "=",
      "subtotal",
      totalImmo,
      true,
    ),
    mkRow(
      "remboursement_capital",
      "Remboursement des emprunts",
      "+",
      "normal",
      remboursementCapital,
      true,
    ),
    mkRow(
      "total_emplois",
      "Total des emplois",
      "=",
      "highlight",
      totalEmplois,
    ),

    // ── Section Fonds de roulement ──
    mkRow("section_fr", "FONDS DE ROULEMENT", "", "section", {
      y0: 0,
      y1: 0,
      y2: 0,
      y3: 0,
    }),
    mkRow(
      "variation_fr",
      "Variation du fonds de roulement",
      "=",
      "subtotal",
      variationFR,
    ),
    mkRow(
      "fonds_roulement",
      "Fonds de roulement",
      "=",
      "highlight",
      fondRoulement,
    ),
  ];

  return { yearLabels, rows };
}
