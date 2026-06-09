/**
 * Source unique de vérité pour le calcul TVA.
 *
 * `calcTVA(data, helpers)` produit toutes les séries TVA (collectée, déductible)
 * et enchaîne `computeTVAMonthly` sur 3 exercices avec report de crédit.
 *
 * Remplace les 3 reconstructions indépendantes qui existaient dans :
 *   - `calculs/bfr.ts`
 *   - `calculs/decaissements.ts`
 *   - `aggregations/tva/build-rows.ts`
 *
 * Méthode de référence pour la TVA déductible achats :
 *   `computeStocksAchatsSeries` (exact) — interdit `montantN × coef × jours / 360` (forfaitaire).
 *
 * Consommateurs :
 *   - `pipeline/build.ts`             → stocke le résultat dans `FinCalcResult.tva`
 *   - `calculs/bfr.ts`                → `fc.tva` (crédit TVA, TVA à payer BFR)
 *   - `calculs/decaissements.ts`      → paramètre `tva` (décaissement TVA trésorerie)
 *   - `aggregations/tva/build-rows.ts`→ `fc.tva` (tableau TVA onglet contrôle)
 */

import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/types/series";
import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  seasonalMonthly,
  ponctuelMonthly,
  chargeExplMonthly,
  computeStocksAchatsSeries,
} from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
export type { TVAMonthlyResult } from "@/lib/finance/tva-engine";
import type { TVAMonthlyResult } from "@/lib/finance/tva-engine";

type Yk3Series = { y1: MonthlySeries; y2: MonthlySeries; y3: MonthlySeries };

/**
 * Helpers calendrier nécessaires à `calcTVA`.
 * Sous-ensemble de `FinCalcResult` — satisfait par n'importe quelle source qui
 * expose `toExerciceKey` et les bornes d'exercice.
 */
export interface TVACalcHelpers {
  toExerciceKey: (date: Date | string) => "y1" | "y2" | "y3" | null;
  exBorne1: Date;
  exBorne2: Date;
  exBorne3: Date;
  dureesMois?: Record<YearKey, number>;
  dateToSlot?: (date: Date | string) => { yk: YearKey | null; mi: number };
}

export interface TVACalcResult {
  isFranchise: boolean;
  periodicite: "mensuel" | "trimestriel";

  /** Résultats `computeTVAMonthly` chaînés sur 3 exercices (source unique). */
  y1: TVAMonthlyResult;
  y2: TVAMonthlyResult;
  y3: TVAMonthlyResult;

  /** Séries brutes exposées pour l'affichage de l'onglet TVA (`buildTVARows`). */
  tvaCollectee: Yk3Series;
  tvaDeductibleAchats: Yk3Series;
  tvaDeductibleCharges: Yk3Series;
  tvaDeductibleImmos: Yk3Series;
  tvaDeductible: Yk3Series;

  /**
   * TVA sur immobilisations acquises ≤ dateDemarrage.
   * Sert de `initialCredit` pour le premier `computeTVAMonthly`.
   */
  creditInitial: number;

  /**
   * TVA sur stock initial ponctuel (position ouverture, y0).
   * Exposée dans `creditTVA.y0` du BFR pour l'affichage du besoin de financement
   * d'ouverture (stock HT + TVA TTC). La récupération effective se fait via le
   * flux mensuel `tvaDeductibleAchats.y1` (rY1.achatsEffSeries inclut ponctuelN[0]).
   * Pas de double-compte : `y0` est une présentation, `rY1` est le flux réel.
   */
  tvaY0StockInit: number;
}

// ── Résultat vide (franchise TVA) ─────────────────────────────────────────────

function zeroYk3(dureesMois: Record<YearKey, number>): Yk3Series {
  return {
    y1: zeroSeries(dureesMois.y1),
    y2: zeroSeries(dureesMois.y2),
    y3: zeroSeries(dureesMois.y3),
  };
}

function zeroTvaResult(nMois: number): TVAMonthlyResult {
  return {
    tvaNetteMonthly: zeroSeries(nMois),
    creditReporteMonthly: zeroSeries(nMois),
    tvaAPayerMonthly: zeroSeries(nMois),
    finalCredit: 0,
  };
}

// ── Fonction principale ────────────────────────────────────────────────────────

