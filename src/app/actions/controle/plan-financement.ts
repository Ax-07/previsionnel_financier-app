"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey4 as PfYearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PfRowValue {
  amount: number;
}

export interface PfRow {
  key: string;
  label: string;
  sign: "+" | "−" | "=" | "";
  style: "normal" | "subtotal" | "highlight" | "section";
  hideIfZero?: boolean;
  values: Record<PfYearKey, PfRowValue>;
}

export interface PfData {
  yearLabels: Record<PfYearKey, string>;
  rows: PfRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function mkRow(
  key: string,
  label: string,
  sign: PfRow["sign"],
  style: PfRow["style"],
  vals: Record<PfYearKey, number>,
  hideIfZero?: boolean,
): PfRow {
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

type YAcc3 = { y1: number; y2: number; y3: number };

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchPlanFinancement(dossierId: string): Promise<PfData> {
  // ── 1. Dossier ──────────────────────────────────────────────────────────────
  const data = await fetchScenarioData(dossierId);
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    apports,
    subventions,
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    provisions,
    chargesFinancieres,
    chargesExceptionnelles,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
    subventionsExploitation,
    parametresIS,
    ajustementsFiscaux,
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

  const yearLabels: Record<PfYearKey, string> = {
    y0: "Initial",
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  // ── 2. Scénario par défaut ──────────────────────────────────────────────────

  // ── 4. Helper date → clé ────────────────────────────────────────────
  // Les éléments datés au plus tard à dateDemarrage (apports, déblocage
  // d'emprunts, acquisitions) vont en y0 (Initial). Le reste de l'année N
  // et les échéances d'emprunt postérieures vont en y1, y2, y3.
  function toKey(date: Date | string): PfYearKey | null {
    const d = date instanceof Date ? date : new Date(date);
    if (d <= dateDemarrageDate) return "y0";
    if (d < exBorne1) return "y1";
    if (d < exBorne2) return "y2";
    if (d < exBorne3) return "y3";
    return null;
  }

  // ── 5. RESSOURCES Financement ──────────────────────────────────────────────

  const apportsCapital: Record<PfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const apportsCC: Record<PfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

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

  // Prêts d'honneur
  for (const subv of subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const dateRef = subv.dateEncaissement ?? subv.dateObtention;
    if (!dateRef) continue;
    const k = toKey(dateRef);
    if (!k) continue;
    apportsCC[k] += n(subv.montant);
  }

  const nouveauxEmprunts: Record<PfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const remboursementCapital: Record<PfYearKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

  for (const emprunt of emprunts) {
    const k = toKey(emprunt.dateDéblocage);
    if (k) nouveauxEmprunts[k] += n(emprunt.montant);

    for (const ligne of emprunt.lignesEcheancier) {
      const lk = toKey(ligne.dateEcheance);
      if (lk) remboursementCapital[lk] += n(ligne.capitalRembourse);
    }
  }

  // ── 6. CAF

  const actifsActifs = activites.filter((a) => a.actif !== false);
  const fc = buildFinCalc(data, data.dateDemarrage);

  const caf: Record<PfYearKey, number> = {
    y0: 0,
    y1: fc.caf.y1,
    y2: fc.caf.y2,
    y3: fc.caf.y3,
  };
  // ── 7. BFR et variation du BFR ─────────────────────────────────────────────

  // Stocks de matières (encours)
  const stocksMatieres: YAcc3 = {
    y1: fc.stockFinal.y1,
    y2: fc.stockFinal.y2,
    y3: fc.stockFinal.y3,
  };

  // Dettes fournisseurs
  const achatsRowsBfr = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      coef: Math.max(0, 1 - n(a.tauxMarge) / 100),
      joursFournisseur: n(a.reglementFournisseurs ?? 30),
      tvaAchats: n(a.tvaAchats ?? 20),
    }));

  const dettesFournisseurs: YAcc3 = {
    y1: achatsRowsBfr.reduce(
      (s, r) => s + (r.montantN * r.coef * r.joursFournisseur) / 365,
      0,
    ),
    y2: achatsRowsBfr.reduce(
      (s, r) => s + (r.montantN1 * r.coef * r.joursFournisseur) / 365,
      0,
    ),
    y3: achatsRowsBfr.reduce(
      (s, r) => s + (r.montantN2 * r.coef * r.joursFournisseur) / 365,
      0,
    ),
  };

  // TVA collectée
  const tvaCollectee: YAcc3 = {
    y1: actifsActifs.reduce(
      (s, a) => s + n(a.montantN) * (n(a.tauxTVA) / 100),
      0,
    ),
    y2: actifsActifs.reduce(
      (s, a) => s + n(a.montantN1) * (n(a.tauxTVA) / 100),
      0,
    ),
    y3: actifsActifs.reduce(
      (s, a) => s + n(a.montantN2) * (n(a.tauxTVA) / 100),
      0,
    ),
  };

