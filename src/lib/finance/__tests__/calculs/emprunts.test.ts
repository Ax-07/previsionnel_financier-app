/**
 * Tests unitaires — calcInteretsEmprunts, calcCapitalRembourse, calcFraisDossier.
 *
 * Couvre :
 *   - Agrégation des intérêts + assurances par exercice fiscal
 *   - Agrégation du capital remboursé par exercice fiscal
 *   - Identification des frais de dossier (moisNumero === 0)
 *   - Plusieurs emprunts
 *   - Lignes hors des 3 exercices ignorées
 */

import { describe, it, expect } from "vitest";
import {
  calcInteretsEmprunts,
  calcCapitalRembourse,
  calcFraisDossier,
} from "@/lib/finance/calculs/emprunts";
import { makeExerciceHelpers } from "@/lib/finance/pipeline/calendar";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DATE_2026 = new Date("2026-01-01");
const { toExerciceKey } = makeExerciceHelpers(DATE_2026);

/** Crée un emprunt minimal avec ses lignes d'échéancier. */
function mkEmprunt(
  id: string,
  opts: {
    fraisDossier?: number;
    dateDéblocage?: string;
    lignes: {
      moisNumero: number;
      dateEcheance: string;
      interesMois: number;
      assuranceMois: number;
      capitalRembourse: number;
      mensualiteTotale: number;
    }[];
  },
) {
  return {
    id,
    libelle: `Emprunt ${id}`,
    fraisDossier: opts.fraisDossier ?? 0,
    dateDéblocage: opts.dateDéblocage ?? "2026-01-01",
    lignesEcheancier: opts.lignes,
  };
}

function mkData(
  emprunts: ReturnType<typeof mkEmprunt>[],
): Pick<ScenarioFinData, "emprunts"> {
  return { emprunts } as unknown as Pick<ScenarioFinData, "emprunts">;
}

// ── Données de test ───────────────────────────────────────────────────────────

// Un emprunt avec 2 lignes en Y1 et 1 ligne en Y2
const EMPRUNT_STANDARD = mkEmprunt("emp-1", {
  lignes: [
    { moisNumero: 1, dateEcheance: "2026-02-15", interesMois: 400,  assuranceMois: 13.33, capitalRembourse: 952.38, mensualiteTotale: 1365.71 },
    { moisNumero: 2, dateEcheance: "2026-03-15", interesMois: 395,  assuranceMois: 13.33, capitalRembourse: 952.38, mensualiteTotale: 1360.71 },
    { moisNumero: 13, dateEcheance: "2027-02-15", interesMois: 350, assuranceMois: 13.33, capitalRembourse: 952.38, mensualiteTotale: 1315.71 },
  ],
});

// Un emprunt avec frais de dossier (champ direct fraisDossier, sans ligne -1 dans l'échéancier)
const EMPRUNT_AVEC_FRAIS = mkEmprunt("emp-2", {
  fraisDossier: 500,
  dateDéblocage: "2026-01-01",
  lignes: [
    { moisNumero: 1, dateEcheance: "2026-02-15", interesMois: 200, assuranceMois: 5, capitalRembourse: 500, mensualiteTotale: 705 },
  ],
});

// ── calcInteretsEmprunts ──────────────────────────────────────────────────────

describe("calcInteretsEmprunts", () => {
  it("agrège intérêts + assurances des lignes en Y1", () => {
    const res = calcInteretsEmprunts(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    // Ligne M1 : 400 + 13.33 = 413.33 — Ligne M2 : 395 + 13.33 = 408.33
    expect(res.y1).toBeCloseTo(413.33 + 408.33, 2);
  });

  it("agrège les intérêts de la ligne en Y2", () => {
    const res = calcInteretsEmprunts(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res.y2).toBeCloseTo(350 + 13.33, 2);
  });

  it("Y3 = 0 si aucune ligne en Y3", () => {
    const res = calcInteretsEmprunts(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res.y3).toBe(0);
  });

  it("agrège plusieurs emprunts correctement", () => {
    const res = calcInteretsEmprunts(
      mkData([EMPRUNT_STANDARD, EMPRUNT_AVEC_FRAIS]),
      toExerciceKey,
    );
    // Y1 : (400+13.33) + (395+13.33) + (200+5) = 1026.99
    expect(res.y1).toBeCloseTo(413.33 + 408.33 + 200 + 5, 2);
  });

  it("retourne zéro si la liste est vide", () => {
    const res = calcInteretsEmprunts(mkData([]), toExerciceKey);
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });
});

// ── calcCapitalRembourse ──────────────────────────────────────────────────────

describe("calcCapitalRembourse", () => {
  it("agrège le capital remboursé en Y1 (2 lignes)", () => {
    const res = calcCapitalRembourse(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res.y1).toBeCloseTo(952.38 + 952.38, 2);
  });

  it("agrège le capital remboursé en Y2 (1 ligne)", () => {
    const res = calcCapitalRembourse(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res.y2).toBeCloseTo(952.38, 2);
  });

  it("Y3 = 0 si aucune ligne en Y3", () => {
    const res = calcCapitalRembourse(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res.y3).toBe(0);
  });

  it("n'inclut que le capital des mensualités (pas les frais de dossier)", () => {
    // fraisDossier est un champ séparé — absent de lignesEcheancier
    const res = calcCapitalRembourse(mkData([EMPRUNT_AVEC_FRAIS]), toExerciceKey);
    expect(res.y1).toBeCloseTo(500, 2); // seule ligne M1
  });
});

// ── calcFraisDossier ──────────────────────────────────────────────────────────

describe("calcFraisDossier", () => {
  it("frais dossier = emprunt.fraisDossier à la date de déblocage", () => {
    const res = calcFraisDossier(mkData([EMPRUNT_AVEC_FRAIS]), toExerciceKey);
    expect(res.y1).toBeCloseTo(500, 2);
  });

  it("ignore les emprunts sans frais dossier (fraisDossier = 0)", () => {
    const res = calcFraisDossier(mkData([EMPRUNT_STANDARD]), toExerciceKey);
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("retourne zéro si aucun emprunt", () => {
    const res = calcFraisDossier(mkData([]), toExerciceKey);
    expect(res).toEqual({ y1: 0, y2: 0, y3: 0 });
  });

  it("agrège les frais dossier de plusieurs emprunts", () => {
    const emp2 = mkEmprunt("emp-frais2", {
      fraisDossier: 300,
      dateDéblocage: "2026-01-15",
      lignes: [],
    });
    const res = calcFraisDossier(mkData([EMPRUNT_AVEC_FRAIS, emp2]), toExerciceKey);
    expect(res.y1).toBeCloseTo(800, 2); // 500 + 300
  });
});
