/**
 * Calcul des encaissements pour le tableau de trésorerie prévisionnel.
 *
 * Responsabilité unique : produire les séries mensuelles Yk3 de chaque
 * catégorie d'encaissement à partir des données du scénario.
 *
 * Fonctions pures, testables unitairement.
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  sumAll,
  uniformMonthly,
  seasonalMonthly,
  ponctuelMonthly,
} from "@/lib/finance/calculs/monthly";
import { shiftSeriesWeighted } from "@/lib/finance/tresorerie-engine";
import type { Yk3 } from "@/lib/finance/tresorerie-types";

// ── Contexte temporel (définitions déplacées vers pipeline/calendar) ──────────
import type { TemporelCtx } from "@/lib/finance/pipeline/calendar";
import { dateToSlot } from "@/lib/finance/pipeline/calendar";
export type { TemporelCtx } from "@/lib/finance/pipeline/calendar";
export { buildTemporelCtx, dateToSlot } from "@/lib/finance/pipeline/calendar";

export function addToYk3(
  series: Yk3,
  date: Date,
  amount: number,
  yearStarts: TemporelCtx["yearStarts"],
): void {
  const { yk, mi } = dateToSlot(date, yearStarts);
  if (yk && mi >= 0) series[yk][mi] = (series[yk][mi] ?? 0) + amount;
}

// ── Encaissements ─────────────────────────────────────────────────────────────

export interface EncaissementsResult {
  encApportsCapital: Yk3;
  encApportsCC: Yk3;
  encEmprunts: Yk3;
  encProdVendue: Yk3;
  encSubvExpl: Yk3;
  encSubvInvest: Yk3;
  encDivers: Yk3;
  totalEnc: Yk3;
  /** Détail par activité (pour les lignes enfants de l'arbre UI) */
  activitesEncData: Array<{
    act: ScenarioFinData["activites"][number];
    yk3: Yk3;
  }>;
}

export function calcEncaissements(
  data: Pick<
    ScenarioFinData,
    | "apports"
    | "subventions"
    | "emprunts"
    | "activites"
    | "subventionsExploitation"
    | "diversEncaissements"
  >,
  ctx: TemporelCtx,
): EncaissementsResult {
  const { yearStarts, isFranchise, defaultDelaiClients } = ctx;

  // ── Apports capital & comptes courants ──────────────────────────────────────
  const encApportsCapital: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  const encApportsCC: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };

  for (const apport of data.apports) {
    const amt = n(apport.montant);
    const date = new Date(apport.dateApport);
    if (apport.type === "CAPITAL" || apport.type === "APPORT_NATURE") {
      addToYk3(encApportsCapital, date, amt, yearStarts);
    } else if (apport.type === "COMPTE_COURANT") {
      addToYk3(encApportsCC, date, amt, yearStarts);
    }
  }
  for (const subv of data.subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (d) addToYk3(encApportsCC, new Date(d), n(subv.montant), yearStarts);
  }

  // ── Déblocages emprunts ─────────────────────────────────────────────────────
  const encEmprunts: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const emprunt of data.emprunts) {
    addToYk3(encEmprunts, new Date(emprunt.dateDéblocage), n(emprunt.montant), yearStarts);
  }

  // ── Production vendue TTC (avec décalage client) ────────────────────────────
  const activitesEncData = data.activites.map((act) => {
    const coefTTC = isFranchise ? 1 : 1 + n(act.tauxTVA) / 100;
    const delaiMois = n(act.reglementClients ?? defaultDelaiClients) / 30;
    const r1 = seasonalMonthly(n(act.montantN) * coefTTC, act.saisonnaliteCA, "N");
    const r2 = seasonalMonthly(n(act.montantN1) * coefTTC, act.saisonnaliteCA, "N1");
    const r3 = seasonalMonthly(n(act.montantN2) * coefTTC, act.saisonnaliteCA, "N2");
    if (delaiMois <= 0) return { act, yk3: { y1: r1, y2: r2, y3: r3 } as Yk3 };
    const { shifted: s1, overflow: ov1 } = shiftSeriesWeighted(r1, delaiMois);
    const { shifted: s2, overflow: ov2 } = shiftSeriesWeighted(r2, delaiMois, ov1);
    const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, ov2);
    return { act, yk3: { y1: s1, y2: s2, y3: s3 } as Yk3 };
  });

  const encProdVendue: Yk3 = {
    y1: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
    y2: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
    y3: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
  };

  // ── Subventions d'exploitation ──────────────────────────────────────────────
  const encSubvExpl: Yk3 = {
    y1: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN), 0)),
    y2: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN1), 0)),
    y3: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN2), 0)),
  };

  // ── Subventions d'investissement (par date) ─────────────────────────────────
  const encSubvInvest: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const subv of data.subventions) {
    if (subv.type === "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (d) addToYk3(encSubvInvest, new Date(d), n(subv.montant), yearStarts);
  }

  // ── Encaissements divers ────────────────────────────────────────────────────
  const encDivers: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const flux of data.diversEncaissements) {
    if (flux.dateN) addToYk3(encDivers, new Date(flux.dateN), n(flux.montantN), yearStarts);
    else encDivers.y1 = sumSeries(encDivers.y1, uniformMonthly(n(flux.montantN)));
    if (flux.dateN1) addToYk3(encDivers, new Date(flux.dateN1), n(flux.montantN1), yearStarts);
    else encDivers.y2 = sumSeries(encDivers.y2, uniformMonthly(n(flux.montantN1)));
    if (flux.dateN2) addToYk3(encDivers, new Date(flux.dateN2), n(flux.montantN2), yearStarts);
    else encDivers.y3 = sumSeries(encDivers.y3, uniformMonthly(n(flux.montantN2)));
  }

  // ── Total ───────────────────────────────────────────────────────────────────
  const totalEnc: Yk3 = {
    y1: sumAll(encApportsCapital.y1, encApportsCC.y1, encEmprunts.y1, encProdVendue.y1, encSubvExpl.y1, encSubvInvest.y1, encDivers.y1),
    y2: sumAll(encApportsCapital.y2, encApportsCC.y2, encEmprunts.y2, encProdVendue.y2, encSubvExpl.y2, encSubvInvest.y2, encDivers.y2),
    y3: sumAll(encApportsCapital.y3, encApportsCC.y3, encEmprunts.y3, encProdVendue.y3, encSubvExpl.y3, encSubvInvest.y3, encDivers.y3),
  };

  return {
    encApportsCapital,
    encApportsCC,
    encEmprunts,
    encProdVendue,
    encSubvExpl,
    encSubvInvest,
    encDivers,
    totalEnc,
    activitesEncData,
  };
}

