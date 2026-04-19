/**
 * Tests unitaires — tresorerie-engine.ts
 *
 * Couvre :
 *   - shiftSeries : décalage entier, overflow, prevYearOverflow
 *   - shiftSeriesWeighted : décalage fractionnaire (30j, 45j, 60j)
 *   - computeSoldeMonthly : solde cumulé, solde initial non nul
 *   - isQuarterly : répartition en 4 acomptes égaux
 *   - isQuarterlyDecaissement : 3 acomptes courant + solde précédent M12
 *   - parseDetailMensuel, salarieMonthlyBrut
 */

import { describe, it, expect } from "vitest";
import {
  shiftSeries,
  shiftSeriesWeighted,
  computeSoldeMonthly,
  isQuarterly,
  isQuarterlyDecaissement,
  parseDetailMensuel,
  salarieMonthlyBrut,
} from "@/lib/finance/tresorerie-engine";
import { zeroSeries, uniformMonthly } from "@/lib/finance/calculs/monthly";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumSeries(s: MonthlySeries): number {
  return s.reduce((a, b) => a + b, 0);
}

// ── shiftSeries ───────────────────────────────────────────────────────────────

describe("shiftSeries — délai = 0", () => {
  it("délai 0 → série identique, overflow = 0", () => {
    const s = uniformMonthly(12000);
    const { shifted, overflow } = shiftSeries(s, 0);
    expect(sumSeries(shifted)).toBeCloseTo(12000, 2);
    expect(sumSeries(overflow)).toBe(0);
  });
});

describe("shiftSeries — délai entier", () => {
  it("délai 1 → M0 passe en M1, overflow contient M12", () => {
    const s = zeroSeries();
    s[11] = 1000; // dernier mois
    const { shifted, overflow } = shiftSeries(s, 1);
    expect(shifted[11]).toBe(0);
    expect(overflow[0]).toBe(1000);
  });

  it("délai 1 — conservation du total (shifted + overflow = original)", () => {
    const s = uniformMonthly(12000);
    const { shifted, overflow } = shiftSeries(s, 1);
    expect(sumSeries(shifted) + sumSeries(overflow)).toBeCloseTo(12000, 2);
  });

  it("délai 12 → tout part en overflow M0–M11", () => {
    const s = uniformMonthly(12000);
    const { shifted, overflow } = shiftSeries(s, 12);
    expect(sumSeries(shifted)).toBe(0);
    expect(sumSeries(overflow)).toBeCloseTo(12000, 2);
  });
});

describe("shiftSeries — prevYearOverflow", () => {
  it("prevYearOverflow est ajouté au shifted", () => {
    const s = zeroSeries();
    const prev = zeroSeries();
    prev[0] = 500;
    const { shifted } = shiftSeries(s, 1, prev);
    expect(shifted[0]).toBe(500);
  });

  it("série vide + prevYearOverflow → shifted = prevYearOverflow", () => {
    const s = zeroSeries();
    const prev = uniformMonthly(12000);
    const { shifted } = shiftSeries(s, 0, prev);
    expect(sumSeries(shifted)).toBeCloseTo(12000, 2);
  });
});

// ── shiftSeriesWeighted ────────────────────────────────────────────────────────

describe("shiftSeriesWeighted — délai entier (= shiftSeries)", () => {
  it("délai 1.0 → conservation du total", () => {
    const s = uniformMonthly(12000);
    const { shifted, overflow } = shiftSeriesWeighted(s, 1.0);
    expect(sumSeries(shifted) + sumSeries(overflow)).toBeCloseTo(12000, 2);
  });
});

describe("shiftSeriesWeighted — délai fractionnaire (45j = 1.5 mois)", () => {
  it("M0 partagé entre M1 (50%) et M2 (50%)", () => {
    const s = zeroSeries();
    s[0] = 1000; // 1 000 € en M0, délai 1.5 mois
    const { shifted } = shiftSeriesWeighted(s, 1.5);
    // w0 = 0.5 → M1 ; w1 = 0.5 → M2
    expect(shifted[1]).toBeCloseTo(500, 6);
    expect(shifted[2]).toBeCloseTo(500, 6);
  });

  it("conservation du total (shifted + overflow)", () => {
    const s = uniformMonthly(12000);
    const { shifted, overflow } = shiftSeriesWeighted(s, 1.5);
    expect(sumSeries(shifted) + sumSeries(overflow)).toBeCloseTo(12000, 2);
  });
});

