import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { SigNode } from "./types";
import type { SigDrilldownRows } from "./drilldown";
import { makeNodeBuilder, buildChildNodes, type ChildRow } from "../helpers/shared-helpers";
import { makeSigNodeAt100Builder } from "./helpers";

// ── Helper : vrai si au moins un exercice est non nul ─────────────────────────
function nonZero(vals: Record<YearKey, number>): boolean {
  return vals.y1 !== 0 || vals.y2 !== 0 || vals.y3 !== 0;
}

/**
 * Construit l'arbre `SigNode[]` du SIG à partir des agrégats financiers (`fc`)
 * et des lignes de drill-down (`rows`).
 * Fonction pure, testable indépendamment de la couche serveur.
 */
export function buildSigTree(
  fc: FinCalcResult,
  rows: SigDrilldownRows,
  isIS: boolean,
): SigNode[] {
  const ca = fc.ca;
  const node = makeNodeBuilder<SigNode>(ca);
  const nodeAt100 = makeSigNodeAt100Builder();
  const childNodes = (r: ChildRow[], key: string) =>
    buildChildNodes<ChildRow, SigNode>(r, key, ca, (row) => row.montantN !== 0 || row.montantN1 !== 0 || row.montantN2 !== 0);

  const {
    prodVendueRows,
    prestationsRows,
    ventesMarchandisesRows,
    prodVendue,
    prestationsServices,
    ventesMarchandises,
    achatsRows,
    fournituresRows,
    servicesRows,
    impotsRows,
    salaireRows,
    dirigeantRows,
    cotisationsRows,
    reprisesRows,
    prodFinRows,
    dotationsParImmoData,
    dotParNature,
    dotCorporel,
    dotIncorporel,
    dotFinancier,
  } = rows;

  return [
    // ── SECTION 1 : Chiffre d'affaires ────────────────────────────────────
    node("sec_ca", "CHIFFRE D'AFFAIRES", ca, "section"),

    ...(nonZero(prodVendue)
      ? [nodeAt100("prod_vendue", "Production vendue", prodVendue, "normal",
          childNodes(prodVendueRows, "prod_vendue"))]
      : []),

    ...(nonZero(prestationsServices)
      ? [nodeAt100("prestations_services", "Prestations de services", prestationsServices, "normal",
          childNodes(prestationsRows, "prestations_services"))]
      : []),

    ...(nonZero(ventesMarchandises)
      ? [nodeAt100("ventes_marchandises", "Ventes de marchandises", ventesMarchandises, "normal",
          childNodes(ventesMarchandisesRows, "ventes_marchandises"))]
      : []),

    nodeAt100("prod_exercice", "Production de l'exercice", ca, "total"),

    // ── SECTION 2 : Marge sur production ──────────────────────────────────
    node("sec_marge_prod", "MARGE SUR PRODUCTION", fc.margeProd, "section"),

    ...(nonZero(fc.achatsEffectues)
      ? [node("achats_effectues", "Achats effectués de matières", fc.achatsEffectues, "normal",
          childNodes(achatsRows, "achats_eff_det"))]
      : []),

    ...(nonZero(fc.varStock)
      ? [node("var_stock_matieres", "Variation de stocks d'approvisionnement",
          { y1: -fc.varStock.y1, y2: -fc.varStock.y2, y3: -fc.varStock.y3 },
          "normal", undefined, true)]
      : []),

    node("achats_consommes", "Achats consommés de matières", fc.achatsConsommes, "total", undefined,
      !nonZero(fc.achatsConsommes)),

    node("marge_prod", "Marge sur production", fc.margeProd, "highlight"),

    // ── SECTION 3 : Valeur ajoutée ─────────────────────────────────────────
    node("sec_va", "VALEUR AJOUTÉE", fc.valeurAjoutee, "section"),

    ...(nonZero(fc.fournitures)
      ? [node("fournitures", "Fournitures consommables", fc.fournitures, "normal",
          childNodes(fournituresRows, "fournitures"), true)]
      : []),

    ...(nonZero(fc.services)
      ? [node("services", "Services extérieurs", fc.services, "normal",
          childNodes(servicesRows, "services"), true)]
      : []),

    node("charges_ext", "Charges externes (Total)", fc.chargesExternes, "total", undefined,
      !nonZero(fc.chargesExternes)),

    node("va", "Valeur ajoutée", fc.valeurAjoutee, "highlight"),

    // ── SECTION 4 : EBE ────────────────────────────────────────────────────
    node("sec_ebe", "EXCÉDENT BRUT D'EXPLOITATION", fc.ebe, "section"),

    node("salaires_bruts", "Salaires bruts (Salariés)", fc.chargesPersonnel.salairesBruts, "normal",
      childNodes(salaireRows, "salaires_bruts"), true),
    node("charges_sociales", "Charges sociales (Salariés)", fc.chargesPersonnel.chargesPatronales, "normal", undefined, true),
    node("remunerations_dir", "Rémunération du dirigeant", fc.chargesPersonnel.remuDirigeant, "normal",
      childNodes(dirigeantRows, "remunerations_dir"), true),
    node("cotisations_tns", "Cotisations TNS", fc.chargesPersonnel.cotisationsTNSTotal, "normal",
      childNodes(cotisationsRows, "cotisations_tns"), true),
    node("charges_personnel", "Charges de personnel (Total)", fc.chargesPersonnel.total, "total", undefined,
      !nonZero(fc.chargesPersonnel.total)),

    node("impots_taxes", "Impôts et taxes", fc.impotsTaxes, "normal",
      childNodes(impotsRows, "impots_taxes"), true),

    ...(nonZero(fc.subventions)
      ? [node("subventions", "Subventions d'exploitation", fc.subventions, "normal", undefined, true)]
      : []),

    node("ebe", "Excédent brut d'exploitation", fc.ebe, "highlight"),

    // ── SECTION 5 : Résultats ──────────────────────────────────────────────
    node("sec_resultats", "RÉSULTATS", fc.resNet, "section"),

    node("dotations_amort", "Dotations aux amortissements", fc.dotationsAmort, "normal",
      dotationsParImmoData.length > 0
        ? [
            ...(dotParNature.CORPOREL.length > 0
              ? [node("dot_amort_corp", "Immobilisations corporelles", dotCorporel, "normal",
                  dotParNature.CORPOREL.map((d, i) =>
                    node(`dot_amort_corp_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
            ...(dotParNature.INCORPOREL.length > 0
              ? [node("dot_amort_incorp", "Immobilisations incorporelles", dotIncorporel, "normal",
                  dotParNature.INCORPOREL.map((d, i) =>
                    node(`dot_amort_incorp_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
            ...(dotParNature.FINANCIER.length > 0
              ? [node("dot_amort_fin", "Immobilisations financières", dotFinancier, "normal",
                  dotParNature.FINANCIER.map((d, i) =>
                    node(`dot_amort_fin_c${i}`, d.immo.libelle, { y1: d.y1, y2: d.y2, y3: d.y3 }, "normal", undefined, true)
                  ))]
              : []),
          ]
        : undefined,
      true,
    ),

    ...(nonZero(fc.dotationsProvisions)
      ? [node("dotations_prov", "Dotations sur provisions", fc.dotationsProvisions, "normal", undefined, true)]
      : []),

    ...(nonZero(fc.reprises)
      ? [node("reprises", "Reprises sur provisions", fc.reprises, "normal", childNodes(reprisesRows, "reprises"), true)]
      : []),

    node("res_expl", "Résultat d'exploitation", fc.resExpl, "highlight"),

    node("charges_fin", "Charges financières", fc.chargesFinTotal, "normal", undefined,
      !nonZero(fc.chargesFinTotal)),

    ...(nonZero(fc.produitsFinanciers)
      ? [node("prod_fin", "Produits financiers", fc.produitsFinanciers, "normal",
          childNodes(prodFinRows, "prod_fin"), true)]
      : []),

    node("res_fin", "Résultat financier", fc.resFin, "highlight", undefined,
      !nonZero(fc.resFin)),

    node("res_courant", "Résultat courant", fc.resCourant, "highlight"),

    ...(isIS
      ? [node("is", "Impôt sur les bénéfices (IS)", fc.isParAnnee, "normal", undefined, true)]
      : []),

    ...(nonZero(fc.resExcep)
      ? [node("res_excep", "Résultat exceptionnel", fc.resExcep, "normal", undefined, true)]
      : []),

    node("res_net", "Résultat de l'exercice", fc.resNet, "highlight"),
    node("caf", "Capacité d'autofinancement (CAF)", fc.caf, "caf"),
  ];
}
