/**
 * Calcul des décaissements pour le tableau de trésorerie prévisionnel.
 *
 * Responsabilité unique : produire les séries mensuelles Yk3 de chaque
 * catégorie de décaissement à partir des données du scénario.
 *
 * Fonctions pures, testables unitairement.
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  subSeries,
  sumAll,
  totalOf,
  uniformMonthly,
  seasonalMonthly,
  ponctuelMonthly,
  chargeExplMonthly,
  computeStocksAchatsSeries,
} from "@/lib/finance/calculs/monthly";
import {
  salarieMonthlyBrut,
  shiftSeries,
  shiftSeriesWeighted,
  isQuarterlyDecaissement,
} from "@/lib/finance/tresorerie-engine";
import type { TVACalcResult } from "@/lib/finance/calculs/calc-tva";
import {
  simulerTresorerieUrssafSur3Ans,
  trouverBrutPourNet,
  detecterACRE,
  remuTNSBase,
} from "@/lib/calcul/taux-tns";
import type { RegimeSocial } from "@/lib/schemas/personnel";
import type { Yk3 } from "@/lib/finance/tresorerie-types";
import type { TemporelCtx } from "@/lib/finance/calculs/encaissements";
import { addToYk3 } from "@/lib/finance/calculs/encaissements";

// ── Helpers locaux ─────────────────────────────────────────────────────────────

/** Applique un décalage de paiement (en mois) à une série Yk3 en préservant l'overflow inter-années. */
export function shiftYk3(raw: Yk3, delay: number): Yk3 {
  if (delay <= 0) return raw;
  const { shifted: s1, overflow: ov1 } = shiftSeries(raw.y1, delay);
  const { shifted: s2, overflow: ov2 } = shiftSeries(raw.y2, delay, ov1);
  const { shifted: s3 } = shiftSeries(raw.y3, delay, ov2);
  return { y1: s1, y2: s2, y3: s3 };
}

/**
 * Décaissements TTC d'une charge externe (fourniture ou service) avec décalage + fréquence.
 *
 * Respecte le mode de calcul de detailCalc :
 * - POURCENTAGE_CA → distribution saisonnière via saisonnaliteCA
 * - FIXE (défaut)  → distribution par fréquence (MENSUELLE/TRIMESTRIELLE/SEMESTRIELLE/ANNUELLE)
 */
export function buildChargeExt(
  charge: ScenarioFinData["fournitures"][number],
  isFranchise: boolean,
  defaultDelaiFourn: number,
): Yk3 {
  const coefTVA = isFranchise ? 1 : 1 + n(charge.tauxTVA ?? 20) / 100;
  const delaiMois = n(charge.delaiReglement ?? defaultDelaiFourn) / 30;

  const detail = charge.detailCalc as Record<string, unknown> | null | undefined;
  const freq = (charge.frequence as string) ?? "MENSUELLE";
  let r1: MonthlySeries, r2: MonthlySeries, r3: MonthlySeries;

  if (detail?.modeCalc === "POURCENTAGE_CA" || freq === "PERSONNALISEE") {
    // POURCENTAGE_CA : saisonnaliteCA = % du CA mensuel appliqué sur le montant calculé
    // PERSONNALISEE  : saisonnaliteCA = répartition mensuelle définie par l'utilisateur
    //                  (éditeur "Répartition mensuelle" dans le dialog détaillé)
    r1 = seasonalMonthly(n(charge.montantN) * coefTVA, detail?.["saisonnaliteCA"], "N");
    r2 = seasonalMonthly(n(charge.montantN1) * coefTVA, detail?.["saisonnaliteCA"], "N1");
    r3 = seasonalMonthly(n(charge.montantN2) * coefTVA, detail?.["saisonnaliteCA"], "N2");
  } else {
    // MENSUELLE / TRIMESTRIELLE / SEMESTRIELLE / ANNUELLE : pattern de fréquence + moisPaiement
    // Utilise chargeExplMonthly pour respecter moisPaiement (cohérent avec bfr.ts et monthly.ts)
    r1 = chargeExplMonthly(n(charge.montantN) * coefTVA, charge, "N");
    r2 = chargeExplMonthly(n(charge.montantN1) * coefTVA, charge, "N1");
    r3 = chargeExplMonthly(n(charge.montantN2) * coefTVA, charge, "N2");
  }

  if (delaiMois <= 0) return { y1: r1, y2: r2, y3: r3 };
  const { shifted: s1, overflow: o1 } = shiftSeriesWeighted(r1, delaiMois);
  const { shifted: s2, overflow: o2 } = shiftSeriesWeighted(r2, delaiMois, o1);
  const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, o2);
  return { y1: s1, y2: s2, y3: s3 };
}

