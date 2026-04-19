/**
 * Tests unitaires — netToGross (conversion net cible → brut).
 *
 * Vérifie la convergence de la dichotomie pour différents profils :
 *   - Non-cadre au SMIC
 *   - Cadre à 3 000 € net
 *   - Cadre au-dessus du PASS
 *   - Temps partiel
 *   - Round-trip brut→net→brut (convergence)
 *   - Net cible ≤ 0 → null
 */

import { describe, it, expect } from "vitest";
import { netToGross } from "@/lib/paie/engine/net-to-gross";
import { simulate } from "@/lib/paie/simulate";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Entrées de base réutilisées par les cas de test
// ─────────────────────────────────────────────────────────────────────────────

function baseInput(overrides: Partial<SimulationInput["salarié"]> = {}): SimulationInput {
  return {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.67,
      brutMensuel: 0, // sera remplacé par la dichotomie
      tauxPAS: 0,
      ...overrides,
    },
    entreprise: {
      effectif: 10,
      tauxATMP: 0.021,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("netToGross — conversion net → brut (dichotomie)", () => {
  it("CAS-NTG-01 : net cible ≤ 0 retourne null", () => {
    expect(netToGross(0, baseInput(), simulate)).toBeNull();
    expect(netToGross(-500, baseInput(), simulate)).toBeNull();
  });

  it("CAS-NTG-02 : non-cadre au SMIC — convergence ≤ 0,01 €", () => {
    const netCible = 1400;
    const result = netToGross(netCible, baseInput(), simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
    expect(result!.brutSoumis).toBeGreaterThan(netCible);
  });

  it("CAS-NTG-03 : cadre à 3 000 € net — convergence ≤ 0,01 €", () => {
    const netCible = 3000;
    const input = baseInput({ statut: "cadre", tauxPAS: 0.075 });
    const result = netToGross(netCible, input, simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
    expect(result!.brutSoumis).toBeGreaterThan(netCible);
  });

  it("CAS-NTG-04 : cadre au-dessus du PASS — convergence ≤ 0,01 €", () => {
    const netCible = 5000;
    const input = baseInput({ statut: "cadre", tauxPAS: 0.12 });
    const result = netToGross(netCible, input, simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
    // Le brut doit dépasser le PASS mensuel (4 005 €)
    expect(result!.brutSoumis).toBeGreaterThan(4005);
  });

  it("CAS-NTG-05 : temps partiel 80h — convergence ≤ 0,01 €", () => {
    const netCible = 900;
    const input = baseInput({ heuresContrat: 80 });
    const result = netToGross(netCible, input, simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
  });

  it("CAS-NTG-06 : round-trip brut → net → brut converge", () => {
    const brutOriginal = 2500;
    const input = baseInput({ brutMensuel: brutOriginal, tauxPAS: 0.05 });
    const simOriginal = simulate(input);

    const netCible = simOriginal.netAPayer;
    const result = netToGross(netCible, input, simulate);

    expect(result).not.toBeNull();
    // Le brut retrouvé doit être proche du brut original (la convergence
    // est sur le net à 0,01 € — l'écart brut peut être plus large)
    expect(Math.abs(result!.brutSoumis - brutOriginal)).toBeLessThanOrEqual(1);
  });

  it("CAS-NTG-07 : net cible modeste (1 200 €) converge", () => {
    const netCible = 1200;
    const result = netToGross(netCible, baseInput(), simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
  });

  it("CAS-NTG-08 : entreprise ≥ 50 salariés — FNAL totalité", () => {
    const netCible = 2000;
    const input: SimulationInput = {
      salarié: {
        statut: "non_cadre",
        typeContrat: "CDI",
        heuresContrat: 151.67,
        brutMensuel: 0,
        tauxPAS: 0.05,
      },
      entreprise: {
        effectif: 100,
        tauxATMP: 0.021,
      },
    };
    const result = netToGross(netCible, input, simulate);

    expect(result).not.toBeNull();
    expect(Math.abs(result!.netAPayer - netCible)).toBeLessThanOrEqual(0.01);
  });
});
