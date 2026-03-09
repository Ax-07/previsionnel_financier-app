"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, makeExerciceHelpers } from "@/lib/finance/utils";
import type { YearKey4 as YearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BfrRowValue {
  amount: number;
}

export interface BfrRow {
  key: string;
  label: string;
  sign: "+" | "−" | "=" | "";
  /**
   * normal    → ligne de détail
   * subtotal  → sous-total de section
   * highlight → ligne clé (BFR)
   * section   → en-tête de section (bandeau)
   */
  style: "normal" | "subtotal" | "highlight" | "section";
  values: Record<YearKey, BfrRowValue>;
  hideIfZero?: boolean;
  children?: BfrRow[];
}

export interface BfrData {
  yearLabels: Record<YearKey, string>;
  rows: BfrRow[];
}


// ── Helpers ───────────────────────────────────────────────────────────────────



function mkRow(
  key: string,
  label: string,
  sign: BfrRow["sign"],
  style: BfrRow["style"],
  vals: Record<YearKey, number>,
  hideIfZero?: boolean,
  children?: BfrRow[],
): BfrRow {
  return {
    key,
    label,
    sign,
    style,
    values: {
      y0: { amount: vals.y0 },
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    hideIfZero,
    children,
  };
}

type YearAcc = { y0: number; y1: number; y2: number; y3: number };
const zero: YearAcc = { y0: 0, y1: 0, y2: 0, y3: 0 };

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchBfr(dossierId: string, preloadedData?: ScenarioFinData): Promise<BfrData> {
  const data = preloadedData ?? await fetchScenarioData(dossierId);
  const { isIS, activites, fournitures, services, immobilisations } = data;
  const fc = buildFinCalc(data, data.dateDemarrage);
  const { toExerciceKey } = makeExerciceHelpers(data.dateDemarrage);
  const anneeDebut = data.dateDemarrage.getFullYear();
  const moisDebut = data.dateDemarrage.getMonth();
  const fmtEx = (start: number) =>
    moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;
  const yearLabels: Record<YearKey, string> = {
    y0: "Initial",
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  // ── Calculs ──────────────────────────────────────────────────────────────────

  // ── CA & achats matières ────────────────────────────────────────────────────
  const actifsActifs = activites.filter((a) => a.actif !== false);

  // TVA collectée sur le CA (1 mois d'encours)
  const tvaCollectee: YearAcc = {
    y0: 0,
    y1: actifsActifs.reduce((s, a) => s + n(a.montantN) * (n(a.tauxTVA) / 100), 0),
    y2: actifsActifs.reduce((s, a) => s + n(a.montantN1) * (n(a.tauxTVA) / 100), 0),
    y3: actifsActifs.reduce((s, a) => s + n(a.montantN2) * (n(a.tauxTVA) / 100), 0),
  };

  // Activités avec stocks (commerce/production)
  const achatsRows = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      libelle: a.libelle,
      tauxMarge: n(a.tauxMarge),
      tvaAchats: n(a.tvaAchats ?? 20),
      joursStock: n(a.stocks ?? 0),
      joursFournisseur: n(a.reglementFournisseurs ?? 30),
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      // Achats de stock ponctuels saisis dans les détails
      achatsStockPonctuel: a.achatsStockPonctuel as Record<string, number[]> | undefined,
    }));

  // Stock initial constitué avant/au démarrage = somme des achats ponctuels N (mois 0 du plan)
  const stockInitialPonctuel = achatsRows.reduce((s, r) => {
    const ponctuelN = r.achatsStockPonctuel?.N ?? [];
    return s + ponctuelN.reduce((a: number, v: number) => a + v, 0);
  }, 0);

  const coefAchat = (r: (typeof achatsRows)[number]) =>
    Math.max(0, 1 - r.tauxMarge / 100);

  // Stock de matières en fin d'exercice
  // y0 = stock initial constitué (achats ponctuels avant/au démarrage)
  const stocksMatieres: YearAcc = {
    y0: stockInitialPonctuel,
    y1: achatsRows.reduce(
      (s, r) => s + (r.montantN * coefAchat(r) * r.joursStock) / 365,
      0,
    ),
    y2: achatsRows.reduce(
      (s, r) => s + (r.montantN1 * coefAchat(r) * r.joursStock) / 365,
      0,
    ),
    y3: achatsRows.reduce(
      (s, r) => s + (r.montantN2 * coefAchat(r) * r.joursStock) / 365,
      0,
    ),
  };

  // Dettes fournisseurs (achats matières)
  const dettesFournisseurs: YearAcc = {
    y0: 0,
    y1: achatsRows.reduce(
      (s, r) =>
        s + (r.montantN * coefAchat(r) * r.joursFournisseur) / 365,
      0,
    ),
    y2: achatsRows.reduce(
      (s, r) =>
        s + (r.montantN1 * coefAchat(r) * r.joursFournisseur) / 365,
      0,
    ),
    y3: achatsRows.reduce(
      (s, r) =>
        s + (r.montantN2 * coefAchat(r) * r.joursFournisseur) / 365,
      0,
    ),
  };

  // TVA déductible sur achats matières
  const tvaDeductibleAchats: YearAcc = {
    y0: 0,
    y1: achatsRows.reduce(
      (s, r) => s + r.montantN * coefAchat(r) * (r.tvaAchats / 100),
      0,
    ),
    y2: achatsRows.reduce(
      (s, r) => s + r.montantN1 * coefAchat(r) * (r.tvaAchats / 100),
      0,
    ),
    y3: achatsRows.reduce(
      (s, r) => s + r.montantN2 * coefAchat(r) * (r.tvaAchats / 100),
      0,
    ),
  };

  // ── Charges externes ────────────────────────────────────────────────────────
  const chargesExtRows = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((s) => s.actif !== false),
  ].map((c) => ({
    libelle: c.libelle,
    montantN: n(c.montantN),
    montantN1: n(c.montantN1),
    montantN2: n(c.montantN2),
    delaiReglement: n(c.delaiReglement ?? 30),
    tauxTVA: n(c.tauxTVA ?? 20),
  }));

  const dettesChargesExternes: YearAcc = {
    y0: 0,
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

  const tvaDeductibleCharges: YearAcc = {
    y0: 0,
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

  // TVA récupérable sur immobilisations (par exercice d'acquisition)
  // Les acquisitions avant dateDemarrage (démarrage d'activité) → y0 (Initial)
  const tvaImmoDeductible: YearAcc = { y0: 0, y1: 0, y2: 0, y3: 0 };
  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tvaImmo <= 0) continue;
    // Cohérence avec plan-financement : dateAcq <= dateDemarrage → y0 (Initial)
    const dateAcq = immo.dateAcquisition instanceof Date
      ? immo.dateAcquisition
      : new Date(String(immo.dateAcquisition));
    const yk = (dateAcq <= data.dateDemarrage ? null : toExerciceKey(dateAcq)) ?? "y0";
    tvaImmoDeductible[yk] += tvaImmo;
  }

  // ── TVA nette avec report de crédit inter-exercices ─────────────────────────
  // Pour y1-y3 : uniquement les flux opérationnels récurrents (achats + charges).
  // La TVA sur immobilisations est un flux d'investissement (haut de bilan) :
  // elle ne s'intègre dans le BFR qu'en colonne Initial (y0).
  //
  // Le crédit TVA de y0 (immos de démarrage) se reporte sur y1, puis y1 sur y2, etc.
  // On reporte le crédit annuel net entre exercices pour savoir ce qui reste en encours
  // en fin de chaque exercice.

  // TVA nette annuelle brute (sans report) par exercice opérationnel
  const tvaNetteAnnuelle = {
    y1: tvaCollectee.y1 - (tvaDeductibleAchats.y1 + tvaDeductibleCharges.y1),
    y2: tvaCollectee.y2 - (tvaDeductibleAchats.y2 + tvaDeductibleCharges.y2),
    y3: tvaCollectee.y3 - (tvaDeductibleAchats.y3 + tvaDeductibleCharges.y3),
  };

  // Crédit initial (y0) = TVA sur immos de démarrage (pas de TVA collectée en y0)
  const creditInitial = tvaImmoDeductible.y0;

  // Report du crédit : le crédit disponible en début d'exercice absorbe la TVA nette positive
  // → réduit la TVA à payer ; si le crédit est supérieur, un reliquat subsiste en fin d'exercice.
  // En fin de chaque exercice, l'encours BFR est soit le crédit restant, soit la TVA à payer /12.

  // y1 : crédit en début = creditInitial
  const creditDebut1 = creditInitial;
  const nette1AvecReport = tvaNetteAnnuelle.y1 - creditDebut1;
  const creditFin1 = nette1AvecReport < 0 ? -nette1AvecReport : 0;

  // y2 : crédit en début = creditFin1
  const creditDebut2 = creditFin1;
  const nette2AvecReport = tvaNetteAnnuelle.y2 - creditDebut2;
  const creditFin2 = nette2AvecReport < 0 ? -nette2AvecReport : 0;

  // y3 : crédit en début = creditFin2
  const creditDebut3 = creditFin2;
  const nette3AvecReport = tvaNetteAnnuelle.y3 - creditDebut3;
  const creditFin3 = nette3AvecReport < 0 ? -nette3AvecReport : 0;

  // Crédit TVA (besoin BFR) = solde résiduel de crédit en fin d'exercice.
  // C'est un STOCK (créance sur le Trésor), pas un flux mensuel → pas de /12.
  // (À comparer : tvaAPayer = flux mensuel → /12 pour l'encours moyen.)
  const creditTVA: YearAcc = {
    y0: creditInitial,
    y1: creditFin1,
    y2: creditFin2,
    y3: creditFin3,
  };

  // TVA à payer (ressource BFR — encours 1 mois pour y1-y3)
  const tvaAPayer: YearAcc = {
    y0: 0,
    y1: nette1AvecReport > 0 ? nette1AvecReport / 12 : 0,
    y2: nette2AvecReport > 0 ? nette2AvecReport / 12 : 0,
    y3: nette3AvecReport > 0 ? nette3AvecReport / 12 : 0,
  };

  // ── Dérivés buildFinCalc ────────────────────────────────────────────────────
  const dettesImpots: YearAcc = {
    y0: 0,
    y1: (fc.impotsTaxes.y1 * 30) / 365,
    y2: (fc.impotsTaxes.y2 * 30) / 365,
    y3: (fc.impotsTaxes.y3 * 30) / 365,
  };
  const dettesPersonnel: YearAcc = {
    y0: 0,
    y1: (fc.chargesPersonnel.total.y1 * 30) / 365,
    y2: (fc.chargesPersonnel.total.y2 * 30) / 365,
    y3: (fc.chargesPersonnel.total.y3 * 30) / 365,
  };

  // IS dette = acomptes trimestriels (IS / 4) — encours un trimestre
  const dettesIS: YearAcc = {
    y0: 0,
    y1: fc.isParAnnee.y1 / 4,
    y2: fc.isParAnnee.y2 / 4,
    y3: fc.isParAnnee.y3 / 4,
  };

  // ── Totaux BFR ──────────────────────────────────────────────────────────────
  const totalBesoins: YearAcc = {
    y0: stocksMatieres.y0 + creditTVA.y0,
    y1: stocksMatieres.y1 + creditTVA.y1,
    y2: stocksMatieres.y2 + creditTVA.y2,
    y3: stocksMatieres.y3 + creditTVA.y3,
  };

  const totalRessources: YearAcc = {
    y0: dettesFournisseurs.y0 +
        dettesChargesExternes.y0 +
        dettesImpots.y0 +
        dettesPersonnel.y0 +
        tvaAPayer.y0 +
        (isIS ? dettesIS.y0 : 0),
    y1:
      dettesFournisseurs.y1 +
      dettesChargesExternes.y1 +
      dettesImpots.y1 +
      dettesPersonnel.y1 +
      tvaAPayer.y1 +
      (isIS ? dettesIS.y1 : 0),
    y2:
      dettesFournisseurs.y2 +
      dettesChargesExternes.y2 +
      dettesImpots.y2 +
      dettesPersonnel.y2 +
      tvaAPayer.y2 +
      (isIS ? dettesIS.y2 : 0),
    y3:
      dettesFournisseurs.y3 +
      dettesChargesExternes.y3 +
      dettesImpots.y3 +
      dettesPersonnel.y3 +
      tvaAPayer.y3 +
      (isIS ? dettesIS.y3 : 0),
  };

  const bfr: YearAcc = {
    y0: totalBesoins.y0 - totalRessources.y0,
    y1: totalBesoins.y1 - totalRessources.y1,
    y2: totalBesoins.y2 - totalRessources.y2,
    y3: totalBesoins.y3 - totalRessources.y3,
  };

  // Variation : N = BFR(N) − BFR(N−1), avec BFR initial = 0
  const variationBFR: YearAcc = {
    y0: bfr.y0, // variation initiale = BFR initial (pas de période précédente)
    y1: bfr.y1, // On considère que le bfr initial est déja financé
    y2: bfr.y2 - bfr.y1,
    y3: bfr.y3 - bfr.y2,
  };

  // ── Détail drill-down ────────────────────────────────────────────────────────

  const stocksChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(
      `stocks_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: 0,
        y1: (r.montantN * coefAchat(r) * r.joursStock) / 365,
        y2: (r.montantN1 * coefAchat(r) * r.joursStock) / 365,
        y3: (r.montantN2 * coefAchat(r) * r.joursStock) / 365,
      },
      true,
    ),
  );

  const dettesFournisseursChildren: BfrRow[] = achatsRows.map((r, i) =>
    mkRow(
      `fournisseurs_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: 0,
        y1: (r.montantN * coefAchat(r) * r.joursFournisseur) / 365,
        y2: (r.montantN1 * coefAchat(r) * r.joursFournisseur) / 365,
        y3: (r.montantN2 * coefAchat(r) * r.joursFournisseur) / 365,
      },
      true,
    ),
  );

  const dettesChargesExtChildren: BfrRow[] = chargesExtRows.map((r, i) =>
    mkRow(
      `charges_ext_child_${i}`,
      r.libelle,
      "",
      "normal",
      {
        y0: 0,
        y1: (r.montantN * r.delaiReglement) / 365,
        y2: (r.montantN1 * r.delaiReglement) / 365,
        y3: (r.montantN2 * r.delaiReglement) / 365,
      },
      true,
    ),
  );

  // ── Construction des lignes ─────────────────────────────────────────────────
  const rows: BfrRow[] = [
    // ── Besoins ──────────────────────────────────────────────────────────────
    mkRow("section_besoins", "BESOINS D'EXPLOITATION", "", "section", zero),
    mkRow("stocks", "Stocks de matières", "", "normal", stocksMatieres, true,
      stocksChildren.length > 0 ? stocksChildren : undefined),
    mkRow("credit_tva", "Crédit de TVA", "", "normal", creditTVA, true),
    mkRow("total_besoins", "Total des besoins", "=", "subtotal", totalBesoins),

    // ── Ressources ────────────────────────────────────────────────────────────
    mkRow("section_ressources", "RESSOURCES D'EXPLOITATION", "", "section", zero),
    mkRow(
      "dettes_fournisseurs",
      "Dettes fournisseurs (achats matières)",
      "",
      "normal",
      dettesFournisseurs,
      true,
      dettesFournisseursChildren.length > 0 ? dettesFournisseursChildren : undefined,
    ),
    mkRow(
      "dettes_charges_ext",
      "Dettes charges externes",
      "",
      "normal",
      dettesChargesExternes,
      true,
      dettesChargesExtChildren.length > 0 ? dettesChargesExtChildren : undefined,
    ),
    mkRow("dettes_impots", "Dettes impôts et taxes", "", "normal", dettesImpots, true),
    mkRow("dettes_personnel", "Dettes personnel", "", "normal", dettesPersonnel, true),
    mkRow("tva_a_payer", "TVA à payer", "", "normal", tvaAPayer, false),
    ...(isIS
      ? [mkRow("dettes_is", "Impôt sur les sociétés (dette)", "", "normal", dettesIS, true)]
      : []),
    mkRow("total_ressources", "Total des ressources", "=", "subtotal", totalRessources),

    // ── BFR ──────────────────────────────────────────────────────────────────
    mkRow("variation_bfr", "Variation du BFR", "", "normal", variationBFR),
    mkRow("bfr", "Besoin en fonds de roulement (BFR)", "=", "highlight", bfr),
  ];

  return { yearLabels, rows };
}
