/**
 * Tests unitaires — calcBfr (calculs/bfr).
 *
 * Couvre les règles BFR critiques (§12 directives) et les bugs corrigés :
 *
 * R5 — Régressions protégées :
 *   - dettesPersonnel = 0 si moisPaiementSalaires = 0 — corrigé le 12 mars 2026
 *   - variationBFR.y1 = bfr.y1 − bfr.y0 (pas bfr.y1) — corrigé le 10 mars 2026
 *
 * Autres cas :
 *   - stocksMatieres = 0 pour PRESTATION_SERVICES
 *   - creancesClients = 0 si délai = 0
 *   - BFR structurellement cohérent (totalBesoins - totalRessources = bfr)
 */

import { describe, it, expect } from "vitest";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import { buildFinCalc } from "@/lib/finance/calculs";
import {
  SCENARIO_CREATION,
  SCENARIO_CREATION_SALARIE,
  SCENARIO_M0_SALAIRE,
  SCENARIO_SERVICE_PUR,
  DATE_DEMARRAGE,
} from "../fixtures/scenario-creation";

// ── Résultats pré-calculés (buildFinCalc est deterministe) ───────────────────

const FC_CREATION = buildFinCalc(SCENARIO_CREATION, DATE_DEMARRAGE);
const FC_SERVICE_PUR = buildFinCalc(SCENARIO_SERVICE_PUR, DATE_DEMARRAGE);
const FC_SALARIE_M1 = buildFinCalc(SCENARIO_CREATION_SALARIE, DATE_DEMARRAGE);
const FC_SALARIE_M0 = buildFinCalc(SCENARIO_M0_SALAIRE, DATE_DEMARRAGE);

// ── stocksMatieres ────────────────────────────────────────────────────────────

describe("calcBfr — stocksMatieres", () => {
  it("VENTES_MARCHANDISES avec stocks > 0 → stocksMatieres.y1 > 0", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    expect(bfr.stocksMatieres.y1).toBeGreaterThan(0);
  });

  it("PRESTATION_SERVICES → stocksMatieres = 0 pour tous les exercices", () => {
    const bfr = calcBfr(SCENARIO_SERVICE_PUR, FC_SERVICE_PUR);
    expect(bfr.stocksMatieres.y1).toBe(0);
    expect(bfr.stocksMatieres.y2).toBe(0);
    expect(bfr.stocksMatieres.y3).toBe(0);
  });
});

// ── creancesClients ───────────────────────────────────────────────────────────

describe("calcBfr — creancesClients", () => {
  it("délai client = 0 → creancesClients = 0 (vente au comptant)", () => {
    // SCENARIO_CREATION : reglementClients = 0
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    expect(bfr.creancesClients.y1).toBe(0);
    expect(bfr.creancesClients.y2).toBe(0);
    expect(bfr.creancesClients.y3).toBe(0);
  });
});

// ── dettesPersonnel — régression 12 mars 2026 ────────────────────────────────

describe("calcBfr — dettesPersonnel (régression 12 mars 2026)", () => {
  it(
    "moisPaiementSalaires = 0 → dettesPersonnel = 0 (bug corrigé)",
    () => {
      const bfr = calcBfr(SCENARIO_M0_SALAIRE, FC_SALARIE_M0);
      expect(bfr.dettesPersonnel.y1).toBe(0);
      expect(bfr.dettesPersonnel.y2).toBe(0);
      expect(bfr.dettesPersonnel.y3).toBe(0);
    },
  );

  it(
    "moisPaiementSalaires = 1 → dettesPersonnel > 0 quand il y a des salaires",
    () => {
      const bfr = calcBfr(SCENARIO_CREATION_SALARIE, FC_SALARIE_M1);
      // Salaire brut = 24 000/an = 2 000/mois ; cotPat = 42%
      // dettesPersonnel.y1 = 2 000 × (1 + 0.42) = 2 840
      expect(bfr.dettesPersonnel.y1).toBeCloseTo(2840, 1);
    },
  );

  it(
    "sans salaires → dettesPersonnel = 0 quel que soit moisPaiementSalaires",
    () => {
      const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
      expect(bfr.dettesPersonnel.y1).toBe(0);
    },
  );
});

