/**
 * Orchestrateur de simulation multi-mois sur une période de contrat.
 *
 * Génère un bulletin de paie pour chaque mois de la période,
 * avec suivi des cumuls annuels et des congés payés.
 *
 * Architecture :
 * 1. Décompose la période en mois individuels (avec prorata entrée/sortie)
 * 2. Pour chaque mois, adapte le `SimulationInput` (prorata, dates)
 * 3. Appelle `simulate()` (pipeline existant — pas de duplication)
 * 4. Accumule les cumuls annuels et les congés payés
 * 5. Calcule les totaux consolidés et l'indemnité compensatrice CP
 *
 * Fonction pure et déterministe : mêmes entrées = même sortie.
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";
import type {
  ContratPeriode,
  BulletinMensuel,
  TotauxContrat,
  SimulationContratResultat,
} from "@/lib/paie/contrat/types";
import type { CumulsAnnuels } from "@/lib/paie/engine/cumuls";
import { simulate } from "@/lib/paie/simulate";
import { decomposerPeriode, labelMois } from "@/lib/paie/contrat/date-utils";
import type { MoisContrat } from "@/lib/paie/contrat/date-utils";
import {
  calcCongesPayesMois,
  calcIndemniteCP,
  creerCongesPayesVides,
} from "@/lib/paie/contrat/conges-payes";
import type { CongesPayesState } from "@/lib/paie/contrat/types";
import { creerCumulsVides, integrerBulletin } from "@/lib/paie/engine/cumuls";

/** Arrondi à 1 décimale pour les jours de CP (demi-journées) */
const roundCP = (v: number) => Math.round(v * 10) / 10;

// ─────────────────────────────────────────────────────────────────────────────
// Input pour la simulation contrat
// ─────────────────────────────────────────────────────────────────────────────

