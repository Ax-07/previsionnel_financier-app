/**
 * Point d'entrée unique du moteur de calcul financier prévisionnel.
 *
 * `buildFinCalc(data, dateDemarrage)` orchestre les 10 étapes du pipeline
 * et produit `FinCalcResult` (agrégats annuels + helpers de calendrier).
 *
 * R1 — Seul orchestrateur autorisé : les actions `controle/` délèguent ICI.
 * R2 — Ne jamais appeler depuis un composant React (Server Action uniquement).
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/types/results";
import type { YearAcc } from "@/lib/finance/types/series";
import type { HypotheseType } from "@/lib/schemas/hypothese";
import { HYPOTHESE_ACTIVE_DEFAULT } from "@/lib/schemas/hypothese";
import { makeExerciceHelpers, fmtExercice } from "./calendar";
import { n } from "@/lib/finance/utils";

import { calcCapitalRembourse } from "@/lib/finance/calculs/emprunts";
import { calcResExcep } from "@/lib/finance/calculs/resultats";
import { calcAjustementNet, calcISParAnnee } from "@/lib/finance/calculs/is";
import { calcTVA } from "@/lib/finance/calculs/calc-tva";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  buildMonthlyCalc,
  monthlyToYearAcc,
  firstMonthToYearAcc,
  lastMonthToYearAcc,
  type MonthlyCalcResult,
} from "@/lib/finance/calculs/monthly";

/**
 * Filtre un tableau d'entités par hypothèse active.
 * Conserve les lignes dont `hypothese` vaut `COMMUNE` ou correspond à l'hypothèse active.
 * Si le champ `hypothese` est absent (données legacy / fixtures de test), la ligne est considérée comme `COMMUNE`.
 */
function filterByHypothese<T extends { hypothese?: string }>(
  items: T[],
  hypotheseActive: HypotheseType,
): T[] {
  return items.filter(
    (item) => {
      const h = item.hypothese ?? "COMMUNE";
      return h === "COMMUNE" || h === hypotheseActive;
    },
  );
}

/**
 * Calcule l'intégralité des agrégats financiers prévisionnels.
 * Délègue tous les calculs à buildMonthlyCalc, puis somme les séries mensuelles.
 * Appeler cette fonction en tête de chaque action de contrôle.
 */
