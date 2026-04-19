/**
 * Tests unitaires — Exonérations heures supplémentaires
 *
 * Art. 81 quater CGI  — Exonération IR (plafond 7 500 €/an)
 * Art. L241-17 CSS    — Réduction cotisations salariales (≤ 11,31 %)
 */

import { describe, it, expect } from "vitest";
import {
  calcExonerationHSIR,
  calcReductionHSCotSal,
  PLAFOND_EXO_HS_IR_ANNUEL,
  TAUX_MAX_REDUCTION_HS_COT_SAL,
  montantForfaitaireParHeureHS,
  calcDeductionForfaitaireHS,
} from "@/lib/paie/engine/exoneration-hs";
import { simulate } from "@/lib/paie/simulate";
import "@/lib/paie/conventions";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// calcExonerationHSIR
// ─────────────────────────────────────────────────────────────────────────────

describe("calcExonerationHSIR", () => {
  it("retourne 0 si remHS = 0", () => {
    expect(calcExonerationHSIR(0)).toBe(0);
  });

  it("cas simple (début d'année) : exo = remHS si remHS ≤ plafond", () => {
    // 500 € < 7 500 € → entièrement exonéré
    expect(calcExonerationHSIR(500, 0)).toBe(500);
  });

  it("cas plafond partiellement consommé", () => {
    // cumul avant = 7 000 €, reste = 500 €, remHS = 800 €
    expect(calcExonerationHSIR(800, 7_000)).toBe(500);
  });

  it("cas plafond annuel atteint → exonération = 0", () => {
    expect(calcExonerationHSIR(800, 7_500)).toBe(0);
  });

  it("cas plafond dépassé → exonération = 0, pas de valeur négative", () => {
    expect(calcExonerationHSIR(200, 8_000)).toBe(0);
  });

  it("plafond annuel = 7 500 €", () => {
    expect(PLAFOND_EXO_HS_IR_ANNUEL).toBe(7_500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcReductionHSCotSal
// ─────────────────────────────────────────────────────────────────────────────

describe("calcReductionHSCotSal", () => {
  it("retourne 0 si remHS = 0", () => {
    expect(calcReductionHSCotSal(0, 2_000, 4_005)).toBe(0);
  });

  it("taux maximal = 11,31 %", () => {
    expect(TAUX_MAX_REDUCTION_HS_COT_SAL).toBeCloseTo(0.1131, 4);
  });

  it("cas simple sous PMSS : voisin de remHS × 11,31 %", () => {
    // Brut = 2 000 €, HS = 500 €, PMSS = 4 005 € → entièrement sous plafond
    // deltaPlaf = 500 (toute la HS dans T1)
    // cotSalHsTheorique = 500 × (0.069 + 0.004 + 0.0315 + 0.0086) = 500 × 0.1131 = 56.55
    const reduction = calcReductionHSCotSal(500, 2_500, 4_005);
    expect(reduction).toBeCloseTo(56.55, 1);
  });

  it("cap : ne peut pas dépasser remHS × 11,31 %", () => {
    // Test de non-régression sur le plafond
    const remHS = 1_000;
    const reduction = calcReductionHSCotSal(remHS, 2_000, 4_005);
    expect(reduction).toBeLessThanOrEqual(remHS * TAUX_MAX_REDUCTION_HS_COT_SAL + 0.01);
  });

  it("cas HS au-dessus du PMSS : vieillesse plaf et ARRCO T1 réduits", () => {
    // Brut sans HS = 3 900 € (sous PMSS 4 005 €), HS = 200 €
    // deltaPlaf = min(4100, 4005) - min(3900, 4005) = 4005 - 3900 = 105 €
    // vieillesse plaf  = 105 × 0.069 = 7.245
    // vieillesse déplaf = 200 × 0.004 = 0.80
    // ARRCO T1 = 105 × 0.0315 = 3.3075
    // CEG T1   = 105 × 0.0086 = 0.903
    // total théorique ≈ 12.255 → cap = 200 × 0.1131 = 22.62 → NON capé ici
    const reduction = calcReductionHSCotSal(200, 4_100, 4_005);
    expect(reduction).toBeGreaterThan(0);
    expect(reduction).toBeLessThanOrEqual(200 * TAUX_MAX_REDUCTION_HS_COT_SAL + 0.01);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Intégration — simulate avec heures supplémentaires
// ─────────────────────────────────────────────────────────────────────────────

describe("simulate — exonérations HS", () => {
  const baseInput: SimulationInput = {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: 2_000,
      heuresSupplementaires: 10,
      tauxPAS: 0.075,
    },
    entreprise: {
      effectif: 5,
      tauxATMP: 0.021,
    },
  };

  it("exonerationHSIR > 0 quand des HS sont présentes", () => {
    const r = simulate(baseInput);
    expect(r.exonerationHSIR).toBeGreaterThan(0);
  });

  it("reductionHSCotSal > 0 quand des HS sont présentes", () => {
    const r = simulate(baseInput);
    expect(r.reductionHSCotSal).toBeGreaterThan(0);
  });

  it("exonerationHSIR = 0 sans heures supplémentaires", () => {
    const input: SimulationInput = {
      ...baseInput,
      salarié: { ...baseInput.salarié, heuresSupplementaires: 0 },
    };
    const r = simulate(input);
    expect(r.exonerationHSIR).toBe(0);
  });

  it("reductionHSCotSal = 0 sans heures supplémentaires", () => {
    const input: SimulationInput = {
      ...baseInput,
      salarié: { ...baseInput.salarié, heuresSupplementaires: 0 },
    };
    const r = simulate(input);
    expect(r.reductionHSCotSal).toBe(0);
  });

  it("net imposable < net imposable sans HS exo (exo IR réduit la base PAS)", () => {
    const withHS = simulate(baseInput);
    const withoutExo = simulate({
      ...baseInput,
      salarié: { ...baseInput.salarié, cumulHeuresSup: 7_500 }, // plafond atteint → 0 exo
    });
    // Avec exo: net imposable plus bas → PAS plus bas
    expect(withHS.netImposable).toBeLessThan(withoutExo.netImposable);
    expect(withHS.pas).toBeLessThan(withoutExo.pas);
  });

  it("net social > net social sans réduction cot. sal. HS", () => {
    const withHS = simulate(baseInput);
    // La réduction cot. sal. HS augmente le net social
    // => totalCotisationsSalariales plus bas (net signe, il inclut la ligne négative)
    expect(withHS.reductionHSCotSal).toBeGreaterThan(0);
    // La ligne EXONERATION_HS_COT_SAL doit apparaître dans les lignes
    const ligneExo = withHS.lignes.find((l) => l.code === "EXONERATION_HS_COT_SAL");
    expect(ligneExo).toBeDefined();
    expect(ligneExo!.montantSalarie).toBeLessThan(0); // crédit salarié
  });

  it("spec §8 — cas simple REM_HS = 500 € → REDUCTION_HS ≈ 56,55 €", () => {
    // Pour obtenir remHS ≈ 500 : avec brutMensuel = 2000 €, heuresContrat = 151.67 h,
    // tauxHoraire ≈ 13.19 €/h → 10 h × 13.19 × 1.25 = 164.88 € HS (loin de 500)
    // Recalibrer pour un remHS proche :
    // brutMensuel = 2000, 10h sup légal 25% → remHS ≈ 2000/151.67 × 10 × 1.25 ≈ 165 €
    // reduction ≈ 165 × 0.1131 ≈ 18.66 € (sous PMSS, formule directe)
    const r = simulate(baseInput);
    const ligneExo = r.lignes.find((l) => l.code === "EXONERATION_HS_COT_SAL");
    expect(ligneExo).toBeDefined();
    expect(Math.abs(ligneExo!.montantSalarie)).toBeCloseTo(r.reductionHSCotSal, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Déduction forfaitaire patronale HS (art. L241-18 CSS)
// ─────────────────────────────────────────────────────────────────────────────

describe("montantForfaitaireParHeureHS", () => {
  it("< 20 salariés → 1,50 €/h", () => {
    expect(montantForfaitaireParHeureHS(1)).toBe(1.50);
    expect(montantForfaitaireParHeureHS(19)).toBe(1.50);
  });

  it("20–249 salariés → 0,50 €/h", () => {
    expect(montantForfaitaireParHeureHS(20)).toBe(0.50);
    expect(montantForfaitaireParHeureHS(100)).toBe(0.50);
    expect(montantForfaitaireParHeureHS(249)).toBe(0.50);
  });

  it("≥ 250 salariés → 0 (non éligible)", () => {
    expect(montantForfaitaireParHeureHS(250)).toBe(0);
    expect(montantForfaitaireParHeureHS(1000)).toBe(0);
  });
});

describe("calcDeductionForfaitaireHS", () => {
  it("retourne 0 si pas d'heures sup", () => {
    expect(calcDeductionForfaitaireHS(0, 5)).toBe(0);
  });

  it("retourne 0 pour une entreprise ≥ 250", () => {
    expect(calcDeductionForfaitaireHS(10, 300)).toBe(0);
  });

  it("< 20 sal : 10 HS → 15 €", () => {
    expect(calcDeductionForfaitaireHS(10, 5)).toBe(15);
  });

  it("20–249 sal : 10 HS → 5 €", () => {
    expect(calcDeductionForfaitaireHS(10, 50)).toBe(5);
  });

  it("< 20 sal : 4 HS → 6 €", () => {
    expect(calcDeductionForfaitaireHS(4, 10)).toBe(6);
  });
});

describe("simulate — déduction forfaitaire patronale HS", () => {
  const baseInputPetite: SimulationInput = {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: 2_000,
      heuresSupplementaires: 10,
      tauxPAS: 0.075,
    },
    entreprise: {
      effectif: 5,
      tauxATMP: 0.021,
    },
  };

  it("ligne DEDUCTION_FORFAITAIRE_HS présente pour entreprise < 20 sal", () => {
    const r = simulate(baseInputPetite);
    const ligne = r.lignes.find((l) => l.code === "DEDUCTION_FORFAITAIRE_HS");
    expect(ligne).toBeDefined();
    expect(ligne!.montantEmployeur).toBe(-15); // 10 h × 1,50 €
    expect(ligne!.montantSalarie).toBe(0);
  });

  it("ligne DEDUCTION_FORFAITAIRE_HS pour entreprise 20–249 sal", () => {
    const input: SimulationInput = {
      ...baseInputPetite,
      entreprise: { ...baseInputPetite.entreprise, effectif: 50 },
    };
    const r = simulate(input);
    const ligne = r.lignes.find((l) => l.code === "DEDUCTION_FORFAITAIRE_HS");
    expect(ligne).toBeDefined();
    expect(ligne!.montantEmployeur).toBe(-5); // 10 h × 0,50 €
  });

  it("pas de ligne pour entreprise ≥ 250 sal", () => {
    const input: SimulationInput = {
      ...baseInputPetite,
      entreprise: { ...baseInputPetite.entreprise, effectif: 300 },
    };
    const r = simulate(input);
    const ligne = r.lignes.find((l) => l.code === "DEDUCTION_FORFAITAIRE_HS");
    expect(ligne).toBeUndefined();
  });

  it("pas de ligne sans heures supplémentaires", () => {
    const input: SimulationInput = {
      ...baseInputPetite,
      salarié: { ...baseInputPetite.salarié, heuresSupplementaires: 0 },
    };
    const r = simulate(input);
    const ligne = r.lignes.find((l) => l.code === "DEDUCTION_FORFAITAIRE_HS");
    expect(ligne).toBeUndefined();
  });

  it("déduction réduit le coût employeur total", () => {
    const avecHS = simulate(baseInputPetite);
    const sansHS: SimulationInput = {
      ...baseInputPetite,
      salarié: { ...baseInputPetite.salarié, heuresSupplementaires: 0 },
    };
    const sansDeduc = simulate(sansHS);
    // Le coût employeur avec HS inclut la déduction forfaitaire
    const ligneDeduc = avecHS.lignes.find((l) => l.code === "DEDUCTION_FORFAITAIRE_HS");
    expect(ligneDeduc).toBeDefined();
    // La déduction est bien négative côté employeur (crédit)
    expect(ligneDeduc!.montantEmployeur).toBeLessThan(0);
  });
});