/** Paramètres pour une simulation multi-mois */
export interface SimulationContratInput {
  /** Paramètres de simulation de base (salarié + entreprise) */
  baseInput: SimulationInput;
  /** Période du contrat */
  periode: ContratPeriode;
  /**
   * Nombre de jours de CP pris par le salarié sur la période.
   * L'indemnité correspondante est ajoutée au brut du dernier mois
   * et soumise à cotisations via le pipeline normal.
   * Défaut : 0 (aucun CP pris → tout en indemnité compensatrice pour les CDD).
   */
  joursCPPris?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation multi-mois
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simule les bulletins de paie pour chaque mois d'une période de contrat.
 *
 * @param params - Paramètres de simulation contrat
 * @returns Résultat complet avec bulletins, totaux et congés payés
 */
export function simulateContrat(
  params: SimulationContratInput,
): SimulationContratResultat {
  const { baseInput, periode, joursCPPris = 0 } = params;

  // ── Décomposition de la période en mois ─────────────────────────────────
  const moisList = decomposerPeriode(periode.dateDebut, periode.dateFin);

  if (moisList.length === 0) {
    return buildResultatVide(periode);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 : Simuler tous les mois SAUF le dernier (pour connaître le brut
  //           total et les CP acquis, nécessaires au calcul d'indemnité CP).
  // ─────────────────────────────────────────────────────────────────────────
  const bulletins: BulletinMensuel[] = [];
  let cumuls: CumulsAnnuels | null = null;
  let cpState: CongesPayesState | null = null;
  let exerciceCourant = moisList[0].annee;

  const dernierIndex = moisList.length - 1;

  for (let i = 0; i < dernierIndex; i++) {
    const mc = moisList[i];

    if (mc.annee !== exerciceCourant) {
      cumuls = null;
      exerciceCourant = mc.annee;
    }

    const monthInput = buildMonthInput(baseInput, mc, periode);
    const simulation = simulate(monthInput);

    cpState = calcCongesPayesMois({
      etatPrecedent: cpState,
      brutSoumisMois: simulation.brutSoumis,
      joursOuvresTravailles: mc.joursOuvresTravailles,
      joursOuvresDuMois: mc.joursOuvresDuMois,
      facteurProrata: mc.facteurProrata,
    });

    cumuls = integrerBulletin(
      cumuls,
      {
        brutSoumis: simulation.brutSoumis,
        pmssProratise: simulation.pmssProratise,
        baseT1: simulation.baseT1,
        baseT2: simulation.baseT2,
        montantRGDU: simulation.montantRGDU,
        totalCotisationsSalariales: simulation.totalCotisationsSalariales,
        totalCotisationsPatronales: simulation.totalCotisationsPatronales,
      },
      "contrat-sim",
      mc.annee,
    );

    bulletins.push({
      mois: mc.cle,
      moisLabel: labelMois(mc.annee, mc.mois),
      numeroMois: i + 1,
      simulation,
      input: monthInput,
      congesPayes: cpState,
      cumuls,
      estMoisEntree: mc.estEntree,
      estMoisSortie: mc.estSortie,
      indemniteCP: 0,
      indemniteCompensatriceCP: 0,
      joursOuvresTravailles: mc.joursOuvresTravailles,
      joursOuvresDuMois: mc.joursOuvresDuMois,
      facteurProrata: mc.facteurProrata,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 : Dernier mois — inclure l'indemnité CP des jours pris dans le brut
  // ─────────────────────────────────────────────────────────────────────────
  const mcDernier = moisList[dernierIndex];

  if (mcDernier.annee !== exerciceCourant) {
    cumuls = null;
    exerciceCourant = mcDernier.annee;
  }

  // Simuler d'abord le dernier mois *sans* indemnité CP pour connaître le brut total
  const monthInputBase = buildMonthInput(baseInput, mcDernier, periode);
  const simSansCp = simulate(monthInputBase);

  // CP acquis au dernier mois (provisoire)
  const cpAvantDernier = cpState;
  const cpDernier = calcCongesPayesMois({
    etatPrecedent: cpAvantDernier,
    brutSoumisMois: simSansCp.brutSoumis,
    joursOuvresTravailles: mcDernier.joursOuvresTravailles,
    joursOuvresDuMois: mcDernier.joursOuvresDuMois,
    facteurProrata: mcDernier.facteurProrata,
  });

  // Brut total hors indemnité CP
  let brutTotalHorsCP = simSansCp.brutSoumis;
  for (const b of bulletins) {
    brutTotalHorsCP += b.simulation.brutSoumis;
  }
  const nbMoisTotal = moisList.length;
  const brutMensuelMoyen = brutTotalHorsCP / nbMoisTotal;
  const joursCPAcquisTotal = cpDernier.joursAcquisCumules;

  // Plafonner les jours pris au solde acquis
  const joursCPEffectivementPris = Math.min(
    Math.max(joursCPPris, 0),
    joursCPAcquisTotal,
  );

  // Calculer l'indemnité CP pour les jours pris (soumise à cotisations)
  const indemniteCPPris = joursCPEffectivementPris > 0
    ? calcIndemniteCP(brutTotalHorsCP, joursCPEffectivementPris, joursCPAcquisTotal, brutMensuelMoyen)
    : 0;

  // Indemnité compensatrice CP (fin de CDD) — jours acquis NON pris, soumise à cotisations
  const estCDD = baseInput.salarié.typeContrat === "CDD";
  const joursNonPris = roundCP(joursCPAcquisTotal - joursCPEffectivementPris);
  const indemniteCompensatriceCPDernier = estCDD && joursNonPris > 0
    ? calcIndemniteCP(brutTotalHorsCP, joursNonPris, joursCPAcquisTotal, brutMensuelMoyen)
    : 0;

  // Total des indemnités CP à ajouter au brut du dernier mois
  const totalIndemnitesCPDernierMois = indemniteCPPris + indemniteCompensatriceCPDernier;

  // Resimmuler le dernier mois avec les indemnités CP ajoutées comme prime soumise
  let monthInputFinal = monthInputBase;
  let simulationDernier: SimulationResultat;
  if (totalIndemnitesCPDernierMois > 0) {
    monthInputFinal = {
      ...monthInputBase,
      salarié: {
        ...monthInputBase.salarié,
        primesSoumises: (monthInputBase.salarié.primesSoumises ?? 0) + totalIndemnitesCPDernierMois,
      },
    };
    simulationDernier = simulate(monthInputFinal);
  } else {
    simulationDernier = simSansCp;
  }

  // Mettre à jour les CP avec les jours pris
  const cpFinal: CongesPayesState = {
    ...cpDernier,
    joursPrisCumules: joursCPEffectivementPris,
    soldeCP: roundCP(cpDernier.joursAcquisCumules - joursCPEffectivementPris),
  };

  cpState = cpFinal;

  cumuls = integrerBulletin(
    cumuls,
    {
      brutSoumis: simulationDernier.brutSoumis,
      pmssProratise: simulationDernier.pmssProratise,
      baseT1: simulationDernier.baseT1,
      baseT2: simulationDernier.baseT2,
      montantRGDU: simulationDernier.montantRGDU,
      totalCotisationsSalariales: simulationDernier.totalCotisationsSalariales,
      totalCotisationsPatronales: simulationDernier.totalCotisationsPatronales,
    },
    "contrat-sim",
    mcDernier.annee,
  );

  bulletins.push({
    mois: mcDernier.cle,
    moisLabel: labelMois(mcDernier.annee, mcDernier.mois),
    numeroMois: dernierIndex + 1,
    simulation: simulationDernier,
    input: monthInputFinal,
    congesPayes: cpFinal,
    cumuls,
    estMoisEntree: mcDernier.estEntree,
    estMoisSortie: mcDernier.estSortie,
    indemniteCP: indemniteCPPris,
    indemniteCompensatriceCP: indemniteCompensatriceCPDernier,
    joursOuvresTravailles: mcDernier.joursOuvresTravailles,
    joursOuvresDuMois: mcDernier.joursOuvresDuMois,
    facteurProrata: mcDernier.facteurProrata,
  });

  // ── Totaux consolidés ─────────────────────────────────────────────────
  const totaux = buildTotaux(bulletins, joursCPEffectivementPris, indemniteCPPris, indemniteCompensatriceCPDernier);

  return {
    periode,
    bulletins,
    totaux,
    congesPayesFinal: cpState ?? creerCongesPayesVides(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction de l'input mensuel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adapte le `SimulationInput` de base pour un mois spécifique de la période.
 *
 * Gère :
 * - la proratisation du brut mensuel pour les mois d'entrée/sortie en cours de mois
 * - les dates d'entrée/sortie pour la proratisation interne du pipeline (PMSS, etc.)
 * - le mois de référence
 */
function buildMonthInput(
  base: SimulationInput,
  mc: MoisContrat,
  periode: ContratPeriode,
): SimulationInput {
  const moisRef = mc.cle; // "YYYY-MM"

  // Proratiser le brut mensuel si mois partiel (entrée ou sortie en cours de mois)
  const brutProratise = mc.facteurProrata < 1
    ? Math.round(base.salarié.brutMensuel * mc.facteurProrata * 100) / 100
    : base.salarié.brutMensuel;

  return {
    ...base,
    salarié: {
      ...base.salarié,
      brutMensuel: brutProratise,
      // Pour les mois d'entrée/sortie, passer les dates pour la proratisation du PMSS
      dateEntree: mc.estEntree ? periode.dateDebut : undefined,
      dateSortie: mc.estSortie ? periode.dateFin : undefined,
      moisReference: moisRef,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul des totaux consolidés
// ─────────────────────────────────────────────────────────────────────────────

function buildTotaux(
  bulletins: BulletinMensuel[],
  joursCPPris: number,
  indemniteCPPris: number,
  indemniteCompensatriceCP: number,
): TotauxContrat {
  const r2 = (v: number) => Math.round(v * 100) / 100;

  let brutTotal = 0;
  let netAPayerTotal = 0;
  let coutEmployeurTotal = 0;
  let cotisationsSalarialesTotal = 0;
  let cotisationsPatronalesTotal = 0;
  let rgduTotal = 0;
  let pasTotal = 0;

  for (const b of bulletins) {
    brutTotal += b.simulation.brutSoumis;
    netAPayerTotal += b.simulation.netAPayer;
    coutEmployeurTotal += b.simulation.coutEmployeur;
    cotisationsSalarialesTotal += b.simulation.totalCotisationsSalariales;
    cotisationsPatronalesTotal += b.simulation.totalCotisationsPatronales;
    rgduTotal += b.simulation.montantRGDU;
    pasTotal += b.simulation.pas;
  }

  brutTotal = r2(brutTotal);
  netAPayerTotal = r2(netAPayerTotal);
  coutEmployeurTotal = r2(coutEmployeurTotal);
  cotisationsSalarialesTotal = r2(cotisationsSalarialesTotal);
  cotisationsPatronalesTotal = r2(cotisationsPatronalesTotal);
  rgduTotal = r2(rgduTotal);
  pasTotal = r2(pasTotal);

  // Congés payés
  const dernierBulletin = bulletins[bulletins.length - 1];
  const provisionCPTotale = dernierBulletin?.congesPayes.provisionCPCumulee ?? 0;
  const joursCPAcquisTotal = dernierBulletin?.congesPayes.joursAcquisCumules ?? 0;

  const coutEmployeurTotalAvecCP = r2(coutEmployeurTotal + provisionCPTotale);

  return {
    nbMois: bulletins.length,
    brutTotal,
    netAPayerTotal,
    coutEmployeurTotal,
    coutEmployeurTotalAvecCP,
    cotisationsSalarialesTotal,
    cotisationsPatronalesTotal,
    provisionCPTotale,
    indemniteCompensatriceCP,
    indemniteCPPris,
    joursCPPris,
    joursCPAcquisTotal,
    rgduTotal,
    pasTotal,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Résultat vide
// ─────────────────────────────────────────────────────────────────────────────

function buildResultatVide(periode: ContratPeriode): SimulationContratResultat {
  return {
    periode,
    bulletins: [],
    totaux: {
      nbMois: 0,
      brutTotal: 0,
      netAPayerTotal: 0,
      coutEmployeurTotal: 0,
      coutEmployeurTotalAvecCP: 0,
      cotisationsSalarialesTotal: 0,
      cotisationsPatronalesTotal: 0,
      provisionCPTotale: 0,
      indemniteCompensatriceCP: 0,
      indemniteCPPris: 0,
      joursCPPris: 0,
      joursCPAcquisTotal: 0,
      rgduTotal: 0,
      pasTotal: 0,
    },
    congesPayesFinal: creerCongesPayesVides(),
  };
}
