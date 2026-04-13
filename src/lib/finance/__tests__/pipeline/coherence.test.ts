/**
 * Tests de cohérence inter-modules — pipeline financier.
 *
 * Ces tests garantissent que les identités comptables fondamentales
 * sont conservées à travers l'ensemble du pipeline buildFinCalc.
 *
 * Identités vérifiées (§19 du référentiel) :
 *   CAF     = ResNet + DotationsAmort + DotationsProv − Reprises
 *   ResNet  = ResCourant + ResExcep − IS
 *   Stocks  = StockInitial(n+1) = StockFinal(n)  — continuité des stocks inter-exercices
 *
 * Tolérance : 0.01€ (erreurs d'arrondi acceptables sur les divisions mensuelles).
 */

import { describe, it, expect, beforeAll } from "vitest";
import type { FinCalcResult } from "@/lib/finance/types/results";
import type { BfrCalcResult } from "@/lib/finance/calculs/bfr";
import { buildFinCalc, calcBfr, buildTemporelCtx, calcEncaissements, calcDecaissements, subSeries } from "@/lib/finance/calculs";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import {
  SCENARIO_CREATION,
  SCENARIO_CREATION_SALARIE,
  DATE_DEMARRAGE,
} from "../fixtures/scenario-creation";

// ── Helpers d'extraction de lignes ────────────────────────────────────────────

/** Lit le montant d'une ligne du bilan par sa clé (0 si absente). */
function bilanAmt(
  rows: ReturnType<typeof buildBilanRows>["rows"],
  key: string,
  yk: "y1" | "y2" | "y3",
): number {
  return rows.find((r) => r.key === key)?.values[yk].amount ?? 0;
}

/** Lit le montant d'une ligne du plan de financement par sa clé (0 si absente). */
function pfAmt(
  rows: ReturnType<typeof buildPlanFinancementRows>["rows"],
  key: string,
  yk: "y1" | "y2" | "y3",
): number {
  return rows.find((r) => r.key === key)?.values[yk].amount ?? 0;
}

// ── Résultats pré-calculés ────────────────────────────────────────────────────

let fc: FinCalcResult;
let fcSal: FinCalcResult;
let bfrCalc: BfrCalcResult;

beforeAll(() => {
  fc = buildFinCalc(SCENARIO_CREATION, DATE_DEMARRAGE);
  fcSal = buildFinCalc(SCENARIO_CREATION_SALARIE, DATE_DEMARRAGE);
  bfrCalc = calcBfr(SCENARIO_CREATION, fc);
});

// ── Identité CAF ─────────────────────────────────────────────────────────────

describe("Cohérence — CAF = ResNet + DotAmort + DotProv − Reprises", () => {
  it("Y1 : caf.y1 = resNet.y1 + dotationsAmort.y1 + dotationsProvisions.y1 − reprises.y1", () => {
    const expected =
      fc.resNet.y1 + fc.dotationsAmort.y1 + fc.dotationsProvisions.y1 - fc.reprises.y1;
    expect(fc.caf.y1).toBeCloseTo(expected, 2);
  });

  it("Y2 : caf.y2 = resNet.y2 + dotationsAmort.y2 + dotationsProvisions.y2 − reprises.y2", () => {
    const expected =
      fc.resNet.y2 + fc.dotationsAmort.y2 + fc.dotationsProvisions.y2 - fc.reprises.y2;
    expect(fc.caf.y2).toBeCloseTo(expected, 2);
  });

  it("Y3 : caf.y3 = resNet.y3 + dotationsAmort.y3 + dotationsProvisions.y3 − reprises.y3", () => {
    const expected =
      fc.resNet.y3 + fc.dotationsAmort.y3 + fc.dotationsProvisions.y3 - fc.reprises.y3;
    expect(fc.caf.y3).toBeCloseTo(expected, 2);
  });

  it("Identité CAF tient aussi pour le scénario avec salarié", () => {
    const expected =
      fcSal.resNet.y1 +
      fcSal.dotationsAmort.y1 +
      fcSal.dotationsProvisions.y1 -
      fcSal.reprises.y1;
    expect(fcSal.caf.y1).toBeCloseTo(expected, 2);
  });
});

