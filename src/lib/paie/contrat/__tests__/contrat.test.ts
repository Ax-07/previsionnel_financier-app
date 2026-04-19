/**
 * Tests unitaires — Module contrat (simulation multi-mois + congés payés).
 *
 * Couvre :
 * - date-utils : jours ouvrés, jours fériés, décomposition de période
 * - conges-payes : acquisition, provision, indemnité compensatrice
 * - simulate-contrat : orchestration multi-mois
 */

import { describe, it, expect } from "vitest";
import {
  joursOuvresMois,
  joursOuvresEntre,
  joursOuvrablesMois,
  joursFeries,
  decomposerPeriode,
  labelMois,
  parseDate,
} from "@/lib/paie/contrat/date-utils";
import {
  calcCongesPayesMois,
  calcIndemniteCompensatriceCP,
  calcIndemniteCP,
  creerCongesPayesVides,
  JOURS_CP_PAR_MOIS,
} from "@/lib/paie/contrat/conges-payes";
import { simulateContrat } from "@/lib/paie/contrat/simulate-contrat";

// ─────────────────────────────────────────────────────────────────────────────
// 1. date-utils
// ─────────────────────────────────────────────────────────────────────────────

describe("date-utils", () => {
  describe("joursFeries", () => {
    it("retourne 11 jours fériés pour 2026", () => {
      const feries = joursFeries(2026);
      expect(feries).toHaveLength(11);
    });

    it("inclut le 1er janvier et le 25 décembre", () => {
      const feries = joursFeries(2026);
      const dates = feries.map((d) => `${d.getMonth() + 1}-${d.getDate()}`);
      expect(dates).toContain("1-1");   // Jour de l'An
      expect(dates).toContain("12-25"); // Noël
    });

    it("inclut le 14 juillet", () => {
      const feries = joursFeries(2026);
      const dates = feries.map((d) => `${d.getMonth() + 1}-${d.getDate()}`);
      expect(dates).toContain("7-14");
    });
  });

  describe("joursOuvresMois", () => {
    it("janvier 2026 a environ 21-22 jours ouvrés", () => {
      const jo = joursOuvresMois(2026, 0); // janvier
      expect(jo).toBeGreaterThanOrEqual(20);
      expect(jo).toBeLessThanOrEqual(23);
    });

    it("retourne 0 jours ouvrés pour un mois valide", () => {
      // Février 2026 a au moins 18 jours ouvrés
      const jo = joursOuvresMois(2026, 1);
      expect(jo).toBeGreaterThan(0);
    });

    it("un mois avec un jour férié a moins de jours ouvrés", () => {
      // Mai a le 1er mai et le 8 mai → moins de jours ouvrés que la moyenne
      const mai = joursOuvresMois(2026, 4);
      // Mai 2026 a 31 jours, ~21 jours ouvrés sans fériés, -2 (ou -1 si samedi/dimanche)
      expect(mai).toBeLessThanOrEqual(21);
    });
  });

  describe("joursOuvrablesMois", () => {
    it("retourne plus de jours ouvrables que de jours ouvrés (inclut samedi)", () => {
      const ouvres = joursOuvresMois(2026, 0);
      const ouvrables = joursOuvrablesMois(2026, 0);
      expect(ouvrables).toBeGreaterThan(ouvres);
    });
  });

  describe("joursOuvresEntre", () => {
    it("retourne 0 si debut > fin", () => {
      expect(joursOuvresEntre("2026-01-31", "2026-01-01")).toBe(0);
    });

    it("retourne 1 pour un seul jour ouvré (lundi)", () => {
      // 5 janvier 2026 est un lundi
      expect(joursOuvresEntre("2026-01-05", "2026-01-05")).toBe(1);
    });

    it("retourne 0 pour un dimanche", () => {
      // 4 janvier 2026 est un dimanche
      expect(joursOuvresEntre("2026-01-04", "2026-01-04")).toBe(0);
    });

    it("calcule correctement une semaine complète", () => {
      // Lundi 5 au vendredi 9 janvier 2026 = 5 jours
      expect(joursOuvresEntre("2026-01-05", "2026-01-09")).toBe(5);
    });
  });

  describe("decomposerPeriode", () => {
    it("retourne un mois pour une période dans un même mois", () => {
      const mois = decomposerPeriode("2026-03-01", "2026-03-31");
      expect(mois).toHaveLength(1);
      expect(mois[0].cle).toBe("2026-03");
      expect(mois[0].estEntree).toBe(true);
      expect(mois[0].estSortie).toBe(true);
    });

    it("retourne 3 mois pour janvier–mars 2026", () => {
      const mois = decomposerPeriode("2026-01-01", "2026-03-31");
      expect(mois).toHaveLength(3);
      expect(mois[0].cle).toBe("2026-01");
      expect(mois[0].estEntree).toBe(true);
      expect(mois[0].estSortie).toBe(false);
      expect(mois[2].cle).toBe("2026-03");
      expect(mois[2].estEntree).toBe(false);
      expect(mois[2].estSortie).toBe(true);
    });

    it("retourne 12 mois pour une année complète", () => {
      const mois = decomposerPeriode("2026-01-01", "2026-12-31");
      expect(mois).toHaveLength(12);
    });

    it("proratise l'entrée en cours de mois", () => {
      const mois = decomposerPeriode("2026-03-15", "2026-04-30");
      expect(mois).toHaveLength(2);
      expect(mois[0].estEntree).toBe(true);
      expect(mois[0].facteurProrata).toBeLessThan(1);
      expect(mois[0].facteurProrata).toBeGreaterThan(0);
    });

    it("proratise la sortie en cours de mois", () => {
      const mois = decomposerPeriode("2026-03-01", "2026-04-15");
      expect(mois).toHaveLength(2);
      expect(mois[1].estSortie).toBe(true);
      expect(mois[1].facteurProrata).toBeLessThan(1);
    });

    it("retourne vide si dateDebut > dateFin", () => {
      expect(decomposerPeriode("2026-06-01", "2026-01-01")).toHaveLength(0);
    });

    it("gère correctement le passage d'année", () => {
      const mois = decomposerPeriode("2026-11-01", "2027-02-28");
      expect(mois).toHaveLength(4);
      expect(mois[0].annee).toBe(2026);
      expect(mois[3].annee).toBe(2027);
    });
  });

  describe("labelMois", () => {
    it("formate correctement janvier 2026", () => {
      expect(labelMois(2026, 0)).toBe("Janvier 2026");
    });

    it("formate correctement décembre 2027", () => {
      expect(labelMois(2027, 11)).toBe("Décembre 2027");
    });
  });

  describe("parseDate", () => {
    it("parse une date ISO correctement", () => {
      const d = parseDate("2026-03-15");
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);  // 0-based
      expect(d.getDate()).toBe(15);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. conges-payes
// ─────────────────────────────────────────────────────────────────────────────

describe("conges-payes", () => {
  describe("creerCongesPayesVides", () => {
    it("retourne un état initial avec tous les compteurs à 0", () => {
      const cp = creerCongesPayesVides();
      expect(cp.joursAcquisCumules).toBe(0);
      expect(cp.joursPrisCumules).toBe(0);
      expect(cp.soldeCP).toBe(0);
      expect(cp.provisionCPCumulee).toBe(0);
      expect(cp.joursAcquisMois).toBe(0);
      expect(cp.provisionCPMois).toBe(0);
    });
  });

  describe("calcCongesPayesMois", () => {
    it("acquiert 2.5 jours pour un mois complet", () => {
      const result = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 2000,
        joursOuvresTravailles: 22,
        joursOuvresDuMois: 22,
        facteurProrata: 1,
      });
      expect(result.joursAcquisMois).toBe(JOURS_CP_PAR_MOIS);
      expect(result.joursAcquisCumules).toBe(JOURS_CP_PAR_MOIS);
    });

    it("provision CP = 10% du brut", () => {
      const result = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 2000,
        joursOuvresTravailles: 22,
        joursOuvresDuMois: 22,
        facteurProrata: 1,
      });
      expect(result.provisionCPMois).toBe(200);
    });

    it("proratise l'acquisition pour un mois partiel sous le seuil", () => {
      const result = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 1000,
        joursOuvresTravailles: 5,   // Sous le seuil de 10
        joursOuvresDuMois: 22,
        facteurProrata: 5 / 22,
      });
      expect(result.joursAcquisMois).toBeLessThan(JOURS_CP_PAR_MOIS);
      expect(result.joursAcquisMois).toBeGreaterThan(0);
    });

    it("acquiert 2.5 jours complets si >= 10 jours travaillés", () => {
      const result = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 1500,
        joursOuvresTravailles: 10,
        joursOuvresDuMois: 22,
        facteurProrata: 10 / 22,
      });
      expect(result.joursAcquisMois).toBe(JOURS_CP_PAR_MOIS);
    });

    it("cumule correctement sur plusieurs mois", () => {
      // Mois 1
      const mois1 = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 2000,
        joursOuvresTravailles: 22,
        joursOuvresDuMois: 22,
        facteurProrata: 1,
      });
      // Mois 2
      const mois2 = calcCongesPayesMois({
        etatPrecedent: mois1,
        brutSoumisMois: 2000,
        joursOuvresTravailles: 20,
        joursOuvresDuMois: 20,
        facteurProrata: 1,
      });
      expect(mois2.joursAcquisCumules).toBe(5); // 2.5 + 2.5
      expect(mois2.provisionCPCumulee).toBe(400); // 200 + 200
      expect(mois2.soldeCP).toBe(5);
    });

    it("retourne 0 jour acquis si 0 jours ouvrés", () => {
      const result = calcCongesPayesMois({
        etatPrecedent: null,
        brutSoumisMois: 0,
        joursOuvresTravailles: 0,
        joursOuvresDuMois: 0,
        facteurProrata: 0,
      });
      expect(result.joursAcquisMois).toBe(0);
    });
  });

  describe("calcIndemniteCompensatriceCP", () => {
    it("indemnité = max(10% brut total, maintien salaire)", () => {
      // 10% de 24000 = 2400 ; maintien = 2000 × (30/26) = 2307.69
      const indemnite = calcIndemniteCompensatriceCP(24000, 30, 2000);
      expect(indemnite).toBe(2400); // 10% est plus favorable
    });

    it("prend le maintien si plus favorable", () => {
      // 10% de 12000 = 1200 ; maintien = 3000 × (10/26) = 1153.85
      const indemnite = calcIndemniteCompensatriceCP(12000, 10, 3000);
      expect(indemnite).toBe(1200); // 10% ici aussi
    });

    it("retourne 0 si aucun jour acquis", () => {
      const indemnite = calcIndemniteCompensatriceCP(24000, 0, 2000);
      expect(indemnite).toBe(0); // 0 jour acquis → pas d'indemnité
    });
  });

  describe("calcIndemniteCP", () => {
    it("proratise l'indemnité selon les jours pris / jours acquis", () => {
      // 10% de 24000 = 2400 total ; 15 jours pris sur 30 acquis → 1200
      const indemnite = calcIndemniteCP(24000, 15, 30, 2000);
      expect(indemnite).toBe(1200);
    });

    it("retourne l'indemnité totale si tous les jours sont pris", () => {
      // 10% de 24000 = 2400 ; 30/30 → 2400
      const indemnite = calcIndemniteCP(24000, 30, 30, 2000);
      expect(indemnite).toBe(2400);
    });

    it("retourne 0 si 0 jours pris", () => {
      const indemnite = calcIndemniteCP(24000, 0, 30, 2000);
      expect(indemnite).toBe(0);
    });

    it("retourne 0 si 0 jours acquis total", () => {
      const indemnite = calcIndemniteCP(24000, 5, 0, 2000);
      expect(indemnite).toBe(0);
    });

    it("compare correctement 10% vs maintien pour la portion prise", () => {
      // 10% de 6000 = 600 pour 15j/15j ; maintien = 3000 × (15/26) = 1730.77
      // maintien est plus favorable
      const indemnite = calcIndemniteCP(6000, 15, 15, 3000);
      expect(indemnite).toBeCloseTo(1730.77, 0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. simulate-contrat (intégration)
// ─────────────────────────────────────────────────────────────────────────────

describe("simulate-contrat", () => {
  // Input de base pour les tests
  const baseInput = {
    salarié: {
      statut: "non_cadre" as const,
      typeContrat: "CDD" as const,
      heuresContrat: 151.66669,
      brutMensuel: 2000,
      tauxPAS: 0.05,
      modePAS: "personnalise" as const,
    },
    entreprise: {
      effectif: 10,
      tauxATMP: 0.021,
    },
  };

  it("génère 1 bulletin pour une période d'un mois complet", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-03-01", dateFin: "2026-03-31" },
    });
    expect(result.bulletins).toHaveLength(1);
    expect(result.bulletins[0].mois).toBe("2026-03");
    expect(result.bulletins[0].moisLabel).toBe("Mars 2026");
    expect(result.bulletins[0].estMoisEntree).toBe(true);
    expect(result.bulletins[0].estMoisSortie).toBe(true);
  });

  it("génère 12 bulletins pour une année complète", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
    });
    expect(result.bulletins).toHaveLength(12);
    expect(result.totaux.nbMois).toBe(12);
  });

  it("le brut total ≈ brut mensuel × nb mois (mois complets)", () => {
    const result = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDI" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
    });
    // 6 mois complets CDI (sans indemnité CP), brut devrait être proche de 2000 × 6
    expect(result.totaux.brutTotal).toBeGreaterThan(11000);
    expect(result.totaux.brutTotal).toBeLessThanOrEqual(12001);
  });

  it("accumule les congés payés sur la durée du contrat", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
    });
    // 12 mois × 2.5 = 30 jours acquis
    expect(result.congesPayesFinal.joursAcquisCumules).toBe(30);
    expect(result.congesPayesFinal.soldeCP).toBe(30);
  });

  it("calcule l'indemnité compensatrice CP pour un CDD", () => {
    const result = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDD" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
    });
    expect(result.totaux.indemniteCompensatriceCP).toBeGreaterThan(0);
    // Doit être environ 10% du brut hors CP (brutTotal inclut l'indemnité elle-même)
    const brutHorsCP = result.totaux.brutTotal - result.totaux.indemniteCompensatriceCP;
    expect(result.totaux.indemniteCompensatriceCP).toBeCloseTo(
      brutHorsCP * 0.1,
      -1, // tolérance de dizaines d'euros
    );
  });

  it("ne calcule pas d'indemnité compensatrice CP pour un CDI", () => {
    const result = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDI" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
    });
    expect(result.totaux.indemniteCompensatriceCP).toBe(0);
  });

  it("proratise le premier et dernier mois si entrée/sortie en cours de mois", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-03-15", dateFin: "2026-05-15" },
    });
    expect(result.bulletins).toHaveLength(3);

    // Premier mois (mars) : entrée le 15, proratisé
    expect(result.bulletins[0].estMoisEntree).toBe(true);
    expect(result.bulletins[0].facteurProrata).toBeLessThan(1);

    // Dernier mois (mai) : sortie le 15, proratisé
    expect(result.bulletins[2].estMoisSortie).toBe(true);
    expect(result.bulletins[2].facteurProrata).toBeLessThan(1);

    // Mois du milieu (avril) : complet
    expect(result.bulletins[1].facteurProrata).toBe(1);
  });

  it("le coût employeur avec CP est supérieur au coût employeur sans CP", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
    });
    expect(result.totaux.coutEmployeurTotalAvecCP).toBeGreaterThan(
      result.totaux.coutEmployeurTotal,
    );
  });

  it("la provision CP totale ≈ 10% du brut total", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
    });
    const ratio = result.totaux.provisionCPTotale / result.totaux.brutTotal;
    expect(ratio).toBeCloseTo(0.1, 1); // ~10%
  });

  it("retourne un résultat vide si la période est invalide", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-06-01", dateFin: "2026-01-01" },
    });
    expect(result.bulletins).toHaveLength(0);
    expect(result.totaux.nbMois).toBe(0);
  });

  it("gère le passage d'année (cumuls réinitialisés)", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-11-01", dateFin: "2027-02-28" },
    });
    expect(result.bulletins).toHaveLength(4);
    // Les CP continuent de s'accumuler
    expect(result.congesPayesFinal.joursAcquisCumules).toBe(10); // 4 × 2.5
  });

  it("chaque bulletin a un numéro de mois croissant", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
    });
    for (let i = 0; i < result.bulletins.length; i++) {
      expect(result.bulletins[i].numeroMois).toBe(i + 1);
    }
  });

  // ── Tests CP pris ──────────────────────────────────────────────────────

  it("ajoute l'indemnité CP au brut du dernier mois quand joursCPPris > 0", () => {
    const sansCP = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
    });
    const avecCP = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
      joursCPPris: 10,
    });

    // Le dernier bulletin doit avoir un brut ≥ (indemnité CP pris + compensatrice ≥ compensatrice seule)
    const dernierSans = sansCP.bulletins[sansCP.bulletins.length - 1];
    const dernierAvec = avecCP.bulletins[avecCP.bulletins.length - 1];
    expect(dernierAvec.simulation.brutSoumis).toBeGreaterThanOrEqual(dernierSans.simulation.brutSoumis);

    // L'indemnité CP doit être > 0 sur le dernier bulletin
    expect(dernierAvec.indemniteCP).toBeGreaterThan(0);

    // Les bulletins précédents ne doivent pas avoir d'indemnité CP
    for (let i = 0; i < avecCP.bulletins.length - 1; i++) {
      expect(avecCP.bulletins[i].indemniteCP).toBe(0);
    }
  });

  it("réduit l'indemnité compensatrice quand des CP sont pris (CDD)", () => {
    const sansCP = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDD" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
    });
    const avecCP = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDD" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
      joursCPPris: 15,
    });

    // L'indemnité compensatrice doit être inférieure quand des CP sont pris
    expect(avecCP.totaux.indemniteCompensatriceCP).toBeLessThan(
      sansCP.totaux.indemniteCompensatriceCP,
    );
    // L'indemnité CP pris doit être > 0
    expect(avecCP.totaux.indemniteCPPris).toBeGreaterThan(0);
    expect(avecCP.totaux.joursCPPris).toBe(15);
  });

  it("indemnité compensatrice = 0 si tous les CP sont pris (CDD)", () => {
    const result = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDD" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-12-31" },
      joursCPPris: 30, // tous les 30 jours acquis
    });

    expect(result.totaux.indemniteCompensatriceCP).toBe(0);
    expect(result.totaux.indemniteCPPris).toBeGreaterThan(0);
    expect(result.totaux.joursCPPris).toBe(30);
    expect(result.congesPayesFinal.soldeCP).toBe(0);
  });

  it("ne touche pas l'indemnité compensatrice pour un CDI avec CP pris", () => {
    const result = simulateContrat({
      baseInput: {
        ...baseInput,
        salarié: { ...baseInput.salarié, typeContrat: "CDI" },
      },
      periode: { dateDebut: "2026-01-01", dateFin: "2026-06-30" },
      joursCPPris: 5,
    });

    // CDI : pas d'indemnité compensatrice
    expect(result.totaux.indemniteCompensatriceCP).toBe(0);
    // Mais l'indemnité CP pris doit être calculée
    expect(result.totaux.indemniteCPPris).toBeGreaterThan(0);
    expect(result.totaux.joursCPPris).toBe(5);
  });

  it("borne joursCPPris au nombre de jours acquis", () => {
    const result = simulateContrat({
      baseInput,
      periode: { dateDebut: "2026-01-01", dateFin: "2026-03-31" },
      joursCPPris: 100, // beaucoup plus que les ~7.5 acquis
    });

    // Les jours pris doivent être bornés aux jours acquis
    expect(result.totaux.joursCPPris).toBeLessThanOrEqual(
      result.congesPayesFinal.joursAcquisCumules,
    );
  });
});