// ── Types résultat ─────────────────────────────────────────────────────────────

export interface DecaissementsResult {
  // Immobilisations
  decImmoCorporel: Yk3;
  decImmoIncorporel: Yk3;
  decImmoFinancier: Yk3;
  /** Montant TTC décaissé (le fournisseur facture TTC ; la TVA déductible transite via decTVA) */
  decImmoTTC: Yk3;
  /** Détail par nature pour l'arbre UI — montants TTC cohérents avec decImmoTTC */
  immosParNature: {
    CORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    INCORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    FINANCIER: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
  };
  // Emprunts
  decCapital: Yk3;
  decInterets: Yk3;
  decFraisDossier: Yk3;
  decEmprunts: Yk3;
  // Achats
  decAchats: Yk3;
  activitesAchatData: Array<{
    act: ScenarioFinData["activites"][number];
    yk3: Yk3;
  }>;
  // Charges externes
  decFournitures: Yk3;
  decServices: Yk3;
  decChargesExt: Yk3;
  fournituresData: Array<{ charge: ScenarioFinData["fournitures"][number]; yk3: Yk3 }>;
  servicesData: Array<{ charge: ScenarioFinData["services"][number]; yk3: Yk3 }>;
  // Impôts & taxes
  decImpots: Yk3;
  // Personnel
  decSalairesNets: Yk3;
  decChargesSociales: Yk3;
  decRemuDirigeant: Yk3;
  decCotisationsTNS: Yk3;
  decTaxesSalaires: Yk3;
  decPersonnel: Yk3;
  /** Totaux annuels bruts salariés (pour calcul IS) */
  salairesBruts: Record<"y1" | "y2" | "y3", number>;
  /** Totaux annuels cotisations patronales (pour calcul IS) */
  cotPat: Record<"y1" | "y2" | "y3", number>;
  // TVA
  decTVACollectee: Yk3;
  decTVADeductible: Yk3;
  decTVA: Yk3;
  // IS
  decIS: Yk3;
  // Divers
  decDivers: Yk3;
  // Total
  totalDec: Yk3;
}

// ── Calcul principal ───────────────────────────────────────────────────────────