// ── variationBFR — régression 10 mars 2026 ───────────────────────────────────

describe("calcBfr — variationBFR (régression 10 mars 2026)", () => {
  it(
    "variationBFR.y1 = bfr.y1 − bfr.y0 (inclut le BFR initial y0)",
    () => {
      const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
      expect(bfr.variationBFR.y1).toBeCloseTo(bfr.bfr.y1 - bfr.bfr.y0, 2);
    },
  );

  it(
    "variationBFR.y2 = bfr.y2 − bfr.y1",
    () => {
      const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
      expect(bfr.variationBFR.y2).toBeCloseTo(bfr.bfr.y2 - bfr.bfr.y1, 2);
    },
  );

  it(
    "variationBFR.y3 = bfr.y3 − bfr.y2",
    () => {
      const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
      expect(bfr.variationBFR.y3).toBeCloseTo(bfr.bfr.y3 - bfr.bfr.y2, 2);
    },
  );
});

// ── Cohérence structurelle du BFR ────────────────────────────────────────────

describe("calcBfr — cohérence structurelle", () => {
  it("bfr = totalBesoins − totalRessources pour chaque exercice", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    for (const yk of ["y1", "y2", "y3"] as const) {
      const calc = bfr.totalBesoins[yk] - bfr.totalRessources[yk];
      expect(bfr.bfr[yk]).toBeCloseTo(calc, 1);
    }
  });

  it("totalBesoins.y1 ≥ 0 (les besoins sont des actifs positifs)", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    expect(bfr.totalBesoins.y1).toBeGreaterThanOrEqual(0);
  });

  it("achatsRows contient 1 ligne correspondant à l'activité", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    expect(bfr.achatsRows).toHaveLength(1);
    expect(bfr.achatsRows[0].libelle).toBe("Vente pain et viennoiserie");
  });

  it("PRESTATION_SERVICES → achatsRows est vide", () => {
    const bfr = calcBfr(SCENARIO_SERVICE_PUR, FC_SERVICE_PUR);
    expect(bfr.achatsRows).toHaveLength(0);
  });
});

// ── dettes fournisseurs TTC M12 — règle de cohérence bilan/tableau ────────────
//
// Règle : la dette fournisseur de clôture = M12 de la série TTC (achatHT + ΔStock/12)
// × coefTTC × délai. Cette règle garantit que TresoBilan = TresoTableau (check #8).

describe("calcBfr — dettesFournisseurs TTC M12 (14 mars 2026)", () => {
  /**
   * Scénario de référence : boulangerie, délai fourn = 30j, TVA achats 5.5%.
   * Activité : 180 000 €/an CA, marge 60%, stocks 30j → achats = 72 000/an HT.
   * Mensuel HT uniforme = 72 000 / 12 = 6 000, M12 = 6 000.
   * ΔStock Y1 = 72 000 × 30/360 = 6 000, mensuel = 500.
   * achatsTTC M12 = (6 000 + 500) × 1.055 = 6 857,50.
   * dettes fourn Y1 = 6 857,50 × (30/30) = 6 857,50.
   */
  it("dettesFournisseurs TTC : inclut TVA et ΔStock mensuel", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    // coef = 1 - 60/100 = 0.40 ; mensuelHT = 180000*0.40/12 = 6000
    // sfY1 = 180000*0.40*30/360 = 6000 ; varY1M = 6000/12 = 500
    // achatsTTCM12 = (6000 + 500) * 1.055 = 6857.5
    // dettes = 6857.5 × (30/30) = 6857.5
    expect(bfr.dettesFournisseurs.y1).toBeCloseTo(6857.5, 0);
  });

  it("dettesFournisseurs > version HT (inclut la TVA + ΔStock en transit)", () => {
    // Vérifie que la valeur TTC > valeur HT pure (achatsHT_M12 × délai)
    // Valeur HT seule = 6000 × 1 = 6000, valeur TTC = 6857.5 > 6000 ✓
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    const htOnly = (180000 * 0.40 / 12) * (30 / 30); // 6 000
    expect(bfr.dettesFournisseurs.y1).toBeGreaterThan(htOnly);
  });

  it("PRESTATION_SERVICES → dettesFournisseurs = 0", () => {
    const bfr = calcBfr(SCENARIO_SERVICE_PUR, FC_SERVICE_PUR);
    expect(bfr.dettesFournisseurs.y1).toBe(0);
    expect(bfr.dettesFournisseurs.y2).toBe(0);
    expect(bfr.dettesFournisseurs.y3).toBe(0);
  });

  it("achatsRows.m11FournY1 ≈ dettesFournisseurs.y1 (drill-down cohérent)", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    const sumDrillDown = bfr.achatsRows.reduce((s, r) => s + r.m11FournY1, 0);
    expect(sumDrillDown).toBeCloseTo(bfr.dettesFournisseurs.y1, 1);
  });
});

