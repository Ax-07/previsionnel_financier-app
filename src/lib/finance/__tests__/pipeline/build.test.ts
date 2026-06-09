/**
 * Tests de smoke — buildFinCalc (pipeline/build).
 *
 * Vérifie que le pipeline de calcul :
 *   1. Retourne tous les champs FinCalcResult attendus
 *   2. Produit des valeurs numériquement cohérentes avec les données d'entrée
 *   3. Gère correctement les labels d'exercice (exercice calendaire vs exercice à cheval)
 *   4. Calcule l'IS si le scénario est bénéficiaire
 */

import { describe, it, expect, beforeAll } from "vitest";
import type { FinCalcResult } from "@/lib/finance/types/results";
import { buildFinCalc } from "@/lib/finance/calculs";
import {
  SCENARIO_CREATION,
  SCENARIO_SERVICE_PUR,
  SCENARIO_EXERCICE_DECALE,
  DATE_DEMARRAGE,
  DATE_DEMARRAGE_DECALE,
} from "../fixtures/scenario-creation";

// ── Résultats partagés ────────────────────────────────────────────────────────

let fc: FinCalcResult;
let fcDecale: FinCalcResult;

beforeAll(() => {
  fc = buildFinCalc(SCENARIO_CREATION, DATE_DEMARRAGE);
  fcDecale = buildFinCalc(SCENARIO_EXERCICE_DECALE, DATE_DEMARRAGE_DECALE);
});

// ── Smoke: tous les champs obligatoires sont définis ─────────────────────────

describe("buildFinCalc — champs FinCalcResult", () => {
  const requiredFields: Array<keyof FinCalcResult> = [
    "anneeDebut",
    "moisDebut",
    "yearLabels",
    "ca",
    "achatsEffectues",
    "stockInitial",
    "stockFinal",
    "varStock",
    "achatsConsommes",
    "chargesExternes",
    "chargesPersonnel",
    "valeurAjoutee",
    "ebe",
    "dotationsAmort",
    "dotationsProvisions",
    "reprises",
    "resExpl",
    "interetsEmprunts",
    "resFin",
    "resCourant",
    "resExcep",
    "isParAnnee",
    "resNet",
    "caf",
    "autofinancement",
    "capitalRembourse",
    "variationBFR",
    "toExerciceKey",
  ];

  it.each(requiredFields)("le champ [%s] est défini", (field) => {
    expect(fc[field]).toBeDefined();
  });
});

// ── CA ───────────────────────────────────────────────────────────────────────

describe("buildFinCalc — chiffre d'affaires", () => {
  it("ca.y1 ≈ 180000 (montant annuel de l'activité)", () => {
    expect(fc.ca.y1).toBeCloseTo(180000, 0);
  });

  it("ca.y1 > 0 pour SCENARIO_SERVICE_PUR", () => {
    const fcSvc = buildFinCalc(SCENARIO_SERVICE_PUR, DATE_DEMARRAGE);
    expect(fcSvc.ca.y1).toBeGreaterThan(0);
  });
});

// ── Labels d'exercice ────────────────────────────────────────────────────────

describe("buildFinCalc — yearLabels", () => {
  it("démarrage en janvier → yearLabels.y1 = '2026' (exercice plein)", () => {
    expect(fc.yearLabels.y1).toBe("2026");
  });

  it("démarrage en janvier → yearLabels.y2 = '2027'", () => {
    expect(fc.yearLabels.y2).toBe("2027");
  });

  it("démarrage en janvier → yearLabels.y3 = '2028'", () => {
    expect(fc.yearLabels.y3).toBe("2028");
  });

  it("démarrage en avril → yearLabels.y1 = '2026–2027' (exercice à cheval)", () => {
    // \u2013 = tiret demi-cadratin "–"
    const label = fcDecale.yearLabels.y1;
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/2027/);
  });
});

// ── IS ───────────────────────────────────────────────────────────────────────

describe("buildFinCalc — IS", () => {
  it("isParAnnee.y1 > 0 pour un scénario bénéficiaire sans charges", () => {
    // CA=180000, achats≈72000, pas de charges → resCourant≈108000 → IS > 0
    expect(fc.isParAnnee.y1).toBeGreaterThan(0);
  });

  it("isParAnnee est défini pour tous les exercices", () => {
    expect(fc.isParAnnee.y1).toBeDefined();
    expect(fc.isParAnnee.y2).toBeDefined();
    expect(fc.isParAnnee.y3).toBeDefined();
  });
});

// ── Stocks ───────────────────────────────────────────────────────────────────

describe("buildFinCalc — stocks", () => {
  it("stockFinal.y1 > 0 (activité avec délai stock = 30j)", () => {
    expect(fc.stockFinal.y1).toBeGreaterThan(0);
  });

  it("stockInitial.y1 = 0 en création (pas de stock initial)", () => {
    expect(fc.stockInitial.y1).toBe(0);
  });

  it("stockInitial.y2 = stockFinal.y1 (continuité des stocks)", () => {
    expect(fc.stockInitial.y2).toBeCloseTo(fc.stockFinal.y1, 2);
  });
});

// ── anneeDebut / moisDebut ────────────────────────────────────────────────────

describe("buildFinCalc — anneeDebut / moisDebut", () => {
  it("anneeDebut = 2026 pour DATE_DEMARRAGE = 2026-01-01", () => {
    expect(fc.anneeDebut).toBe(2026);
  });

  it("moisDebut = 0 pour DATE_DEMARRAGE = 2026-01-01 (mois 0-indexé = janvier)", () => {
    // moisDebut = 0 → janvier (convention JS Date)
    expect(fc.moisDebut).toBe(0);
  });

  it("moisDebut = 3 pour DATE_DEMARRAGE_DECALE = 2026-04-01 (avril)", () => {
    expect(fcDecale.moisDebut).toBe(3);
  });
});

describe("buildFinCalc — exercices reels", () => {
  it("produit des series mensuelles a la longueur reelle et conserve le total annuel", () => {
    const scenarioCourt = {
      ...SCENARIO_CREATION,
      dateDemarrage: new Date("2026-01-01"),
      dureeProjection: 3,
      scenario: {
        ...SCENARIO_CREATION.scenario,
        parametres: {
          ...(SCENARIO_CREATION.scenario.parametres ?? {}),
          dateDebutExerciceN: new Date("2026-09-01"),
          dureePrevisionnelle: 3,
          exercices: [
            { ordre: 1, dateCloture: new Date("2026-12-31"), duree: 4, annee: 2026 },
            { ordre: 2, dateCloture: new Date("2027-12-31"), duree: 12, annee: 2027 },
            { ordre: 3, dateCloture: new Date("2028-12-31"), duree: 12, annee: 2028 },
          ],
        },
      },
    } as typeof SCENARIO_CREATION;

    const result = buildFinCalc(scenarioCourt, new Date("2026-01-01"));

    expect(result.calendar.source).toBe("parametres");
    expect(result.moisDebut).toBe(8);
    expect(result.monthlyCalc.ca.y1).toHaveLength(4);
    expect(result.ca.y1).toBeCloseTo(180000, 2);
    expect(result.tva.tvaCollectee.y1).toHaveLength(4);
    expect(result.toExerciceKey("2026-12-31")).toBe("y1");
    expect(result.toExerciceKey("2027-01-01")).toBe("y2");
  });
});
