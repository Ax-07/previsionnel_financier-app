import { totalOf, type MonthlyAcc } from "@/lib/finance/calculs/monthly";
import type { MonthlyCalcResult } from "@/lib/finance/calculs/monthly";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { YearKey } from "@/lib/finance/utils";
import { budgetNode, n12, zeroAcc, childActivityNodes, childChargeNodes, childSimpleNodes } from "./helpers";
import type { BudgetNode } from "./types";

function sumGroup(groupe: { series: MonthlyAcc }[]): MonthlyAcc {
  const tot = zeroAcc();
  for (const d of groupe) {
    for (const yk of ["y1", "y2", "y3"] as YearKey[]) {
      for (let i = 0; i < 12; i++) tot[yk][i]! += d.series[yk][i] ?? 0;
    }
  }
  return tot;
}

export function buildBudgetTree(
  data: ScenarioFinData,
  mc: MonthlyCalcResult,
): BudgetNode[] {
  const achatsEffY = {
    y1: totalOf(mc.achatsEffectues.y1),
    y2: totalOf(mc.achatsEffectues.y2),
    y3: totalOf(mc.achatsEffectues.y3),
  };
  const achatsConsY = {
    y1: totalOf(mc.achatsConsommes.y1),
    y2: totalOf(mc.achatsConsommes.y2),
    y3: totalOf(mc.achatsConsommes.y3),
  };
  const hasStocks =
    totalOf(mc.stockFinal.y1) !== 0 ||
    totalOf(mc.stockFinal.y2) !== 0 ||
    totalOf(mc.stockFinal.y3) !== 0;

  const prodVendueY = {
    y1: totalOf(mc.caByType.productionVendue.y1),
    y2: totalOf(mc.caByType.productionVendue.y2),
    y3: totalOf(mc.caByType.productionVendue.y3),
  };
  const prestationsY = {
    y1: totalOf(mc.caByType.prestationServices.y1),
    y2: totalOf(mc.caByType.prestationServices.y2),
    y3: totalOf(mc.caByType.prestationServices.y3),
  };
  const ventesY = {
    y1: totalOf(mc.caByType.ventesMarchandises.y1),
    y2: totalOf(mc.caByType.ventesMarchandises.y2),
    y3: totalOf(mc.caByType.ventesMarchandises.y3),
  };

  const isSeries = mc.isSeries;
  const isParAnnee = mc.isParAnnee;

  const rawNodes: (BudgetNode | null)[] = [
    // ── SECTION 1 : Production et marge ──────────────────────────────────────
    n12("sec_prod", "PRODUCTION ET MARGE SUR PRODUCTION", mc.ca, "section"),

    ...(prodVendueY.y1 !== 0 || prodVendueY.y2 !== 0 || prodVendueY.y3 !== 0
      ? [
          budgetNode(
            "prod_vendue",
            "Production vendue",
            mc.caByType.productionVendue,
            "normal",
            childActivityNodes(
              mc.caByActivity.filter(
                (a) =>
                  data.activites.find((x) => x.libelle === a.libelle)
                    ?.typeActivite === "PRODUCTION_VENDUE",
              ),
              "prod_vendue",
            ),
          ),
        ]
      : []),

    ...(prestationsY.y1 !== 0 || prestationsY.y2 !== 0 || prestationsY.y3 !== 0
      ? [
          budgetNode(
            "prestations_services",
            "Prestations de services",
            mc.caByType.prestationServices,
            "normal",
            childActivityNodes(
              mc.caByActivity.filter(
                (a) =>
                  data.activites.find((x) => x.libelle === a.libelle)
                    ?.typeActivite === "PRESTATION_SERVICES",
              ),
              "prestations_services",
            ),
          ),
        ]
      : []),

    ...(ventesY.y1 !== 0 || ventesY.y2 !== 0 || ventesY.y3 !== 0
      ? [
          budgetNode(
            "ventes_marchandises",
            "Ventes de marchandises",
            mc.caByType.ventesMarchandises,
            "normal",
            childActivityNodes(
              mc.caByActivity.filter(
                (a) =>
                  data.activites.find((x) => x.libelle === a.libelle)
                    ?.typeActivite === "VENTE_MARCHANDISES",
              ),
              "ventes_marchandises",
            ),
          ),
        ]
      : []),

    budgetNode("prod_exercice", "Production de l'exercice", mc.ca, "total"),

    n12(
      "achats_effectues",
      "Achats effectués de matières",
      mc.achatsEffectues,
      "normal",
      childActivityNodes(mc.achatsByActivity, "achats_effectues"),
      achatsEffY.y1 === 0 && achatsEffY.y2 === 0 && achatsEffY.y3 === 0,
    ),

    ...(hasStocks
      ? ([
          n12(
            "stock_initial",
            "Stock initial de matières",
            mc.stockInitial,
            "normal",
            childActivityNodes(mc.stockInitialByActivity, "stock_initial"),
            true,
          ),
          n12(
            "stock_final",
            "Stock final de matières",
            mc.stockFinal,
            "normal",
            childActivityNodes(mc.stockFinalByActivity, "stock_final"),
            true,
          ),
          n12(
            "var_stock",
            "Variation de stock de matières",
            mc.varStock,
            "normal",
            childActivityNodes(mc.varStockByActivity, "var_stock"),
            true,
          ),
        ].filter(Boolean) as BudgetNode[])
      : []),

    budgetNode(
      "achats_consommes_mat",
      "Achats consommés de matières",
      mc.achatsConsommes,
      "total",
    ),

    budgetNode("marge_prod", "Marge sur production", mc.margeGlobale, "result"),

    // ── SECTION 2 : Marge globale ─────────────────────────────────────────────
    n12("sec_marge_glob", "MARGE GLOBALE", mc.ca, "section"),

    budgetNode("ca", "Chiffre d'affaires", mc.ca, "normal",
      childActivityNodes(mc.caByActivity, "ca")),

    budgetNode("ventes_prod", "Ventes + Production réelle", mc.ca, "total"),

    n12(
      "achats_consommes_glob",
      "Achats consommés",
      mc.achatsConsommes,
      "normal",
      undefined,
      achatsConsY.y1 === 0 && achatsConsY.y2 === 0 && achatsConsY.y3 === 0,
    ),

    budgetNode("marge_globale", "Marge globale", mc.margeGlobale, "result"),

    // ── SECTION 3 : Valeur ajoutée ────────────────────────────────────────────
    n12("sec_va", "VALEUR AJOUTÉE", mc.valeurAjoutee, "section"),

    n12(
      "fournitures",
      "Fournitures consommables",
      mc.fournitures,
      "normal",
      childChargeNodes(data.fournitures, "fournitures"),
      data.fournitures.length === 0,
    ),

    n12(
      "services",
      "Services extérieurs",
      mc.services,
      "normal",
      childChargeNodes(data.services, "services"),
      data.services.length === 0,
    ),

    budgetNode("charges_ext", "Charges externes (Total)", mc.chargesExternes, "total"),

    budgetNode("va", "Valeur ajoutée", mc.valeurAjoutee, "result"),

    // ── SECTION 4 : EBE ───────────────────────────────────────────────────────
    n12("sec_ebe", "EXCÉDENT BRUT D'EXPLOITATION", mc.ebe, "section"),

    n12(
      "impots_taxes",
      "Impôts et taxes",
      mc.impotsTaxes,
      "normal",
      childChargeNodes(data.impotsTaxes, "impots_taxes"),
      data.impotsTaxes.length === 0,
    ),

    n12(
      "salaires_bruts",
      "Salaires bruts",
      mc.salairesBruts,
      "normal",
      childSimpleNodes(data.salaries, "salaires_bruts"),
      data.salaries.length === 0,
    ),

    n12(
      "charges_sociales",
      "Charges sociales",
      mc.chargesPatronales,
      "normal",
      undefined,
      totalOf(mc.chargesPatronales.y1) === 0 &&
        totalOf(mc.chargesPatronales.y2) === 0 &&
        totalOf(mc.chargesPatronales.y3) === 0,
    ),

    n12(
      "remunerations_dir",
      "Rémunération dirigeant",
      mc.remuDirigeant,
      "normal",
      childSimpleNodes(data.dirigeants, "remunerations_dir"),
      data.dirigeants.length === 0,
    ),

    n12(
      "cotisations_tns",
      "Cotisations TNS",
      mc.cotisationsTNS,
      "normal",
      childSimpleNodes(data.cotisationsTNS, "cotisations_tns"),
      data.cotisationsTNS.length === 0,
    ),

    n12(
      "taxes_salaires",
      "Taxes assises sur les salaires",
      mc.taxesSalaires,
      "normal",
      childSimpleNodes(data.taxesSalaires, "taxes_salaires"),
      data.taxesSalaires.length === 0,
    ),

    budgetNode(
      "charges_personnel",
      "Charges de personnel (Total)",
      mc.chargesPersonnel,
      "total",
    ),

    n12(
      "subventions",
      "Subventions d'exploitation",
      mc.subventions,
      "normal",
      undefined,
      data.subventionsExploitation.length === 0,
    ),

    budgetNode("ebe", "Excédent brut d'exploitation", mc.ebe, "result"),

    // ── SECTION 5 : Résultats ─────────────────────────────────────────────────
    n12("sec_resultats", "RÉSULTATS", mc.resNet, "section"),

    n12(
      "dotations_amort",
      "Dotations aux amortissements",
      mc.dotationsAmort,
      "normal",
      mc.dotationsParImmo.length > 0
        ? (() => {
            const byNature = {
              CORPOREL: mc.dotationsParImmo.filter((d) => d.immo.nature === "CORPOREL"),
              INCORPOREL: mc.dotationsParImmo.filter((d) => d.immo.nature === "INCORPOREL"),
              FINANCIER: mc.dotationsParImmo.filter((d) => d.immo.nature === "FINANCIER"),
            };
            const children: BudgetNode[] = [];
            if (byNature.CORPOREL.length > 0) {
              children.push(
                budgetNode(
                  "dot_amort_corp",
                  "Immobilisations corporelles",
                  sumGroup(byNature.CORPOREL),
                  "normal",
                  byNature.CORPOREL.map((d, i) =>
                    budgetNode(
                      `dot_amort_corp_c${i}`,
                      d.immo.libelle,
                      d.series,
                      "normal",
                      undefined,
                      true,
                    ),
                  ),
                ),
              );
            }
            if (byNature.INCORPOREL.length > 0) {
              children.push(
                budgetNode(
                  "dot_amort_incorp",
                  "Immobilisations incorporelles",
                  sumGroup(byNature.INCORPOREL),
                  "normal",
                  byNature.INCORPOREL.map((d, i) =>
                    budgetNode(
                      `dot_amort_incorp_c${i}`,
                      d.immo.libelle,
                      d.series,
                      "normal",
                      undefined,
                      true,
                    ),
                  ),
                ),
              );
            }
            if (byNature.FINANCIER.length > 0) {
              children.push(
                budgetNode(
                  "dot_amort_fin",
                  "Immobilisations financières",
                  sumGroup(byNature.FINANCIER),
                  "normal",
                  byNature.FINANCIER.map((d, i) =>
                    budgetNode(
                      `dot_amort_fin_c${i}`,
                      d.immo.libelle,
                      d.series,
                      "normal",
                      undefined,
                      true,
                    ),
                  ),
                ),
              );
            }
            return children;
          })()
        : undefined,
      data.immobilisations.length === 0,
    ),

    n12(
      "dotations_prov",
      "Dotations sur provisions",
      mc.dotationsProvisions,
      "normal",
      undefined,
      data.provisions.length === 0,
    ),

    n12(
      "reprises_prov",
      "Reprises sur provisions",
      mc.reprises,
      "normal",
      undefined,
      data.reprisesProduits.length === 0,
    ),

    budgetNode("res_expl", "Résultat d'exploitation", mc.resExpl, "result"),

    n12(
      "prod_fin",
      "Produits financiers",
      mc.produitsFinanciers,
      "normal",
      undefined,
      data.financiersProduits.length === 0,
    ),

    n12(
      "charges_fin",
      "Charges financières",
      mc.chargesFinancieres,
      "normal",
      undefined,
      totalOf(mc.chargesFinancieres.y1) === 0 &&
        totalOf(mc.chargesFinancieres.y2) === 0 &&
        totalOf(mc.chargesFinancieres.y3) === 0,
    ),

    n12(
      "res_financier",
      "Résultat financier",
      mc.resFin,
      "normal",
      undefined,
      totalOf(mc.resFin.y1) === 0 &&
        totalOf(mc.resFin.y2) === 0 &&
        totalOf(mc.resFin.y3) === 0,
    ),

    budgetNode("res_courant", "Résultat courant", mc.resCourant, "result"),

    ...(data.isIS
      ? [
          n12(
            "is_benef",
            "Impôt sur les bénéfices (IS)",
            isSeries,
            "normal",
            undefined,
            isParAnnee.y1 === 0 && isParAnnee.y2 === 0 && isParAnnee.y3 === 0,
          ),
        ]
      : []),

    n12(
      "res_excep",
      "Résultat exceptionnel",
      mc.resExcep,
      "normal",
      undefined,
      totalOf(mc.resExcep.y1) === 0 &&
        totalOf(mc.resExcep.y2) === 0 &&
        totalOf(mc.resExcep.y3) === 0,
    ),

    budgetNode("res_net", "Résultat de l'exercice", mc.resNet, "highlight"),

    budgetNode("caf", "Capacité d'autofinancement (CAF)", mc.caf, "highlight"),
  ];

  return rawNodes.filter((nd): nd is BudgetNode => nd !== null);
}