// ── dettes charges ext TTC M12 ───────────────────────────────────────────────

describe("calcBfr — dettesChargesExternes TTC M12 (14 mars 2026)", () => {
  it("dettesChargesExternes TTC : inclut la TVA récupérable en transit", () => {
    // Charge : loyer 15 000/an, TVA 20%, délai 30j.
    // Mensuel HT = 1 250, M12 = 1 250. TTC = 1 250 × 1.20 × (30/30) = 1 500.
    const scenario = {
      ...SCENARIO_CREATION,
      fournitures: [],
      services: [
        {
          id: "svc-1",
          libelle: "Loyer",
          actif: true,
          montantN: 15000,
          montantN1: 15000,
          montantN2: 15000,
          tauxTVA: 20,
          frequence: "MENSUELLE",
          delaiReglement: 30,
          detailCalc: null,
          categorie: "SERVICE_EXTERIEUR",
        },
      ],
    } as unknown as typeof SCENARIO_CREATION;
    const fc = buildFinCalc(scenario, DATE_DEMARRAGE);
    const bfr = calcBfr(scenario, fc);
    // M12 = 15000/12 = 1250, TTC = 1250 × 1.20 = 1500, délai = 1 mois → 1500
    expect(bfr.dettesChargesExternes.y1).toBeCloseTo(1500, 0);
  });

  it("dettesChargesExternes > version HT (inclut TVA en transit)", () => {
    const scenario = {
      ...SCENARIO_CREATION,
      fournitures: [],
      services: [
        {
          id: "svc-1",
          libelle: "Loyer",
          actif: true,
          montantN: 15000,
          montantN1: 15000,
          montantN2: 15000,
          tauxTVA: 20,
          frequence: "MENSUELLE",
          delaiReglement: 30,
          detailCalc: null,
          categorie: "SERVICE_EXTERIEUR",
        },
      ],
    } as unknown as typeof SCENARIO_CREATION;
    const fc = buildFinCalc(scenario, DATE_DEMARRAGE);
    const bfr = calcBfr(scenario, fc);
    const htOnly = (15000 / 12) * (30 / 30); // 1 250
    expect(bfr.dettesChargesExternes.y1).toBeGreaterThan(htOnly);
  });

  it("chargesExtRows.m11ChargeY1 ≈ dettesChargesExternes.y1 (drill-down cohérent)", () => {
    const scenario = {
      ...SCENARIO_CREATION,
      fournitures: [],
      services: [
        {
          id: "svc-1",
          libelle: "Loyer",
          actif: true,
          montantN: 15000,
          montantN1: 15000,
          montantN2: 15000,
          tauxTVA: 20,
          frequence: "MENSUELLE",
          delaiReglement: 30,
          detailCalc: null,
          categorie: "SERVICE_EXTERIEUR",
        },
      ],
    } as unknown as typeof SCENARIO_CREATION;
    const fc = buildFinCalc(scenario, DATE_DEMARRAGE);
    const bfr = calcBfr(scenario, fc);
    const sumDrillDown = bfr.chargesExtRows.reduce((s, r) => s + r.m11ChargeY1, 0);
    expect(sumDrillDown).toBeCloseTo(bfr.dettesChargesExternes.y1, 1);
  });
});

