"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { n, sumBy } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SigValue {
  amount: number;
  pct: number | null;
}

export interface SigNode {
  key: string;
  label: string;
  values: Record<YearKey, SigValue>;
  children?: SigNode[];
  /**
   * normal   → ligne de détail
   * total    → sous-total de section
   * highlight → solde intermédiaire clé (fonds coloré)
   * section  → en-tête de section (bandeau)
   */
  style: "normal" | "total" | "highlight" | "section";
  hideIfZero?: boolean;
}

export interface SigData {
  yearLabels: Record<YearKey, string>;
  nodes: SigNode[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkVal(amount: number, pct: number | null): SigValue {
  return { amount, pct };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchSig(dossierId: string, preloadedData?: ScenarioFinData): Promise<SigData> {
  const data = preloadedData ?? await fetchScenarioData(dossierId);
  const { activites, isIS, immobilisations } = data;

  // ── Moteur de calcul centralisé (source unique de vérité) ─────────────────
  const fc = buildFinCalc(data, data.dateDemarrage);
  const {
    yearLabels,
    ca, achatsEffectues, stockInitial, stockFinal, varStock, achatsConsommes,
    fournitures: fournituresAgg, services: servicesAgg, chargesExternes,
    valeurAjoutee, subventions: subventionsAgg, impotsTaxes: impotsTaxesAgg,
    chargesPersonnel, ebe,
    dotationsAmort, dotationsProvisions, reprises,
    resExpl, produitsFinanciers, interetsEmprunts, resFin, resCourant,
    resExcep, isParAnnee, resNet, caf,
    anneeDebut,
  } = fc;

  // ── Ventilation par type d'activité (drill-down affichage uniquement) ────
  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      libelle: a.libelle,
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
      stocks: a.stocks ?? 0,
    }));

  const prodVendueRows = caRows.filter((r) => r.typeActivite === "PRODUCTION_VENDUE");
  const prestationsRows = caRows.filter((r) => r.typeActivite === "PRESTATION_SERVICES");
  const ventesMarchandisesRows = caRows.filter((r) => r.typeActivite === "VENTE_MARCHANDISES");

  const prodVendue: Record<YearKey, number> = {
    y1: sumBy(prodVendueRows, (r) => r.montantN),
    y2: sumBy(prodVendueRows, (r) => r.montantN1),
    y3: sumBy(prodVendueRows, (r) => r.montantN2),
  };
  const prestationsServices: Record<YearKey, number> = {
    y1: sumBy(prestationsRows, (r) => r.montantN),
    y2: sumBy(prestationsRows, (r) => r.montantN1),
    y3: sumBy(prestationsRows, (r) => r.montantN2),
  };
  const ventesMarchandises: Record<YearKey, number> = {
    y1: sumBy(ventesMarchandisesRows, (r) => r.montantN),
    y2: sumBy(ventesMarchandisesRows, (r) => r.montantN1),
    y3: sumBy(ventesMarchandisesRows, (r) => r.montantN2),
  };

