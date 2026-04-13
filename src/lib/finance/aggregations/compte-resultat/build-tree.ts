import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { CRNode } from "./types";
import type { DrilldownRows } from "./build-rows";
import { mkVal, pct, buildChildNodes, makeNodeBuilder } from "./helpers";

// ── Helper : vrai si au moins un exercice est non nul ─────────────────────────
function nonZero(vals: Record<YearKey, number>): boolean {
  return vals.y1 !== 0 || vals.y2 !== 0 || vals.y3 !== 0;
}

// ── Agrégats dérivés (calculs locaux, non produits par buildFinCalc) ──────────
function deriveAggregates(fc: FinCalcResult, rows: DrilldownRows) {
  return {
    varStockDisplay: { y1: -fc.varStock.y1, y2: -fc.varStock.y2, y3: -fc.varStock.y3 },
    // Charges externes (Total) = somme exacte des lignes affichées :
    //   Achats effectués + Variation de stocks (affichée −) + Fournitures + Services
    // = achatsEffectues − varStock + fournitures + services
    // = achatsConsommes + fournitures + services
    // (achatsConsommes = achatsEffectués − varStock ; les achatsPonctuels sont inclus dans achatsConsommes)
    chargesExternes: {
      y1: fc.achatsEffectues.y1 - fc.varStock.y1 + fc.fournitures.y1 + fc.services.y1,
      y2: fc.achatsEffectues.y2 - fc.varStock.y2 + fc.fournitures.y2 + fc.services.y2,
      y3: fc.achatsEffectues.y3 - fc.varStock.y3 + fc.fournitures.y3 + fc.services.y3,
    },
    totalChargesExpl: {
      y1: fc.totalProduitsExpl.y1 - fc.resExpl.y1,
      y2: fc.totalProduitsExpl.y2 - fc.resExpl.y2,
      y3: fc.totalProduitsExpl.y3 - fc.resExpl.y3,
    },
    chargesFinTotal: {
      y1: fc.interetsEmprunts.y1 + fc.fraisDossierEmprunts.y1 + fc.autresChargesFinancieres.y1,
      y2: fc.interetsEmprunts.y2 + fc.fraisDossierEmprunts.y2 + fc.autresChargesFinancieres.y2,
      y3: fc.interetsEmprunts.y3 + fc.fraisDossierEmprunts.y3 + fc.autresChargesFinancieres.y3,
    },
    produitsExcep: {
      y1: rows.prodExcepRows.reduce((s, r) => s + r.montantN, 0),
      y2: rows.prodExcepRows.reduce((s, r) => s + r.montantN1, 0),
      y3: rows.prodExcepRows.reduce((s, r) => s + r.montantN2, 0),
    },
    chargesExcep: {
      y1: rows.chargesExcepRows.reduce((s, r) => s + r.montantN, 0),
      y2: rows.chargesExcepRows.reduce((s, r) => s + r.montantN1, 0),
      y3: rows.chargesExcepRows.reduce((s, r) => s + r.montantN2, 0),
    },
  };
}

// ── Constructeur de l'arbre de nœuds ─────────────────────────────────────────

/**
 * Construit l'arbre `CRNode[]` du compte de résultat à partir des agrégats
 * financiers (`fc`) et des lignes de drill-down (`rows`).
 * Fonction pure, testable indépendamment de la couche serveur.
 */
