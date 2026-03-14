/**
 * Tests unitaires — calcIS (utils) et calcISParAnnee (calculs/is).
 *
 * Couvre :
 *   - Résultat négatif → IS = 0
 *   - Tranche réduite (resultat ≤ plafond)
 *   - Tranche normale (resultat > plafond)
 *   - Crédit d'impôt
 *   - IS jamais négatif même si crédit > IS brut
 *   - régime IR → IS = 0
 *   - isEnabled = false → IS = 0
 */

import { describe, it, expect } from "vitest";
import { calcIS } from "@/lib/finance/utils";
import { calcISParAnnee } from "@/lib/finance/calculs/is";

// ── calcIS (utils) ────────────────────────────────────────────────────────────

describe("calcIS (utils)", () => {
  it("résultat négatif → IS = 0", () => {
    expect(calcIS(-10000, 42500, 15, 25, 0, 0)).toBe(0);
  });

  it("résultat = 0 → IS = 0", () => {
    expect(calcIS(0, 42500, 15, 25, 0, 0)).toBe(0);
  });

  it("résultat = 42 500 → IS = 42 500 × 15% = 6 375", () => {
    expect(calcIS(42500, 42500, 15, 25, 0, 0)).toBeCloseTo(6375, 2);
  });

  it(
    "résultat = 100 000 → IS = 42 500 × 15% + 57 500 × 25% = 6 375 + 14 375 = 20 750",
    () => {
      expect(calcIS(100000, 42500, 15, 25, 0, 0)).toBeCloseTo(20750, 2);
    },
  );

  it("crédit d'impôt réduit l'IS du montant exact", () => {
    const base = calcIS(42500, 42500, 15, 25, 0, 0);       // 6 375
    const avecCredit = calcIS(42500, 42500, 15, 25, 1000, 0); // 5 375
    expect(avecCredit).toBeCloseTo(base - 1000, 2);
  });

  it("IS jamais négatif : crédit > IS brut → IS = 0", () => {
    const is = calcIS(1000, 42500, 15, 25, 5000, 0);
    expect(is).toBe(0);
  });

  it("contribution volontaire s'ajoute à l'IS brut", () => {
    const sansContrib = calcIS(42500, 42500, 15, 25, 0, 0);
    const avecContrib = calcIS(42500, 42500, 15, 25, 0, 500);
    expect(avecContrib).toBeCloseTo(sansContrib + 500, 2);
  });

  it("taux zéro → IS = 0 quel que soit le résultat", () => {
    expect(calcIS(100000, 42500, 0, 0, 0, 0)).toBe(0);
  });
});

// ── calcISParAnnee ────────────────────────────────────────────────────────────

const ZERO_ACC = { y1: 0, y2: 0, y3: 0 };
const PARAMETRES_IS_STD = {
  isEnabled: true,
  plafondReduitN: 42500,
  tauxReduitN: 15,
  tauxNormalN: 25,
  creditImpotN: 0,
  contributionVolN: 0,
  plafondReduitN1: 42500,
  tauxReduitN1: 15,
  tauxNormalN1: 25,
  creditImpotN1: 0,
  contributionVolN1: 0,
  plafondReduitN2: 42500,
  tauxReduitN2: 15,
  tauxNormalN2: 25,
  creditImpotN2: 0,
  contributionVolN2: 0,
} as Parameters<typeof calcISParAnnee>[3];

describe("calcISParAnnee", () => {
  it("isIS = false → IS = 0 pour tous les exercices (régime IR)", () => {
    const res = calcISParAnnee(
      { y1: 100000, y2: 120000, y3: 140000 },
      ZERO_ACC,
      ZERO_ACC,
      PARAMETRES_IS_STD,
      false,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("parametresIS.isEnabled = false → IS = 0", () => {
    const paramsDisabled = { ...PARAMETRES_IS_STD, isEnabled: false };
    const res = calcISParAnnee(
      { y1: 100000, y2: 100000, y3: 100000 },
      ZERO_ACC,
      ZERO_ACC,
      paramsDisabled,
      true,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("parametresIS = null + isIS = true → IS calculé avec les taux par défaut (?? 15%/25%)", () => {
    const res = calcISParAnnee(
      { y1: 100000, y2: 100000, y3: 100000 },
      ZERO_ACC,
      ZERO_ACC,
      null,
      true,
    );
    // null → utilise les valeurs par défaut via ??: plafond=42500, taux réduit=15%, normal=25%
    // IS = 42500 × 15% + 57500 × 25% = 6375 + 14375 = 20750
    expect(res.y1).toBeCloseTo(20750, 0);
    expect(res.y2).toBeCloseTo(20750, 0);
    expect(res.y3).toBeCloseTo(20750, 0);
  });

  it("parametresIS = null + isIS = false → IS = 0 (régime IR)", () => {
    const res = calcISParAnnee(
      { y1: 100000, y2: 100000, y3: 100000 },
      ZERO_ACC,
      ZERO_ACC,
      null,
      false,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("résultat positif → IS calculé correctement pour chaque exercice", () => {
    const res = calcISParAnnee(
      { y1: 42500, y2: 100000, y3: 0 },
      ZERO_ACC,
      ZERO_ACC,
      PARAMETRES_IS_STD,
      true,
    );
    expect(res.y1).toBeCloseTo(6375, 2);   // 42 500 × 15%
    expect(res.y2).toBeCloseTo(20750, 2);  // 42 500 × 15% + 57 500 × 25%
    expect(res.y3).toBe(0);                // résultat = 0
  });

  it("déficit resCourant → IS.y1 = 0", () => {
    const res = calcISParAnnee(
      { y1: -20000, y2: 50000, y3: 60000 },
      ZERO_ACC,
      ZERO_ACC,
      PARAMETRES_IS_STD,
      true,
    );
    expect(res.y1).toBe(0);
    // Y2 : la fonction calcISParAnnee ne gère pas le report automatique de déficit,
    // c'est la couche pipeline qui s'en charge. Ici on vérifie juste Y1 = 0.
    expect(res.y2).toBeGreaterThan(0);
  });

  it("ajustementNet positif (réintégration) augmente la base IS", () => {
    const sansAjust = calcISParAnnee(
      { y1: 40000, y2: 0, y3: 0 },
      ZERO_ACC,
      ZERO_ACC,
      PARAMETRES_IS_STD,
      true,
    );
    const avecAjust = calcISParAnnee(
      { y1: 40000, y2: 0, y3: 0 },
      ZERO_ACC,
      { y1: 5000, y2: 0, y3: 0 }, // +5 000 réintégré
      PARAMETRES_IS_STD,
      true,
    );
    expect(avecAjust.y1).toBeGreaterThan(sansAjust.y1);
    // Base = 40 000 + 5 000 = 45 000 → IS = 42 500×15% + 2 500×25% = 6 375 + 625 = 7 000
    expect(avecAjust.y1).toBeCloseTo(7000, 2);
  });
});
