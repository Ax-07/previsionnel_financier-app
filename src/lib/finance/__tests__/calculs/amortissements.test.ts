/**
 * Tests unitaires — distribuerAmortParExercice (calculs/amortissements).
 *
 * Couvre :
 *   - Mode AUCUN → dotations = 0
 *   - Mode LINEAIRE avec prorata jan 2026 (full year)
 *   - Mode LINEAIRE avec acquisition en cours d'exercice (prorata mois)
 *   - Mode LINEAIRE : durée nulle → dotations = 0
 *   - Mode LINEAIRE : montant nul → dotations = 0
 *   - Exercice décalé : moisDebut > 0
 */

import { describe, it, expect } from "vitest";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

// Les tests utilisent la structure dynamique (ImmoAmortInput est un type local non exporté).
type ImmoInput = Parameters<typeof distribuerAmortParExercice>[0];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkImmo(overrides: Partial<ImmoInput> = {}): ImmoInput {
  return {
    modeAmortissement: "LINEAIRE",
    montantHT: 12000,
    dureeAmortissement: 5, // 5 ans = 60 mois
    dateAcquisition: "2026-01-01",
    lignesAmortissement: [],
    ...overrides,
  };
}

// ── Mode AUCUN ────────────────────────────────────────────────────────────────

describe("distribuerAmortParExercice — mode AUCUN", () => {
  it("retourne zéro pour tous les exercices", () => {
    const res = distribuerAmortParExercice(
      mkImmo({ modeAmortissement: "AUCUN" }),
      2026,
      0,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });
});

// ── Mode LINEAIRE — acquisition janvier 2026, exercice jan 2026 ───────────────

describe("distribuerAmortParExercice — LINEAIRE, acquisition jan 2026", () => {
  // 12 000 € sur 5 ans (60 mois) = 200 €/mois
  const immo = mkImmo(); // dateAcquisition = 2026-01-01, dur = 5 ans
  const anneeDebut = 2026;
  const moisDebut = 0; // janvier

  it("dotation mensuelle = montantHT / (durée_mois) = 200 €/mois", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    // Chaque exercice = 12 mois × 200 € = 2 400 €
    expect(res.y1).toBeCloseTo(2400, 2);
    expect(res.y2).toBeCloseTo(2400, 2);
    expect(res.y3).toBeCloseTo(2400, 2);
  });

  it("dotations Y1 + Y2 + Y3 = 7 200 (3 années sur 5 = 60%)", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const total3Ans = res.y1 + res.y2 + res.y3;
    expect(total3Ans).toBeCloseTo(7200, 1); // 3/5 × 12 000
  });
});

// ── Mode LINEAIRE — acquisition mars 2026 (prorata) ──────────────────────────

describe("distribuerAmortParExercice — LINEAIRE, acquisition mars 2026", () => {
  // Acquisition le 1er mars 2026 → Y1 reçoit 10 mois (mars→déc) = 10 × 200 = 2 000
  const immo = mkImmo({ dateAcquisition: "2026-03-01" });
  const anneeDebut = 2026;
  const moisDebut = 0;

  it("Y1 = 10 mois × 200 = 2 000 € (prorata mars–décembre)", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    expect(res.y1).toBeCloseTo(2000, 2);
  });

  it("Y2 = 12 mois complets = 2 400 €", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    expect(res.y2).toBeCloseTo(2400, 2);
  });

  it("Y3 = 12 mois complets = 2 400 €", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    expect(res.y3).toBeCloseTo(2400, 2);
  });

  it("total Y1+Y2+Y3 < total_acquisition car l'amortissement débute en mars", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    const total3Ans = res.y1 + res.y2 + res.y3;
    expect(total3Ans).toBeLessThan(12000);
    expect(total3Ans).toBeCloseTo(2000 + 2400 + 2400, 1); // 6 800
  });
});

// ── Mode LINEAIRE — durée ou montant nul ──────────────────────────────────────

describe("distribuerAmortParExercice — LINEAIRE, valeurs limites", () => {
  it("durée = 0 → dotations = 0 (protection division par zéro)", () => {
    const res = distribuerAmortParExercice(
      mkImmo({ dureeAmortissement: 0 }),
      2026,
      0,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("montantHT = 0 → dotations = 0", () => {
    const res = distribuerAmortParExercice(
      mkImmo({ montantHT: 0 }),
      2026,
      0,
    );
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("acquisition en dehors des 3 exercices → dotations 3 exercices = 0", () => {
    // Acquisition 5 ans avant le début du prévisionnel
    const res = distribuerAmortParExercice(
      mkImmo({ dateAcquisition: "2010-01-01", dureeAmortissement: 5 }),
      2026,
      0,
    );
    // Durée = 5 ans → fin = jan 2015 → tous les mois sont avant Y1 2026
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });
});

// ── Exercice décalé (moisDebut = 3 = avril) ──────────────────────────────────

describe("distribuerAmortParExercice — exercice décalé (moisDebut = 3)", () => {
  // Acquisition 1er juin 2026 ; exercice démarre en avril 2026
  // Y1 : avril 2026 → mars 2027 (12 mois) — acquisition juin → 10 mois dans y1
  const immo = mkImmo({ dateAcquisition: "2026-06-01" });
  const anneeDebut = 2026;
  const moisDebut = 3; // avril

  it("Y1 inclut les mois d'acquisition dans l'exercice décalé", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    // Exercice y1 = [avr 2026, mar 2027[ → acquisition juin 2026 : 10 mois
    expect(res.y1).toBeCloseTo(10 * 200, 2); // 2 000 €
  });

  it("Y2 = 12 mois complets (avr 2027 → mar 2028)", () => {
    const res = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
    expect(res.y2).toBeCloseTo(2400, 2);
  });
});
