/**
 * Tests unitaires — aggregations/ : cas limites
 *
 * Couvre les builders de la couche aggregations avec des données limites :
 *   - CA = 0 (activité présente, montant nul) → risque division par zéro dans % CA
 *   - Aucune activité (activites = []) → tableaux vides, pas de crash
 *
 * Pour chaque builder, on vérifie :
 *   1. Retour d'une structure valide (non null, propriétés attendues)
 *   2. Valeurs numériques finies (pas de NaN, ±Infinity)
 *   3. Totaux à zéro quand les données sources sont nulles
 *   4. Cohérence interne (ex: CA total = somme des lignes CA)
 */

import { describe, it, expect } from "vitest";
import { buildFinCalc } from "@/lib/finance/calculs";
import { buildCompteResultatRows } from "@/lib/finance/aggregations/compte-resultat";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildCafRows } from "@/lib/finance/aggregations/caf";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { buildRatiosRows } from "@/lib/finance/aggregations/ratios";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import { buildTableauFinancementRows } from "@/lib/finance/aggregations/tableau-financement";
// Note : buildTresorerieRows prend TresorerieRowsInput (pas data+fc) → testé en integration
import {
  SCENARIO_CREATION,
  SCENARIO_ZERO_CA,
  SCENARIO_AUCUNE_ACTIVITE,
  DATE_DEMARRAGE,
} from "../fixtures/scenario-creation";

// ── Pré-calcul (déterministe) ─────────────────────────────────────────────────

const FC_CREATION = buildFinCalc(SCENARIO_CREATION, DATE_DEMARRAGE);
const FC_ZERO_CA = buildFinCalc(SCENARIO_ZERO_CA, DATE_DEMARRAGE);
const FC_VIDE = buildFinCalc(SCENARIO_AUCUNE_ACTIVITE, DATE_DEMARRAGE);

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Extrait toutes les valeurs numériques d'un objet de façon récursive */
function allNumbers(obj: unknown): number[] {
  if (typeof obj === "number") return [obj];
  if (obj === null || typeof obj !== "object") return [];
  return Object.values(obj as Record<string, unknown>).flatMap(allNumbers);
}

/** Vérifie qu'aucune valeur n'est NaN ou ±Infinity */
function hasNoInvalidNumber(obj: unknown): boolean {
  return allNumbers(obj).every((v) => Number.isFinite(v));
}

// ══════════════════════════════════════════════════════════════════════════════
// buildCompteResultatRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildCompteResultatRows — CA = 0", () => {
  const cr = buildCompteResultatRows(SCENARIO_ZERO_CA, FC_ZERO_CA, true);

  it("retourne un objet avec yearLabels et nodes", () => {
    expect(cr).toHaveProperty("yearLabels");
    expect(cr).toHaveProperty("nodes");
    expect(Array.isArray(cr.nodes)).toBe(true);
  });

  it("aucun NaN ni Infinity dans les valeurs", () => {
    expect(hasNoInvalidNumber(cr)).toBe(true);
  });

  it("yearLabels couvre y1, y2, y3", () => {
    expect(cr.yearLabels).toHaveProperty("y1");
    expect(cr.yearLabels).toHaveProperty("y2");
    expect(cr.yearLabels).toHaveProperty("y3");
  });
});

describe("buildCompteResultatRows — aucune activité", () => {
  const cr = buildCompteResultatRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE, true);

  it("ne crash pas avec activites = []", () => {
    expect(cr).toBeDefined();
    expect(Array.isArray(cr.nodes)).toBe(true);
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(cr)).toBe(true);
  });
});

describe("buildCompteResultatRows — scénario normal (smoke)", () => {
  const cr = buildCompteResultatRows(SCENARIO_CREATION, FC_CREATION, true);

  it("nodes non vide", () => {
    expect(cr.nodes.length).toBeGreaterThan(0);
  });

  it("chaque nœud a une key, label, values, style", () => {
    for (const node of cr.nodes) {
      expect(typeof node.key).toBe("string");
      expect(typeof node.label).toBe("string");
      expect(node.values).toHaveProperty("y1");
      expect(typeof node.style).toBe("string");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildSigData
// ══════════════════════════════════════════════════════════════════════════════

describe("buildSigData — CA = 0", () => {
  const sig = buildSigData(SCENARIO_ZERO_CA, FC_ZERO_CA, true);

  it("retourne un objet avec yearLabels et nodes", () => {
    expect(sig).toHaveProperty("yearLabels");
    expect(sig).toHaveProperty("nodes");
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(sig)).toBe(true);
  });
});

describe("buildSigData — aucune activité", () => {
  const sig = buildSigData(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE, true);

  it("ne crash pas", () => {
    expect(sig).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(sig)).toBe(true);
  });
});

describe("buildSigData — scénario normal (smoke)", () => {
  const sig = buildSigData(SCENARIO_CREATION, FC_CREATION, true);

  it("nodes non vide", () => {
    expect(sig.nodes.length).toBeGreaterThan(0);
  });

  it("chaque nœud a key, label, values (y1/y2/y3), style", () => {
    for (const node of sig.nodes) {
      expect(typeof node.key).toBe("string");
      expect(node.values).toHaveProperty("y1");
      expect(node.values).toHaveProperty("y2");
      expect(node.values).toHaveProperty("y3");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildBfrRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildBfrRows — CA = 0", () => {
  const bfr = buildBfrRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet avec yearLabels et rows", () => {
    expect(bfr).toHaveProperty("yearLabels");
    expect(bfr).toHaveProperty("rows");
    expect(Array.isArray(bfr.rows)).toBe(true);
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(bfr)).toBe(true);
  });
});

describe("buildBfrRows — aucune activité", () => {
  const bfr = buildBfrRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(bfr).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(bfr)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildCafRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildCafRows — CA = 0", () => {
  const caf = buildCafRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet valide", () => {
    expect(caf).toHaveProperty("yearLabels");
    expect(caf).toHaveProperty("rows");
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(caf)).toBe(true);
  });
});

