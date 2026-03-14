/**
 * Tests unitaires — calcCA, calcCAByType, calcStocks.
 *
 * R5 (Guide 06) — Tests de régression couvrant les bugs corrigés :
 *   - Convention /360 (pas /365) — corrigé le 11 mars 2026
 *   - achatsConsommés = PRIMAL (CA × coef), indépendant du stock — corrigé le 11 mars 2026
 */

import { describe, it, expect } from "vitest";
import { calcCA, calcCAByType, calcStocks } from "@/lib/finance/calculs/ca";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Données de test ───────────────────────────────────────────────────────────

const ACTIVITE_BOULANGERIE = {
  id: "act-1",
  libelle: "Boulangerie",
  typeActivite: "VENTES_MARCHANDISES",
  actif: true,
  montantN: 180000,
  montantN1: 198000,
  montantN2: 207900,
  tauxMarge: 60,
  stocks: 30,
};

const ACTIVITE_SERVICE = {
  ...ACTIVITE_BOULANGERIE,
  id: "act-svc",
  typeActivite: "PRESTATION_SERVICES",
  tauxMarge: 100,
  stocks: 0,
};

const ACTIVITE_INACTIVE = {
  ...ACTIVITE_BOULANGERIE,
  id: "act-inactive",
  actif: false,
};

function mkData(
  activites: unknown[],
): Pick<ScenarioFinData, "activites"> {
  return { activites } as unknown as Pick<ScenarioFinData, "activites">;
}

// ── calcCA ────────────────────────────────────────────────────────────────────

describe("calcCA", () => {
  it("retourne les montants annuels exacts pour une activité active", () => {
    const ca = calcCA(mkData([ACTIVITE_BOULANGERIE]));
    expect(ca.y1).toBe(180000);
    expect(ca.y2).toBe(198000);
    expect(ca.y3).toBe(207900);
  });

  it("agrège plusieurs activités actives", () => {
    const ca = calcCA(mkData([
      ACTIVITE_BOULANGERIE,
      { ...ACTIVITE_BOULANGERIE, id: "act-2", montantN: 20000, montantN1: 22000, montantN2: 23000 },
    ]));
    expect(ca.y1).toBe(200000);
    expect(ca.y2).toBe(220000);
    expect(ca.y3).toBe(230900);
  });

  it("ignore les activités avec actif === false", () => {
    const ca = calcCA(mkData([ACTIVITE_INACTIVE]));
    expect(ca.y1).toBe(0);
    expect(ca.y2).toBe(0);
    expect(ca.y3).toBe(0);
  });

  it("retourne zéro si la liste est vide", () => {
    const ca = calcCA(mkData([]));
    expect(ca.y1).toBe(0);
  });
});

// ── calcCAByType ──────────────────────────────────────────────────────────────

describe("calcCAByType", () => {
  it("filtre par typeActivite VENTES_MARCHANDISES", () => {
    const ca = calcCAByType(
      mkData([ACTIVITE_BOULANGERIE, ACTIVITE_SERVICE]),
      "VENTES_MARCHANDISES",
    );
    expect(ca.y1).toBe(180000);
  });

  it("filtre par typeActivite PRESTATION_SERVICES", () => {
    const ca = calcCAByType(
      mkData([ACTIVITE_BOULANGERIE, ACTIVITE_SERVICE]),
      "PRESTATION_SERVICES",
    );
    expect(ca.y1).toBe(180000);
  });

  it("retourne 0 si aucune activité ne correspond au type", () => {
    const ca = calcCAByType(mkData([ACTIVITE_BOULANGERIE]), "PRESTATION_SERVICES");
    expect(ca.y1).toBe(0);
  });
});

// ── calcStocks ────────────────────────────────────────────────────────────────

describe("calcStocks — PRIMAL/DÉRIVÉ (régression 11 mars 2026)", () => {
  it("achatsConsommés = PRIMAL : CA × (1 − tauxMarge/100), indépendant du stock", () => {
    // VENTES_MARCHANDISES : 180 000 × (1 − 0.60) = 72 000
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    expect(res.achatsConsommes.y1).toBeCloseTo(72000, 2);
    expect(res.achatsConsommes.y2).toBeCloseTo(79200, 2);  // 198 000 × 0.40
    expect(res.achatsConsommes.y3).toBeCloseTo(83160, 2);  // 207 900 × 0.40
  });

  it("utilise la convention /360 (pas /365) — régression 11 mars 2026", () => {
    // stockFinal Y1 = achatsConsommes.y1 × joursStock / 360
    // = 72 000 × 30 / 360 = 6 000
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    expect(res.stockFinal.y1).toBeCloseTo(6000, 2);
    // Vérification : /365 donnerait 72 000 × 30 / 365 ≈ 5 918 → différent
    expect(res.stockFinal.y1).not.toBeCloseTo(72000 * 30 / 365, 1);
  });

  it("stockInitial.y1 = 0 (création d'entreprise)", () => {
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    expect(res.stockInitial.y1).toBe(0);
  });

  it("stockInitial.y2 = stockFinal.y1 (continuité inter-exercices)", () => {
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    expect(res.stockInitial.y2).toBeCloseTo(res.stockFinal.y1, 6);
  });

  it("stockInitial.y3 = stockFinal.y2 (continuité inter-exercices)", () => {
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    expect(res.stockInitial.y3).toBeCloseTo(res.stockFinal.y2, 6);
  });

  it("achatsEffectués = DÉRIVÉ : achatsConsommés + varStock", () => {
    const res = calcStocks(mkData([ACTIVITE_BOULANGERIE]));
    // Y1 : achats = 72 000 + (6 000 − 0) = 78 000
    expect(res.achatsEffectues.y1).toBeCloseTo(
      res.achatsConsommes.y1 + res.varStock.y1,
      2,
    );
    // Y2 : varStock = stockFinal.y2 - stockFinal.y1
    expect(res.achatsEffectues.y2).toBeCloseTo(
      res.achatsConsommes.y2 + res.varStock.y2,
      2,
    );
  });

  it("PRESTATION_SERVICES → achatsConsommés = 0 et stockFinal = 0", () => {
    const res = calcStocks(mkData([ACTIVITE_SERVICE]));
    expect(res.achatsConsommes.y1).toBe(0);
    expect(res.stockFinal.y1).toBe(0);
    expect(res.varStock.y1).toBe(0);
  });

  it("tauxMarge = 100 → achatsConsommés = 0", () => {
    const act = { ...ACTIVITE_BOULANGERIE, typeActivite: "VENTES_MARCHANDISES", tauxMarge: 100 };
    const res = calcStocks(mkData([act]));
    expect(res.achatsConsommes.y1).toBe(0);
  });

  it("tauxMarge = 0 → achatsConsommés = CA (négoce sans marge)", () => {
    const act = { ...ACTIVITE_BOULANGERIE, typeActivite: "VENTES_MARCHANDISES", tauxMarge: 0 };
    const res = calcStocks(mkData([act]));
    expect(res.achatsConsommes.y1).toBe(180000);
  });

  it("stocks = 0 → stockFinal = 0 (service sans stock)", () => {
    const act = { ...ACTIVITE_BOULANGERIE, stocks: 0 };
    const res = calcStocks(mkData([act]));
    expect(res.stockFinal.y1).toBe(0);
    expect(res.varStock.y1).toBe(0);
    // achatsEffectués = achatsConsommés + 0 = 72 000
    expect(res.achatsEffectues.y1).toBeCloseTo(72000, 2);
  });
});
