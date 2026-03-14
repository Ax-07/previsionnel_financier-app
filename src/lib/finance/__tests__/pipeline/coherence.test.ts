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
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
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

beforeAll(() => {
  fc = buildFinCalc(SCENARIO_CREATION, DATE_DEMARRAGE);
  fcSal = buildFinCalc(SCENARIO_CREATION_SALARIE, DATE_DEMARRAGE);
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

