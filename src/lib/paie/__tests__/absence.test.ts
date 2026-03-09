/**
 * Tests unitaires — Lot 5 : IJSS subrogées, maintien légal/conventionnel,
 * complément employeur, régularisations.
 *
 * 8 cas de test couvrant les scénarios fonctionnels définis dans la roadmap.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { LeaveAndBenefitsEngine } from "@/lib/paie/absence/leave-benefits-engine";
import { calcIjss } from "@/lib/paie/absence/ijss-subrogation-engine";
import { calculerMaintenLegal } from "@/lib/paie/absence/legal-maintenance";
import {
  registerConventionMaintenance,
  listConventionsWithMaintenance,
} from "@/lib/paie/absence/conventional-maintenance";
import {
  calculerRegularisation,
  calculerTropVerse,
} from "@/lib/paie/absence/absence-regularization-engine";
import { PARAMS_2026 } from "@/lib/paie/params/2026";
import type { AbsenceEvent } from "@/lib/paie/absence/types";

const PASS_ANNUEL = PARAMS_2026.passAnnuel; // 48 060 €
const BRUT_MENSUEL = 2500; // salarié de référence

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A01 — Maladie ordinaire subrogée (10 jours, ancienneté > 3 ans)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A01 — Maladie ordinaire subrogée 10 jours", () => {
  const absence: AbsenceEvent = {
    type: "maladie_ordinaire",
    joursCivils: 10,
    ancienneteEnMois: 48, // 4 ans
    subrogation: true,
  };

  it("retourne les jours de carence SS (3 jours)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.joursCarenceSS).toBe(3);
  });

  it("retourne les jours indemnisés SS (7 jours = 10 - 3)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.joursAvecIjss).toBe(7);
  });

  it("IJ brute journalière ≈ 50 % du SJR plafonné", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    const sjrEstime = BRUT_MENSUEL / 30.42;
    // Le plafond légal s'applique si SJR > PASS/730
    const plafondSjr = PASS_ANNUEL / 730;
    const sjrPlafonne = Math.min(sjrEstime, plafondSjr);
    expect(resultIjss.ijBruteJournaliere).toBeCloseTo(sjrPlafonne * 0.5, 2);
  });

  it("IJ nette < IJ brute (CSG/CRDS déduits)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.ijssNetteTotal).toBeLessThan(result.ijssBruteTotal);
  });

  it("droit au maintien légal (ancienneté ≥ 12 mois)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.droitAuMaintienLegal).toBe(true);
  });

  it("brut soumis après absence > 0", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.brutSoumisApresAbsence).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A02 — AT/MP (0 jour de carence SS, ancienneté > 1 an)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A02 — AT/MP sans carence SS", () => {
  const absence: AbsenceEvent = {
    type: "at_mp",
    joursCivils: 20,
    ancienneteEnMois: 18,
    subrogation: false,
  };

  it("carence SS = 0 pour AT/MP", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    expect(resultIjss.joursCarenceSS).toBe(0);
  });

  it("tous les 20 jours sont indemnisés SS", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    expect(resultIjss.joursIndemnises).toBe(20);
  });

  it("taux IJ phase 1 AT/MP = 60 % du SJR plafonné", () => {
    // 20 jours sont tous en phase 1 (≤ 28 jours)
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    const sjr = BRUT_MENSUEL / 30.42;
    const plafondSjr = PASS_ANNUEL / 730;
    const sjrPlafonne = Math.min(sjr, plafondSjr);
    expect(resultIjss.ijBruteJournaliere).toBeCloseTo(sjrPlafonne * 0.60, 2);
  });

  it("taux effectif AT/MP en phase 2 (29+ jours) ≈ 80 %", () => {
    const irLong: AbsenceEvent = { ...absence, joursCivils: 40 };
    const resultIjss = calcIjss(irLong, BRUT_MENSUEL, PASS_ANNUEL);
    expect(resultIjss.tauxEffectif).toBeGreaterThan(0.60);
    expect(resultIjss.tauxEffectif).toBeLessThanOrEqual(0.80);
  });

  it("droit au maintien légal AT/MP (0 carence employeur)", () => {
    const result = calculerMaintenLegal(absence, BRUT_MENSUEL);
    expect(result.droitAuMaintien).toBe(true);
    // Carence employeur AT/MP = 0 → tous jours après carence SS maintenus
    expect(result.joursMaintenusPlein).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A03 — Maternité 16 semaines (100 % IJ, pas de carence)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A03 — Maternité 112 jours", () => {
  const absence: AbsenceEvent = {
    type: "maternite",
    joursCivils: 112, // 16 semaines légales
    ancienneteEnMois: 24,
    subrogation: true,
  };

  it("carence SS = 0 pour maternité", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    expect(resultIjss.joursCarenceSS).toBe(0);
  });

  it("taux IJ maternité = 100 % du SJR plafonné", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    // IJ journalière = min(SJR, plafond) × 100 %
    const sjr = BRUT_MENSUEL / 30.42;
    const plafond = PASS_ANNUEL / 360;
    const sjrPlafonne = Math.min(sjr, plafond);
    expect(resultIjss.ijBruteJournaliere).toBeCloseTo(sjrPlafonne, 2);
  });

  it("total IJ brute sur 112 jours est positif et cohérent", () => {
    const resultIjss = calcIjss(absence, BRUT_MENSUEL, PASS_ANNUEL);
    expect(resultIjss.ijBruteTotal).toBeGreaterThan(0);
    expect(resultIjss.ijBruteTotal).toBe(resultIjss.ijBruteJournaliere * 112);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A04 — Absence non subrogée (brut réduit, IJ attendues séparément)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A04 — Absence non subrogée", () => {
  const absence: AbsenceEvent = {
    type: "maladie_ordinaire",
    joursCivils: 5,
    ancienneteEnMois: 3, // moins d'1 an → pas de maintien légal
    subrogation: false,
  };

  it("pas de droit au maintien légal (ancienneté < 12 mois)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.droitAuMaintienLegal).toBe(false);
  });

  it("maintien brut légal = 0 (ancienneté insuffisante)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.maintienBrutLegal).toBe(0);
  });

  it("déduction brut < 0 (retenue pour absence)", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    expect(result.deductionBrutAbsence).toBeLessThan(0);
  });

  it("IJ SS toujours estimées même en mode non subrogé", () => {
    const result = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });
    // 5 jours - 3 jours carence = 2 jours indemnisés
    expect(result.joursAvecIjss).toBe(2);
    expect(result.ijssNetteTotal).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A05 — Maintien légal avec ancienneté ≥ 1 an (10 jours maladie)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A05 — Maintien légal L1226-1", () => {
  const absence: AbsenceEvent = {
    type: "maladie_ordinaire",
    joursCivils: 10,
    ancienneteEnMois: 24, // 2 ans
    subrogation: true,
  };

  it("maintien légal : jours maintenus à taux plein > 0 (après carence 7 j employeur)", () => {
    const result = calculerMaintenLegal(absence, BRUT_MENSUEL);
    // 10 jours - 7 jours carence employeur = 3 jours à 90 %
    expect(result.joursMaintenusPlein).toBe(3);
    expect(result.joursMaintenusPartiel).toBe(0);
  });

  it("maintien brut taux plein = brut journalier × jours × 90 %", () => {
    const result = calculerMaintenLegal(absence, BRUT_MENSUEL);
    const brutJournalier = BRUT_MENSUEL / 30.42;
    expect(result.maintienBrutTauxPlein).toBeCloseTo(brutJournalier * 3 * 0.9, 2);
  });

  it("maintien brut total > 0", () => {
    const result = calculerMaintenLegal(absence, BRUT_MENSUEL);
    expect(result.maintienBrutTotal).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A06 — Maintien conventionnel meilleur que légal (0 j carence employeur)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A06 — Maintien conventionnel (suppression carence employeur)", () => {
  const IDCC_TEST = "9999"; // convention fictive pour le test

  beforeEach(() => {
    // Enregistrer une convention test qui supprime la carence employeur
    registerConventionMaintenance(IDCC_TEST, {
      maladie_ordinaire: {
        joursCarenceEmployeur: 0, // supprime les 7 jours légaux
        tauxMaintienPlein: 1.00,  // améliore les 90 % légaux
      },
    });
  });

  it("la convention fictive est bien enregistrée", () => {
    expect(listConventionsWithMaintenance()).toContain(IDCC_TEST);
  });

  it("maintien brut conventionnel > maintien brut légal (même absence)", () => {
    const absence: AbsenceEvent = {
      type: "maladie_ordinaire",
      joursCivils: 10,
      ancienneteEnMois: 24,
      subrogation: true,
    };

    const resultSansConv = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      passAnnuel: PASS_ANNUEL,
    });

    const resultAvecConv = LeaveAndBenefitsEngine.calculate({
      absence,
      brutMensuelTheorique: BRUT_MENSUEL,
      conventionCode: IDCC_TEST,
      passAnnuel: PASS_ANNUEL,
    });

    // Avec convention (0 carence, 100%): plus de jours maintenus à taux plus élevé
    const totalSansConv = resultSansConv.maintienBrutLegal;
    const totalAvecConv =
      resultAvecConv.maintienBrutLegal + resultAvecConv.maintienBrutConventionnel;
    expect(totalAvecConv).toBeGreaterThanOrEqual(totalSansConv);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A07 — Régularisation IJ tardives (subrogation initiale)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A07 — Régularisation IJSS tardives", () => {
  it("régularisation nulle quand IJ reçues ≤ maintien avancé (situation normale)", () => {
    const result = calculerRegularisation({
      moisAbsence: "2026-01",
      moisRegularisation: "2026-02",
      ijssRecuesMontant: 400,    // employeur reçoit 400 € de la CPAM
      subrogationInitiale: true,
      maintienAvanceMontant: 600, // avait avancé 600 € (complément logique)
    });
    // Les IJ ne couvrent pas le maintien → c'est le complément normal → pas de rappel
    expect(result.montantRegularisation).toBe(0);
  });

  it("régularisation positive quand IJ reçues > maintien avancé (trop-versé CPAM)", () => {
    const result = calculerRegularisation({
      moisAbsence: "2026-01",
      moisRegularisation: "2026-02",
      ijssRecuesMontant: 800,     // CPAM verse plus que prévu
      subrogationInitiale: true,
      maintienAvanceMontant: 500,
    });
    // IJ > avance → régularisation positive
    expect(result.montantRegularisation).toBeGreaterThan(0);
    expect(result.motif).toBe("ijss_tardives");
  });

  it("régularisation neutre en mode non subrogé", () => {
    const result = calculerRegularisation({
      moisAbsence: "2026-01",
      moisRegularisation: "2026-02",
      ijssRecuesMontant: 500,
      subrogationInitiale: false, // pas de subrogation
      maintienAvanceMontant: 0,
    });
    expect(result.montantRegularisation).toBe(0);
    expect(result.motif).toBe("neutralisation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS-A08 — Trop-versé employeur (refus partiel CPAM)
// ─────────────────────────────────────────────────────────────────────────────
describe("CAS-A08 — Trop-versé suite à refus CPAM", () => {
  it("calcule une déduction négative sur le bulletin de régularisation", () => {
    const result = calculerTropVerse(
      600,  // net maintenu versé par l'employeur
      300,  // IJ finalement acceptées par la CPAM (50 % refusées)
      "2026-03",
    );
    expect(result.montantRegularisation).toBeLessThan(0);
    expect(result.motif).toBe("regularisation_trop_verse");
  });

  it("aucune déduction si IJ acceptées couvrent entièrement le maintien", () => {
    const result = calculerTropVerse(500, 600, "2026-03");
    expect(result.montantRegularisation).toBe(0);
  });
});
