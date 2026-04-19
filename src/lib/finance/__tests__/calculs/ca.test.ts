/**
 * Tests unitaires — calcCA, calcCAByType.
 */

import { describe, it, expect } from "vitest";
import { calcCA, calcCAByType } from "@/lib/finance/calculs/ca";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
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