export function calcDecaissements(
  data: ScenarioFinData,
  ctx: TemporelCtx,
  moisPaiementSalaires: number,
  isParAnnee: Record<"y1" | "y2" | "y3", number>,
  tva: TVACalcResult,
): DecaissementsResult {
  const {
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    parametresIS,
    diversDecaissements,
    diversRemboursementsCC,
    isIS,
    scenario,
  } = data;

  const { yearStarts, isFranchise, moisDebut } = ctx;

  const defaultDelaiFourn = 30;

  // ── Immobilisations ────────────────────────────────────────────────────────
  function calcDecImmos() {
    const immosData = immobilisations.filter((immo) => immo.actif !== false).map((immo) => {
      const yk3: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
      // En trésorerie on décaisse TTC : la TVA récupérable se résorbe via la déclaration TVA (decTVA),
      // la TVA non-récupérable est définitivement perdue — dans les deux cas le flux de caisse est TTC.
      const coefTVA = isFranchise ? 1 : 1 + n(immo.tauxTVA ?? 0) / 100;
      addToYk3(yk3, new Date(immo.dateAcquisition), n(immo.montantHT) * coefTVA, yearStarts);
      return { immo, yk3 };
    });
    function sumImmosGroup(group: typeof immosData): Yk3 {
      return {
        y1: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries() as MonthlySeries),
        y2: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries() as MonthlySeries),
        y3: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries() as MonthlySeries),
      };
    }
    const immosParNature = {
      CORPOREL: immosData.filter(({ immo }) => immo.nature === "CORPOREL"),
      INCORPOREL: immosData.filter(({ immo }) => immo.nature === "INCORPOREL"),
      FINANCIER: immosData.filter(({ immo }) => immo.nature === "FINANCIER"),
    };
    const decImmoCorporel = sumImmosGroup(immosParNature.CORPOREL);
    const decImmoIncorporel = sumImmosGroup(immosParNature.INCORPOREL);
    const decImmoFinancier = sumImmosGroup(immosParNature.FINANCIER);
    const decImmoTTC: Yk3 = {
      y1: sumAll(decImmoCorporel.y1, decImmoIncorporel.y1, decImmoFinancier.y1),
      y2: sumAll(decImmoCorporel.y2, decImmoIncorporel.y2, decImmoFinancier.y2),
      y3: sumAll(decImmoCorporel.y3, decImmoIncorporel.y3, decImmoFinancier.y3),
    };
    return { immosParNature, decImmoCorporel, decImmoIncorporel, decImmoFinancier, decImmoTTC };
  }
  const { immosParNature, decImmoCorporel, decImmoIncorporel, decImmoFinancier, decImmoTTC } = calcDecImmos();

  // ── Emprunts ───────────────────────────────────────────────────────────────
  function calcDecEmprunts() {
    const decCapital: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    const decInterets: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    const decFraisDossier: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    for (const emprunt of emprunts) {
      for (const ligne of emprunt.lignesEcheancier) {
        const date = new Date(ligne.dateEcheance);
        addToYk3(decCapital, date, n(ligne.capitalRembourse), yearStarts);
        addToYk3(decInterets, date, n(ligne.interesMois) + n(ligne.assuranceMois), yearStarts);
      }
      // Frais de dossier décaissés à la date de déblocage
      const frais = n(emprunt.fraisDossier ?? 0);
      if (frais > 0) {
        addToYk3(decFraisDossier, new Date(emprunt.dateDéblocage), frais, yearStarts);
      }
    }
    const decEmprunts: Yk3 = {
      y1: sumAll(decCapital.y1, decInterets.y1, decFraisDossier.y1),
      y2: sumAll(decCapital.y2, decInterets.y2, decFraisDossier.y2),
      y3: sumAll(decCapital.y3, decInterets.y3, decFraisDossier.y3),
    };
    return { decCapital, decInterets, decFraisDossier, decEmprunts };
  }
  const { decCapital, decInterets, decFraisDossier, decEmprunts } = calcDecEmprunts();

  // ── Achats TTC (avec délai fournisseur) ────────────────────────────────────
  function calcDecAchats() {
  const activitesAchatData = activites
    .filter((act) => act.typeActivite !== "PRESTATION_SERVICES")
    .map((act) => {
      const coef = Math.max(0, 1 - n(act.tauxMarge) / 100);
      const coefTVA = isFranchise ? 1 : 1 + n(act.tvaAchats ?? 20) / 100;
      const delaiMois = n(act.reglementFournisseurs ?? defaultDelaiFourn) / 30;
      // Achats consommés récurrents (base saisonnalisée, HT)
      const base1 = seasonalMonthly(n(act.montantN) * coef, act.saisonnaliteAchats, "N");
      const base2 = seasonalMonthly(n(act.montantN1) * coef, act.saisonnaliteAchats, "N1");
      const base3 = seasonalMonthly(n(act.montantN2) * coef, act.saisonnaliteAchats, "N2");

      // ── Formule RCA cumulative (identique à monthly.ts et bfr.ts) ──────────
      // achatsEff[j] = conso[j] + sf[j] − si[j]
      // La cohérence avec bfr.ts est garantie : même fonction, mêmes paramètres.
      // → les dettes fournisseurs BFR (achatsEff[11] × coefTTC × délai) correspondent
      //   exactement aux encours implicites du tableau de trésorerie.
      const joursStock = n(act.stocks ?? 0);
      const ponctuelY1 = ponctuelMonthly(act.achatsStockPonctuel, "N");
      const ponctuelY2 = ponctuelMonthly(act.achatsStockPonctuel, "N1");
      const ponctuelY3 = ponctuelMonthly(act.achatsStockPonctuel, "N2");
      const rY1 = computeStocksAchatsSeries(base1, ponctuelY1, joursStock, 0);
      const rY2 = computeStocksAchatsSeries(base2, ponctuelY2, joursStock, rY1.sfFinal);
      const rY3 = computeStocksAchatsSeries(base3, ponctuelY3, joursStock, rY2.sfFinal);

      // Conversion HT → TTC.
      // Note : ponctuelY1[0] est le stock initial pré-financé (BFR initial).
      // Dans la formule RCA (si=0, ponc[0]=stockInit), son effet est distribué
      // sur les achatsEff de l'exercice via la courbe cumulative — la somme
      // annuelle reste identique à l'ancienne formule (consoHT + sfFinal) × coefTTC.
      // Cela garantit que l'overflow implicite de décembre = dettes fournisseurs
      // bfr.ts (achatsEff[11] × coefTTC × délai), éliminant l'écart tréso/bilan.
      const r1 = rY1.achatsEffSeries.map((v) => v * coefTVA) as MonthlySeries;
      const r2 = rY2.achatsEffSeries.map((v) => v * coefTVA) as MonthlySeries;
      const r3 = rY3.achatsEffSeries.map((v) => v * coefTVA) as MonthlySeries;

      // Application du délai fournisseur
      let s1: MonthlySeries, s2: MonthlySeries, s3: MonthlySeries;
      if (delaiMois <= 0) {
        s1 = r1; s2 = r2; s3 = r3;
      } else {
        const { shifted: _s1, overflow: ov1 } = shiftSeriesWeighted(r1, delaiMois);
        const { shifted: _s2, overflow: ov2 } = shiftSeriesWeighted(r2, delaiMois, ov1);
        const { shifted: _s3 } = shiftSeriesWeighted(r3, delaiMois, ov2);
        s1 = _s1; s2 = _s2; s3 = _s3;
      }
      return { act, yk3: { y1: s1, y2: s2, y3: s3 } as Yk3 };
    });

  const decAchats: Yk3 = {
    y1: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries() as MonthlySeries),
    y2: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries() as MonthlySeries),
    y3: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries() as MonthlySeries),
  };
    return { activitesAchatData, decAchats };
  }
  const { activitesAchatData, decAchats } = calcDecAchats();

  // ── Charges externes ───────────────────────────────────────────────────────
  function calcDecChargesExt() {
    const fournituresData = fournitures.map((c) => ({
      charge: c,
      yk3: buildChargeExt(c, isFranchise, defaultDelaiFourn),
    }));
    const servicesData = services.map((c) => ({
      charge: c,
      yk3: buildChargeExt(c, isFranchise, defaultDelaiFourn),
    }));
    const decFournitures: Yk3 = {
      y1: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries() as MonthlySeries),
      y2: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries() as MonthlySeries),
      y3: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries() as MonthlySeries),
    };
    const decServices: Yk3 = {
      y1: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries() as MonthlySeries),
      y2: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries() as MonthlySeries),
      y3: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries() as MonthlySeries),
    };
    const decChargesExt: Yk3 = {
      y1: sumSeries(decFournitures.y1, decServices.y1),
      y2: sumSeries(decFournitures.y2, decServices.y2),
      y3: sumSeries(decFournitures.y3, decServices.y3),
    };
    return { fournituresData, servicesData, decFournitures, decServices, decChargesExt };
  }
  const { fournituresData, servicesData, decFournitures, decServices, decChargesExt } = calcDecChargesExt();

  // ── Impôts et taxes ────────────────────────────────────────────────────────
  function calcDecImpotsTaxes() {
    const decImpots: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    for (const impot of impotsTaxes) {
      const v1 = n(impot.montantN ?? 0);
      const v2 = n(impot.montantN1 ?? 0);
      const v3 = n(impot.montantN2 ?? 0);
      if (impot.dateN && v1 > 0) {
        addToYk3(decImpots, new Date(impot.dateN), v1, yearStarts);
      } else if (v1 > 0) {
        decImpots.y1 = sumSeries(decImpots.y1, uniformMonthly(v1));
      }
      if (impot.dateN1 && v2 > 0) {
        addToYk3(decImpots, new Date(impot.dateN1), v2, yearStarts);
      } else if (v2 > 0) {
        decImpots.y2 = sumSeries(decImpots.y2, uniformMonthly(v2));
      }
      if (impot.dateN2 && v3 > 0) {
        addToYk3(decImpots, new Date(impot.dateN2), v3, yearStarts);
      } else if (v3 > 0) {
        decImpots.y3 = sumSeries(decImpots.y3, uniformMonthly(v3));
      }
    }
    return { decImpots };
  }
  const { decImpots } = calcDecImpotsTaxes();

  // ── Personnel ──────────────────────────────────────────────────────────────
  function calcDecPersonnel() {
  let brutSeriesY1: MonthlySeries = zeroSeries();
  let brutSeriesY2: MonthlySeries = zeroSeries();
  let brutSeriesY3: MonthlySeries = zeroSeries();
  let cotSalSeriesY1: MonthlySeries = zeroSeries();
  let cotSalSeriesY2: MonthlySeries = zeroSeries();
  let cotSalSeriesY3: MonthlySeries = zeroSeries();
  let cotPatSeriesY1: MonthlySeries = zeroSeries();
  let cotPatSeriesY2: MonthlySeries = zeroSeries();
  let cotPatSeriesY3: MonthlySeries = zeroSeries();

  for (const sal of salaries.filter((s) => s.actif !== false)) {
    const tCotSal = n(sal.tauxCotSal ?? 22) / 100;
    const tCotPat = n(sal.tauxCotPat) / 100;
    const b1 = salarieMonthlyBrut(n(sal.montantN), sal.detailMensuelN, moisDebut);
    const b2 = salarieMonthlyBrut(n(sal.montantN1), sal.detailMensuelN1, moisDebut);
    const b3 = salarieMonthlyBrut(n(sal.montantN2), sal.detailMensuelN2, moisDebut);
    brutSeriesY1 = sumSeries(brutSeriesY1, b1);
    brutSeriesY2 = sumSeries(brutSeriesY2, b2);
    brutSeriesY3 = sumSeries(brutSeriesY3, b3);
    cotSalSeriesY1 = sumSeries(cotSalSeriesY1, b1.map((v) => v * tCotSal) as MonthlySeries);
    cotSalSeriesY2 = sumSeries(cotSalSeriesY2, b2.map((v) => v * tCotSal) as MonthlySeries);
    cotSalSeriesY3 = sumSeries(cotSalSeriesY3, b3.map((v) => v * tCotSal) as MonthlySeries);
    cotPatSeriesY1 = sumSeries(cotPatSeriesY1, b1.map((v) => v * tCotPat) as MonthlySeries);
    cotPatSeriesY2 = sumSeries(cotPatSeriesY2, b2.map((v) => v * tCotPat) as MonthlySeries);
    cotPatSeriesY3 = sumSeries(cotPatSeriesY3, b3.map((v) => v * tCotPat) as MonthlySeries);
  }

  const salairesBruts = {
    y1: totalOf(brutSeriesY1),
    y2: totalOf(brutSeriesY2),
    y3: totalOf(brutSeriesY3),
  };
  const cotPat = {
    y1: totalOf(cotPatSeriesY1),
    y2: totalOf(cotPatSeriesY2),
    y3: totalOf(cotPatSeriesY3),
  };

  let remuDirigeantY1: MonthlySeries = zeroSeries();
  let remuDirigeantY2: MonthlySeries = zeroSeries();
  let remuDirigeantY3: MonthlySeries = zeroSeries();
  for (const d of dirigeants.filter((d) => d.actif !== false)) {
    remuDirigeantY1 = sumSeries(remuDirigeantY1, salarieMonthlyBrut(n(d.montantN), d.detailMensuelN, moisDebut));
    remuDirigeantY2 = sumSeries(remuDirigeantY2, salarieMonthlyBrut(n(d.montantN1), d.detailMensuelN1, moisDebut));
    remuDirigeantY3 = sumSeries(remuDirigeantY3, salarieMonthlyBrut(n(d.montantN2), d.detailMensuelN2, moisDebut));
  }

  const decSalairesNets = shiftYk3(
    {
      y1: subSeries(brutSeriesY1, cotSalSeriesY1),
      y2: subSeries(brutSeriesY2, cotSalSeriesY2),
      y3: subSeries(brutSeriesY3, cotSalSeriesY3),
    },
    moisPaiementSalaires,
  );
  const decChargesSociales = shiftYk3(
    {
      y1: sumSeries(cotSalSeriesY1, cotPatSeriesY1),
      y2: sumSeries(cotSalSeriesY2, cotPatSeriesY2),
      y3: sumSeries(cotSalSeriesY3, cotPatSeriesY3),
    },
    moisPaiementSalaires,
  );
  const decRemuDirigeant = shiftYk3(
    { y1: remuDirigeantY1, y2: remuDirigeantY2, y3: remuDirigeantY3 },
    moisPaiementSalaires,
  );
  const decCotisationsTNS = (() => {
    // En mode "Début d'activité forfait", le calendrier encaissé URSSAF diffère
    // des charges définitives (forfait N + régularisation décalée en N+1/N+2).
    // → La trésorerie utilise le calendrier URSSAF réel ; le CR/bilan utilise
    //   les montants définitifs stockés en BDD (séparation comptable correcte).
    const tnsModeCalcul = scenario.parametres?.tnsModeCalcul ?? "DEFINITIF";
    const dirigeantsActifs = dirigeants.filter((d) => d.actif !== false);
    if (tnsModeCalcul === "DEBUT_ACTIVITE_FORFAIT" && dirigeantsActifs.length > 0) {
      const tnsRegimeSocial = (scenario.parametres?.tnsRegimeSocial ?? "commerce") as RegimeSocial;
      const tnsDir = dirigeantsActifs.map((d) => ({
        actif: d.actif,
        montantN: n(d.montantN),
        montantN1: n(d.montantN1),
        montantN2: n(d.montantN2),
        tauxFixe: n(d.tauxFixe),
        exonerationTNS: d.exonerationTNS ?? undefined,
      }));
      const { remuN, remuN1, remuN2 } = remuTNSBase(tnsDir);
      const acreN = detecterACRE(tnsDir);
      const simN  = trouverBrutPourNet(remuN,  tnsRegimeSocial, acreN,  { mode: "DEFINITIF" });
      const simN1 = trouverBrutPourNet(remuN1, tnsRegimeSocial, false, { mode: "DEFINITIF" });
      const simN2 = trouverBrutPourNet(remuN2, tnsRegimeSocial, false, { mode: "DEFINITIF" });
      const treso = simulerTresorerieUrssafSur3Ans({
        brutN: simN.brut, brutN1: simN1.brut, brutN2: simN2.brut,
        regime: tnsRegimeSocial, acreN,
      });
      // Cotisations facultatives (Madelin, non-Madelin, etc.) : calcAuto = false
      // → non couvertes par la simulation URSSAF → traitement DEFINITIF (mensuel uniforme).
      const cotsFac = cotisationsTNS.filter((c) => c.actif !== false && !c.calcAuto);
      const facY1 = cotsFac.reduce((s, c) => s + n(c.montantN), 0);
      const facY2 = cotsFac.reduce((s, c) => s + n(c.montantN1), 0);
      const facY3 = cotsFac.reduce((s, c) => s + n(c.montantN2), 0);
      return shiftYk3(
        {
          y1: sumSeries(uniformMonthly(treso[0].totalPaye), uniformMonthly(facY1)),
          y2: sumSeries(uniformMonthly(treso[1].totalPaye), uniformMonthly(facY2)),
          y3: sumSeries(uniformMonthly(treso[2].totalPaye), uniformMonthly(facY3)),
        },
        moisPaiementSalaires,
      );
    }
    // Mode DEFINITIF : utiliser les montants définitifs stockés en BDD
    const activeCotisations = cotisationsTNS.filter((c) => c.actif !== false);
    return shiftYk3(
      {
        y1: uniformMonthly(activeCotisations.reduce((s, c) => s + n(c.montantN), 0)),
        y2: uniformMonthly(activeCotisations.reduce((s, c) => s + n(c.montantN1), 0)),
        y3: uniformMonthly(activeCotisations.reduce((s, c) => s + n(c.montantN2), 0)),
      },
      moisPaiementSalaires,
    );
  })();

  // ── Taxes assises sur salaires ──────────────────────────────────────────────
  const decTaxesSalairesY1 = zeroSeries();
  const decTaxesSalairesY2 = zeroSeries();
  const decTaxesSalairesY3 = zeroSeries();
  for (const taxe of taxesSalaires.filter((t) => t.actif !== false)) {
    const amt1 = n(taxe.montantN);
    const amt2 = n(taxe.montantN1);
    const amt3 = n(taxe.montantN2);
    const seriesCtx: Yk3 = { y1: decTaxesSalairesY1, y2: decTaxesSalairesY2, y3: decTaxesSalairesY3 };
    if (taxe.dateN) {
      addToYk3(seriesCtx, new Date(taxe.dateN), amt1, yearStarts);
    } else {
      const spread1 = uniformMonthly(amt1);
      for (let m = 0; m < 12; m++) decTaxesSalairesY1[m] = (decTaxesSalairesY1[m] ?? 0) + (spread1[m] ?? 0);
    }
    if (taxe.dateN1) {
      addToYk3(seriesCtx, new Date(taxe.dateN1), amt2, yearStarts);
    } else {
      const spread2 = uniformMonthly(amt2);
      for (let m = 0; m < 12; m++) decTaxesSalairesY2[m] = (decTaxesSalairesY2[m] ?? 0) + (spread2[m] ?? 0);
    }
    if (taxe.dateN2) {
      addToYk3(seriesCtx, new Date(taxe.dateN2), amt3, yearStarts);
    } else {
      const spread3 = uniformMonthly(amt3);
      for (let m = 0; m < 12; m++) decTaxesSalairesY3[m] = (decTaxesSalairesY3[m] ?? 0) + (spread3[m] ?? 0);
    }
  }
  const decTaxesSalaires: Yk3 = {
    y1: decTaxesSalairesY1,
    y2: decTaxesSalairesY2,
    y3: decTaxesSalairesY3,
  };

  const decPersonnel: Yk3 = {
    y1: sumAll(decSalairesNets.y1, decChargesSociales.y1, decRemuDirigeant.y1, decCotisationsTNS.y1, decTaxesSalaires.y1),
    y2: sumAll(decSalairesNets.y2, decChargesSociales.y2, decRemuDirigeant.y2, decCotisationsTNS.y2, decTaxesSalaires.y2),
    y3: sumAll(decSalairesNets.y3, decChargesSociales.y3, decRemuDirigeant.y3, decCotisationsTNS.y3, decTaxesSalaires.y3),
  };
    return {
      decSalairesNets, decChargesSociales, decRemuDirigeant, decCotisationsTNS,
      decTaxesSalaires, decPersonnel, salairesBruts, cotPat,
    };
  }
  const {
    decSalairesNets, decChargesSociales, decRemuDirigeant, decCotisationsTNS,
    decTaxesSalaires, decPersonnel, salairesBruts, cotPat,
  } = calcDecPersonnel();

  // ── TVA + IS ───────────────────────────────────────────────────────────────
  function calcDecTVAetIS() {
    const decTVACollectee: Yk3 = { y1: tva.tvaCollectee.y1, y2: tva.tvaCollectee.y2, y3: tva.tvaCollectee.y3 };
    const decTVADeductible: Yk3 = { y1: tva.tvaDeductible.y1, y2: tva.tvaDeductible.y2, y3: tva.tvaDeductible.y3 };
    const decTVA: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    if (!isFranchise) {
      // La TVA du mois M est payée le 19 du mois M+1 (décalage 1 mois).
      const { y1: s1, y2: s2, y3: s3 } = shiftYk3(
        { y1: tva.y1.tvaAPayerMonthly, y2: tva.y2.tvaAPayerMonthly, y3: tva.y3.tvaAPayerMonthly },
        1,
      );
      decTVA.y1 = s1; decTVA.y2 = s2; decTVA.y3 = s3;
    }
    // Convention : 3 acomptes dans l'exercice courant (M3, M6, M9) + solde exercice précédent (M12).
    // Cohérent avec dettesIS = IS/4 dans le BFR (1 acompte en attente à la clôture).
    // Formule : decIS_Y = 3/4·IS_Y + 1/4·IS_{Y-1}  ←→  IS_Y + dette_{Y-1} − dette_Y
    const decIS: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    if (isIS && parametresIS?.isEnabled !== false) {
      decIS.y1 = isQuarterlyDecaissement(isParAnnee.y1, 0);                          // pas d'IS en Y0
      decIS.y2 = isQuarterlyDecaissement(isParAnnee.y2, isParAnnee.y1);
      decIS.y3 = isQuarterlyDecaissement(isParAnnee.y3, isParAnnee.y2);
    }
    return { decTVACollectee, decTVADeductible, decTVA, decIS };
  }
  const { decTVACollectee, decTVADeductible, decTVA, decIS } = calcDecTVAetIS();

  // ── Décaissements divers ────────────────────────────────────────────────────
  const decDivers: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const flux of [...diversDecaissements, ...diversRemboursementsCC]) {
    if (flux.dateN) addToYk3(decDivers, new Date(flux.dateN), n(flux.montantN), yearStarts);
    else decDivers.y1 = sumSeries(decDivers.y1, uniformMonthly(n(flux.montantN)));
    if (flux.dateN1) addToYk3(decDivers, new Date(flux.dateN1), n(flux.montantN1), yearStarts);
    else decDivers.y2 = sumSeries(decDivers.y2, uniformMonthly(n(flux.montantN1)));
    if (flux.dateN2) addToYk3(decDivers, new Date(flux.dateN2), n(flux.montantN2), yearStarts);
    else decDivers.y3 = sumSeries(decDivers.y3, uniformMonthly(n(flux.montantN2)));
  }

  // ── Total décaissements ────────────────────────────────────────────────────
  const totalDec: Yk3 = {
    y1: sumAll(decImmoTTC.y1, decEmprunts.y1, decAchats.y1, decChargesExt.y1, decImpots.y1, decPersonnel.y1, decTVA.y1, decIS.y1, decDivers.y1),
    y2: sumAll(decImmoTTC.y2, decEmprunts.y2, decAchats.y2, decChargesExt.y2, decImpots.y2, decPersonnel.y2, decTVA.y2, decIS.y2, decDivers.y2),
    y3: sumAll(decImmoTTC.y3, decEmprunts.y3, decAchats.y3, decChargesExt.y3, decImpots.y3, decPersonnel.y3, decTVA.y3, decIS.y3, decDivers.y3),
  };

  return {
    decImmoCorporel,
    decImmoIncorporel,
    decImmoFinancier,
    decImmoTTC,
    immosParNature,
    decCapital,
    decInterets,
    decFraisDossier,
    decEmprunts,
    decAchats,
    activitesAchatData,
    decFournitures,
    decServices,
    decChargesExt,
    fournituresData,
    servicesData,
    decImpots,
    decSalairesNets,
    decChargesSociales,
    decRemuDirigeant,
    decCotisationsTNS,
    decTaxesSalaires,
    decPersonnel,
    salairesBruts,
    cotPat,
    decTVACollectee,
    decTVADeductible,
    decTVA,
    decIS,
    decDivers,
    totalDec,
  };
}