/**
 * Série brute TTC des achats (sans décalage fournisseur) — utilisée pour les encours.
 * Inclut les achats récurrents et ponctuels, en TTC avec le taux TVA propre à chaque activité.
 * Doit rester cohérent (même unité, même périmètre) avec decAchats issu de calcDecaissements.
 */
export function calcAchatsRaw(
  activites: ScenarioFinData["activites"],
  isFranchise: boolean,
): Yk3 {
  const achatActivites = activites.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");
  const result: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
  for (const a of achatActivites) {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const coefTVA = isFranchise ? 1 : 1 + n(a.tvaAchats ?? 20) / 100;
    // Achats récurrents TTC
    result.y1 = sumSeries(result.y1, seasonalMonthly(n(a.montantN) * coef * coefTVA, a.saisonnaliteAchats, "N"));
    result.y2 = sumSeries(result.y2, seasonalMonthly(n(a.montantN1) * coef * coefTVA, a.saisonnaliteAchats, "N1"));
    result.y3 = sumSeries(result.y3, seasonalMonthly(n(a.montantN2) * coef * coefTVA, a.saisonnaliteAchats, "N2"));
    // Achats ponctuels TTC (délai = 0, donc raw == paid → n'influencent pas l'encours)
    result.y1 = sumSeries(result.y1, ponctuelMonthly(a.achatsStockPonctuel, "N").map((v) => v * coefTVA) as MonthlySeries);
    result.y2 = sumSeries(result.y2, ponctuelMonthly(a.achatsStockPonctuel, "N1").map((v) => v * coefTVA) as MonthlySeries);
    result.y3 = sumSeries(result.y3, ponctuelMonthly(a.achatsStockPonctuel, "N2").map((v) => v * coefTVA) as MonthlySeries);
  }
  return result;
}

/**
 * Calcule les encours fournisseurs courants (solde tournant sur 3 ans).
 * raw et paid doivent être dans la même unité (TTC).
 * running[m] = running[m-1] + achats_TTC[m] - paiements_TTC[m]
 */
export function calcEncoursFournisseurs(
  decAchatsRaw: Yk3,
  decAchats: Yk3,
): Yk3 {
  function computeYear(
    raw: MonthlySeries,
    paid: MonthlySeries,
    initialEncours: number,
  ): MonthlySeries {
    const result = zeroSeries();
    let running = initialEncours;
    for (let m = 0; m < 12; m++) {
      running = running + (raw[m] ?? 0) - (paid[m] ?? 0);
      result[m] = Math.max(0, running);
    }
    return result;
  }

  const y1 = computeYear(decAchatsRaw.y1, decAchats.y1, 0);
  const y2 = computeYear(decAchatsRaw.y2, decAchats.y2, y1[11] ?? 0);
  const y3 = computeYear(decAchatsRaw.y3, decAchats.y3, y2[11] ?? 0);
  return { y1, y2, y3 };
}