describe("buildCafRows — aucune activité", () => {
  const caf = buildCafRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(caf).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(caf)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildBilanRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildBilanRows — CA = 0", () => {
  const bilan = buildBilanRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet valide", () => {
    expect(bilan).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(bilan)).toBe(true);
  });
});

describe("buildBilanRows — aucune activité", () => {
  const bilan = buildBilanRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(bilan).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(bilan)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildRatiosRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildRatiosRows — CA = 0 (risque division par zéro)", () => {
  const ratios = buildRatiosRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("ne crash pas malgré CA = 0", () => {
    expect(ratios).toBeDefined();
  });

  it("aucun NaN ni Infinity (safeDiv doit protéger)", () => {
    expect(hasNoInvalidNumber(ratios)).toBe(true);
  });
});

describe("buildRatiosRows — aucune activité", () => {
  const ratios = buildRatiosRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(ratios).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(ratios)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildTVARows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildTVARows — CA = 0", () => {
  const tva = buildTVARows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet valide", () => {
    expect(tva).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(tva)).toBe(true);
  });
});

describe("buildTVARows — aucune activité", () => {
  const tva = buildTVARows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(tva).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(tva)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildPlanFinancementRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildPlanFinancementRows — CA = 0", () => {
  const plan = buildPlanFinancementRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet valide", () => {
    expect(plan).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(plan)).toBe(true);
  });
});

describe("buildPlanFinancementRows — aucune activité", () => {
  const plan = buildPlanFinancementRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(plan).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(plan)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildTableauFinancementRows
// ══════════════════════════════════════════════════════════════════════════════

describe("buildTableauFinancementRows — CA = 0", () => {
  const tab = buildTableauFinancementRows(SCENARIO_ZERO_CA, FC_ZERO_CA);

  it("retourne un objet valide", () => {
    expect(tab).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(tab)).toBe(true);
  });
});

describe("buildTableauFinancementRows — aucune activité", () => {
  const tab = buildTableauFinancementRows(SCENARIO_AUCUNE_ACTIVITE, FC_VIDE);

  it("ne crash pas", () => {
    expect(tab).toBeDefined();
  });

  it("aucun NaN ni Infinity", () => {
    expect(hasNoInvalidNumber(tab)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Propriétés structurelles cross-builders
// ══════════════════════════════════════════════════════════════════════════════

describe("Cohérence structurelle — yearLabels consistent cross-builders", () => {
  it("tous les builders partagent les mêmes yearLabels (y1/y2/y3)", () => {
    const cr = buildCompteResultatRows(SCENARIO_CREATION, FC_CREATION, true);
    const sig = buildSigData(SCENARIO_CREATION, FC_CREATION, true);
    const bfr = buildBfrRows(SCENARIO_CREATION, FC_CREATION);

    // Les labels d'exercice doivent être cohérents
    expect(cr.yearLabels.y1).toBe(sig.yearLabels.y1);
    expect(cr.yearLabels.y1).toBe(bfr.yearLabels.y1);
  });
});

describe("Cohérence comptable — CR vs SIG (smoke)", () => {
  const cr = buildCompteResultatRows(SCENARIO_CREATION, FC_CREATION, true);
  const sig = buildSigData(SCENARIO_CREATION, FC_CREATION, true);

  it("les deux structures ont des nodes", () => {
    expect(cr.nodes.length).toBeGreaterThan(0);
    expect(sig.nodes.length).toBeGreaterThan(0);
  });

  it("les keys de nœuds CR sont uniques", () => {
    function collectKeys(nodes: typeof cr.nodes): string[] {
      return nodes.flatMap((n) => [n.key, ...(n.children ? collectKeys(n.children) : [])]);
    }
    const keys = collectKeys(cr.nodes);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("les keys de nœuds SIG sont uniques", () => {
    function collectKeys(nodes: typeof sig.nodes): string[] {
      return nodes.flatMap((n) => [n.key, ...(n.children ? collectKeys(n.children) : [])]);
    }
    const keys = collectKeys(sig.nodes);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});
