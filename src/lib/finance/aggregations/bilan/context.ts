/**
 * Contexte partagé Bilan — centralise les 7 calculs `calcXxx()` utilisés à
 * la fois par `aggregations/bilan/build-rows.ts` et `aggregations/ratios/build-rows.ts`.
 *
 * Avant ce refactoring (P3/R7), chacun des deux modules appelait
 * indépendamment les mêmes fonctions lourdes (`calcBfr`, `calcImmosBilan`,
 * `calcApportsCumulatifs`, etc.), produisant un double calcul inutile et
 * un risque de divergence si l'un des deux était mis à jour sans l'autre.
 *
 * Usage :
 *   const ctx = buildBilanContext(data, fc);
 *   // puis passer ctx à buildBilanRows et buildRatiosRows
 *
 * @module aggregations/bilan/context
 */

import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import type { BfrCalcResult } from "@/lib/finance/calculs/bfr";
import {
  calcImmosBilan,
  calcApportsCumulatifs,
  calcEmpruntsPassif,
  calcProvisionsCumul,
  calcCapitauxPropres,
  calcTresorerieBilan,
  calcFluxNonPLCumul,
} from "@/lib/finance/calculs/bilan";
import type { ImmoBilanResult } from "@/lib/finance/calculs/bilan";
import type { YearAcc } from "@/lib/finance/utils";

// ── Interface BilanContext ────────────────────────────────────────────────────

/**
 * Résultat de `buildBilanContext` — source unique de vérité pour toutes
 * les données intermédiaires nécessaires au bilan et aux ratios.
 */
export interface BilanContext {
  // ── Résultats bruts des calculs spécialisés ────────────────────────────
  bfr: BfrCalcResult;
  immos: ImmoBilanResult;
  apportsCapital: YearAcc;
  apportsCC: YearAcc;
  capitalRestantDu: YearAcc;
  empruntsDebloques: YearAcc;
  remboursementsCumul: YearAcc;
  provisionsCumul: YearAcc;
  capitalSocial: YearAcc;
  comptesCoursants: YearAcc;
  reportANouveau: YearAcc;
  capitauxPropres: YearAcc;
  disponibilites: YearAcc;
  decouvert: YearAcc;

  // ── Dérivés pré-calculés (évitent la répétition dans build-rows.ts / ratios/build-rows.ts) ─
  /** Stocks de matières (= bfr.stocksMatieres). */
  stocks: YearAcc;
  /** Crédit de TVA (= bfr.creditTVA). */
  creditTVA: YearAcc;
  /** Créances clients (= bfr.creancesClients). */
  creancesClients: YearAcc;
  /** Stocks + crédit TVA + créances clients. */
  stocksCumul: YearAcc;
  /** Total dettes d'exploitation (= bfr.totalRessources). */
  totalDettesExploitation: YearAcc;
  /** Actif circulant = stocksCumul + disponibilites. */
  actifCirculant: YearAcc;
  /** Total actif = immos.immoNette + actifCirculant. */
  totalActif: YearAcc;
  /** Total dettes = capitalRestantDu + totalDettesExploitation + decouvert. */
  totalDettes: YearAcc;
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Calcule le BilanContext une seule fois pour un dossier donné.
 *
 * Cette fonction centralise tous les appels lourds nécessaires au bilan et
 * aux ratios, évitant le double calcul précédemment présent dans chaque module.
 */
export function buildBilanContext(
  data: ScenarioFinData,
  fc: FinCalcResult,
): BilanContext {
  const { anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3 } = fc;

  const bfr = calcBfr(data, fc);
  const immos = calcImmosBilan(
    data,
    anneeDebut,
    moisDebut,
    exBorne1,
    exBorne2,
    exBorne3,
    fc.dotationsParImmoAcc,
  );
  const { apportsCapital, apportsCC } = calcApportsCumulatifs(
    data,
    exBorne1,
    exBorne2,
    exBorne3,
  );
  const { capitalRestantDu, empruntsDebloques, remboursementsCumul } =
    calcEmpruntsPassif(data, exBorne1, exBorne2, exBorne3);
  const provisionsCumul = calcProvisionsCumul(fc);
  const { capitalSocial, comptesCoursants, reportANouveau, capitauxPropres } =
    calcCapitauxPropres(apportsCapital, apportsCC, fc.resNet);
  const { encFluxNonPLCumul, decFluxNonPLCumul } = calcFluxNonPLCumul(
    data,
    exBorne1,
    exBorne2,
    exBorne3,
  );

  const stocks: YearAcc = bfr.stocksMatieres;
  const creditTVA: YearAcc = bfr.creditTVA;
  const creancesClients: YearAcc = bfr.creancesClients;
  const totalDettesExploitation: YearAcc = bfr.totalRessources;
  const stocksCumul: YearAcc = {
    y1: stocks.y1 + creditTVA.y1 + creancesClients.y1,
    y2: stocks.y2 + creditTVA.y2 + creancesClients.y2,
    y3: stocks.y3 + creditTVA.y3 + creancesClients.y3,
  };

  const { disponibilites, decouvert } = calcTresorerieBilan({
    caf: fc.caf,
    apportsCapital,
    apportsCC,
    empruntsDebloques,
    immoAcquises: immos.immoAcquises,
    stocksCumul,
    totalDettesExploitation,
    remboursementsCumul,
    encFluxNonPLCumul,
    decFluxNonPLCumul,
  });

  const actifCirculant: YearAcc = {
    y1: stocksCumul.y1 + disponibilites.y1,
    y2: stocksCumul.y2 + disponibilites.y2,
    y3: stocksCumul.y3 + disponibilites.y3,
  };
  const totalActif: YearAcc = {
    y1: immos.immoNette.y1 + actifCirculant.y1,
    y2: immos.immoNette.y2 + actifCirculant.y2,
    y3: immos.immoNette.y3 + actifCirculant.y3,
  };
  const totalDettes: YearAcc = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1 + decouvert.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2 + decouvert.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3 + decouvert.y3,
  };

  return {
    bfr,
    immos,
    apportsCapital,
    apportsCC,
    capitalRestantDu,
    empruntsDebloques,
    remboursementsCumul,
    provisionsCumul,
    capitalSocial,
    comptesCoursants,
    reportANouveau,
    capitauxPropres,
    disponibilites,
    decouvert,
    stocks,
    creditTVA,
    creancesClients,
    stocksCumul,
    totalDettesExploitation,
    actifCirculant,
    totalActif,
    totalDettes,
  };
}
