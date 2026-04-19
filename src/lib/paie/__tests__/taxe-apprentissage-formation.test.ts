/**
 * Tests — Taxe d'apprentissage & Contribution à la formation professionnelle.
 *
 * Vérifie :
 *   - Présence des lignes dans le bulletin (employeur uniquement)
 *   - Taux correct selon l'effectif (CFP : 0,55 % < 11 / 1,00 % ≥ 11)
 *   - Taxe d'apprentissage à 0,68 % quel que soit l'effectif
 *   - Montants calculés sur le brut soumis
 *   - Exclusion pour les stagiaires
 *   - Inclusion pour les apprentis (cotisations patronales)
 */

import { describe, it, expect } from "vitest";
import { simulate } from "@/lib/paie/simulate";
import type { SimulationInput } from "@/lib/paie/types";

const TOLERANCE = 0.02;

function approx(received: number, expected: number, label = "") {
  const diff = Math.abs(received - expected);
  if (diff > TOLERANCE) {
    throw new Error(
      `${label} : attendu ≈ ${expected.toFixed(2)} € — reçu ${received.toFixed(2)} € (écart ${diff.toFixed(4)} €)`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inputs de base
// ─────────────────────────────────────────────────────────────────────────────

const BASE_SALARIE = {
  statut: "non_cadre" as const,
  typeContrat: "CDI" as const,
  heuresContrat: 151.66669,
  brutMensuel: 2500,
};

const ENTREPRISE_INF11: SimulationInput["entreprise"] = {
  effectif: 8,
  tauxATMP: 0.021,
  tauxMobilite: 0,
};

const ENTREPRISE_SUP11: SimulationInput["entreprise"] = {
  effectif: 25,
  tauxATMP: 0.021,
  tauxMobilite: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests — Taxe d'apprentissage
// ─────────────────────────────────────────────────────────────────────────────

describe("Taxe d'apprentissage", () => {
  it("présente dans le bulletin — taux 0,68 % employeur, 0 % salarié", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_INF11 });
    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");

    expect(ta).toBeDefined();
    expect(ta!.famille).toBe("taxe_apprentissage");
    expect(ta!.tauxEmployeur).toBe(0.0068);
    expect(ta!.tauxSalarie).toBe(0);
    approx(ta!.montantEmployeur, 2500 * 0.0068, "montantEmployeur TA");
    expect(ta!.montantSalarie).toBe(0);
  });

  it("même taux pour entreprise ≥ 11 salariés", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_SUP11 });
    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");

    expect(ta).toBeDefined();
    expect(ta!.tauxEmployeur).toBe(0.0068);
    approx(ta!.montantEmployeur, 2500 * 0.0068, "montantEmployeur TA ≥ 11");
  });

  it("impacte le coût employeur", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_INF11 });
    expect(res.coutEmployeur).toBeGreaterThan(2500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — Contribution à la formation professionnelle
// ─────────────────────────────────────────────────────────────────────────────

describe("Contribution à la formation professionnelle", () => {
  it("< 11 salariés : taux 0,55 %", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_INF11 });
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(cfp).toBeDefined();
    expect(cfp!.famille).toBe("formation_professionnelle");
    expect(cfp!.tauxEmployeur).toBe(0.0055);
    expect(cfp!.tauxSalarie).toBe(0);
    approx(cfp!.montantEmployeur, 2500 * 0.0055, "montantEmployeur CFP < 11");
    expect(cfp!.montantSalarie).toBe(0);
  });

  it("≥ 11 salariés : taux 1,00 %", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_SUP11 });
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(cfp).toBeDefined();
    expect(cfp!.tauxEmployeur).toBe(0.01);
    approx(cfp!.montantEmployeur, 2500 * 0.01, "montantEmployeur CFP ≥ 11");
  });

  it("libellé adapté à l'effectif", () => {
    const resInf = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_INF11 });
    const resSup = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_SUP11 });

    const cfpInf = resInf.lignes.find((l) => l.code === "FORMATION_PRO_PAT");
    const cfpSup = resSup.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(cfpInf!.libelle).toContain("< 11");
    expect(cfpSup!.libelle).toContain("≥ 11");
  });

  it("n'impacte pas les cotisations salariales", () => {
    const res = simulate({ salarié: BASE_SALARIE, entreprise: ENTREPRISE_INF11 });
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");
    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");

    expect(cfp!.montantSalarie).toBe(0);
    expect(ta!.montantSalarie).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — Exclusion stagiaires
// ─────────────────────────────────────────────────────────────────────────────

describe("Stagiaires — exclusion taxe apprentissage & formation pro", () => {
  it("aucune ligne TA ni CFP pour un stagiaire sous le seuil", () => {
    const res = simulate({
      salarié: {
        statut: "non_cadre",
        typeContrat: "stage",
        heuresContrat: 151.66669,
        brutMensuel: 600,
      },
      entreprise: ENTREPRISE_INF11,
    });

    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(ta).toBeUndefined();
    expect(cfp).toBeUndefined();
  });

  it("aucune ligne TA ni CFP pour un stagiaire au-dessus du seuil", () => {
    const res = simulate({
      salarié: {
        statut: "non_cadre",
        typeContrat: "stage",
        heuresContrat: 151.66669,
        brutMensuel: 1000,
      },
      entreprise: ENTREPRISE_INF11,
    });

    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(ta).toBeUndefined();
    expect(cfp).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — Inclusion apprentis (cotisations patronales)
// ─────────────────────────────────────────────────────────────────────────────

describe("Apprentis — inclusion taxe apprentissage & formation pro", () => {
  it("TA et CFP présentes pour un apprenti", () => {
    const res = simulate({
      salarié: {
        statut: "non_cadre",
        typeContrat: "apprentissage",
        heuresContrat: 151.66669,
        brutMensuel: 1200,
        apprentissage: {
          generation: "depuis_mars_2025",
          annee: 1,
          ageApprenti: 20,
        },
      },
      entreprise: ENTREPRISE_INF11,
    });

    const ta = res.lignes.find((l) => l.code === "TAXE_APPRENTISSAGE_PAT");
    const cfp = res.lignes.find((l) => l.code === "FORMATION_PRO_PAT");

    expect(ta).toBeDefined();
    expect(cfp).toBeDefined();
    expect(ta!.montantEmployeur).toBeGreaterThan(0);
    expect(cfp!.montantEmployeur).toBeGreaterThan(0);
  });
});