describe("shiftSeriesWeighted — délai 30j = 1.0 mois", () => {
  it("conservation totale", () => {
    const s = uniformMonthly(6000);
    const { shifted, overflow } = shiftSeriesWeighted(s, 1);
    expect(sumSeries(shifted) + sumSeries(overflow)).toBeCloseTo(6000, 2);
  });
});

describe("shiftSeriesWeighted — délai 60j = 2.0 mois", () => {
  it("conservation totale", () => {
    const s = uniformMonthly(6000);
    const { shifted, overflow } = shiftSeriesWeighted(s, 2);
    expect(sumSeries(shifted) + sumSeries(overflow)).toBeCloseTo(6000, 2);
  });
});

describe("shiftSeriesWeighted — prévYearOverflow", () => {
  it("prevYearOverflow injecté dans shifted[0]", () => {
    const s = zeroSeries();
    const prev = zeroSeries();
    prev[0] = 800;
    const { shifted } = shiftSeriesWeighted(s, 1.5, prev);
    expect(shifted[0]).toBe(800);
  });
});

// ── computeSoldeMonthly ────────────────────────────────────────────────────────

describe("computeSoldeMonthly", () => {
  it("série nulle → soldeFinal = initialSolde chaque mois", () => {
    const variation = zeroSeries();
    const { soldeFinal } = computeSoldeMonthly(variation, 5000);
    expect(soldeFinal.every((v) => v === 5000)).toBe(true);
  });

  it("flux uniforme positif → solde cumulé croissant", () => {
    const variation = uniformMonthly(12000); // 1000/mois
    const { soldeFinal } = computeSoldeMonthly(variation, 0);
    expect(soldeFinal[0]).toBeCloseTo(1000, 2);
    expect(soldeFinal[11]).toBeCloseTo(12000, 2);
  });

  it("soldePrecedent[0] = initialSolde", () => {
    const variation = uniformMonthly(12000);
    const { soldePrecedent } = computeSoldeMonthly(variation, 3000);
    expect(soldePrecedent[0]).toBe(3000);
  });

  it("soldeFinal[m] = soldePrecedent[m] + variation[m]", () => {
    const variation = uniformMonthly(12000);
    const { soldePrecedent, soldeFinal } = computeSoldeMonthly(variation, 0);
    for (let m = 0; m < 12; m++) {
      expect((soldeFinal[m] ?? 0) - (soldePrecedent[m] ?? 0)).toBeCloseTo(variation[m] ?? 0, 6);
    }
  });

  it("soldePrecedent[m+1] = soldeFinal[m] (continuité)", () => {
    const variation = uniformMonthly(12000);
    const { soldePrecedent, soldeFinal } = computeSoldeMonthly(variation, 0);
    for (let m = 0; m < 11; m++) {
      expect(soldePrecedent[m + 1]).toBeCloseTo(soldeFinal[m] ?? 0, 6);
    }
  });
});

// ── isQuarterly ───────────────────────────────────────────────────────────────

describe("isQuarterly", () => {
  it("IS = 0 → série zéro", () => {
    const s = isQuarterly(0);
    expect(sumSeries(s)).toBe(0);
  });

  it("IS > 0 → 4 acomptes égaux aux mois 2, 5, 8, 11 (index)", () => {
    const s = isQuarterly(10000);
    expect(s[2]).toBeCloseTo(2500, 2);
    expect(s[5]).toBeCloseTo(2500, 2);
    expect(s[8]).toBeCloseTo(2500, 2);
    expect(s[11]).toBeCloseTo(2500, 2);
  });

  it("IS total = somme des 4 acomptes", () => {
    const s = isQuarterly(8000);
    expect(sumSeries(s)).toBeCloseTo(8000, 2);
  });

  it("IS négatif → série zéro (IS minimum = 0)", () => {
    const s = isQuarterly(-1000);
    expect(sumSeries(s)).toBe(0);
  });
});

// ── isQuarterlyDecaissement ───────────────────────────────────────────────────