  // TVA déductible achats
  const tvaDeductibleAchats: YAcc3 = {
    y1: achatsRowsBfr.reduce(
      (s, r) => s + r.montantN * r.coef * (r.tvaAchats / 100),
      0,
    ),
    y2: achatsRowsBfr.reduce(
      (s, r) => s + r.montantN1 * r.coef * (r.tvaAchats / 100),
      0,
    ),
    y3: achatsRowsBfr.reduce(
      (s, r) => s + r.montantN2 * r.coef * (r.tvaAchats / 100),
      0,
    ),
  };

  const chargesExtRows = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((sv) => sv.actif !== false),
  ].map((c) => ({
    montantN: n(c.montantN),
    montantN1: n(c.montantN1),
    montantN2: n(c.montantN2),
    delaiReglement: n(c.delaiReglement ?? 30),
    tauxTVA: n(c.tauxTVA ?? 20),
  }));

  const dettesChargesExternes: YAcc3 = {
    y1: chargesExtRows.reduce(
      (s, r) => s + (r.montantN * r.delaiReglement) / 365,
      0,
    ),
    y2: chargesExtRows.reduce(
      (s, r) => s + (r.montantN1 * r.delaiReglement) / 365,
      0,
    ),
    y3: chargesExtRows.reduce(
      (s, r) => s + (r.montantN2 * r.delaiReglement) / 365,
      0,
    ),
  };

  const tvaDeductibleCharges: YAcc3 = {
    y1: chargesExtRows.reduce(
      (s, r) => s + r.montantN * (r.tauxTVA / 100),
      0,
    ),
    y2: chargesExtRows.reduce(
      (s, r) => s + r.montantN1 * (r.tauxTVA / 100),
      0,
    ),
    y3: chargesExtRows.reduce(
      (s, r) => s + r.montantN2 * (r.tauxTVA / 100),
      0,
    ),
  };

  const tvaNette: YAcc3 = {
    y1: tvaCollectee.y1 - tvaDeductibleAchats.y1 - tvaDeductibleCharges.y1,
    y2: tvaCollectee.y2 - tvaDeductibleAchats.y2 - tvaDeductibleCharges.y2,
    y3: tvaCollectee.y3 - tvaDeductibleAchats.y3 - tvaDeductibleCharges.y3,
  };

  const creditTVA: YAcc3 = {
    y1: Math.max(0, -tvaNette.y1) / 12,
    y2: Math.max(0, -tvaNette.y2) / 12,
    y3: Math.max(0, -tvaNette.y3) / 12,
  };

  const tvaAPayer: YAcc3 = {
    y1: Math.max(0, tvaNette.y1) / 12,
    y2: Math.max(0, tvaNette.y2) / 12,
    y3: Math.max(0, tvaNette.y3) / 12,
  };

  const dettesImpots: YAcc3 = {
    y1: (fc.impotsTaxes.y1 * 30) / 365,
    y2: (fc.impotsTaxes.y2 * 30) / 365,
    y3: (fc.impotsTaxes.y3 * 30) / 365,
  };

  const dettesPersonnel: YAcc3 = {
    y1: (fc.chargesPersonnel.total.y1 * 30) / 365,
    y2: (fc.chargesPersonnel.total.y2 * 30) / 365,
    y3: (fc.chargesPersonnel.total.y3 * 30) / 365,
  };

  const dettesIS: YAcc3 = {
    y1: isIS ? fc.isParAnnee.y1 / 4 : 0,
    y2: isIS ? fc.isParAnnee.y2 / 4 : 0,
    y3: isIS ? fc.isParAnnee.y3 / 4 : 0,
  };

  const bfrBesoins: YAcc3 = {
    y1: stocksMatieres.y1 + creditTVA.y1,
    y2: stocksMatieres.y2 + creditTVA.y2,
    y3: stocksMatieres.y3 + creditTVA.y3,
  };

  const bfrRessources: YAcc3 = {
    y1:
      dettesFournisseurs.y1 +
      dettesChargesExternes.y1 +
      dettesImpots.y1 +
      dettesPersonnel.y1 +
      tvaAPayer.y1 +
      dettesIS.y1,
    y2:
      dettesFournisseurs.y2 +
      dettesChargesExternes.y2 +
      dettesImpots.y2 +
      dettesPersonnel.y2 +
      tvaAPayer.y2 +
      dettesIS.y2,
    y3:
      dettesFournisseurs.y3 +
      dettesChargesExternes.y3 +
      dettesImpots.y3 +
      dettesPersonnel.y3 +
      tvaAPayer.y3 +
      dettesIS.y3,
  };

  const bfr: YAcc3 = {
    y1: bfrBesoins.y1 - bfrRessources.y1,
    y2: bfrBesoins.y2 - bfrRessources.y2,
    y3: bfrBesoins.y3 - bfrRessources.y3,
  };

  // Variation BFR (y0 = BFR initial = 0 avant démarrage)
  const variationBFR: Record<PfYearKey, number> = {
    y0: 0,
    y1: bfr.y1,
    y2: bfr.y2 - bfr.y1,
    y3: bfr.y3 - bfr.y2,
  };

  // ── 8. EMPLOIS : Immobilisations ────────────────────────────────────────────
  const immoIncorporelles: Record<PfYearKey, number> = {
    y0: 0, y1: 0, y2: 0, y3: 0,
  };
  const immoCorporelles: Record<PfYearKey, number> = {
    y0: 0, y1: 0, y2: 0, y3: 0,
  };

  for (const immo of immobilisations) {
    const k = toKey(immo.dateAcquisition);
    if (!k) continue;
    const montant = n(immo.montantHT);
    if (immo.nature === "INCORPOREL") {
      immoIncorporelles[k] += montant;
    } else {
      immoCorporelles[k] += montant;
    }
  }

  const totalImmo: Record<PfYearKey, number> = {
    y0: immoIncorporelles.y0 + immoCorporelles.y0,
    y1: immoIncorporelles.y1 + immoCorporelles.y1,
    y2: immoIncorporelles.y2 + immoCorporelles.y2,
    y3: immoIncorporelles.y3 + immoCorporelles.y3,
  };

  // ── 9. Totaux & Trésorerie ──────────────────────────────────────────────────
  const totalBesoins: Record<PfYearKey, number> = {
    y0: totalImmo.y0 + variationBFR.y0 + remboursementCapital.y0,
    y1: totalImmo.y1 + variationBFR.y1 + remboursementCapital.y1,
    y2: totalImmo.y2 + variationBFR.y2 + remboursementCapital.y2,
    y3: totalImmo.y3 + variationBFR.y3 + remboursementCapital.y3,
  };

  const totalRessources: Record<PfYearKey, number> = {
    y0:
      apportsCapital.y0 + apportsCC.y0 + nouveauxEmprunts.y0 + caf.y0,
    y1:
      apportsCapital.y1 + apportsCC.y1 + nouveauxEmprunts.y1 + caf.y1,
    y2:
      apportsCapital.y2 + apportsCC.y2 + nouveauxEmprunts.y2 + caf.y2,
    y3:
      apportsCapital.y3 + apportsCC.y3 + nouveauxEmprunts.y3 + caf.y3,
  };

  const variationTresorerie: Record<PfYearKey, number> = {
    y0: totalRessources.y0 - totalBesoins.y0,
    y1: totalRessources.y1 - totalBesoins.y1,
    y2: totalRessources.y2 - totalBesoins.y2,
    y3: totalRessources.y3 - totalBesoins.y3,
  };

  // Solde trésorerie cumulatif
  const soldeTresorerie: Record<PfYearKey, number> = {
    y0: variationTresorerie.y0,
    y1: variationTresorerie.y0 + variationTresorerie.y1,
    y2:
      variationTresorerie.y0 +
      variationTresorerie.y1 +
      variationTresorerie.y2,
    y3:
      variationTresorerie.y0 +
      variationTresorerie.y1 +
      variationTresorerie.y2 +
      variationTresorerie.y3,
  };

  // ── 10. Construction des lignes ────────────────────────────────────────────
  const rows: PfRow[] = [
    // ── Section Besoins ──
    mkRow("section_besoins", "BESOINS", "", "section", {
      y0: 0, y1: 0, y2: 0, y3: 0,
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
      "variation_bfr",
      "Variation du BFR",
      "+",
      "normal",
      variationBFR,
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
      "total_besoins",
      "Total des besoins",
      "=",
      "highlight",
      totalBesoins,
    ),

    // ── Section Ressources ──
    mkRow("section_ressources", "RESSOURCES", "", "section", {
      y0: 0, y1: 0, y2: 0, y3: 0,
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
    mkRow(
      "caf",
      "Capacité d'autofinancement (CAF)",
      "+",
      "normal",
      caf,
      true,
    ),
    mkRow(
      "total_ressources",
      "Total des ressources",
      "=",
      "highlight",
      totalRessources,
    ),

    // ── Section Trésorerie ──
    mkRow("section_tresorerie", "TRÉSORERIE", "", "section", {
      y0: 0, y1: 0, y2: 0, y3: 0,
    }),
    mkRow(
      "variation_tresorerie",
      "Variation de trésorerie",
      "=",
      "subtotal",
      variationTresorerie,
    ),
    mkRow(
      "solde_tresorerie",
      "Solde de trésorerie",
      "=",
      "highlight",
      soldeTresorerie,
    ),
  ];

  return { yearLabels, rows };
}