// ── Identité ResNet ───────────────────────────────────────────────────────────

describe("Cohérence — ResNet = ResCourant + ResExcep − IS", () => {
  it("Y1 : resNet.y1 = resCourant.y1 + resExcep.y1 − isParAnnee.y1", () => {
    const expected = fc.resCourant.y1 + fc.resExcep.y1 - fc.isParAnnee.y1;
    expect(fc.resNet.y1).toBeCloseTo(expected, 2);
  });

  it("Y2 : resNet.y2 = resCourant.y2 + resExcep.y2 − isParAnnee.y2", () => {
    const expected = fc.resCourant.y2 + fc.resExcep.y2 - fc.isParAnnee.y2;
    expect(fc.resNet.y2).toBeCloseTo(expected, 2);
  });

  it("Y3 : resNet.y3 = resCourant.y3 + resExcep.y3 − isParAnnee.y3", () => {
    const expected = fc.resCourant.y3 + fc.resExcep.y3 - fc.isParAnnee.y3;
    expect(fc.resNet.y3).toBeCloseTo(expected, 2);
  });

  it("Identité ResNet tient aussi pour le scénario avec salarié", () => {
    const expected =
      fcSal.resCourant.y1 + fcSal.resExcep.y1 - fcSal.isParAnnee.y1;
    expect(fcSal.resNet.y1).toBeCloseTo(expected, 2);
  });
});

// ── Continuité des stocks inter-exercices ─────────────────────────────────────

describe("Cohérence — StockInitial(n+1) = StockFinal(n)", () => {
  it("stockInitial.y2 = stockFinal.y1", () => {
    expect(fc.stockInitial.y2).toBeCloseTo(fc.stockFinal.y1, 2);
  });

  it("stockInitial.y3 = stockFinal.y2", () => {
    expect(fc.stockInitial.y3).toBeCloseTo(fc.stockFinal.y2, 2);
  });

  it("stockInitial.y1 = 0 (création — pas d'apport de stocks)", () => {
    expect(fc.stockInitial.y1).toBe(0);
  });
});

// ── Cohérence achats ──────────────────────────────────────────────────────────

describe("Cohérence — achatsEffectues = achatsConsommes + (stockFinal − stockInitial)", () => {
  it("Y1 : achatsEffectues.y1 = achatsConsommes.y1 + varStock.y1", () => {
    expect(fc.achatsEffectues.y1).toBeCloseTo(
      fc.achatsConsommes.y1 + fc.varStock.y1,
      2,
    );
  });

  it("Y2 : achatsEffectues.y2 = achatsConsommes.y2 + varStock.y2", () => {
    expect(fc.achatsEffectues.y2).toBeCloseTo(
      fc.achatsConsommes.y2 + fc.varStock.y2,
      2,
    );
  });
});

// ── Résultat exploitation < résultat courant < résultat net ───────────────────

describe("Cohérence — ordre grandeur des résultats SIG", () => {
  it("resExpl > 0 pour le scénario de création rentable", () => {
    expect(fc.resExpl.y1).toBeGreaterThan(0);
  });

  it("caf.y1 ≥ resNet.y1 (la CAF est au moins égale au résultat net)", () => {
    // CAF ≥ resNet car dotationsAmort ≥ 0 et dotationsProvisions ≥ 0
    expect(fc.caf.y1).toBeGreaterThanOrEqual(fc.resNet.y1);
  });

  it("resNet.y1 < resCourant.y1 → l'IS réduit bien le résultat", () => {
    // L'IS étant positif, il réduit le résultat courant → resNet < resCourant
    expect(fc.resNet.y1).toBeLessThan(fc.resCourant.y1);
  });
});

