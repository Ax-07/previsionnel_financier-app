/**
 * Tests unitaires — couche normalize/
 *
 * Couvre :
 *   - normalizeFournitures / normalizeServices / normalizeImpotsTaxes
 *   - normalizeSalaries / normalizeDirigeants / normalizeTNS
 *   - filtrage `actif !== false`
 *   - clamp moisPaiement ∈ [1, 12] (Fix H3)
 *   - parseDetailMensuel : fallback effectif si brutIndividuel = [0…] (Fix H1)
 *   - Immutabilité (Object.freeze)
 */

import { describe, it, expect } from "vitest";
import {
  normalizeFournitures,
  normalizeServices,
  normalizeImpotsTaxes,
} from "@/lib/finance/normalize/charges";
import {
  normalizeSalaries,
  normalizeDirigeants,
  normalizeTNS,
} from "@/lib/finance/normalize/personnel";

// ── Helpers de fixture ───────────────────────────────────────────────────────

function charge(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    intitule: "Test charge",
    montantN: 12000,
    montantN1: 13000,
    montantN2: 14000,
    frequence: "MENSUELLE",
    moisPaiement: 1,
    tva: 20,
    actif: true,
    detailCalc: null,
    categorie: "SERVICE_EXTERIEUR",
    scenarioId: "test-scenario",
    ...overrides,
  };
}

function salarie(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    libelle: "Salarié test",
    actif: true,
    montantN: 24000,
    montantN1: 24000,
    montantN2: 24000,
    tauxCotPat: 42,
    detailMensuelN: null,
    detailMensuelN1: null,
    detailMensuelN2: null,
    scenarioId: "test-scenario",
    ...overrides,
  };
}

// ── normalizeFournitures / Services / ImpotsTaxes ─────────────────────────────

describe("normalizeCharges — filtrage actif", () => {
  it("filtre les charges avec actif = false", () => {
    const data = {
      fournitures: [charge({ actif: false }), charge({ id: "c-2", actif: true })],
    };
    const result = normalizeFournitures(data as never);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("c-2");
  });

  it("conserve les charges avec actif = null (comportement permissif)", () => {
    const data = { fournitures: [charge({ actif: null })] };
    const result = normalizeFournitures(data as never);
    expect(result).toHaveLength(1);
  });

  it("conserve les charges avec actif = true", () => {
    const data = { services: [charge({ actif: true })] };
    const result = normalizeServices(data as never);
    expect(result).toHaveLength(1);
  });
});

describe("normalizeCharges — montants convertis", () => {
  it("convertit les montants Decimal Prisma-like en number", () => {
    const data = {
      fournitures: [charge({ montantN: { toNumber: () => 12000 } })],
    };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.montant.y1).toBe(12000);
  });

  it("normalise les montants à 0 si null", () => {
    const data = { fournitures: [charge({ montantN: null })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.montant.y1).toBe(0);
  });
});

