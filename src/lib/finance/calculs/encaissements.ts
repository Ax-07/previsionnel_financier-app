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
import type { YearKey } from "@/lib/finance/types/series";

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
  if (yk && mi >= 0 && mi < series[yk].length) {
    (series[yk] as number[])[mi] = ((series[yk] as number[])[mi] ?? 0) + amount;
  }
}

const DEFAULT_DUREES: Record<YearKey, number> = { y1: 12, y2: 12, y3: 12 };

function dureesFromCtx(ctx: Pick<TemporelCtx, "dureesMois">): Record<YearKey, number> {
  return ctx.dureesMois ?? DEFAULT_DUREES;
}

function zeroYk3(durees: Record<YearKey, number>): Yk3 {
  return {
    y1: zeroSeries(durees.y1),
    y2: zeroSeries(durees.y2),
    y3: zeroSeries(durees.y3),
  };
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
  const { yearStarts, isFranchise } = ctx;
  const nMoisCtx = dureesFromCtx(ctx);

  // ── Apports capital & comptes courants ──────────────────────────────────────
  const encApportsCapital: Yk3 = zeroYk3(nMoisCtx);
  const encApportsCC: Yk3 = zeroYk3(nMoisCtx);

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
  const encEmprunts: Yk3 = zeroYk3(nMoisCtx);
  for (const emprunt of data.emprunts) {
    addToYk3(encEmprunts, new Date(emprunt.dateDéblocage), n(emprunt.montant), yearStarts);
  }

  // ── Production vendue TTC (avec décalage client) ────────────────────────────
  const activitesEncData = data.activites.map((act) => {
    const coefTTC = isFranchise ? 1 : 1 + n(act.tauxTVA) / 100;
    const delaiMois = n(act.reglementClients ?? 30) / 30;
    const r1 = seasonalMonthly(n(act.montantN) * coefTTC, act.saisonnaliteCA, "N", nMoisCtx.y1);
    const r2 = seasonalMonthly(n(act.montantN1) * coefTTC, act.saisonnaliteCA, "N1", nMoisCtx.y2);
    const r3 = seasonalMonthly(n(act.montantN2) * coefTTC, act.saisonnaliteCA, "N2", nMoisCtx.y3);
    if (delaiMois <= 0) return { act, yk3: { y1: r1, y2: r2, y3: r3 } as Yk3 };
    const { shifted: s1, overflow: ov1 } = shiftSeriesWeighted(r1, delaiMois, undefined, nMoisCtx.y1, nMoisCtx.y2);
    const { shifted: s2, overflow: ov2 } = shiftSeriesWeighted(r2, delaiMois, ov1, nMoisCtx.y2, nMoisCtx.y3);
    const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, ov2, nMoisCtx.y3, 0);
    return { act, yk3: { y1: s1, y2: s2, y3: s3 } as Yk3 };
  });

  const encProdVendue: Yk3 = {
    y1: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries(nMoisCtx.y1) as MonthlySeries),
    y2: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries(nMoisCtx.y2) as MonthlySeries),
    y3: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries(nMoisCtx.y3) as MonthlySeries),
  };

  // ── Subventions d'exploitation ──────────────────────────────────────────────
  const encSubvExpl: Yk3 = {
    y1: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN), 0), nMoisCtx.y1),
    y2: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN1), 0), nMoisCtx.y2),
    y3: uniformMonthly(data.subventionsExploitation.reduce((s, sv) => s + n(sv.montantN2), 0), nMoisCtx.y3),
  };

  // ── Subventions d'investissement (par date) ─────────────────────────────────
  const encSubvInvest: Yk3 = zeroYk3(nMoisCtx);
  for (const subv of data.subventions) {
    if (subv.type === "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (d) addToYk3(encSubvInvest, new Date(d), n(subv.montant), yearStarts);
  }

  // ── Encaissements divers ────────────────────────────────────────────────────
  const encDivers: Yk3 = zeroYk3(nMoisCtx);
  for (const flux of data.diversEncaissements) {
    if (flux.dateN) addToYk3(encDivers, new Date(flux.dateN), n(flux.montantN), yearStarts);
    else encDivers.y1 = sumSeries(encDivers.y1, uniformMonthly(n(flux.montantN), nMoisCtx.y1));
    if (flux.dateN1) addToYk3(encDivers, new Date(flux.dateN1), n(flux.montantN1), yearStarts);
    else encDivers.y2 = sumSeries(encDivers.y2, uniformMonthly(n(flux.montantN1), nMoisCtx.y2));
    if (flux.dateN2) addToYk3(encDivers, new Date(flux.dateN2), n(flux.montantN2), yearStarts);
    else encDivers.y3 = sumSeries(encDivers.y3, uniformMonthly(n(flux.montantN2), nMoisCtx.y3));
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
  dureesMois: Record<YearKey, number> = DEFAULT_DUREES,
): Yk3 {
  const achatActivites = activites.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");
  const result: Yk3 = zeroYk3(dureesMois);
  for (const a of achatActivites) {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const coefTVA = isFranchise ? 1 : 1 + n(a.tvaAchats ?? 20) / 100;
    // Achats récurrents TTC
    result.y1 = sumSeries(result.y1, seasonalMonthly(n(a.montantN) * coef * coefTVA, a.saisonnaliteAchats, "N", dureesMois.y1));
    result.y2 = sumSeries(result.y2, seasonalMonthly(n(a.montantN1) * coef * coefTVA, a.saisonnaliteAchats, "N1", dureesMois.y2));
    result.y3 = sumSeries(result.y3, seasonalMonthly(n(a.montantN2) * coef * coefTVA, a.saisonnaliteAchats, "N2", dureesMois.y3));
    // Achats ponctuels TTC (délai = 0, donc raw == paid → n'influencent pas l'encours)
    result.y1 = sumSeries(result.y1, ponctuelMonthly(a.achatsStockPonctuel, "N", dureesMois.y1).map((v: number) => v * coefTVA) as MonthlySeries);
    result.y2 = sumSeries(result.y2, ponctuelMonthly(a.achatsStockPonctuel, "N1", dureesMois.y2).map((v: number) => v * coefTVA) as MonthlySeries);
    result.y3 = sumSeries(result.y3, ponctuelMonthly(a.achatsStockPonctuel, "N2", dureesMois.y3).map((v: number) => v * coefTVA) as MonthlySeries);
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
    const nMois = raw.length;
    const result = zeroSeries(nMois);
    let running = initialEncours;
    for (let m = 0; m < nMois; m++) {
      running = running + (raw[m] ?? 0) - (paid[m] ?? 0);
      result[m] = Math.max(0, running);
    }
    return result;
  }

  const y1 = computeYear(decAchatsRaw.y1, decAchats.y1, 0);
  const y2 = computeYear(decAchatsRaw.y2, decAchats.y2, y1[y1.length - 1] ?? 0);
  const y3 = computeYear(decAchatsRaw.y3, decAchats.y3, y2[y2.length - 1] ?? 0);
  return { y1, y2, y3 };
}
