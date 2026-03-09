/**
 * Point d'entrée unique des calculs financiers prévisionnels.
 *
 * `buildFinCalc(data, dateDemarrage)` délègue tous les calculs à
 * `buildMonthlyCalc` (source unique de vérité mensuelle) et somme les séries
 * pour produire les agrégats annuels (YearAcc) utilisés par les actions de
 * contrôle.
 *
 * Objectif : zéro duplication — une seule logique de calcul, disponible en
 * mensuel (budget, trésorerie) ET en annuel (compte de résultat, bilan, etc.).
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, makeExerciceHelpers, type YearAcc } from "@/lib/finance/utils";

import {
  calcInteretsEmprunts,
  calcCapitalRembourse,
} from "./emprunts";
import {
  calcResExcep,
  calcResNet,
} from "./resultats";
import {
  calcAjustementNet,
  calcISParAnnee,
} from "./is";
import {
  buildMonthlyCalc,
  monthlyToYearAcc,
  type MonthlyCalcResult,
} from "./monthly";

export type { YearAcc };

export interface FinCalcResult {
  // ── Labels ────────────────────────────────────────────────────────────────
  anneeDebut: number;
  moisDebut: number;
  yearLabels: Record<"y1" | "y2" | "y3", string>;

  // ── Helpers date ──────────────────────────────────────────────────────────
  toExerciceKey: (date: Date | string) => "y1" | "y2" | "y3" | null;
  exBorne1: Date;
  exBorne2: Date;
  exBorne3: Date;
  pFin: number;
  pDeb: number;

  // ── CA & stocks ───────────────────────────────────────────────────────────
  ca: YearAcc;
  achatsEffectues: YearAcc;
  stockInitial: YearAcc;
  stockFinal: YearAcc;
  varStock: YearAcc;
  achatsConsommes: YearAcc;

  // ── Charges & SIG ─────────────────────────────────────────────────────────
  chargesExternes: YearAcc;
  fournitures: YearAcc;
  services: YearAcc;
  subventions: YearAcc;
  impotsTaxes: YearAcc;
  chargesPersonnel: {
    salairesBruts: YearAcc;
    chargesPatronales: YearAcc;
    remuDirigeant: YearAcc;
    cotisationsTNSTotal: YearAcc;
    taxesSalairesTotal: YearAcc;
    total: YearAcc;
  };
  valeurAjoutee: YearAcc;
  ebe: YearAcc;

  // ── Amortissements & provisions ───────────────────────────────────────────
  dotationsAmort: YearAcc;
  dotationsProvisions: YearAcc;
  reprises: YearAcc;

  // ── Autres produits / charges d'exploitation ──────────────────────────────
  commissionsTotal: YearAcc;
  prodImmo: YearAcc;
  transferts: YearAcc;
  autresProdGestion: YearAcc;
  autresChargesGestion: YearAcc;
  totalProduitsExpl: YearAcc;

  // ── Résultats ─────────────────────────────────────────────────────────────
  resExpl: YearAcc;
  interetsEmprunts: YearAcc;
  fraisDossierEmprunts: YearAcc;
  capitalRembourse: YearAcc;
  produitsFinanciers: YearAcc;
  autresChargesFinancieres: YearAcc;
  resFin: YearAcc;
  resCourant: YearAcc;
  resExcep: YearAcc;
  ajustementNet: YearAcc;
  isParAnnee: YearAcc;
  resNet: YearAcc;

  // ── CAF ───────────────────────────────────────────────────────────────────
  caf: YearAcc;
  capitalRembourseForCAF: YearAcc;
  autofinancement: YearAcc;

  // ── Drill-down CAF ────────────────────────────────────────────────────────
  dotationsParImmoAcc: { immo: { id: string; libelle: string; nature: string }; values: YearAcc }[];
  capitalRembourseParEmprunt: { emprunt: { id: string; libelle: string }; values: YearAcc }[];
}

/**
 * Calcule l'intégralité des agrégats financiers prévisionnels.
 * Délègue tous les calculs à buildMonthlyCalc, puis somme les séries mensuelles.
 * Appeler cette fonction en tête de chaque action de contrôle.
 */
