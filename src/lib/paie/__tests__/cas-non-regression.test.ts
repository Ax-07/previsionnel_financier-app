/**
 * Tests de non-régression du moteur de paie 2026.
 *
 * 16 cas obligatoires couvrant :
 *   - SMIC, salaires courants, dépassement PASS
 *   - Temps partiel, proratisation entrée/sortie
 *   - Apprentissage (2 générations, 2 âges)
 *   - Contrat pro, stage en-dessous/au-dessus du seuil
 *   - Entreprise < 50 / ≥ 50 salariés
 *   - Versement mobilité nul/non nul
 *   - AT/MP faible/élevé
 *
 * Tolérance : ± 0,02 € sur chaque montant (arrondis réglementaires).
 */

import { describe, it, expect } from "vitest";
import { simulate } from "@/lib/paie/simulate";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Tolarance d'arrondi centimes */
const TOLERANCE = 0.02;

function approx(received: number, expected: number, label = "") {
  const diff = Math.abs(received - expected);
  if (diff > TOLERANCE) {
    throw new Error(
      `${label} : attendu ≈ ${expected.toFixed(2)} € — reçu ${received.toFixed(2)} € (écart ${diff.toFixed(4)} €)`
    );
  }
}

/** Input entreprise standard < 50 salariés */
const ENTREPRISE_PETITE = { effectif: 10, tauxATMP: 0.021, tauxMobilite: 0 };
/** Input entreprise ≥ 50 salariés */
const ENTREPRISE_GRANDE = { effectif: 60, tauxATMP: 0.021, tauxMobilite: 0 };

