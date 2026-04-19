/**
 * Tests unitaires — tva-engine.ts / computeTVAMonthly
 *
 * Couvre :
 *   - Régime mensuel : TVA payée chaque mois
 *   - Régime trimestriel : TVA payée aux mois 3, 6, 9, 12
 *   - Credit carryforward : report du crédit de TVA sur les mois suivants
 *   - initialCredit : crédit initial de l'exercice précédent
 *   - finalCredit : crédit résiduel en fin d'exercice
 *   - Conservation : somme(tvaAPayer) + finalCredit = somme(tvaCollectee) - somme(tvaDeductible) + initialCredit
 */

import { describe, it, expect } from "vitest";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import { zeroSeries, uniformMonthly } from "@/lib/finance/calculs/monthly";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumSeries(s: MonthlySeries): number {
  return s.reduce((a, b) => a + b, 0);
}

// ── Régime mensuel ────────────────────────────────────────────────────────────

describe("computeTVAMonthly — régime mensuel, sans crédit", () => {
  it("collectée > déductible chaque mois → tvaAPayer = diff chaque mois", () => {
    const collectee = uniformMonthly(12000); // 1000/mois
    const deductible = uniformMonthly(6000);  // 500/mois
    const { tvaAPayerMonthly, creditReporteMonthly, finalCredit } =
      computeTVAMonthly(collectee, deductible, "mensuel");

    expect(tvaAPayerMonthly.every((v) => Math.abs(v - 500) < 0.01)).toBe(true);
    expect(creditReporteMonthly.every((v) => v === 0)).toBe(true);
    expect(finalCredit).toBe(0);
  });

  it("TVA nulle → aucun paiement, aucun crédit", () => {
    const s = zeroSeries();
    const { tvaAPayerMonthly, finalCredit } = computeTVAMonthly(s, s, "mensuel");
    expect(sumSeries(tvaAPayerMonthly)).toBe(0);
    expect(finalCredit).toBe(0);
  });

  it("conservation : somme(tvaAPayer) + finalCredit = TVA nette + initialCredit", () => {
    const collectee = uniformMonthly(12000);
    const deductible = uniformMonthly(6000);
    const initialCredit = 300;
    const { tvaAPayerMonthly, finalCredit } = computeTVAMonthly(
      collectee, deductible, "mensuel", initialCredit
    );
    const tvaNetteTotal = sumSeries(collectee) - sumSeries(deductible);
    // Conservation : tvaAPayer + initialCredit = tvaNetteTotal + finalCredit
    // (le crédit initial réduit ce que le business paie, et augmente le finalCredit si non consommé)
    expect(sumSeries(tvaAPayerMonthly) + initialCredit).toBeCloseTo(
      tvaNetteTotal + finalCredit, 2
    );
  });
});

describe("computeTVAMonthly — régime mensuel, credit carryforward", () => {
  it("déductible > collectée un mois → crédit reporté le mois suivant", () => {
    const collectee = zeroSeries();
    const deductible = zeroSeries();
    collectee[0] = 500;
    deductible[0] = 1000; // crédit de 500 en M0
    collectee[1] = 800;  // M1 : 800 - 500 (crédit) = 300 à payer

    const { tvaAPayerMonthly, creditReporteMonthly } = computeTVAMonthly(
      collectee, deductible, "mensuel"
    );

    expect(tvaAPayerMonthly[0]).toBe(0);        // crédit en M0
    expect(creditReporteMonthly[0]).toBe(500);  // 500 reportés
    expect(tvaAPayerMonthly[1]).toBeCloseTo(300, 6); // 800 - 500 crédit
    expect(creditReporteMonthly[1]).toBe(0);
  });

  it("crédit jamais résorbé → finalCredit > 0", () => {
    const collectee = zeroSeries(); // jamais de TVA collectée
    const deductible = uniformMonthly(12000);
    const { tvaAPayerMonthly, finalCredit } = computeTVAMonthly(collectee, deductible, "mensuel");

    expect(sumSeries(tvaAPayerMonthly)).toBe(0);
    expect(finalCredit).toBeCloseTo(12000, 2);
  });

  it("initialCredit est consommé avant de payer la TVA courante", () => {
    const collectee = uniformMonthly(12000); // 1000/mois
    const deductible = zeroSeries();
    const initialCredit = 3000;

    const { tvaAPayerMonthly } = computeTVAMonthly(
      collectee, deductible, "mensuel", initialCredit
    );

    // M0, M1, M2 : le crédit de 3000 absorbe 3 × 1000 = 0 à payer
    expect(tvaAPayerMonthly[0]).toBe(0);
    expect(tvaAPayerMonthly[1]).toBe(0);
    expect(tvaAPayerMonthly[2]).toBe(0);
    // M3 : crédit épuisé → 1000 à payer
    expect(tvaAPayerMonthly[3]).toBeCloseTo(1000, 6);
  });
});

// ── Régime trimestriel ────────────────────────────────────────────────────────

