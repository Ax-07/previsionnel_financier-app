"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { n, makeExerciceHelpers } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { buildFinCalc } from "@/lib/finance/calculs";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CRYearValue {
  amount: number;
  pct: number | null; // % du CA
}

export interface CRNode {
  key: string;
  label: string;
  values: Record<YearKey, CRYearValue>;
  children?: CRNode[];
  /** Niveau d'affichage : normal | section (titre section) | total | result */
  style: "normal" | "section" | "total" | "result";
  /** Masquer si les trois valeurs sont à 0 (lignes vides) */
  hideIfZero?: boolean;
}

export interface CompteResultatData {
  /** Labels des exercices, ex: "2026–2027" */
  yearLabels: Record<YearKey, string>;
  nodes: CRNode[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkVal(val: number, pct: number | null): CRYearValue {
  return { amount: val, pct };
}

/** Construire un nœud fille à partir d'une liste de lignes actives */
function buildChildNodes(
  rows: Array<{
    id?: string;
    libelle: string;
    actif?: boolean | null;
    montantN: number;
    montantN1: number;
    montantN2: number;
  }>,
  parentKey: string,
  ca: Record<YearKey, number>,
): CRNode[] {
  return rows
    .filter((r) => r.actif !== false)
    .map((r, i) => ({
      key: `${parentKey}_child_${i}`,
      label: r.libelle,
      values: {
        y1: mkVal(r.montantN, ca.y1 ? (r.montantN / ca.y1) * 100 : null),
        y2: mkVal(r.montantN1, ca.y2 ? (r.montantN1 / ca.y2) * 100 : null),
        y3: mkVal(r.montantN2, ca.y3 ? (r.montantN2 / ca.y3) * 100 : null),
      },
      style: "normal" as const,
      hideIfZero: true,
    }));
}

// ── Server Action principale ───────────────────────────────────────────────────

export async function fetchCompteResultat(
  dossierId: string,
): Promise<CompteResultatData> {
  const data = await fetchScenarioData(dossierId);
  const fc = buildFinCalc(data, data.dateDemarrage);

  const { anneeDebut, yearLabels } = fc;

  const {
    activites,
    activiteCommissions: commissions,
    productionsImmobilisees: productionsImmo,
    subventionsExploitation: subventions,
    fournitures,
    services,
    impotsTaxes: impots,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    immobilisations,
    provisions,
    chargesGestionCourante,
    chargesExceptionnelles,
    chargesFinancieres,
    emprunts,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
  } = data;

  // ── Tableaux de lignes pour le drill-down des nœuds UI ────────────────────

  // ── CA par activité ────────────────────────────────────────────────────────
  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      id: a.id,
      libelle: a.libelle,
      actif: a.actif,
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
    }));

  // ── Achats de matières / marchandises ──────────────────────────────────────
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => ({
      libelle: `Achats – ${r.libelle}`,
      actif: r.actif,
      montantN: r.montantN * Math.max(0, 1 - r.tauxMarge / 100),
      montantN1: r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100),
      montantN2: r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100),
    }));

  // ── Achats de stock ponctuels par activité (totaux annuels pour le drill-down) ──
  const achatsPonctuelsRows = activites
    .filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES")
    .flatMap((a) => {
      const p = a.achatsStockPonctuel as Record<string, number[]> | null | undefined;
      if (!p) return [];
      const sumArr = (arr: number[] | undefined) => (arr ?? []).reduce((s, v) => s + v, 0);
      const y1 = sumArr(p["N"]);
      const y2 = sumArr(p["N1"]);
      const y3 = sumArr(p["N2"]);
      if (y1 === 0 && y2 === 0 && y3 === 0) return [];
      return [{ libelle: `Achats ponctuels – ${a.libelle}`, montantN: y1, montantN1: y2, montantN2: y3 }];
    });

  // ── Commissions ───────────────────────────────────────────────────────────
  const commissionRows = commissions
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  // ── Reprises sur provisions ───────────────────────────────────────────────
  const reprisesRows = reprisesProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  // ── Fournitures & services ─────────────────────────────────────────────────
  const fournituresRows = fournitures
    .filter((f) => f.actif !== false)
    .map((f) => ({ libelle: f.libelle, actif: f.actif, montantN: n(f.montantN), montantN1: n(f.montantN1), montantN2: n(f.montantN2) }));

  const servicesRows = services
    .filter((s) => s.actif !== false)
    .map((s) => ({ libelle: s.libelle, actif: s.actif, montantN: n(s.montantN), montantN1: n(s.montantN1), montantN2: n(s.montantN2) }));

  // ── Impôts ────────────────────────────────────────────────────────────────
  const impotsRows = impots
    .filter((i) => i.actif !== false)
    .map((i) => ({ libelle: i.libelle, actif: i.actif, montantN: n(i.montantN ?? 0), montantN1: n(i.montantN1 ?? 0), montantN2: n(i.montantN2 ?? 0) }));

  // ── Personnel ─────────────────────────────────────────────────────────────
  const salaireRows = salaries
    .filter((s) => s.actif !== false)
    .map((s) => ({ libelle: s.libelle, actif: s.actif, montantN: n(s.montantN), montantN1: n(s.montantN1), montantN2: n(s.montantN2) }));

  const dirigeantRows = dirigeants
    .filter((d) => d.actif !== false)
    .map((d) => ({ libelle: d.libelle, actif: d.actif, montantN: n(d.montantN), montantN1: n(d.montantN1), montantN2: n(d.montantN2) }));

  const cotisationsRows = cotisationsTNS
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  const taxesSalairesRows = taxesSalaires
    .map((t) => ({ libelle: t.libelle, montantN: n(t.montantN), montantN1: n(t.montantN1), montantN2: n(t.montantN2) }));

  // ── Amortissements drill-down — mode réel (AUCUN / LINEAIRE / DEGRESSIF) ──
  const dotationsParImmoData = immobilisations
    .filter((immo) => immo.actif !== false)
    .map((immo) => {
      const dot = distribuerAmortParExercice(immo, anneeDebut, fc.moisDebut);
      return { immo, y1: dot.y1, y2: dot.y2, y3: dot.y3 };
    });

  const dotParNature = {
    CORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "CORPOREL"),
    INCORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "INCORPOREL"),
    FINANCIER: dotationsParImmoData.filter((d) => d.immo.nature === "FINANCIER"),
  };

  function sumDotGroup(groupe: { y1: number; y2: number; y3: number }[]): Record<YearKey, number> {
    return {
      y1: groupe.reduce((s, d) => s + d.y1, 0),
      y2: groupe.reduce((s, d) => s + d.y2, 0),
      y3: groupe.reduce((s, d) => s + d.y3, 0),
    };
  }

  const dotCorporel = sumDotGroup(dotParNature.CORPOREL);
  const dotIncorporel = sumDotGroup(dotParNature.INCORPOREL);
  const dotFinancier = sumDotGroup(dotParNature.FINANCIER);

  // ── Charges financières drill-down ─────────────────────────────────────────
  const { toExerciceKey } = makeExerciceHelpers(data.dateDemarrage);

  // Intérêts + assurances par emprunt
  const interetsParEmprunt = emprunts
    .filter((e) => e.lignesEcheancier.length > 0)
    .map((emprunt) => {
      const vals = { y1: 0, y2: 0, y3: 0 };
      for (const ligne of emprunt.lignesEcheancier) {
        if (ligne.moisNumero === 0) continue;
        const dateStr =
          ligne.dateEcheance instanceof Date
            ? ligne.dateEcheance.toISOString()
            : String(ligne.dateEcheance);
        const yk = toExerciceKey(dateStr);
        if (yk) {
          vals[yk] += n(ligne.interesMois) + n(ligne.assuranceMois);
        }
      }
      return { libelle: emprunt.libelle, ...vals };
    })
    .filter((e) => e.y1 !== 0 || e.y2 !== 0 || e.y3 !== 0);

  // Frais de dossier par emprunt
  const fraisDossierParEmprunt = emprunts
    .map((emprunt) => {
      const vals = { y1: 0, y2: 0, y3: 0 };
      for (const ligne of emprunt.lignesEcheancier) {
        if (ligne.moisNumero !== 0) continue;
        const dateStr =
          ligne.dateEcheance instanceof Date
            ? ligne.dateEcheance.toISOString()
            : String(ligne.dateEcheance);
        const yk = toExerciceKey(dateStr);
        if (yk) {
          vals[yk] += n(ligne.mensualiteTotale);
        }
      }
      return { libelle: emprunt.libelle, ...vals };
    })
    .filter((e) => e.y1 !== 0 || e.y2 !== 0 || e.y3 !== 0);

  // Autres charges financières saisies manuellement
  const autresChargesFinRows = chargesFinancieres
    .filter((c) => c.actif !== false)
    .map((c) => ({
      libelle: c.libelle,
      montantN: n(c.montantN),
      montantN1: n(c.montantN1),
      montantN2: n(c.montantN2),
    }));

  // ── Autres charges ────────────────────────────────────────────────────────
  const provisionsRows = provisions
    .filter((p) => p.actif !== false)
    .map((p) => ({ libelle: p.libelle, actif: p.actif, montantN: n(p.montantN), montantN1: n(p.montantN1), montantN2: n(p.montantN2) }));

  const chargesGestionRows = chargesGestionCourante
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  const prodFinRows = financiersProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const prodExcepRows = exceptionnelsProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const chargesExcepRows = chargesExceptionnelles
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  // ── Agrégats depuis buildFinCalc (source unique de vérité) ───────────────
  const ca = fc.ca;
  const achats = fc.achatsEffectues;
  const achatsConsommes = fc.achatsConsommes;
  // Variation de stocks : signe PCG = SI − SF (négatif si le stock augmente → réduit les charges)
  const varStockDisplay: Record<YearKey, number> = {
    y1: -fc.varStock.y1,
    y2: -fc.varStock.y2,
    y3: -fc.varStock.y3,
  };
  const commissionsTotal = fc.commissionsTotal;
  const prodImmo = fc.prodImmo;
  const subventionsTotal = fc.subventions;
  const reprises = fc.reprises;
  const transferts = fc.transferts;
  const autresProdGestion = fc.autresProdGestion;
  const totalProduitsExpl = fc.totalProduitsExpl;
  const fournituresTotal = fc.fournitures;
  const servicesTotal = fc.services;
  // Sous-total affiché : achatsConsommes + fournitures + services (PCG, intègre la variation de stock)
  const chargesExternes: Record<YearKey, number> = {
    y1: achatsConsommes.y1 + fc.fournitures.y1 + fc.services.y1,
    y2: achatsConsommes.y2 + fc.fournitures.y2 + fc.services.y2,
    y3: achatsConsommes.y3 + fc.fournitures.y3 + fc.services.y3,
  };
  const impotsTotal = fc.impotsTaxes;
  const salairesBruts = fc.chargesPersonnel.salairesBruts;
  const chargesPatronales = fc.chargesPersonnel.chargesPatronales;
  const remuDirigeant = fc.chargesPersonnel.remuDirigeant;
  const cotisationsTNSTotal = fc.chargesPersonnel.cotisationsTNSTotal;
  const taxesSalairesTotal = fc.chargesPersonnel.taxesSalairesTotal;
  const chargesPersonnel = fc.chargesPersonnel.total;
  const dotationsAmortissements = fc.dotationsAmort;
  const dotationsProvisions = fc.dotationsProvisions;
  const autresChargesGestion = fc.autresChargesGestion;
  // totalChargesExpl par identité comptable : produits − résultat d'exploitation
  const totalChargesExpl: Record<YearKey, number> = {
    y1: fc.totalProduitsExpl.y1 - fc.resExpl.y1,
    y2: fc.totalProduitsExpl.y2 - fc.resExpl.y2,
    y3: fc.totalProduitsExpl.y3 - fc.resExpl.y3,
  };
  const resExpl = fc.resExpl;
  const produitsFinanciers = fc.produitsFinanciers;
  const chargesFinTotal: Record<YearKey, number> = {
    y1: fc.interetsEmprunts.y1 + fc.fraisDossierEmprunts.y1 + fc.autresChargesFinancieres.y1,
    y2: fc.interetsEmprunts.y2 + fc.fraisDossierEmprunts.y2 + fc.autresChargesFinancieres.y2,
    y3: fc.interetsEmprunts.y3 + fc.fraisDossierEmprunts.y3 + fc.autresChargesFinancieres.y3,
  };
  const resFin = fc.resFin;
  const resCourant = fc.resCourant;
  const produitsExcep: Record<YearKey, number> = {
    y1: prodExcepRows.reduce((s, r) => s + r.montantN, 0),
    y2: prodExcepRows.reduce((s, r) => s + r.montantN1, 0),
    y3: prodExcepRows.reduce((s, r) => s + r.montantN2, 0),
  };
  const chargesExcep: Record<YearKey, number> = {
    y1: chargesExcepRows.reduce((s, r) => s + r.montantN, 0),
    y2: chargesExcepRows.reduce((s, r) => s + r.montantN1, 0),
    y3: chargesExcepRows.reduce((s, r) => s + r.montantN2, 0),
  };
  const resExcep = fc.resExcep;
  const isParAnnee = fc.isParAnnee;
  const resNet = fc.resNet;
  const isIS = data.isIS;

  // ─ 5. Construction de l'arbre ─────────────────────────────────────────────

  function pct(amount: number, base: number): number | null {
    return base !== 0 ? (amount / base) * 100 : null;
  }

  function node(
    key: string,
    label: string,
    vals: Record<YearKey, number>,
    style: CRNode["style"],
    children?: CRNode[],
    hideIfZero = false,
  ): CRNode {
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

  const nodes: CRNode[] = [
    // ── PRODUITS D'EXPLOITATION ───────────────────────────────────────────
    node("prod_expl_header", "PRODUITS D'EXPLOITATION", totalProduitsExpl, "section"),

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

    ...(commissionsTotal.y1 !== 0 || commissionsTotal.y2 !== 0 || commissionsTotal.y3 !== 0
      ? [
          node(
            "commissions",
            "Commissions",
            commissionsTotal,
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

    ...(prodImmo.y1 !== 0 || prodImmo.y2 !== 0 || prodImmo.y3 !== 0
      ? [node("prod_immo", "Productions immobilisées", prodImmo, "normal", undefined, true)]
      : []),

    ...(subventionsTotal.y1 !== 0 || subventionsTotal.y2 !== 0 || subventionsTotal.y3 !== 0
      ? [node("subventions_expl", "Subventions d'exploitation", subventionsTotal, "normal", undefined, true)]
      : []),

    ...(reprises.y1 !== 0 || reprises.y2 !== 0 || reprises.y3 !== 0
      ? [node("reprises", "Reprises sur provisions", reprises, "normal", buildChildNodes(reprisesRows, "reprises", ca), true)]
      : []),

    ...(transferts.y1 !== 0 || transferts.y2 !== 0 || transferts.y3 !== 0
      ? [node("transferts", "Transferts de charges", transferts, "normal", undefined, true)]
      : []),

    ...(autresProdGestion.y1 !== 0 || autresProdGestion.y2 !== 0 || autresProdGestion.y3 !== 0
      ? [node("autres_prod_gestion", "Autres produits de gestion courante", autresProdGestion, "normal", undefined, true)]
      : []),

    node("total_prod_expl", "Total des produits d'exploitation", totalProduitsExpl, "total"),

    // ── CHARGES D'EXPLOITATION ────────────────────────────────────────────
    node("charges_expl_header", "CHARGES D'EXPLOITATION", totalChargesExpl, "section"),

    ...(achats.y1 !== 0 || achats.y2 !== 0 || achats.y3 !== 0
      ? [
          node(
            "achats",
            "Achats effectués de matières / marchandises",
            achats,
            "normal",
            [
              ...buildChildNodes(achatsRows, "achats", ca),
              ...achatsPonctuelsRows.map((r, i) => ({
                key: `achats_ponctuel_${i}`,
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

    ...(varStockDisplay.y1 !== 0 || varStockDisplay.y2 !== 0 || varStockDisplay.y3 !== 0
      ? [node("variation_stock", "Variation de stocks", varStockDisplay, "normal", undefined, true)]
      : []),

    ...(fournituresTotal.y1 !== 0 || fournituresTotal.y2 !== 0 || fournituresTotal.y3 !== 0
      ? [
          node(
            "fournitures",
            "Fournitures consommables",
            fournituresTotal,
            "normal",
            buildChildNodes(fournituresRows, "fournitures", ca),
            true,
          ),
        ]
      : []),

    ...(servicesTotal.y1 !== 0 || servicesTotal.y2 !== 0 || servicesTotal.y3 !== 0
      ? [
          node(
            "services",
            "Services extérieurs",
            servicesTotal,
            "normal",
            buildChildNodes(servicesRows, "services", ca),
            true,
          ),
        ]
      : []),

    node("charges_ext", "Charges externes (Total)", chargesExternes, "total"),

    node(
      "impots_taxes",
      "Impôts et taxes",
      impotsTotal,
      "normal",
      buildChildNodes(impotsRows, "impots", ca),
      true,
    ),

    node(
      "salaires_bruts",
      "Salaires bruts (Salariés)",
      salairesBruts,
      "normal",
      buildChildNodes(salaireRows, "salaires", ca),
      true,
    ),
    node("charges_sociales", "Charges sociales (Salariés)", chargesPatronales, "normal", undefined, true),
    node(
      "remunerations_dir",
      "Rémunération du dirigeant",
      remuDirigeant,
      "normal",
      buildChildNodes(dirigeantRows, "dirigeants", ca),
      true,
    ),
    node(
      "cotisations_tns",
      "Cotisations TNS",
      cotisationsTNSTotal,
      "normal",
      buildChildNodes(cotisationsRows, "cotisations_tns", ca),
      true,
    ),
    node(
      "taxes_salaires",
      "Taxes assises sur les salaires",
      taxesSalairesTotal,
      "normal",
      buildChildNodes(taxesSalairesRows, "taxes_sal", ca),
      taxesSalairesRows.length === 0,
    ),
    node("charges_personnel", "Charges de personnel (Total)", chargesPersonnel, "total"),

    node("dotations_amort", "Dotations aux amortissements", dotationsAmortissements, "normal",
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
      true),

    ...(dotationsProvisions.y1 !== 0 || dotationsProvisions.y2 !== 0 || dotationsProvisions.y3 !== 0
      ? [node("dotations_provisions", "Dotations sur provisions", dotationsProvisions, "normal", buildChildNodes(provisionsRows, "provisions", ca), true)]
      : []),

    ...(autresChargesGestion.y1 !== 0 || autresChargesGestion.y2 !== 0 || autresChargesGestion.y3 !== 0
      ? [node("autres_charges_gestion", "Autres charges de gestion courante", autresChargesGestion, "normal", buildChildNodes(chargesGestionRows, "charges_gestion", ca), true)]
      : []),

    node("total_charges_expl", "Total des charges d'exploitation", totalChargesExpl, "total"),

    // ── RÉSULTAT D'EXPLOITATION ───────────────────────────────────────────
    node("res_expl", "Résultat d'exploitation", resExpl, "result"),

    // ── RÉSULTAT FINANCIER ────────────────────────────────────────────────
    ...(produitsFinanciers.y1 !== 0 || produitsFinanciers.y2 !== 0 || produitsFinanciers.y3 !== 0
      ? [node("produits_fin", "Produits financiers", produitsFinanciers, "normal", buildChildNodes(prodFinRows, "prod_fin", ca), true)]
      : []),

    ...(chargesFinTotal.y1 !== 0 || chargesFinTotal.y2 !== 0 || chargesFinTotal.y3 !== 0
      ? [
          node(
            "charges_fin",
            "Charges financières (dont intérêts emprunts)",
            chargesFinTotal,
            "normal",
            [
              ...(interetsParEmprunt.length > 0
                ? [
                    node(
                      "charges_fin_interets",
                      "Intérêts et assurances emprunts",
                      {
                        y1: fc.interetsEmprunts.y1,
                        y2: fc.interetsEmprunts.y2,
                        y3: fc.interetsEmprunts.y3,
                      },
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
                      {
                        y1: fc.fraisDossierEmprunts.y1,
                        y2: fc.fraisDossierEmprunts.y2,
                        y3: fc.fraisDossierEmprunts.y3,
                      },
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

    node("res_fin", "Résultat financier", resFin, "result"),

    // ── RÉSULTAT COURANT ──────────────────────────────────────────────────
    node("res_courant", "Résultat courant avant impôt", resCourant, "result"),

    // ── RÉSULTAT EXCEPTIONNEL ─────────────────────────────────────────────
    ...(produitsExcep.y1 !== 0 || produitsExcep.y2 !== 0 || produitsExcep.y3 !== 0
      ? [node("produits_excep", "Produits exceptionnels", produitsExcep, "normal", buildChildNodes(prodExcepRows, "prod_excep", ca), true)]
      : []),
    ...(chargesExcep.y1 !== 0 || chargesExcep.y2 !== 0 || chargesExcep.y3 !== 0
      ? [node("charges_excep", "Charges exceptionnelles", chargesExcep, "normal", buildChildNodes(chargesExcepRows, "charges_excep", ca), true)]
      : []),
    ...(resExcep.y1 !== 0 || resExcep.y2 !== 0 || resExcep.y3 !== 0
      ? [node("res_excep", "Résultat exceptionnel", resExcep, "result", undefined, true)]
      : []),

    // ── IS ────────────────────────────────────────────────────────────────
    ...(isIS
      ? [node("is", isIS ? "Impôt sur les bénéfices (IS)" : "Impôt (IR — hors CR)", isParAnnee, "normal", undefined, true)]
      : []),

    // ── RÉSULTAT NET ──────────────────────────────────────────────────────
    node("res_net", "Résultat de l'exercice", resNet, "result"),
  ];

  return { yearLabels, nodes };
}