export function buildFinCalc(
  data: ScenarioFinData,
  dateDemarrage: Date,
  hypotheseActive: HypotheseType = HYPOTHESE_ACTIVE_DEFAULT,
): FinCalcResult {
  // ── Filtrage des données par hypothèse ──────────────────────────────────
  const d: ScenarioFinData = {
    ...data,
    activites: filterByHypothese(data.activites, hypotheseActive),
    activiteCommissions: filterByHypothese(data.activiteCommissions, hypotheseActive),
    subventionsExploitation: filterByHypothese(data.subventionsExploitation, hypotheseActive),
    productionsImmobilisees: filterByHypothese(data.productionsImmobilisees, hypotheseActive),
    fournitures: filterByHypothese(data.fournitures, hypotheseActive),
    services: filterByHypothese(data.services, hypotheseActive),
    impotsTaxes: filterByHypothese(data.impotsTaxes, hypotheseActive),
    salaries: filterByHypothese(data.salaries, hypotheseActive),
    dirigeants: filterByHypothese(data.dirigeants, hypotheseActive),
    cotisationsTNS: filterByHypothese(data.cotisationsTNS, hypotheseActive),
    taxesSalaires: filterByHypothese(data.taxesSalaires, hypotheseActive),
    immobilisations: filterByHypothese(data.immobilisations, hypotheseActive),
    provisions: filterByHypothese(data.provisions, hypotheseActive),
    chargesFinancieres: filterByHypothese(data.chargesFinancieres, hypotheseActive),
    chargesExceptionnelles: filterByHypothese(data.chargesExceptionnelles, hypotheseActive),
    chargesGestionCourante: filterByHypothese(data.chargesGestionCourante, hypotheseActive),
    reprisesProduits: filterByHypothese(data.reprisesProduits, hypotheseActive),
    financiersProduits: filterByHypothese(data.financiersProduits, hypotheseActive),
    exceptionnelsProduits: filterByHypothese(data.exceptionnelsProduits, hypotheseActive),
    transfertsProduits: filterByHypothese(data.transfertsProduits, hypotheseActive),
    gestionCouranteProduits: filterByHypothese(data.gestionCouranteProduits, hypotheseActive),
    emprunts: filterByHypothese(data.emprunts, hypotheseActive),
    apports: filterByHypothese(data.apports, hypotheseActive),
    subventions: filterByHypothese(data.subventions, hypotheseActive),
    diversEncaissements: filterByHypothese(data.diversEncaissements, hypotheseActive),
    diversDecaissements: filterByHypothese(data.diversDecaissements, hypotheseActive),
    diversRemboursementsCC: filterByHypothese(data.diversRemboursementsCC, hypotheseActive),
    ajustementsFiscaux: filterByHypothese(data.ajustementsFiscaux, hypotheseActive),
  };

  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth();
  const { toExerciceKey, exBorne1, exBorne2, exBorne3, pFin, pDeb } =
    makeExerciceHelpers(dateDemarrage, d.scenario.parametres?.exercices ?? undefined);

  // Calcul TVA — source unique de vérité pour tout le pipeline
  const tva = calcTVA(d, { toExerciceKey, exBorne1, exBorne2, exBorne3 });

  const yearLabels = {
    y1: fmtExercice(anneeDebut, moisDebut),
    y2: fmtExercice(anneeDebut + 1, moisDebut),
    y3: fmtExercice(anneeDebut + 2, moisDebut),
  };

  const dureeProjection = ((d.dureeProjection ?? 3) as 1 | 2 | 3);

  // ── IS : nécessite resCourant et resExcep calculés d'abord ────────────────
  const _capital = calcCapitalRembourse(d, toExerciceKey);
  const _resExcep = calcResExcep(d);
  const _ajustementNet = calcAjustementNet(d);

  // Passe 1 : IS = 0 pour obtenir resCourant (IS dépend de RCAI → calcul après)
  const mc0: MonthlyCalcResult = buildMonthlyCalc(d, dateDemarrage, { y1: 0, y2: 0, y3: 0 });
  const _resCourant = monthlyToYearAcc(mc0.resCourant);

  const isParAnnee = calcISParAnnee(
    _resCourant,
    _resExcep,
    _ajustementNet,
    d.parametresIS,
    d.isIS,
  );

  // Passe 2 : re-calcul avec IS réel — séries mensuelles (resNet, caf, isSeries) correctes
  const mc: MonthlyCalcResult = buildMonthlyCalc(d, dateDemarrage, isParAnnee);

  // ── Calcul des agrégats annuels (somme des séries mensuelles) ─────────────
  const sum = monthlyToYearAcc;

  const ca = sum(mc.ca);
  const achatsEffectues = sum(mc.achatsEffectues);
  // Stocks : niveaux de fin d'exercice → dernier mois (index 11), pas la somme
  const stockInitial = firstMonthToYearAcc(mc.stockInitial);
  const stockFinal = lastMonthToYearAcc(mc.stockFinal);
  const stockFinalSeries = mc.stockFinal;
  const stockInitialSeries = mc.stockInitial;
  const achatsConsommes = sum(mc.achatsConsommes);
  // Variation de stocks annuelle (pour CR/SIG) = achatsEffectués − achatsConsommés
  // ≠ lastMonthToYearAcc(mc.varStock) qui ne donne que le delta du dernier mois (≈ 0 en régime permanent)
  const varStock: YearAcc = {
    y1: achatsEffectues.y1 - achatsConsommes.y1,
    y2: achatsEffectues.y2 - achatsConsommes.y2,
    y3: achatsEffectues.y3 - achatsConsommes.y3,
  };
  const fournitures = sum(mc.fournitures);
  const services = sum(mc.services);
  const chargesExternes = sum(mc.chargesExternes);
  const subventions = sum(mc.subventions);
  const impotsTaxes = sum(mc.impotsTaxes);
  const salairesBruts = sum(mc.salairesBruts);
  const chargesPatronales = sum(mc.chargesPatronales);
  const remuDirigeant = sum(mc.remuDirigeant);
  const cotisationsTNSTotal = sum(mc.cotisationsTNS);
  const taxesSalairesTotal = sum(mc.taxesSalaires);
  const chargesPersonnelTotal = sum(mc.chargesPersonnel);
  const chargesPersonnel = {
    salairesBruts,
    chargesPatronales,
    remuDirigeant,
    cotisationsTNSTotal,
    taxesSalairesTotal,
    total: chargesPersonnelTotal,
  };
  const valeurAjoutee = sum(mc.valeurAjoutee);
  const ebe = sum(mc.ebe);
  const dotationsAmort = sum(mc.dotationsAmort);
  const dotationsProvisions = sum(mc.dotationsProvisions);
  const reprises = sum(mc.reprises);
  const commissionsTotal = sum(mc.commissionsTotal);
  const prodImmo = sum(mc.prodImmo);
  const transferts = sum(mc.transferts);
  const autresProdGestion = sum(mc.autresProdGestion);
  const autresChargesGestion = sum(mc.autresChargesGestion);
  const totalProduitsExpl: YearAcc = {
    y1: ca.y1 + commissionsTotal.y1 + prodImmo.y1 + subventions.y1 + reprises.y1 + transferts.y1 + autresProdGestion.y1,
    y2: ca.y2 + commissionsTotal.y2 + prodImmo.y2 + subventions.y2 + reprises.y2 + transferts.y2 + autresProdGestion.y2,
    y3: ca.y3 + commissionsTotal.y3 + prodImmo.y3 + subventions.y3 + reprises.y3 + transferts.y3 + autresProdGestion.y3,
  };
  const resExpl = sum(mc.resExpl);
  const produitsFinanciers = sum(mc.produitsFinanciers);
  const interetsEmprunts = sum(mc.interetsEmprunts);
  const fraisDossierEmprunts = sum(mc.fraisDossierEmprunts);
  const autresChargesFinancieres = sum(mc.autresChargesFinancieres);
  const chargesFinTotal: YearAcc = {
    y1: interetsEmprunts.y1 + fraisDossierEmprunts.y1 + autresChargesFinancieres.y1,
    y2: interetsEmprunts.y2 + fraisDossierEmprunts.y2 + autresChargesFinancieres.y2,
    y3: interetsEmprunts.y3 + fraisDossierEmprunts.y3 + autresChargesFinancieres.y3,
  };
  const resFin = sum(mc.resFin);
  const resCourant = sum(mc.resCourant);
  const resExcep = sum(mc.resExcep);
  const ajustementNet = _ajustementNet;
  // Passe 2 : resNet et caf incluent déjà l'IS réel (plus de correction post-hoc)
  const resNet = sum(mc.resNet);
  const caf = sum(mc.caf);
  const capitalRembourse = _capital;

  const autofinancement: YearAcc = {
    y1: caf.y1 - capitalRembourse.y1,
    y2: caf.y2 - capitalRembourse.y2,
    y3: caf.y3 - capitalRembourse.y3,
  };

  // ── Agrégats dérivés ────────────────────────────────────────────────────────
  const margeProd: YearAcc = {
    y1: ca.y1 - achatsConsommes.y1,
    y2: ca.y2 - achatsConsommes.y2,
    y3: ca.y3 - achatsConsommes.y3,
  };
  const totalChargesExpl: YearAcc = {
    y1: totalProduitsExpl.y1 - resExpl.y1,
    y2: totalProduitsExpl.y2 - resExpl.y2,
    y3: totalProduitsExpl.y3 - resExpl.y3,
  };

  // ── BFR — variation annuelle exposée dans FinCalcResult ──────────────────
  // Appel minimal : seuls stockFinal, tva, moisDebut, isParAnnee sont requis.
  const { variationBFR } = calcBfr(d, { stockFinal, tva, moisDebut, isParAnnee });

  // ── Drill-down CAF ────────────────────────────────────────────────────────
  const dotationsParImmoAcc = mc.dotationsParImmo.map((d) => ({
    immo: d.immo,
    values: sum(d.series),
  }));

  const capitalRembourseParEmprunt = d.emprunts.map((emprunt) => {
    const values: YearAcc = { y1: 0, y2: 0, y3: 0 };
    for (const ligne of emprunt.lignesEcheancier) {
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance);
      const yk = toExerciceKey(dateStr);
      if (yk) values[yk] += n(ligne.capitalRembourse);
    }
    return { emprunt: { id: emprunt.id, libelle: emprunt.libelle }, values };
  });

  return {
    anneeDebut,
    moisDebut,
    dureeProjection,
    yearLabels,
    toExerciceKey,
    exBorne1,
    exBorne2,
    exBorne3,
    pFin,
    pDeb,
    ca,
    caSeries: mc.ca,
    achatsEffectues,
    stockInitial,
    stockFinal,
    varStock,
    stockFinalSeries,
    stockInitialSeries,
    achatsConsommes,
    chargesExternes,
    fournitures,
    services,
    subventions,
    impotsTaxes,
    chargesPersonnel,
    valeurAjoutee,
    ebe,
    ebeSeries: mc.ebe,
    dotationsAmort,
    dotationsProvisions,
    reprises,
    commissionsTotal,
    prodImmo,
    transferts,
    autresProdGestion,
    autresChargesGestion,
    totalProduitsExpl,
    margeProd,
    totalChargesExpl,
    chargesFinTotal,
    resExpl,
    interetsEmprunts,
    fraisDossierEmprunts,
    capitalRembourse,
    produitsFinanciers,
    autresChargesFinancieres,
    resFin,
    resCourant,
    resExcep,
    ajustementNet,
    isParAnnee,
    resNet,
    resNetSeries: mc.resNet,
    caf,
    capitalRembourseForCAF: capitalRembourse,
    autofinancement,
    variationBFR,
    dotationsParImmoAcc,
    capitalRembourseParEmprunt,
    tva,
    monthlyCalc: mc,
    filteredData: d,
  };
}