export function calcTVA(
  data: ScenarioFinData,
  helpers: TVACalcHelpers,
): TVACalcResult {
  const { activites, fournitures, services, immobilisations, scenario } = data;
  const nMoisCtx: Record<YearKey, number> =
    helpers.dureesMois ?? { y1: 12, y2: 12, y3: 12 };

  const isFranchise = scenario.parametres?.regimeTVA === "FRANCHISE";
  const periodicite: "mensuel" | "trimestriel" =
    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
      ? "trimestriel"
      : "mensuel";

  if (isFranchise) {
    return {
      isFranchise,
      periodicite,
      y1: zeroTvaResult(nMoisCtx.y1),
      y2: zeroTvaResult(nMoisCtx.y2),
      y3: zeroTvaResult(nMoisCtx.y3),
      tvaCollectee: zeroYk3(nMoisCtx),
      tvaDeductibleAchats: zeroYk3(nMoisCtx),
      tvaDeductibleCharges: zeroYk3(nMoisCtx),
      tvaDeductibleImmos: zeroYk3(nMoisCtx),
      tvaDeductible: zeroYk3(nMoisCtx),
      creditInitial: 0,
      tvaY0StockInit: 0,
    };
  }

  const { toExerciceKey } = helpers;

  const actifsActifs = activites.filter((a) => a.actif !== false);
  const achatsActifs = actifsActifs.filter(
    (a) => a.typeActivite !== "PRESTATION_SERVICES",
  );
  const allChargesActif = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((s) => s.actif !== false),
  ];

  // ── TVA collectée sur CA ────────────────────────────────────────────────────
  const tvaCollectee: Yk3Series = {
    y1: actifsActifs.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N", nMoisCtx.y1)),
      zeroSeries(nMoisCtx.y1) as MonthlySeries,
    ),
    y2: actifsActifs.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1", nMoisCtx.y2)),
      zeroSeries(nMoisCtx.y2) as MonthlySeries,
    ),
    y3: actifsActifs.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2", nMoisCtx.y3)),
      zeroSeries(nMoisCtx.y3) as MonthlySeries,
    ),
  };

  // ── TVA déductible achats (méthode exacte — computeStocksAchatsSeries) ──────
  //
  // Règle : interdiction d'utiliser `montantN × coef × joursStk / 360` (forfaitaire).
  // La ΔStock est calculée mois par mois via la série cumulative RCA, ce qui
  // garantit la cohérence avec le BFR, la trésorerie et le bilan.
  //
  // ponctuelN[0] (stock initial y0) est inclus dans le flux TVA Y1.
  // Zeroeiser p1tva[0] créerait un cut-off de (sfFinal_nom − sfFinal_tva) × taux
  // reporté sur Y2. La TVA sur stock d'ouverture est gérée séparément via `creditInitial`.
  let tvaAchatsY1: MonthlySeries = zeroSeries(nMoisCtx.y1);
  let tvaAchatsY2: MonthlySeries = zeroSeries(nMoisCtx.y2);
  let tvaAchatsY3: MonthlySeries = zeroSeries(nMoisCtx.y3);

  for (const a of achatsActifs) {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const taux = n(a.tvaAchats ?? 20) / 100;
    const joursStk = n(a.stocks ?? 0);

    const sm1 = seasonalMonthly(n(a.montantN) * coef, a.saisonnaliteAchats, "N", nMoisCtx.y1);
    const sm2 = seasonalMonthly(n(a.montantN1) * coef, a.saisonnaliteAchats, "N1", nMoisCtx.y2);
    const sm3 = seasonalMonthly(n(a.montantN2) * coef, a.saisonnaliteAchats, "N2", nMoisCtx.y3);
    const p1 = ponctuelMonthly(a.achatsStockPonctuel, "N", nMoisCtx.y1);
    const p2 = ponctuelMonthly(a.achatsStockPonctuel, "N1", nMoisCtx.y2);
    const p3 = ponctuelMonthly(a.achatsStockPonctuel, "N2", nMoisCtx.y3);

    // Séries nominales pour assurer la continuité des stocks inter-exercices
    const rY1 = computeStocksAchatsSeries(sm1, p1, joursStk, 0, nMoisCtx.y1);
    const rY2 = computeStocksAchatsSeries(sm2, p2, joursStk, rY1.sfFinal, nMoisCtx.y2);
    const rY3 = computeStocksAchatsSeries(sm3, p3, joursStk, rY2.sfFinal, nMoisCtx.y3);

    // TVA déductible = mêmes séries que la trésorerie et le BFR (rY1/rY2/rY3).
    // ponctuelN[0] est un achat du mois 0 de Y1 → TVA déductible en Y1.
    // Ne pas l'exclure : zeroeiser p1tva[0] créerait un cut-off exact de
    // (rY1.sfFinal − r1tva.sfFinal) × taux de Y1 vers Y2.
    tvaAchatsY1 = sumSeries(tvaAchatsY1, rY1.achatsEffSeries.map((v) => v * taux) as MonthlySeries);
    tvaAchatsY2 = sumSeries(tvaAchatsY2, rY2.achatsEffSeries.map((v) => v * taux) as MonthlySeries);
    tvaAchatsY3 = sumSeries(tvaAchatsY3, rY3.achatsEffSeries.map((v) => v * taux) as MonthlySeries);
  }

  const tvaDeductibleAchats: Yk3Series = {
    y1: tvaAchatsY1,
    y2: tvaAchatsY2,
    y3: tvaAchatsY3,
  };

  // ── TVA déductible charges externes ────────────────────────────────────────
  const tvaDeductibleCharges: Yk3Series = {
    y1: allChargesActif.reduce(
      (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N", nMoisCtx.y1)),
      zeroSeries(nMoisCtx.y1) as MonthlySeries,
    ),
    y2: allChargesActif.reduce(
      (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN1) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N1", nMoisCtx.y2)),
      zeroSeries(nMoisCtx.y2) as MonthlySeries,
    ),
    y3: allChargesActif.reduce(
      (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN2) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N2", nMoisCtx.y3)),
      zeroSeries(nMoisCtx.y3) as MonthlySeries,
    ),
  };

  // ── TVA déductible immobilisations ─────────────────────────────────────────
  //
  // Les immobilisations acquises ≤ dateDemarrage contribuent à `creditInitial`
  // (créance y0 sur le Trésor). Les suivantes sont positionnées dans la série
  // mensuelle du bon exercice.
  const tvaDeductibleImmos: Yk3Series = {
    y1: zeroSeries(nMoisCtx.y1),
    y2: zeroSeries(nMoisCtx.y2),
    y3: zeroSeries(nMoisCtx.y3),
  };
  let creditInitial = 0;

  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;

    const dateAcq =
      immo.dateAcquisition instanceof Date
        ? immo.dateAcquisition
        : new Date(String(immo.dateAcquisition));

    if (dateAcq <= data.dateDemarrage) {
      creditInitial += tva;
      continue;
    }

    const slot = helpers.dateToSlot?.(dateAcq);
    const yk = slot?.yk ?? toExerciceKey(dateAcq);
    const start =
      yk === "y1" ? data.dateDemarrage :
      yk === "y2" ? helpers.exBorne1 :
      yk === "y3" ? helpers.exBorne2 :
      null;
    const mi = slot?.mi ?? (start
      ? Math.max(
          0,
          (dateAcq.getFullYear() - start.getFullYear()) * 12 +
            (dateAcq.getMonth() - start.getMonth()),
        )
      : -1);
    if (yk && mi >= 0 && mi < tvaDeductibleImmos[yk].length) {
      (tvaDeductibleImmos[yk] as number[])[mi] =
        ((tvaDeductibleImmos[yk] as number[])[mi] ?? 0) + tva;
    }
  }

  // ── TVA sur stock initial ponctuel (y0) ────────────────────────────────────
  // Affiché dans creditTVA.y0 du BFR uniquement (besoin d'ouverture = stock HT + TVA).
  // La RÉCUPÉRATION de cette TVA se fait via tvaDeductibleAchats.y1 (rY1.achatsEffSeries,
  // qui intègre ponctuelN[0] au mois 0 de Y1). Pas de double-compte : y0 = présentation
  // BFR d'ouverture (funding need) ; rY1 = flux mensuel TVA réel.
  const tvaY0StockInit = achatsActifs.reduce((s, a) => {
    const taux = n(a.tvaAchats ?? 20) / 100;
    const ponctuelRec = a.achatsStockPonctuel as Record<string, number[]> | undefined;
    return s + (ponctuelRec?.N?.[0] ?? 0) * taux;
  }, 0);

  // ── Total déductible ────────────────────────────────────────────────────────
  const tvaDeductible: Yk3Series = {
    y1: sumSeries(sumSeries(tvaDeductibleAchats.y1, tvaDeductibleCharges.y1), tvaDeductibleImmos.y1),
    y2: sumSeries(sumSeries(tvaDeductibleAchats.y2, tvaDeductibleCharges.y2), tvaDeductibleImmos.y2),
    y3: sumSeries(sumSeries(tvaDeductibleAchats.y3, tvaDeductibleCharges.y3), tvaDeductibleImmos.y3),
  };

  // ── computeTVAMonthly — 3 exercices chaînés (source unique de vérité) ───────
  const y1 = computeTVAMonthly(tvaCollectee.y1, tvaDeductible.y1, periodicite, creditInitial);
  const y2 = computeTVAMonthly(tvaCollectee.y2, tvaDeductible.y2, periodicite, y1.finalCredit);
  const y3 = computeTVAMonthly(tvaCollectee.y3, tvaDeductible.y3, periodicite, y2.finalCredit);

  return {
    isFranchise,
    periodicite,
    y1,
    y2,
    y3,
    tvaCollectee,
    tvaDeductibleAchats,
    tvaDeductibleCharges,
    tvaDeductibleImmos,
    tvaDeductible,
    creditInitial,
    tvaY0StockInit,
  };
}