// ── Cohérence trésorerie ↔ bilan ─────────────────────────────────────────────
//
// Identité §20 : le solde de trésorerie du plan de financement doit être égal
// aux disponibilités du bilan diminuées du découvert bancaire.
//
//   soldeTrésorerie.yn  =  disponibilités.yn  −  découvert.yn
//
// Autrement dit, le tableau de financement et le bilan doivent "parler" de la
// même position de trésorerie en clôture d'exercice.

describe("Cohérence — soldeTrésorerie plan financement = disponibilités − découvert bilan", () => {
  let bilan: ReturnType<typeof buildBilanRows>;
  let pf: ReturnType<typeof buildPlanFinancementRows>;
  let bilanSal: ReturnType<typeof buildBilanRows>;
  let pfSal: ReturnType<typeof buildPlanFinancementRows>;

  beforeAll(() => {
    bilan = buildBilanRows(SCENARIO_CREATION, fc);
    pf = buildPlanFinancementRows(SCENARIO_CREATION, fc);
    bilanSal = buildBilanRows(SCENARIO_CREATION_SALARIE, fcSal);
    pfSal = buildPlanFinancementRows(SCENARIO_CREATION_SALARIE, fcSal);
  });

  it("Y1 : soldeTrésorerie (plan) = disponibilités − découvert (bilan)", () => {
    const soldeTreso = pfAmt(pf.rows, "solde_tresorerie", "y1");
    const dispo = bilanAmt(bilan.rows, "disponibilites", "y1");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y1");
    expect(soldeTreso).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Y2 : soldeTrésorerie (plan) = disponibilités − découvert (bilan)", () => {
    const soldeTreso = pfAmt(pf.rows, "solde_tresorerie", "y2");
    const dispo = bilanAmt(bilan.rows, "disponibilites", "y2");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y2");
    expect(soldeTreso).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Y3 : soldeTrésorerie (plan) = disponibilités − découvert (bilan)", () => {
    const soldeTreso = pfAmt(pf.rows, "solde_tresorerie", "y3");
    const dispo = bilanAmt(bilan.rows, "disponibilites", "y3");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y3");
    expect(soldeTreso).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Identité tient aussi avec salarié (SCENARIO_CREATION_SALARIE)", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      const soldeTreso = pfAmt(pfSal.rows, "solde_tresorerie", yk);
      const dispo = bilanAmt(bilanSal.rows, "disponibilites", yk);
      const decouvert = bilanAmt(bilanSal.rows, "decouvert", yk);
      expect(soldeTreso).toBeCloseTo(dispo - decouvert, 1);
    }
  });

  it("Le bilan est équilibré (totalActif = totalPassif) — Y1", () => {
    expect(bilan.equilibre.y1).toBe(true);
  });

  it("Le bilan est équilibré (totalActif = totalPassif) — Y2", () => {
    expect(bilan.equilibre.y2).toBe(true);
  });

  it("Le bilan est équilibré (totalActif = totalPassif) — Y3", () => {
    expect(bilan.equilibre.y3).toBe(true);
  });

  it("disponibilités ≥ 0 — les montants en actif sont toujours positifs", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bilanAmt(bilan.rows, "disponibilites", yk)).toBeGreaterThanOrEqual(0);
    }
  });

  it("découvert = 0 pour un scénario profitable sans emprunt", () => {
    // SCENARIO_CREATION sans emprunt → jamais en découvert
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bilanAmt(bilan.rows, "decouvert", yk)).toBe(0);
    }
  });
});

// ── Cohérence TVA : BFR = Bilan (C9) ─────────────────────────────────────────
//
// Le bilan lit creditTVA et tvaAPayer directement depuis calcBfr.
// Les montants affichés dans les deux onglets doivent être identiques.

