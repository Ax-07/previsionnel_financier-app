/**
 * Tests unitaires — Mutuelle obligatoire (complémentaire santé — ANI 2013).
 *
 * Vérifie le calcul du forfait mensuel fixe avec répartition employeur/salarié.
 */

import { describe, it, expect } from "vitest";
import { buildLigneMutuelle } from "@/lib/paie/params/prevoyance";
import type { MutuelleConfig } from "@/lib/paie/params/prevoyance";

describe("buildLigneMutuelle — forfait mensuel fixe", () => {
  it("répartit 50/50 pour un forfait de 60 €", () => {
    const config: MutuelleConfig = {
      montantMensuel: 60,
      partEmployeur: 0.50,
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.code).toBe("MUTUELLE_OBLIGATOIRE");
    expect(ligne.famille).toBe("prevoyance_mutuelle");
    expect(ligne.montantEmployeur).toBe(30);
    expect(ligne.montantSalarie).toBe(30);
    expect(ligne.assiette).toBe(60);
    expect(ligne.deductible).toBe(true);
  });

  it("répartit 60/40 pour un forfait de 80 €", () => {
    const config: MutuelleConfig = {
      montantMensuel: 80,
      partEmployeur: 0.60,
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.montantEmployeur).toBe(48);
    expect(ligne.montantSalarie).toBe(32);
  });

  it("force le minimum 50 % employeur si partEmployeur < 0.50", () => {
    const config: MutuelleConfig = {
      montantMensuel: 100,
      partEmployeur: 0.30, // invalide — doit être clampé à 0.50
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.montantEmployeur).toBe(50);
    expect(ligne.montantSalarie).toBe(50);
  });

  it("accepte 100 % employeur (part salarié = 0)", () => {
    const config: MutuelleConfig = {
      montantMensuel: 60,
      partEmployeur: 1.0,
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.montantEmployeur).toBe(60);
    expect(ligne.montantSalarie).toBe(0);
  });

  it("gère un montant à 0 € sans erreur", () => {
    const config: MutuelleConfig = {
      montantMensuel: 0,
      partEmployeur: 0.50,
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.montantEmployeur).toBe(0);
    expect(ligne.montantSalarie).toBe(0);
    expect(ligne.tauxSalarie).toBe(0);
    expect(ligne.tauxEmployeur).toBe(0);
  });

  it("utilise l'organisme fourni", () => {
    const config: MutuelleConfig = {
      montantMensuel: 60,
      partEmployeur: 0.50,
      organisme: "AG2R La Mondiale",
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.organisme).toBe("AG2R La Mondiale");
  });

  it("respecte le flag deductible = false", () => {
    const config: MutuelleConfig = {
      montantMensuel: 60,
      partEmployeur: 0.50,
      deductible: false,
    };
    const ligne = buildLigneMutuelle(config);

    expect(ligne.deductible).toBe(false);
  });

  it("arrondit correctement pour 70 € à 60 % employeur", () => {
    const config: MutuelleConfig = {
      montantMensuel: 70,
      partEmployeur: 0.60,
    };
    const ligne = buildLigneMutuelle(config);

    // 70 × 0.60 = 42.00, 70 - 42.00 = 28.00
    expect(ligne.montantEmployeur).toBe(42);
    expect(ligne.montantSalarie).toBe(28);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — Assiette CSG incluant la part patronale mutuelle/prévoyance
// ─────────────────────────────────────────────────────────────────────────────

import { simulate } from "@/lib/paie/simulate";
import { ABATTEMENT_CSG } from "@/lib/paie/params/2026";
import type { SimulationInput } from "@/lib/paie/types";

describe("Assiette CSG — intégration part patronale complémentaire", () => {
  const BRUT = 2500;
  const BASE_INPUT: SimulationInput = {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: BRUT,
    },
    entreprise: {
      effectif: 10,
      tauxATMP: 0.021,
      tauxMobilite: 0,
    },
  };

  it("sans mutuelle : assietteCsg = brut × 98,25 %", () => {
    const res = simulate(BASE_INPUT);
    const csgDed = res.lignes.find((l) => l.code === "CSG_DED_SAL");

    expect(csgDed).toBeDefined();
    const attendu = Math.round(BRUT * ABATTEMENT_CSG * 100) / 100;
    expect(csgDed!.assiette).toBeCloseTo(attendu, 1);
  });

  it("avec mutuelle 60 € / 50 % employeur : assietteCsg majorée de 30 €", () => {
    const input: SimulationInput = {
      ...BASE_INPUT,
      entreprise: {
        ...BASE_INPUT.entreprise,
        mutuelle: { montantMensuel: 60, partEmployeur: 0.50 },
      },
    };
    const res = simulate(input);
    const csgDed = res.lignes.find((l) => l.code === "CSG_DED_SAL");

    expect(csgDed).toBeDefined();
    // brut × 98,25 % + 30 € (part patronale mutuelle, sans abattement)
    const attendu = Math.round(BRUT * ABATTEMENT_CSG * 100) / 100 + 30;
    expect(csgDed!.assiette).toBeCloseTo(attendu, 1);
  });

  it("avec mutuelle 100 % employeur : assietteCsg majorée du montant total", () => {
    const input: SimulationInput = {
      ...BASE_INPUT,
      entreprise: {
        ...BASE_INPUT.entreprise,
        mutuelle: { montantMensuel: 80, partEmployeur: 1.0 },
      },
    };
    const res = simulate(input);
    const csgDed = res.lignes.find((l) => l.code === "CSG_DED_SAL");

    const attendu = Math.round(BRUT * ABATTEMENT_CSG * 100) / 100 + 80;
    expect(csgDed!.assiette).toBeCloseTo(attendu, 1);
  });

  it("CSG non déductible et CRDS utilisent la même assiette majorée", () => {
    const input: SimulationInput = {
      ...BASE_INPUT,
      entreprise: {
        ...BASE_INPUT.entreprise,
        mutuelle: { montantMensuel: 60, partEmployeur: 0.50 },
      },
    };
    const res = simulate(input);
    const csgDed = res.lignes.find((l) => l.code === "CSG_DED_SAL");
    const csgNded = res.lignes.find((l) => l.code === "CSG_NDED_SAL");
    const crds = res.lignes.find((l) => l.code === "CRDS_SAL");

    expect(csgDed!.assiette).toBe(csgNded!.assiette);
    expect(csgDed!.assiette).toBe(crds!.assiette);
  });
});