export function buildCRTree(
  fc: FinCalcResult,
  rows: DrilldownRows,
  isIS: boolean,
): CRNode[] {
  const ca = fc.ca;
  const node = makeNodeBuilder(ca);
  const agg = deriveAggregates(fc, rows);

  const {
    caRows,
    commissionRows,
    reprisesRows,
    achatsRows,
    achatsPonctuelsRows,
    fournituresRows,
    servicesRows,
    impotsRows,
    salaireRows,
    dirigeantRows,
    cotisationsRows,
    taxesSalairesRows,
    dotationsParImmoData,
    dotParNature,
    dotCorporel,
    dotIncorporel,
    dotFinancier,
    interetsParEmprunt,
    fraisDossierParEmprunt,
    autresChargesFinRows,
    provisionsRows,
    chargesGestionRows,
    prodFinRows,
    prodExcepRows,
    chargesExcepRows,
  } = rows;

  return [
    // ── PRODUITS D'EXPLOITATION ───────────────────────────────────────────
    node("prod_expl_header", "PRODUITS D'EXPLOITATION", fc.totalProduitsExpl, "section"),

    node(
      "ca",
      "Chiffre d'affaires",
      ca,
      "total",
      caRows.map((r, i) => ({
        key: `ca_child_${i}`,
        label: r.libelle,
        values: {
          y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
          y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
          y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
        },
        style: "normal" as const,
        hideIfZero: true,
      })),
    ),

    ...(nonZero(fc.commissionsTotal)
      ? [
          node(
            "commissions",
            "Commissions",
            fc.commissionsTotal,
            "normal",
            commissionRows.map((r, i) => ({
              key: `commission_child_${i}`,
              label: r.libelle,
              values: {
                y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
                y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
                y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
              },
              style: "normal" as const,
              hideIfZero: true,
            })),
            true,
          ),
        ]
      : []),

    ...(nonZero(fc.prodImmo) ? [node("prod_immo", "Productions immobilisées", fc.prodImmo, "normal", undefined, true)] : []),
    ...(nonZero(fc.subventions) ? [node("subventions_expl", "Subventions d'exploitation", fc.subventions, "normal", undefined, true)] : []),
    ...(nonZero(fc.reprises) ? [node("reprises", "Reprises sur provisions", fc.reprises, "normal", buildChildNodes(reprisesRows, "reprises", ca), true)] : []),
    ...(nonZero(fc.transferts) ? [node("transferts", "Transferts de charges", fc.transferts, "normal", undefined, true)] : []),
    ...(nonZero(fc.autresProdGestion) ? [node("autres_prod_gestion", "Autres produits de gestion courante", fc.autresProdGestion, "normal", undefined, true)] : []),

    node("total_prod_expl", "Total des produits d'exploitation", fc.totalProduitsExpl, "total"),

    // ── CHARGES D'EXPLOITATION ────────────────────────────────────────────
    node("charges_expl_header", "CHARGES D'EXPLOITATION", agg.totalChargesExpl, "section"),

    ...(nonZero(fc.achatsEffectues)
      ? [
          node(
            "achats",
            "Achats effectués de matières / marchandises",
            fc.achatsEffectues,
            "normal",
            [
              ...buildChildNodes(achatsRows, "achats", ca),
            ],
            true,
          ),
        ]
      : []),

    ...(nonZero(agg.varStockDisplay) ? [node("variation_stock", "Variation de stocks", agg.varStockDisplay, "normal", undefined, true)] : []),
    ...(nonZero(fc.fournitures) ? [node("fournitures", "Fournitures consommables", fc.fournitures, "normal", buildChildNodes(fournituresRows, "fournitures", ca), true)] : []),
    ...(nonZero(fc.services) ? [node("services", "Services extérieurs", fc.services, "normal", buildChildNodes(servicesRows, "services", ca), true)] : []),

    node("charges_ext", "Charges externes (Total)", agg.chargesExternes, "total"),

    node("impots_taxes", "Impôts et taxes", fc.impotsTaxes, "normal", buildChildNodes(impotsRows, "impots", ca), true),

    node("salaires_bruts", "Salaires bruts (Salariés)", fc.chargesPersonnel.salairesBruts, "normal", buildChildNodes(salaireRows, "salaires", ca), true),
    node("charges_sociales", "Charges sociales (Salariés)", fc.chargesPersonnel.chargesPatronales, "normal", undefined, true),
    node("remunerations_dir", "Rémunération du dirigeant", fc.chargesPersonnel.remuDirigeant, "normal", buildChildNodes(dirigeantRows, "dirigeants", ca), true),
    node("cotisations_tns", "Cotisations TNS", fc.chargesPersonnel.cotisationsTNSTotal, "normal", buildChildNodes(cotisationsRows, "cotisations_tns", ca), true),
    node(
      "taxes_salaires",
      "Taxes assises sur les salaires",
      fc.chargesPersonnel.taxesSalairesTotal,
      "normal",
      buildChildNodes(taxesSalairesRows, "taxes_sal", ca),
      taxesSalairesRows.length === 0,
    ),
    node("charges_personnel", "Charges de personnel (Total)", fc.chargesPersonnel.total, "total"),

    node(
      "dotations_amort",
      "Dotations aux amortissements",
      fc.dotationsAmort,
      "normal",
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

    ...(nonZero(fc.dotationsProvisions) ? [node("dotations_provisions", "Dotations sur provisions", fc.dotationsProvisions, "normal", buildChildNodes(provisionsRows, "provisions", ca), true)] : []),
    ...(nonZero(fc.autresChargesGestion) ? [node("autres_charges_gestion", "Autres charges de gestion courante", fc.autresChargesGestion, "normal", buildChildNodes(chargesGestionRows, "charges_gestion", ca), true)] : []),

    node("total_charges_expl", "Total des charges d'exploitation", agg.totalChargesExpl, "total"),

    // ── RÉSULTAT D'EXPLOITATION ───────────────────────────────────────────
    node("res_expl", "Résultat d'exploitation", fc.resExpl, "result"),

    // ── RÉSULTAT FINANCIER ────────────────────────────────────────────────
    ...(nonZero(fc.produitsFinanciers)
      ? [node("produits_fin", "Produits financiers", fc.produitsFinanciers, "normal", buildChildNodes(prodFinRows, "prod_fin", ca), true)]
      : []),

    ...(nonZero(agg.chargesFinTotal)
      ? [
          node(
            "charges_fin",
            "Charges financières (dont intérêts emprunts)",
            agg.chargesFinTotal,
            "normal",
            [
              ...(interetsParEmprunt.length > 0
                ? [
                    node(
                      "charges_fin_interets",
                      "Intérêts et assurances emprunts",
                      { y1: fc.interetsEmprunts.y1, y2: fc.interetsEmprunts.y2, y3: fc.interetsEmprunts.y3 },
                      "normal",
                      interetsParEmprunt.map((e, i) => ({
                        key: `charges_fin_interets_c${i}`,
                        label: e.libelle,
                        values: {
                          y1: mkVal(e.y1, pct(e.y1, ca.y1)),
                          y2: mkVal(e.y2, pct(e.y2, ca.y2)),
                          y3: mkVal(e.y3, pct(e.y3, ca.y3)),
                        },
                        style: "normal" as const,
                        hideIfZero: true,
                      })),
                      false,
                    ),
                  ]
                : []),
              ...(fraisDossierParEmprunt.length > 0
                ? [
                    node(
                      "charges_fin_frais_dossier",
                      "Frais de dossier emprunts",
                      { y1: fc.fraisDossierEmprunts.y1, y2: fc.fraisDossierEmprunts.y2, y3: fc.fraisDossierEmprunts.y3 },
                      "normal",
                      fraisDossierParEmprunt.map((e, i) => ({
                        key: `charges_fin_frais_dossier_c${i}`,
                        label: e.libelle,
                        values: {
                          y1: mkVal(e.y1, pct(e.y1, ca.y1)),
                          y2: mkVal(e.y2, pct(e.y2, ca.y2)),
                          y3: mkVal(e.y3, pct(e.y3, ca.y3)),
                        },
                        style: "normal" as const,
                        hideIfZero: true,
                      })),
                      false,
                    ),
                  ]
                : []),
              ...autresChargesFinRows.map((r, i) => ({
                key: `charges_fin_autre_${i}`,
                label: r.libelle,
                values: {
                  y1: mkVal(r.montantN, pct(r.montantN, ca.y1)),
                  y2: mkVal(r.montantN1, pct(r.montantN1, ca.y2)),
                  y3: mkVal(r.montantN2, pct(r.montantN2, ca.y3)),
                },
                style: "normal" as const,
                hideIfZero: true,
              })),
            ],
            true,
          ),
        ]
      : []),

    node("res_fin", "Résultat financier", fc.resFin, "result"),

    // ── RÉSULTAT COURANT ──────────────────────────────────────────────────
    node("res_courant", "Résultat courant avant impôt", fc.resCourant, "result"),

    // ── RÉSULTAT EXCEPTIONNEL ─────────────────────────────────────────────
    ...(nonZero(agg.produitsExcep)
      ? [node("produits_excep", "Produits exceptionnels", agg.produitsExcep, "normal", buildChildNodes(prodExcepRows, "prod_excep", ca), true)]
      : []),
    ...(nonZero(agg.chargesExcep)
      ? [node("charges_excep", "Charges exceptionnelles", agg.chargesExcep, "normal", buildChildNodes(chargesExcepRows, "charges_excep", ca), true)]
      : []),
    ...(nonZero(fc.resExcep) ? [node("res_excep", "Résultat exceptionnel", fc.resExcep, "result", undefined, true)] : []),

    // ── IS ────────────────────────────────────────────────────────────────
    ...(isIS ? [node("is", "Impôt sur les bénéfices (IS)", fc.isParAnnee, "normal", undefined, true)] : []),

    // ── RÉSULTAT NET ──────────────────────────────────────────────────────
    node("res_net", "Résultat de l'exercice", fc.resNet, "result"),
  ];
}