  // Détail achats (drill-down) — uniquement pour l'affichage
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => ({
      libelle: `Achats – ${r.libelle}`,
      montantN: r.montantN * Math.max(0, 1 - r.tauxMarge / 100),
      montantN1: r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100),
      montantN2: r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100),
      stocks: r.stocks,
    }));

  // Drill-down fournitures / services pour l'arbre SIG
  const fournituresRows = data.fournitures
    .filter((f) => f.actif !== false)
    .map((f) => ({
      libelle: f.libelle,
      montantN: n(f.montantN),
      montantN1: n(f.montantN1),
      montantN2: n(f.montantN2),
    }));
  const servicesRows = data.services
    .filter((s) => s.actif !== false)
    .map((s) => ({
      libelle: s.libelle,
      montantN: n(s.montantN),
      montantN1: n(s.montantN1),
      montantN2: n(s.montantN2),
    }));

  // Drill-down impôts
  const impotsRows = data.impotsTaxes
    .filter((i) => i.actif !== false)
    .map((i) => ({
      libelle: i.libelle,
      montantN: n(i.montantN ?? 0),
      montantN1: n(i.montantN1 ?? 0),
      montantN2: n(i.montantN2 ?? 0),
    }));

  // Drill-down salariés / dirigeants / cotisations TNS
  const salaireRows = data.salaries
    .filter((s) => s.actif !== false)
    .map((s) => ({
      libelle: s.libelle,
      montantN: n(s.montantN),
      montantN1: n(s.montantN1),
      montantN2: n(s.montantN2),
      tauxCotPat: n(s.tauxCotPat),
    }));
  const dirigeantRows = data.dirigeants
    .filter((d) => d.actif !== false)
    .map((d) => ({
      libelle: d.libelle,
      montantN: n(d.montantN),
      montantN1: n(d.montantN1),
      montantN2: n(d.montantN2),
    }));
  const cotisationsRows = data.cotisationsTNS
    .filter((c) => c.actif !== false)
    .map((c) => ({
      libelle: c.libelle,
      montantN: n(c.montantN),
      montantN1: n(c.montantN1),
      montantN2: n(c.montantN2),
    }));
  const reprisesRows = data.reprisesProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({
      libelle: r.libelle,
      montantN: n(r.montantN),
      montantN1: n(r.montantN1),
      montantN2: n(r.montantN2),
    }));
  const prodFinRows = data.financiersProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({
      libelle: r.libelle,
      montantN: n(r.montantN),
      montantN1: n(r.montantN1),
      montantN2: n(r.montantN2),
    }));

  // ── Agrégats depuis buildFinCalc (aliasés pour compabilité avec l'arbre) ─
  const margeProd: Record<YearKey, number> = {
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  };
  const margeGlobale: Record<YearKey, number> = { y1: margeProd.y1, y2: margeProd.y2, y3: margeProd.y3 };

  const fournituresTotal: Record<YearKey, number> = { y1: fournituresAgg.y1, y2: fournituresAgg.y2, y3: fournituresAgg.y3 };
  const servicesTotal: Record<YearKey, number>    = { y1: servicesAgg.y1,    y2: servicesAgg.y2,    y3: servicesAgg.y3    };
  const subventionsTotal: Record<YearKey, number> = { y1: subventionsAgg.y1, y2: subventionsAgg.y2, y3: subventionsAgg.y3 };
  const impotsTotal: Record<YearKey, number>      = { y1: impotsTaxesAgg.y1, y2: impotsTaxesAgg.y2, y3: impotsTaxesAgg.y3 };

  const salairesBruts: Record<YearKey, number>     = { y1: chargesPersonnel.salairesBruts.y1,     y2: chargesPersonnel.salairesBruts.y2,     y3: chargesPersonnel.salairesBruts.y3     };
  const chargesPatronales: Record<YearKey, number> = { y1: chargesPersonnel.chargesPatronales.y1, y2: chargesPersonnel.chargesPatronales.y2, y3: chargesPersonnel.chargesPatronales.y3 };
  const remuDirigeant: Record<YearKey, number>     = { y1: chargesPersonnel.remuDirigeant.y1,     y2: chargesPersonnel.remuDirigeant.y2,     y3: chargesPersonnel.remuDirigeant.y3     };
  const cotisationsTNSTotal: Record<YearKey, number> = { y1: chargesPersonnel.cotisationsTNSTotal.y1, y2: chargesPersonnel.cotisationsTNSTotal.y2, y3: chargesPersonnel.cotisationsTNSTotal.y3 };
  const chargesPersonnelTotal: Record<YearKey, number> = { y1: chargesPersonnel.total.y1, y2: chargesPersonnel.total.y2, y3: chargesPersonnel.total.y3 };

  const chargesFinTotal: Record<YearKey, number> = {
    y1: interetsEmprunts.y1 + (fc.autresChargesFinancieres?.y1 ?? 0),
    y2: interetsEmprunts.y2 + (fc.autresChargesFinancieres?.y2 ?? 0),
    y3: interetsEmprunts.y3 + (fc.autresChargesFinancieres?.y3 ?? 0),
  };

  // Dotations par immo (drill-down par nature) — mode réel (AUCUN / LINEAIRE / DEGRESSIF)
  const dotationsParImmoData = immobilisations
    .filter((immo) => immo.actif !== false)
    .map((immo) => {
      const dot = distribuerAmortParExercice(immo, anneeDebut, fc.moisDebut);
      return { immo, y1: dot.y1, y2: dot.y2, y3: dot.y3 };
    });

  const dotParNature = {
    CORPOREL:   dotationsParImmoData.filter((d) => d.immo.nature === "CORPOREL"),
    INCORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "INCORPOREL"),
    FINANCIER:  dotationsParImmoData.filter((d) => d.immo.nature === "FINANCIER"),
  };

  function sumDotGroup(groupe: { y1: number; y2: number; y3: number }[]): Record<YearKey, number> {
    return {
      y1: groupe.reduce((s, d) => s + d.y1, 0),
      y2: groupe.reduce((s, d) => s + d.y2, 0),
      y3: groupe.reduce((s, d) => s + d.y3, 0),
    };
  }

  const dotCorporel   = sumDotGroup(dotParNature.CORPOREL);
  const dotIncorporel = sumDotGroup(dotParNature.INCORPOREL);
  const dotFinancier  = sumDotGroup(dotParNature.FINANCIER);

  const hasStocks =
    stockFinal.y1 !== 0 || stockFinal.y2 !== 0 || stockFinal.y3 !== 0 ||
    stockInitial.y1 !== 0 || stockInitial.y2 !== 0 || stockInitial.y3 !== 0;

  // ── 5. Construction de l'arbre SIG ──────────────────────────────────────

  function pct(amount: number, base: number): number | null {
    return base !== 0 ? (amount / base) * 100 : null;
  }

  function sigNode(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: SigNode["style"],
    children?: SigNode[],
    hideIfZero = false,
  ): SigNode {
    return {
      key,
      label,
      values: {
        y1: mkVal(vals.y1, pct(vals.y1, ca.y1)),
        y2: mkVal(vals.y2, pct(vals.y2, ca.y2)),
        y3: mkVal(vals.y3, pct(vals.y3, ca.y3)),
      },
      children,
      style,
      hideIfZero,
    };
  }

  /** Nœud avec pct forcé à 100% (pour lignes CA/Production) */
  function sigNodeAt100(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: SigNode["style"],
    children?: SigNode[],
  ): SigNode {
    return {
      key,
      label,
      values: {
        y1: mkVal(vals.y1, vals.y1 !== 0 ? 100 : null),
        y2: mkVal(vals.y2, vals.y2 !== 0 ? 100 : null),
        y3: mkVal(vals.y3, vals.y3 !== 0 ? 100 : null),
      },
      children,
      style,
    };
  }

  function childNodes(
    rows: { libelle: string; montantN: number; montantN1: number; montantN2: number }[],
    parentKey: string,
  ): SigNode[] {
    return rows
      .filter((r) => r.montantN !== 0 || r.montantN1 !== 0 || r.montantN2 !== 0)
      .map((r, i) => ({
        key: `${parentKey}_c${i}`,
        label: r.libelle,
        values: {
          y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
          y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
          y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
        },
        style: "normal" as const,
        hideIfZero: true,
      }));
  }

  // hasStocks est déjà calculé plus haut via les agrégats buildFinCalc

  const nodes: SigNode[] = [
    // ── SECTION 1 : Marge sur production ──────────────────────────────────
    sigNode("sec_marge_prod", "MARGE SUR PRODUCTION", ca, "section"),

    ...(prodVendue.y1 !== 0 || prodVendue.y2 !== 0 || prodVendue.y3 !== 0
      ? [sigNodeAt100("prod_vendue", "Production vendue", prodVendue, "normal",
          childNodes(prodVendueRows, "prod_vendue"))]
      : []),

    ...(prestationsServices.y1 !== 0 || prestationsServices.y2 !== 0 || prestationsServices.y3 !== 0
      ? [sigNodeAt100("prestations_services", "Prestations de services", prestationsServices, "normal",
          childNodes(prestationsRows, "prestations_services"))]
      : []),

    ...(ventesMarchandises.y1 !== 0 || ventesMarchandises.y2 !== 0 || ventesMarchandises.y3 !== 0
      ? [sigNodeAt100("ventes_marchandises", "Ventes de marchandises", ventesMarchandises, "normal",
          childNodes(ventesMarchandisesRows, "ventes_marchandises"))]
      : []),

    sigNodeAt100("prod_exercice", "Production de l'exercice", ca, "total"),

    // Achats effectués de matières avec drill-down stocks
    ...(achatsEffectues.y1 !== 0 || achatsEffectues.y2 !== 0 || achatsEffectues.y3 !== 0
      ? [
          sigNode(
            "achats_effectues",
            "Achats effectués de matières",
            achatsEffectues,
            "normal",
            [
              ...childNodes(achatsRows, "achats_eff_det"),
              ...( hasStocks
                ? [
                    sigNode("stock_initial", "Stock initial de matières", stockInitial, "normal", undefined, true),
                    sigNode("stock_final", "Stock final de matières", stockFinal, "normal", undefined, true),
                    sigNode("var_stock", "Variation de stock de matières", varStock, "normal", undefined, true),
                  ]
                : []),
              sigNode("achats_consommes_mat", "Achats consommés de matières", achatsConsommes, "total"),
            ],
          ),
        ]
      : []),

    sigNode("marge_prod", "Marge sur production", margeProd, "highlight"),

    // ── SECTION 2 : Marge globale ──────────────────────────────────────────
    sigNode("sec_marge_glob", "MARGE GLOBALE (CA)", ca, "section"),

    sigNodeAt100("ca", "Chiffre d'affaires", ca, "normal",
      childNodes(caRows, "ca")),

    sigNodeAt100("ventes_prod_reelle", "Ventes + Production réelle", ca, "total"),

    sigNode("achats_consommes_glob", "Achats consommés", achatsConsommes, "normal", undefined,
      achatsConsommes.y1 === 0 && achatsConsommes.y2 === 0 && achatsConsommes.y3 === 0),

    sigNode("marge_globale", "Marge globale", margeGlobale, "highlight"),

    // ── SECTION 3 : Valeur ajoutée ─────────────────────────────────────────
    sigNode("sec_va", "VALEUR AJOUTÉE", valeurAjoutee, "section"),

    ...(fournituresTotal.y1 !== 0 || fournituresTotal.y2 !== 0 || fournituresTotal.y3 !== 0
      ? [
          sigNode("fournitures", "Fournitures consommables", fournituresTotal, "normal",
            childNodes(fournituresRows, "fournitures"), true),
        ]
      : []),

    ...(servicesTotal.y1 !== 0 || servicesTotal.y2 !== 0 || servicesTotal.y3 !== 0
      ? [
          sigNode("services", "Services extérieurs", servicesTotal, "normal",
            childNodes(servicesRows, "services"), true),
        ]
      : []),

    sigNode("charges_ext", "Charges externes (Total)", chargesExternes, "total", undefined,
      chargesExternes.y1 === 0 && chargesExternes.y2 === 0 && chargesExternes.y3 === 0),

    sigNode("va", "Valeur ajoutée", valeurAjoutee, "highlight"),

    // ── SECTION 4 : EBE ────────────────────────────────────────────────────
    sigNode("sec_ebe", "EXCÉDENT BRUT D'EXPLOITATION", ebe, "section"),

    sigNode("impots_taxes", "Impôts et taxes", impotsTotal, "normal",
      childNodes(impotsRows, "impots_taxes"), true),

    sigNode("salaires_bruts", "Salaires bruts (Salariés)", salairesBruts, "normal",
      childNodes(salaireRows, "salaires_bruts"), true),

    sigNode("charges_sociales", "Charges sociales (Salariés)", chargesPatronales, "normal", undefined, true),

    sigNode("remunerations_dir", "Rémunération du dirigeant", remuDirigeant, "normal",
      childNodes(dirigeantRows, "remunerations_dir"), true),

    sigNode("cotisations_tns", "Cotisations TNS", cotisationsTNSTotal, "normal",
      childNodes(cotisationsRows, "cotisations_tns"), true),

    sigNode("charges_personnel", "Charges de personnel (Total)", chargesPersonnelTotal, "total", undefined,
      chargesPersonnelTotal.y1 === 0 && chargesPersonnelTotal.y2 === 0 && chargesPersonnelTotal.y3 === 0),

    ...(subventionsTotal.y1 !== 0 || subventionsTotal.y2 !== 0 || subventionsTotal.y3 !== 0
      ? [sigNode("subventions", "Subventions d'exploitation", subventionsTotal, "normal", undefined, true)]
      : []),

    sigNode("ebe", "Excédent brut d'exploitation", ebe, "highlight"),

    // ── SECTION 5 : Résultats ──────────────────────────────────────────────
    sigNode("sec_resultats", "RÉSULTATS", resNet, "section"),

    sigNode("dotations_amort", "Dotations aux amortissements", dotationsAmort, "normal",
      dotationsParImmoData.length > 0
        ? [
            ...(dotParNature.CORPOREL.length > 0
              ? [sigNode("dot_amort_corp", "Immobilisations corporelles", dotCorporel, "normal",
                  dotParNature.CORPOREL.map((d, i) =>
                    sigNode(`dot_amort_corp_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
            ...(dotParNature.INCORPOREL.length > 0
              ? [sigNode("dot_amort_incorp", "Immobilisations incorporelles", dotIncorporel, "normal",
                  dotParNature.INCORPOREL.map((d, i) =>
                    sigNode(`dot_amort_incorp_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
            ...(dotParNature.FINANCIER.length > 0
              ? [sigNode("dot_amort_fin", "Immobilisations financières", dotFinancier, "normal",
                  dotParNature.FINANCIER.map((d, i) =>
                    sigNode(`dot_amort_fin_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
          ]
        : undefined,
      true),

    ...(dotationsProvisions.y1 !== 0 || dotationsProvisions.y2 !== 0 || dotationsProvisions.y3 !== 0
      ? [sigNode("dotations_prov", "Dotations sur provisions", dotationsProvisions, "normal", undefined, true)]
      : []),

    ...(reprises.y1 !== 0 || reprises.y2 !== 0 || reprises.y3 !== 0
      ? [sigNode("reprises", "Reprises sur provisions", reprises, "normal", childNodes(reprisesRows, "reprises"), true)]
      : []),

    sigNode("res_expl", "Résultat d'exploitation", resExpl, "highlight"),

    sigNode("charges_fin", "Charges financières", chargesFinTotal, "normal", undefined,
      chargesFinTotal.y1 === 0 && chargesFinTotal.y2 === 0 && chargesFinTotal.y3 === 0),

    ...(produitsFinanciers.y1 !== 0 || produitsFinanciers.y2 !== 0 || produitsFinanciers.y3 !== 0
      ? [sigNode("prod_fin", "Produits financiers", produitsFinanciers, "normal", childNodes(prodFinRows, "prod_fin"), true)]
      : []),

    sigNode("res_fin", "Résultat financier", resFin, "highlight", undefined,
      resFin.y1 === 0 && resFin.y2 === 0 && resFin.y3 === 0),

    sigNode("res_courant", "Résultat courant", resCourant, "highlight"),

    ...(isIS
      ? [sigNode("is", "Impôt sur les bénéfices (IS)", isParAnnee, "normal", undefined, true)]
      : []),

    ...(resExcep.y1 !== 0 || resExcep.y2 !== 0 || resExcep.y3 !== 0
      ? [sigNode("res_excep", "Résultat exceptionnel", resExcep, "normal", undefined, true)]
      : []),

    sigNode("res_net", "Résultat de l'exercice", resNet, "highlight"),

    sigNode("caf", "Capacité d'autofinancement (CAF)", caf, "highlight"),
  ];

  return { yearLabels, nodes };
}