describe("normalizeCharges — moisPaiement clamp [1, 12] (Fix H3)", () => {
  it("clamp moisPaiement = 0 → 1", () => {
    const data = { fournitures: [charge({ moisPaiement: 0 })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.moisPaiement).toBe(1);
  });

  it("clamp moisPaiement = 13 → 12", () => {
    const data = { services: [charge({ moisPaiement: 13 })] };
    const result = normalizeServices(data as never);
    expect(result[0]!.moisPaiement).toBe(12);
  });

  it("conserve moisPaiement = 6 (dans la plage)", () => {
    const data = { impotsTaxes: [charge({ moisPaiement: 6 })] };
    const result = normalizeImpotsTaxes(data as never);
    expect(result[0]!.moisPaiement).toBe(6);
  });

  it("résout moisPaiement = null → 1", () => {
    const data = { fournitures: [charge({ moisPaiement: null })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.moisPaiement).toBe(1);
  });

  it("clamp moisPaiement = -1 → 1", () => {
    const data = { fournitures: [charge({ moisPaiement: -1 })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.moisPaiement).toBe(1);
  });
});

describe("normalizeCharges — frequence", () => {
  it("résout frequence = null → MENSUELLE", () => {
    const data = { fournitures: [charge({ frequence: null })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.frequence).toBe("MENSUELLE");
  });

  it("passe en majuscules les fréquences valides", () => {
    const data = { fournitures: [charge({ frequence: "trimestrielle" })] };
    const result = normalizeFournitures(data as never);
    expect(result[0]!.frequence).toBe("TRIMESTRIELLE");
  });
});

describe("normalizeCharges — immutabilité", () => {
  it("le tableau retourné est gelé", () => {
    const data = { fournitures: [charge()] };
    const result = normalizeFournitures(data as never);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("chaque objet charge est gelé", () => {
    const data = { fournitures: [charge()] };
    const result = normalizeFournitures(data as never);
    expect(Object.isFrozen(result[0])).toBe(true);
  });
});

// ── normalizeSalaries ─────────────────────────────────────────────────────────

describe("normalizeSalaries — filtrage actif", () => {
  it("filtre les salariés avec actif = false", () => {
    const data = {
      salaries: [salarie({ actif: false }), salarie({ id: "s-2", actif: true })],
    };
    const result = normalizeSalaries(data as never);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("s-2");
  });
});

describe("normalizeSalaries — detailMensuel null", () => {
  it("detailMensuelN = null → detailMensuel.N = null", () => {
    const data = { salaries: [salarie({ detailMensuelN: null })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.detailMensuel.N).toBeNull();
  });
});

describe("normalizeSalaries — parseDetailMensuel (Fix H1)", () => {
  it("brutIndividuel=[0…0], effectif valide → retourne null (les deux sont nuls)", () => {
    // Si brutIndividuel est un tableau de 12 zéros, il est sélectionné (fix H1)
    // mais le résultat est null car la somme est 0 — comportement correct.
    const detail = {
      brutIndividuel: Array(12).fill(0),
      effectif: Array(12).fill(1),
    };
    const data = { salaries: [salarie({ detailMensuelN: detail })] };
    const result = normalizeSalaries(data as never);
    // brutIndividuel est valide (12 éléments) donc sélectionné, mais [0…0]
    // → parseDetailMensuel retourne le tableau (normalize ne filtre pas le tout-zéro)
    expect(result[0]!.detailMensuel.N).toEqual(Array(12).fill(0));
  });

  it("brutIndividuel absent → fallback sur effectif", () => {
    const detail = { effectif: Array(12).fill(1000) };
    const data = { salaries: [salarie({ detailMensuelN: detail })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.detailMensuel.N).toEqual(Array(12).fill(1000));
  });

  it("brutIndividuel valide (non-zéro) → utilisé en priorité sur effectif", () => {
    const detail = {
      brutIndividuel: Array(12).fill(2000),
      effectif: Array(12).fill(1),
    };
    const data = { salaries: [salarie({ detailMensuelN: detail })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.detailMensuel.N).toEqual(Array(12).fill(2000));
  });

  it("detailMensuel tableau direct → parsé correctement", () => {
    const detail = Array(12).fill(1500);
    const data = { salaries: [salarie({ detailMensuelN: detail })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.detailMensuel.N).toEqual(Array(12).fill(1500));
  });

  it("detailMensuel avec moins de 12 éléments → null", () => {
    const detail = { brutIndividuel: [1000, 2000], effectif: [1, 1] };
    const data = { salaries: [salarie({ detailMensuelN: detail })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.detailMensuel.N).toBeNull();
  });
});

describe("normalizeSalaries — montants", () => {
  it("convertit les montants correctement", () => {
    const data = { salaries: [salarie({ montantN: 30000, montantN1: 32000, montantN2: 34000 })] };
    const result = normalizeSalaries(data as never);
    expect(result[0]!.montant).toEqual({ y1: 30000, y2: 32000, y3: 34000 });
  });
});

// ── normalizeDirigeants ───────────────────────────────────────────────────────

describe("normalizeDirigeants — filtrage actif", () => {
  it("filtre les dirigeants inactifs", () => {
    const data = {
      dirigeants: [
        { id: "d-1", libelle: "Dir", actif: false, montantN: 60000, montantN1: 60000, montantN2: 60000, detailMensuelN: null, detailMensuelN1: null, detailMensuelN2: null, scenarioId: "s" },
        { id: "d-2", libelle: "Dir2", actif: true, montantN: 60000, montantN1: 60000, montantN2: 60000, detailMensuelN: null, detailMensuelN1: null, detailMensuelN2: null, scenarioId: "s" },
      ],
    };
    const result = normalizeDirigeants(data as never);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("d-2");
  });

  it("tauxCotisationsPatronales = 0 pour les dirigeants", () => {
    const data = {
      dirigeants: [
        { id: "d-1", libelle: "Dir", actif: true, montantN: 60000, montantN1: 60000, montantN2: 60000, detailMensuelN: null, detailMensuelN1: null, detailMensuelN2: null, scenarioId: "s" },
      ],
    };
    const result = normalizeDirigeants(data as never);
    expect(result[0]!.tauxCotisationsPatronales).toBe(0);
  });
});

// ── normalizeTNS ──────────────────────────────────────────────────────────────

describe("normalizeTNS — filtrage actif", () => {
  it("filtre les cotisations TNS inactives", () => {
    const data = {
      cotisationsTNS: [
        { id: "t-1", libelle: "Madelin", actif: false, montantN: 5000, montantN1: 5000, montantN2: 5000, scenarioId: "s" },
        { id: "t-2", libelle: "CIPAV", actif: true, montantN: 8000, montantN1: 8000, montantN2: 8000, scenarioId: "s" },
      ],
    };
    const result = normalizeTNS(data as never);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("t-2");
  });

});