// ── Franchise TVA : coefTTC = 1 ──────────────────────────────────────────────

describe("calcBfr — franchise TVA (isFranchise)", () => {
  const SCENARIO_FRANCHISE = {
    ...SCENARIO_CREATION,
    scenario: {
      id: "test-scenario",
      parametres: { ...SCENARIO_CREATION.scenario.parametres, regimeTVA: "FRANCHISE" },
    },
  } as unknown as typeof SCENARIO_CREATION;
  const FC_FRANCHISE = buildFinCalc(SCENARIO_FRANCHISE, DATE_DEMARRAGE);

  it("franchise → dettes fournisseurs = HT uniquement (pas de TVA ajoutée)", () => {
    const bfr = calcBfr(SCENARIO_FRANCHISE, FC_FRANCHISE);
    const bfrNormal = calcBfr(SCENARIO_CREATION, FC_CREATION);
    // Pour franchise, pas de TVA récupérable → dettes HT seulement
    expect(bfr.dettesFournisseurs.y1).toBeLessThan(bfrNormal.dettesFournisseurs.y1);
  });
});

// ── Traitement du stock ponctuel du mois de démarrage — régression 14 mars 2026 ───
//
// Règle : ponctuelN[0] (mois de démarrage) → BFR initial (stocksMatieres.y0).
// Les autres ponctuels (N[1..11], N1, N2) → flux cash normaux dans decaissements.ts.
// Pas de double-comptage : chaque achat ponctuel est traité soit comme BFR initial,
// soit comme flux de trésorerie, mais jamais les deux.

describe("calcBfr — ponctuelN[0] = BFR initial, ponctuelN[1..11] = flux normaux", () => {
  const SCENARIO_PONCTUEL = {
    ...SCENARIO_CREATION,
    activites: [
      {
        ...SCENARIO_CREATION.activites[0],
        achatsStockPonctuel: { N: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], N1: [], N2: [] },
      },
    ],
  } as unknown as typeof SCENARIO_CREATION;
  const FC_PONCTUEL = buildFinCalc(SCENARIO_PONCTUEL, DATE_DEMARRAGE);

  it("stocksMatieres.y0 = 1000 avec un achat ponctuel M1 de 1 000 € (BFR initial)", () => {
    const bfr = calcBfr(SCENARIO_PONCTUEL, FC_PONCTUEL);
    // ponctuelN[0] = 1000 € → stock initial ouverture (BFR initial)
    expect(bfr.stocksMatieres.y0).toBeCloseTo(1000, 2);
  });

  it("stocksMatieres.y0 = 0 sans ponctuel", () => {
    const bfr = calcBfr(SCENARIO_CREATION, FC_CREATION);
    expect(bfr.stocksMatieres.y0).toBe(0);
  });

  it("bfr.y0 inclut le ponctuel N[0] HT + TVA comme besoin initial", () => {
    const bfrSans = calcBfr(SCENARIO_CREATION, FC_CREATION);
    const bfrAvec = calcBfr(SCENARIO_PONCTUEL, FC_PONCTUEL);
    // bfr.y0 = totalBesoins.y0 − totalRessources.y0
    // Avec ponctuel :
    //   stocksMatieres.y0 += 1000 HT
    //   creditTVA.y0     += 55   (TVA = 1000 × 5.5 %)
    //   totalBesoins.y0  += 1055
    expect(bfrAvec.bfr.y0).toBeCloseTo(bfrSans.bfr.y0 + 1055, 2);
  });

  it("totalBesoins.y0 inclut le ponctuel (stocksMatieres.y0 = 1000 + creditTVA.y0)", () => {
    const bfr = calcBfr(SCENARIO_PONCTUEL, FC_PONCTUEL);
    // totalBesoins.y0 = stocksMatieres.y0 + creditTVA.y0 = 1000 + creditInitial
    expect(bfr.totalBesoins.y0).toBeCloseTo(bfr.stocksMatieres.y0 + bfr.creditTVA.y0, 2);
  });
});