describe("isQuarterlyDecaissement", () => {
  it("3 acomptes courants aux M3, M6, M9 (indices 2, 5, 8)", () => {
    const s = isQuarterlyDecaissement(12000, 0);
    expect(s[2]).toBeCloseTo(3000, 2);
    expect(s[5]).toBeCloseTo(3000, 2);
    expect(s[8]).toBeCloseTo(3000, 2);
    expect(s[11]).toBe(0); // aucun solde précédent
  });

  it("solde précédent (IS N-1) au M12 (index 11)", () => {
    const s = isQuarterlyDecaissement(0, 8000);
    expect(s[2]).toBe(0);
    expect(s[5]).toBe(0);
    expect(s[8]).toBe(0);
    expect(s[11]).toBeCloseTo(2000, 2); // = 8000 / 4
  });

  it("mix : 3 acomptes courants + solde précédent", () => {
    const s = isQuarterlyDecaissement(12000, 8000);
    // Acomptes courants
    expect(s[2]).toBeCloseTo(3000, 2);
    expect(s[5]).toBeCloseTo(3000, 2);
    expect(s[8]).toBeCloseTo(3000, 2);
    // Solde exercice précédent
    expect(s[11]).toBeCloseTo(2000, 2);
    // Total = 3 × (12000/4) + 8000/4
    expect(sumSeries(s)).toBeCloseTo(11000, 2);
  });

  it("cohérence avec BFR : dettesIS = IS/4 = solde M12", () => {
    // Si IS courant = 10 000 → dette fin d'exercice = 10 000/4 = 2 500
    // = le solde décaissé en M12 de l'exercice suivant
    const IS_courant = 10000;
    const s = isQuarterlyDecaissement(0, IS_courant); // exercice suivant, IS précédent
    expect(s[11]).toBeCloseTo(IS_courant / 4, 2);
  });
});

// ── parseDetailMensuel ────────────────────────────────────────────────────────

describe("parseDetailMensuel", () => {
  it("null → null", () => {
    expect(parseDetailMensuel(null)).toBeNull();
  });

  it("string → null (type invalide)", () => {
    expect(parseDetailMensuel("texte")).toBeNull();
  });

  it("objet sans effectif ni brutIndividuel → null", () => {
    expect(parseDetailMensuel({})).toBeNull();
  });

  it("effectif et brutIndividuel valides → produit mensuel", () => {
    const detail = {
      effectif: Array(12).fill(2),
      brutIndividuel: Array(12).fill(1500),
    };
    const result = parseDetailMensuel(detail);
    expect(result).not.toBeNull();
    expect(result!.every((v) => v === 3000)).toBe(true);
  });

  it("effectif ou brutIndividuel < 12 éléments → null", () => {
    const detail = { effectif: [1, 1], brutIndividuel: [1500, 1500] };
    expect(parseDetailMensuel(detail)).toBeNull();
  });

  it("total = 0 → null (série entièrement nulle)", () => {
    const detail = {
      effectif: Array(12).fill(0),
      brutIndividuel: Array(12).fill(1500),
    };
    expect(parseDetailMensuel(detail)).toBeNull();
  });
});

// ── salarieMonthlyBrut ────────────────────────────────────────────────────────

describe("salarieMonthlyBrut", () => {
  it("sans détail → uniformMonthly(montant)", () => {
    const result = salarieMonthlyBrut(24000, null);
    expect(sumSeries(result)).toBeCloseTo(24000, 2);
    expect(result.every((v) => v === 2000)).toBe(true);
  });

  it("avec détail valide et moisDebut = 0 → série brute directe", () => {
    const detail = {
      effectif: Array(12).fill(1),
      brutIndividuel: Array(12).fill(2500),
    };
    const result = salarieMonthlyBrut(0, detail, 0);
    expect(result.every((v) => v === 2500)).toBe(true);
  });

  it("avec moisDebut = 3 (avril) → pivot de la série", () => {
    // Série calendaire : jan=1000, fev-dec=2000
    const brutal = Array(12).fill(2000) as number[];
    brutal[0] = 1000; // janvier
    const detail = { effectif: Array(12).fill(1), brutIndividuel: brutal };
    const result = salarieMonthlyBrut(0, detail, 3); // exercice commence en avril
    // M0 de l'exercice = avril (index 3 calendaire) → 2000
    expect(result[0]).toBe(2000);
    // M9 de l'exercice = janvier (index 0 calendaire) → 1000
    expect(result[9]).toBe(1000);
  });
});