describe("Cohérence — TVA BFR = TVA Bilan (C9)", () => {
  let bilan: ReturnType<typeof buildBilanRows>;
  let bfrRows: ReturnType<typeof buildBfrRows>;

  beforeAll(() => {
    bilan = buildBilanRows(SCENARIO_CREATION, fc);
    bfrRows = buildBfrRows(SCENARIO_CREATION, fc);
  });

  /** Helper pour extraire un montant d'une ligne BFR par sa clé. */
  function bfrAmt(
    rows: ReturnType<typeof buildBfrRows>["rows"],
    key: string,
    yk: "y1" | "y2" | "y3",
  ): number {
    const find = (rs: typeof rows): number | undefined => {
      for (const r of rs) {
        if (r.key === key) return r.values[yk].amount;
        if (r.children) {
          const c = find(r.children);
          if (c !== undefined) return c;
        }
      }
      return undefined;
    };
    return find(rows) ?? 0;
  }

  it("creditTVA du BFR (calcBfr) = creditTVA du bilan (ligne actif)", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bfrCalc.creditTVA[yk]).toBeCloseTo(
        bilanAmt(bilan.rows, "credit_tva", yk),
        2,
      );
    }
  });

  it("tvaAPayer du BFR (calcBfr) = tvaAPayer du bilan (ligne passif)", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bfrCalc.tvaAPayer[yk]).toBeCloseTo(
        bilanAmt(bilan.rows, "tva_a_payer", yk),
        2,
      );
    }
  });

  it("creditTVA des lignes BFR agrégées = valeurs calcBfr brutes", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bfrAmt(bfrRows.rows, "credit_tva", yk)).toBeCloseTo(
        bfrCalc.creditTVA[yk],
        2,
      );
    }
  });

  it("tvaAPayer des lignes BFR agrégées = valeurs calcBfr brutes", () => {
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bfrAmt(bfrRows.rows, "tva_a_payer", yk)).toBeCloseTo(
        bfrCalc.tvaAPayer[yk],
        2,
      );
    }
  });
});

// ── Cohérence TVA : décaissement M+1 (C11) ──────────────────────────────────
//
// La TVA de M12 (décembre) apparaît comme dette BFR (tvaAPayer) et n'est PAS
// décaissée en M12 dans la trésorerie (shift M+1). Autrement dit, la somme
// annuelle décaissée = TVA nette annuelle − TVA M12 (reportée en M1 suivant).

describe("Cohérence — DecTVA = TVA nette décalée M+1 (C11)", () => {
  it("decTVA.y1[0] = 0 en création (pas de TVA M12 de l'exercice précédent)", () => {
    const ctx = buildTemporelCtx(DATE_DEMARRAGE, false);
    const dec = calcDecaissements(
      SCENARIO_CREATION,
      ctx,
      SCENARIO_CREATION.scenario.parametres?.moisPaiementSalaires ?? 1,
      fc.isParAnnee,
      fc.tva,
    );

    // En création, il n'y a pas d'exercice précédent → aucun overflow TVA M12 → M1 Y1 = 0.
    expect(dec.decTVA.y1[0]).toBe(0);
  });

  it("decTVA.y2[0] ≈ tvaAPayer.y1 (TVA M12 Y1 payée en janvier Y2)", () => {
    const ctx = buildTemporelCtx(DATE_DEMARRAGE, false);
    const dec = calcDecaissements(
      SCENARIO_CREATION,
      ctx,
      SCENARIO_CREATION.scenario.parametres?.moisPaiementSalaires ?? 1,
      fc.isParAnnee,
      fc.tva,
    );

    // Le shift M+1 reporte la TVA de décembre Y1 en janvier Y2.
    // Ce montant = tvaAPayer BFR Y1 (dette non soldée au 31/12).
    expect(dec.decTVA.y2[0]).toBeCloseTo(bfrCalc.tvaAPayer.y1, 1);
  });

  it("decTVA.y3[0] ≈ tvaAPayer.y2 (TVA M12 Y2 payée en janvier Y3)", () => {
    const ctx = buildTemporelCtx(DATE_DEMARRAGE, false);
    const dec = calcDecaissements(
      SCENARIO_CREATION,
      ctx,
      SCENARIO_CREATION.scenario.parametres?.moisPaiementSalaires ?? 1,
      fc.isParAnnee,
      fc.tva,
    );

    expect(dec.decTVA.y3[0]).toBeCloseTo(bfrCalc.tvaAPayer.y2, 1);
  });

  it("tvaAPayer BFR > 0 pour un scénario avec TVA nette positive", () => {
    // Le scénario de création (boulangerie, TVA 5.5% sur ventes et achats)
    // génère une TVA nette positive chaque mois car CA >> Achats×tauxMarge.
    for (const yk of ["y1", "y2", "y3"] as const) {
      expect(bfrCalc.tvaAPayer[yk]).toBeGreaterThan(0);
    }
  });
});