describe("computeTVAMonthly — régime trimestriel", () => {
  it("TVA payée uniquement aux mois 3, 6, 9, 12 (indices 2, 5, 8, 11)", () => {
    const collectee = uniformMonthly(12000); // 1000/mois
    const deductible = uniformMonthly(6000);  // 500/mois

    const { tvaAPayerMonthly } = computeTVAMonthly(collectee, deductible, "trimestriel");

    // Mois intermédiaires → 0
    expect(tvaAPayerMonthly[0]).toBe(0);
    expect(tvaAPayerMonthly[1]).toBe(0);
    expect(tvaAPayerMonthly[3]).toBe(0);
    expect(tvaAPayerMonthly[4]).toBe(0);

    // Mois de fin de trimestre → cumul de 3 mois
    expect(tvaAPayerMonthly[2]).toBeCloseTo(1500, 2);  // 3 × 500
    expect(tvaAPayerMonthly[5]).toBeCloseTo(1500, 2);
    expect(tvaAPayerMonthly[8]).toBeCloseTo(1500, 2);
    expect(tvaAPayerMonthly[11]).toBeCloseTo(1500, 2);
  });

  it("conservation : total annuel identique au régime mensuel (sans crédit initial)", () => {
    const collectee = uniformMonthly(12000);
    const deductible = uniformMonthly(6000);

    const mensuel = computeTVAMonthly(collectee, deductible, "mensuel");
    const trimestriel = computeTVAMonthly(collectee, deductible, "trimestriel");

    expect(sumSeries(trimestriel.tvaAPayerMonthly)).toBeCloseTo(
      sumSeries(mensuel.tvaAPayerMonthly), 2
    );
  });

  it("régime trimestriel — credit carryforward sur fin de trimestre", () => {
    // M0-M1 : TVA collectée < déductible (crédit accumulé)
    // M2 : fin du trimestre → crédit résorbé si TVA nette positive sur le trimestre
    const collectee = zeroSeries();
    const deductible = zeroSeries();
    deductible[0] = 1000; // crédit M0
    collectee[1] = 400;
    collectee[2] = 2000; // fin T1 : nette trimestre = -1000+400+2000 = 1400
    // Mais la périodicité trimestrielle accumule → fin T1 : 2000 - 1000 - crédit

    const { tvaAPayerMonthly } = computeTVAMonthly(collectee, deductible, "trimestriel");
    // T1 = (0-1000) + (400-0) + (2000-0) = 1400 → si crédit initial = 0
    expect(tvaAPayerMonthly[2]).toBeCloseTo(1400, 2);
  });

  it("TVA totale trimestrielle nulle → 0 à payer et finalCredit = 0", () => {
    const s = zeroSeries();
    const { tvaAPayerMonthly, finalCredit } = computeTVAMonthly(s, s, "trimestriel");
    expect(sumSeries(tvaAPayerMonthly)).toBe(0);
    expect(finalCredit).toBe(0);
  });
});

// ── finalCredit / initialCredit ───────────────────────────────────────────────

describe("computeTVAMonthly — finalCredit propagé", () => {
  it("finalCredit peut être utilisé comme initialCredit de l'exercice suivant", () => {
    // Exercice 1 : crédit de 2000
    const s1 = computeTVAMonthly(zeroSeries(), uniformMonthly(2400), "mensuel");
    expect(s1.finalCredit).toBeCloseTo(2400, 2);

    // Exercice 2 : on démarre avec le crédit de l'exercice 1
    const collectee2 = uniformMonthly(12000);
    const s2 = computeTVAMonthly(collectee2, zeroSeries(), "mensuel", s1.finalCredit);

    // Les premiers mois doivent être absorbés par le crédit
    expect(s2.tvaAPayerMonthly[0]).toBe(0); // 1000 < crédit 2400
    expect(s2.tvaAPayerMonthly[1]).toBe(0); // encore du crédit
    // M2 : crédit = 2400 - 2000 = 400 → 1000 - 400 = 600 à payer
    expect(s2.tvaAPayerMonthly[2]).toBeCloseTo(600, 6);
  });
});

// ── tvaNetteMonthly ────────────────────────────────────────────────────────────

describe("computeTVAMonthly — tvaNetteMonthly", () => {
  it("tvaNetteMonthly = collectee - deductible par mois (sans effet du crédit)", () => {
    const collectee = uniformMonthly(12000); // 1000/mois
    const deductible = uniformMonthly(3600);  // 300/mois

    const { tvaNetteMonthly } = computeTVAMonthly(collectee, deductible, "mensuel");
    expect(tvaNetteMonthly.every((v) => Math.abs(v - 700) < 0.01)).toBe(true);
  });

  it("tvaNetteMonthly peut être négatif (crédit)", () => {
    const collectee = zeroSeries();
    const deductible = uniformMonthly(6000);
    const { tvaNetteMonthly } = computeTVAMonthly(collectee, deductible, "mensuel");
    expect(tvaNetteMonthly.every((v) => v === -500)).toBe(true);
  });
});
