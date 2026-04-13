import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { SigNode } from "./types";
import type { SigDrilldownRows } from "./build-rows";
import { makeSigNodeBuilder, makeSigNodeAt100Builder, buildSigChildNodes } from "./helpers";

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
  const sigNode = makeSigNodeBuilder(ca);
  const sigNodeAt100 = makeSigNodeAt100Builder();

  function childNodes(
    r: { libelle: string; montantN: number; montantN1: number; montantN2: number }[],
    key: string,
  ) {
    return buildSigChildNodes(r, key, ca);
  }

  const {
    caRows,
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

  const {
    achatsEffectues,
    achatsConsommes,
    fournitures: fournituresAgg,
    services: servicesAgg,
    chargesExternes,
    valeurAjoutee,
    subventions: subventionsAgg,
    impotsTaxes: impotsTaxesAgg,
    chargesPersonnel,
    ebe,
    dotationsAmort,
    dotationsProvisions,
    reprises,
    resExpl,
    produitsFinanciers,
    interetsEmprunts,
    fraisDossierEmprunts,
    autresChargesFinancieres,
    resFin,
    resCourant,
    resExcep,
    isParAnnee,
    resNet,
    caf,
  } = fc;

  const margeProd: Record<YearKey, number> = {
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  };
  const margeGlobale = { ...margeProd };

  const fournituresTotal = { y1: fournituresAgg.y1, y2: fournituresAgg.y2, y3: fournituresAgg.y3 };
  const servicesTotal    = { y1: servicesAgg.y1,    y2: servicesAgg.y2,    y3: servicesAgg.y3    };
  const subventionsTotal = { y1: subventionsAgg.y1, y2: subventionsAgg.y2, y3: subventionsAgg.y3 };
  const impotsTotal      = { y1: impotsTaxesAgg.y1, y2: impotsTaxesAgg.y2, y3: impotsTaxesAgg.y3 };

  const salairesBruts      = chargesPersonnel.salairesBruts;
  const chargesPatronales  = chargesPersonnel.chargesPatronales;
  const remuDirigeant      = chargesPersonnel.remuDirigeant;
  const cotisationsTNSTotal = chargesPersonnel.cotisationsTNSTotal;
  const chargesPersonnelTotal = chargesPersonnel.total;

  const chargesFinTotal: Record<YearKey, number> = {
    y1: interetsEmprunts.y1 + fraisDossierEmprunts.y1 + autresChargesFinancieres.y1,
    y2: interetsEmprunts.y2 + fraisDossierEmprunts.y2 + autresChargesFinancieres.y2,
    y3: interetsEmprunts.y3 + fraisDossierEmprunts.y3 + autresChargesFinancieres.y3,
  };

  return [
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

    ...(achatsEffectues.y1 !== 0 || achatsEffectues.y2 !== 0 || achatsEffectues.y3 !== 0
      ? [
          sigNode(
            "achats_effectues",
            "Achats effectués de matières",
            achatsEffectues,
            "normal",
            [
              ...childNodes(achatsRows, "achats_eff_det"),
              sigNode("achats_consommes_mat", "Achats consommés de matières", achatsConsommes, "total"),
            ],
          ),
        ]
      : []),

    sigNode("marge_prod", "Marge sur production", margeProd, "highlight"),

    // ── SECTION 2 : Marge globale ──────────────────────────────────────────
    sigNode("sec_marge_glob", "MARGE GLOBALE (CA)", ca, "section"),

    sigNodeAt100("ca", "Chiffre d'affaires", ca, "normal", childNodes(caRows, "ca")),
    sigNodeAt100("ventes_prod_reelle", "Ventes + Production réelle", ca, "total"),

    sigNode("achats_consommes_glob", "Achats consommés", achatsConsommes, "normal", undefined,
      achatsConsommes.y1 === 0 && achatsConsommes.y2 === 0 && achatsConsommes.y3 === 0),

    sigNode("marge_globale", "Marge globale", margeGlobale, "highlight"),

    // ── SECTION 3 : Valeur ajoutée ─────────────────────────────────────────
    sigNode("sec_va", "VALEUR AJOUTÉE", valeurAjoutee, "section"),

    ...(fournituresTotal.y1 !== 0 || fournituresTotal.y2 !== 0 || fournituresTotal.y3 !== 0
      ? [sigNode("fournitures", "Fournitures consommables", fournituresTotal, "normal",
          childNodes(fournituresRows, "fournitures"), true)]
      : []),

    ...(servicesTotal.y1 !== 0 || servicesTotal.y2 !== 0 || servicesTotal.y3 !== 0
      ? [sigNode("services", "Services extérieurs", servicesTotal, "normal",
          childNodes(servicesRows, "services"), true)]
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

    sigNode(
      "dotations_amort",
      "Dotations aux amortissements",
      dotationsAmort,
      "normal",
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
      true,
    ),

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
      ? [sigNode("prod_fin", "Produits financiers", produitsFinanciers, "normal",
          childNodes(prodFinRows, "prod_fin"), true)]
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
}