// ── Cohérence solde trésorerie mensuel ↔ bilan ───────────────────────────────
//
// Le solde de trésorerie au 31/12 (M12 du tableau mensuel) doit être égal
// aux disponibilités − découvert du bilan. C'est l'identité la plus forte :
// elle relie le tableau de trésorerie mensuel (flux) au bilan (stock).

describe("Cohérence — soldeTrésorerie mensuel M12 = disponibilités − découvert bilan", () => {
  function buildSoldeM12(data: typeof SCENARIO_CREATION, result: FinCalcResult) {
    const isFranchise = data.scenario.parametres?.regimeTVA === "FRANCHISE";
    const delaiClients = data.activites?.[0]?.reglementClients ?? 0;
    const ctx = buildTemporelCtx(
      data.dateDemarrage as unknown as Date,
      isFranchise,
      delaiClients,
    );

    const enc = calcEncaissements(data, ctx);
    const dec = calcDecaissements(
      data,
      ctx,
      data.scenario.parametres?.moisPaiementSalaires ?? 1,
      result.isParAnnee,
      result.tva,
    );

    const variation = {
      y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
      y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
      y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
    };

    const y1Sol = computeSoldeMonthly(variation.y1, 0);
    const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
    const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

    return {
      y1: y1Sol.soldeFinal[11] ?? 0,
      y2: y2Sol.soldeFinal[11] ?? 0,
      y3: y3Sol.soldeFinal[11] ?? 0,
    };
  }

  it("Y1 : soldeMensuel M12 = disponibilités − découvert (bilan) — SCENARIO_CREATION", () => {
    const bilan = buildBilanRows(SCENARIO_CREATION, fc);
    const solde = buildSoldeM12(SCENARIO_CREATION, fc);

    const dispo = bilanAmt(bilan.rows, "disponibilites", "y1");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y1");
    expect(solde.y1).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Y2 : soldeMensuel M12 = disponibilités − découvert (bilan) — SCENARIO_CREATION", () => {
    const bilan = buildBilanRows(SCENARIO_CREATION, fc);
    const solde = buildSoldeM12(SCENARIO_CREATION, fc);

    const dispo = bilanAmt(bilan.rows, "disponibilites", "y2");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y2");
    expect(solde.y2).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Y3 : soldeMensuel M12 = disponibilités − découvert (bilan) — SCENARIO_CREATION", () => {
    const bilan = buildBilanRows(SCENARIO_CREATION, fc);
    const solde = buildSoldeM12(SCENARIO_CREATION, fc);

    const dispo = bilanAmt(bilan.rows, "disponibilites", "y3");
    const decouvert = bilanAmt(bilan.rows, "decouvert", "y3");
    expect(solde.y3).toBeCloseTo(dispo - decouvert, 1);
  });

  it("Identité tient aussi avec salarié (Y1–Y3)", () => {
    const bilan = buildBilanRows(SCENARIO_CREATION_SALARIE, fcSal);
    const solde = buildSoldeM12(SCENARIO_CREATION_SALARIE, fcSal);

    for (const yk of ["y1", "y2", "y3"] as const) {
      const dispo = bilanAmt(bilan.rows, "disponibilites", yk);
      const decouvert = bilanAmt(bilan.rows, "decouvert", yk);
      expect(solde[yk]).toBeCloseTo(dispo - decouvert, 1);
    }
  });
});