export function buildFinCalc(
  data: ScenarioFinData,
  dateDemarrage: Date,
): FinCalcResult {
  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth();
  const { toExerciceKey, exBorne1, exBorne2, exBorne3, pFin, pDeb } =
    makeExerciceHelpers(dateDemarrage);

  const fmtEx = (start: number): string =>
    moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;

  const yearLabels = {
    y1: fmtEx(anneeDebut),
    y2: fmtEx(anneeDebut + 1),
    y3: fmtEx(anneeDebut + 2),
  };

  // ── IS : nécessite resCourant et resExcep calculés d'abord ────────────────
  // On utilise les helpers emprunts/resultats pour un premier passage annuel
  // permettant de calculer l'IS, qui sera ensuite injecté dans buildMonthlyCalc.
  const _interets = calcInteretsEmprunts(data, toExerciceKey);
  const _capital = calcCapitalRembourse(data, toExerciceKey);
  const _resExcep = calcResExcep(data);
  const _ajustementNet = calcAjustementNet(data);

  // Pré-calcul mensuel sans IS (isParAnnee = 0) pour extraire resCourant annuel
  const _preMonthly = buildMonthlyCalc(data, dateDemarrage, { y1: 0, y2: 0, y3: 0 });
  const _resCourant = monthlyToYearAcc(_preMonthly.resCourant);

  const isParAnnee = calcISParAnnee(
    _resCourant,
    _resExcep,
    _ajustementNet,
    data.parametresIS,
    data.isIS,
  );

  // ── Calcul mensuel final (avec IS) ────────────────────────────────────────
  const mc: MonthlyCalcResult = buildMonthlyCalc(data, dateDemarrage, isParAnnee);

  // ── Agrégats annuels (somme des séries mensuelles) ────────────────────────
  const sum = monthlyToYearAcc;

  const ca = sum(mc.ca);
  const achatsEffectues = sum(mc.achatsEffectues);
  const stockInitial = sum(mc.stockInitial);
  const stockFinal = sum(mc.stockFinal);
  const varStock = sum(mc.varStock);
  const achatsConsommes = sum(mc.achatsConsommes);
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
  const resFin = sum(mc.resFin);
  const resCourant = sum(mc.resCourant);
  const resExcep = sum(mc.resExcep);
  const ajustementNet = _ajustementNet;
  const resNet = sum(mc.resNet);
  const caf = sum(mc.caf);
  const capitalRembourse = _capital;

  const autofinancement: YearAcc = {
    y1: caf.y1 - capitalRembourse.y1,
    y2: caf.y2 - capitalRembourse.y2,
    y3: caf.y3 - capitalRembourse.y3,
  };

  // ── Drill-down CAF ────────────────────────────────────────────────────────
  const dotationsParImmoAcc = mc.dotationsParImmo.map((d) => ({
    immo: d.immo,
    values: sum(d.series),
  }));

  const capitalRembourseParEmprunt = data.emprunts.map((emprunt) => {
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

  // Supprimer les warnings TS sur les variables intermédiaires utilisées
  void pFin; void pDeb; void _interets;

  return {
    anneeDebut,
    moisDebut,
    yearLabels,
    toExerciceKey,
    exBorne1,
    exBorne2,
    exBorne3,
    pFin,
    pDeb,
    ca,
    achatsEffectues,
    stockInitial,
    stockFinal,
    varStock,
    achatsConsommes,
    chargesExternes,
    fournitures,
    services,
    subventions,
    impotsTaxes,
    chargesPersonnel,
    valeurAjoutee,
    ebe,
    dotationsAmort,
    dotationsProvisions,
    reprises,
    commissionsTotal,
    prodImmo,
    transferts,
    autresProdGestion,
    autresChargesGestion,
    totalProduitsExpl,
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
    caf,
    capitalRembourseForCAF: capitalRembourse,
    autofinancement,
    dotationsParImmoAcc,
    capitalRembourseParEmprunt,
  };
}