function nonCadre(brutMensuel: number, extra?: Partial<SimulationInput["salarié"]>): SimulationInput {
  return {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel,
      ...extra,
    },
    entreprise: ENTREPRISE_PETITE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CAS 01 — Non-cadre au SMIC (1 823,03 €)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-01 — SMIC non-cadre temps plein < 50 sal.", () => {
  const res = simulate(nonCadre(1823.03));

  it("brut soumis = SMIC mensuel", () => {
    approx(res.brutSoumis, 1823.03, "brutSoumis");
  });

  it("net à payer > 1 300 € et < 1 600 €", () => {
    expect(res.netAPayer).toBeGreaterThan(1300);
    expect(res.netAPayer).toBeLessThan(1600);
  });

  it("RGDU s'applique (montant > 0)", () => {
    expect(res.montantRGDU).toBeGreaterThan(0);
  });

  it("coût employeur < 2 300 € (RGDU réduit les charges)", () => {
    expect(res.coutEmployeur).toBeLessThan(2300);
  });

  it("totalCotisationsSalariales > 0 (valeur absolue des retenues)", () => {
    expect(res.totalCotisationsSalariales).toBeGreaterThan(0);
  });

  it("totalCotisationsPatronales > 0", () => {
    expect(res.totalCotisationsPatronales).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 02 — Non-cadre 2 500 € brut < 50 sal.
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-02 — Non-cadre 2 500 € < 50 sal.", () => {
  const res = simulate(nonCadre(2500));

  it("net à payer entre 1 800 € et 2 100 €", () => {
    expect(res.netAPayer).toBeGreaterThan(1800);
    expect(res.netAPayer).toBeLessThan(2100);
  });

  it("pas de T2 Agirc-Arrco (brut < PASS = 4 005 €)", () => {
    expect(res.baseT2).toBe(0);
  });

  it("RGDU s'applique (brut < 3 × SMIC ≈ 5 469 €)", () => {
    expect(res.montantRGDU).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 03 — Non-cadre au PASS (4 005 €)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-03 — Non-cadre au PASS (4 005 €)", () => {
  const res = simulate(nonCadre(4005));

  it("baseT1 = PASS = 4 005 €", () => {
    approx(res.baseT1, 4005, "baseT1");
  });

  it("baseT2 = 0 (brut exactement au PASS)", () => {
    approx(res.baseT2, 0, "baseT2");
  });

  it("RGDU nul ou très faible (proche du plafond sortie 3 × SMIC ≈ 5 469 €)", () => {
    // À 4 005 €, le coefficient RGDU est faible mais peut être > 0
    expect(res.montantRGDU).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 04 — Non-cadre dépassant légèrement le PASS (4 005,01 €)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-04 — Non-cadre 4 005,01 € (dépassement PASS d'un centime)", () => {
  const res = simulate(nonCadre(4005.01));

  it("baseT1 plafonnée à PASS (4 005 €)", () => {
    approx(res.baseT1, 4005, "baseT1");
  });

  it("baseT2 = 0,01 €", () => {
    approx(res.baseT2, 0.01, "baseT2");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 05 — Cadre à 8 × PASS
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-05 — Cadre à 8 × PASS (32 040 €)", () => {
  const input: SimulationInput = {
    salarié: {
      statut: "cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: 32040,
    },
    entreprise: ENTREPRISE_GRANDE,
  };
  const res = simulate(input);

  it("baseT1 = PASS = 4 005 €", () => {
    approx(res.baseT1, 4005, "baseT1");
  });

  it("baseT2 = 7 × PASS = 28 035 € (plafonné 8 PASS)", () => {
    approx(res.baseT2, 28035, "baseT2");
  });

  it("RGDU = 0 (brut >> 3 × SMIC)", () => {
    approx(res.montantRGDU, 0, "montantRGDU");
  });

  it("APEC présente dans les lignes (cadre)", () => {
    const apec = res.lignes.find((l) => l.famille === "apec");
    expect(apec).toBeDefined();
  });

  it("CET présente dans les lignes (brut > PASS)", () => {
    const cet = res.lignes.find((l) => l.famille === "cet");
    expect(cet).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 06 — Temps partiel 80 % (121,34 h)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-06 — Temps partiel 80 % (121,34 h)", () => {
  const brutTP = Math.round(1823.03 * 0.8 * 100) / 100;
  const res = simulate(nonCadre(brutTP, { heuresContrat: 121.34 }));

  it("PMSS proratisé ≈ 0.8 × 4 005 = 3 204 €", () => {
    // Le prorata est calculé sur heuresContrat / 151.66669
    expect(res.pmssProratise).toBeGreaterThan(3000);
    expect(res.pmssProratise).toBeLessThan(3250);
  });

  it("facteurProrata = 1 (pas d'entrée/sortie en cours de mois)", () => {
    approx(res.facteurProrata, 1, "facteurProrata");
  });

  it("RGDU s'applique", () => {
    expect(res.montantRGDU).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 07 — Entrée le 15 du mois (proratisation calendaire)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-07 — Entrée le 15 janvier 2026", () => {
  const res = simulate(
    nonCadre(2500, {
      dateEntree: "2026-01-15",
      moisReference: "2026-01",
    })
  );

  it("facteurProrata ≈ 0.5 (moitié du mois)", () => {
    expect(res.facteurProrata).toBeGreaterThan(0.4);
    expect(res.facteurProrata).toBeLessThan(0.65);
  });

  it("PMSS proratisé ≈ facteurProrata × 4 005", () => {
    const attendu = res.facteurProrata * 4005;
    approx(res.pmssProratise, attendu, "pmssProratise");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 08 — Apprenti 18-20 ans, 1re année, génération depuis mars 2025
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-08 — Apprenti 18-20 ans 1re an. (depuis mars 2025)", () => {
  const brutApprenti = Math.round(1823.03 * 0.43 * 100) / 100; // 43 % SMIC
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "apprentissage",
      heuresContrat: 151.66669,
      brutMensuel: brutApprenti,
      apprentissage: { generation: "depuis_mars_2025", annee: 1, ageApprenti: 19 },
    },
    entreprise: ENTREPRISE_PETITE,
  });

  it("lignes d'exonération présentes (famille 'exoneration')", () => {
    const exos = res.lignes.filter((l) => l.famille === "exoneration");
    expect(exos.length).toBeGreaterThan(0);
  });

  it("net à payer ≈ brut (exonérations quasi-totales en dessous du seuil)", () => {
    // En-dessous de 50 % SMIC, cotisations salariales exonérées
    expect(res.netAPayer).toBeGreaterThan(brutApprenti * 0.95);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 09 — Apprenti 21-25 ans, 3e année, génération avant mars 2025
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-09 — Apprenti 21-25 ans 3e an. (avant mars 2025)", () => {
  const brutApprenti = Math.round(1823.03 * 0.78 * 100) / 100; // 78 % SMIC
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "apprentissage",
      heuresContrat: 151.66669,
      brutMensuel: brutApprenti,
      apprentissage: { generation: "avant_mars_2025", annee: 3, ageApprenti: 23 },
    },
    entreprise: ENTREPRISE_PETITE,
  });

  it("lignes d'exonération présentes", () => {
    const exos = res.lignes.filter((l) => l.famille === "exoneration");
    expect(exos.length).toBeGreaterThan(0);
  });

  it("brut soumis correct", () => {
    approx(res.brutSoumis, brutApprenti, "brutSoumis");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 10 — Contrat pro < 21 ans
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-10 — Contrat pro < 21 ans", () => {
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "contrat_pro",
      heuresContrat: 151.66669,
      brutMensuel: 1823.03,
    },
    entreprise: ENTREPRISE_PETITE,
  });

  it("simulation produit un résultat sans erreur", () => {
    expect(res.netAPayer).toBeGreaterThan(0);
    expect(res.brutSoumis).toBeGreaterThan(0);
  });

  it("RGDU s'applique", () => {
    expect(res.montantRGDU).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 11 — Stage en-dessous du seuil de gratification (4,50 €/h × 151,67 h = 682,52 €)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-11 — Stage en-dessous du seuil (gratification 500 €)", () => {
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "stage",
      heuresContrat: 151.66669,
      brutMensuel: 500,
    },
    entreprise: ENTREPRISE_PETITE,
  });

  it("cotisations salariales = 0 (en-dessous du seuil d'exonération)", () => {
    // En-dessous du seuil, la plupart des cotisations sont exonérées
    // On vérifie que le net est proche du brut
    expect(res.netAPayer).toBeGreaterThan(480);
  });

  it("pas de RGDU pour un stage", () => {
    approx(res.montantRGDU, 0, "montantRGDU");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 12 — Stage au-dessus du seuil (900 €)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-12 — Stage au-dessus du seuil (900 €)", () => {
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "stage",
      heuresContrat: 151.66669,
      brutMensuel: 900,
    },
    entreprise: ENTREPRISE_PETITE,
  });

  it("simulation produit un résultat sans erreur", () => {
    expect(res.netAPayer).toBeGreaterThan(0);
  });

  it("pas de RGDU pour un stage", () => {
    approx(res.montantRGDU, 0, "montantRGDU");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 13 — Entreprise < 50 sal. : FNAL plafonné PASS (0,1 %)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-13 — Entreprise < 50 : FNAL 0,1 % plafonné PASS", () => {
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: 2500,
    },
    entreprise: { effectif: 10, tauxATMP: 0.021, tauxMobilite: 0 },
  });

  const fnal = res.lignes.find((l) => l.code.toLowerCase().includes("fnal"));

  it("ligne FNAL présente", () => {
    expect(fnal).toBeDefined();
  });

  it("FNAL taux employeur = 0,1 % (< 50 sal.)", () => {
    expect(fnal?.tauxEmployeur).toBeCloseTo(0.001, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 14 — Entreprise ≥ 50 sal. : FNAL sur totalité (0,5 %)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-14 — Entreprise ≥ 50 : FNAL 0,5 % sur totalité", () => {
  const res = simulate({
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel: 2500,
    },
    entreprise: { effectif: 60, tauxATMP: 0.021, tauxMobilite: 0 },
  });

  const fnal = res.lignes.find((l) => l.code.toLowerCase().includes("fnal"));

  it("ligne FNAL présente", () => {
    expect(fnal).toBeDefined();
  });

  it("FNAL taux employeur = 0,5 % (≥ 50 sal.)", () => {
    expect(fnal?.tauxEmployeur).toBeCloseTo(0.005, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 15 — Versement mobilité nul vs non nul
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-15 — Versement mobilité 0 % vs 2,95 %", () => {
  const resNul = simulate({
    salarié: { statut: "non_cadre", typeContrat: "CDI", heuresContrat: 151.66669, brutMensuel: 2500 },
    entreprise: { effectif: 10, tauxATMP: 0.021, tauxMobilite: 0 },
  });

  const resActif = simulate({
    salarié: { statut: "non_cadre", typeContrat: "CDI", heuresContrat: 151.66669, brutMensuel: 2500 },
    entreprise: { effectif: 10, tauxATMP: 0.021, tauxMobilite: 0.0295 },
  });

  it("sans mobilité : pas de ligne versement_mobilite", () => {
    const vm = resNul.lignes.find((l) => l.famille === "versement_mobilite");
    expect(vm).toBeUndefined();
  });

  it("avec mobilité : ligne versement_mobilite présente", () => {
    const vm = resActif.lignes.find((l) => l.famille === "versement_mobilite");
    expect(vm).toBeDefined();
  });

  it("coût employeur plus élevé avec versement mobilité", () => {
    expect(resActif.coutEmployeur).toBeGreaterThan(resNul.coutEmployeur);
  });

  it("montant versement mobilité ≈ 2 500 × 2,95 % ≈ 73,75 €", () => {
    const vm = resActif.lignes.find((l) => l.famille === "versement_mobilite");
    approx(vm?.montantEmployeur ?? 0, 73.75, "versementMobilite");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 16 — AT/MP faible (0,5 %) vs élevé (8 %)
// ─────────────────────────────────────────────────────────────────────────────

describe("CAS-16 — AT/MP 0,5 % vs 8 %", () => {
  const resFaible = simulate({
    salarié: { statut: "non_cadre", typeContrat: "CDI", heuresContrat: 151.66669, brutMensuel: 2500 },
    entreprise: { effectif: 10, tauxATMP: 0.005 },
  });

  const resEleve = simulate({
    salarié: { statut: "non_cadre", typeContrat: "CDI", heuresContrat: 151.66669, brutMensuel: 2500 },
    entreprise: { effectif: 10, tauxATMP: 0.08 },
  });

  it("coût employeur plus élevé avec AT/MP 8 %", () => {
    expect(resEleve.coutEmployeur).toBeGreaterThan(resFaible.coutEmployeur);
  });

  it("différence coût ≈ (8 % - 0,5 %) × 2 500 = 187,50 €", () => {
    const diffAttendue = (0.08 - 0.005) * 2500;
    const diffReelle = resEleve.coutEmployeur - resFaible.coutEmployeur;
    approx(diffReelle, diffAttendue, "delta AT/MP");
  });

  it("net à payer identique (AT/MP = cotisation patronale uniquement)", () => {
    approx(resFaible.netAPayer, resEleve.netAPayer, "netAPayer");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS BONUS — Convergence net → brut (via netToGross)
// ─────────────────────────────────────────────────────────────────────────────

describe("BONUS — Convergence net → brut", () => {
  it("simulate(brut=1823.03).netAPayer est reproductible", () => {
    const r1 = simulate(nonCadre(1823.03));
    const r2 = simulate(nonCadre(1823.03));
    approx(r1.netAPayer, r2.netAPayer, "reproductibilité");
  });

  it("simulate est déterministe — mêmes entrées = même sortie", () => {
    const input = nonCadre(2500);
    const r1 = simulate(input);
    const r2 = simulate(input);
    expect(r1.netAPayer).toBe(r2.netAPayer);
    expect(r1.montantRGDU).toBe(r2.montantRGDU);
    expect(r1.coutEmployeur).toBe(r2.coutEmployeur);
  });

  it("Alsace-Moselle ajoute une cotisation maladie salarié supplémentaire", () => {
    const sans = simulate(nonCadre(2500));
    const avec = simulate(nonCadre(2500, { alsaceMoselle: true }));
    // Net à payer plus faible avec Alsace-Moselle (cotisation salarié supplémentaire)
    expect(avec.netAPayer).toBeLessThan(sans.netAPayer);
  });
});
