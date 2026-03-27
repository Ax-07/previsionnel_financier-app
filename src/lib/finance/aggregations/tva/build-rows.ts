import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  uniformMonthly,
  seasonalMonthly,
  chargeExplMonthly,
  ponctuelMonthly,
} from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { YearKey } from "@/lib/finance/utils";
import { vatValue, vatRow, dateToExercise } from "./helpers";
import type { VATRow, VATRowStyle } from "./types";

/**
 * Construit les lignes du tableau TVA.
 *
 * Le tableau affiche toujours les colonnes mois par mois (résolution mensuelle),
 * indépendamment du régime de déclaration. Le paramètre `periodiciteDecaissement`
 * contrôle uniquement le calendrier de paiement de la TVA à payer (trimestriel
 * = paiement en fin de trimestre), ce qui affecte la ligne « TVA à payer » et
 * « Crédit TVA reporté » mais PAS les colonnes mensuelles du tableau.
 */
export function buildTVARows(
  data: ScenarioFinData,
  periodiciteDecaissement: "mensuel" | "trimestriel",
): VATRow[] {
  const { dateDemarrage, activites, fournitures, services, immobilisations } = data;

  // ── TVA collectée sur CA ──────────────────────────────────────────────────
  const activitesActives = activites.filter((a) => a.actif !== false);
  const tvaCollecteeSeries: Record<YearKey, MonthlySeries> = {
    y1: activitesActives.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
      zeroSeries(),
    ),
    y2: activitesActives.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
      zeroSeries(),
    ),
    y3: activitesActives.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
      zeroSeries(),
    ),
  };

  const tvaCAChildren: VATRow[] = activitesActives
    .map((a) => ({
      key: `tva-ca-${a.id}`,
      label: a.libelle,
      values: {
        y1: vatValue(seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
        y2: vatValue(seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
        y3: vatValue(seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    }));

  // ── TVA déductible sur immobilisations ────────────────────────────────────
  const tvaImmoSeries: Record<YearKey, MonthlySeries> = {
    y1: zeroSeries(),
    y2: zeroSeries(),
    y3: zeroSeries(),
  };

  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const { yk, monthIndex } = dateToExercise(dateDemarrage, new Date(immo.dateAcquisition));
    if (yk && monthIndex >= 0) {
      tvaImmoSeries[yk][monthIndex] = (tvaImmoSeries[yk][monthIndex] ?? 0) + tva;
    }
  }

  const tvaImmoChildren: VATRow[] = immobilisations
    .filter((immo) => immo.actif !== false && immo.typeTva === "RECUPERABLE")
    .map((immo) => {
      const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
      const y1s = zeroSeries(), y2s = zeroSeries(), y3s = zeroSeries();
      if (tvaImmo > 0) {
        const { yk, monthIndex } = dateToExercise(dateDemarrage, new Date(immo.dateAcquisition));
        if (yk === "y1" && monthIndex >= 0) y1s[monthIndex] = (y1s[monthIndex] ?? 0) + tvaImmo;
        else if (yk === "y2" && monthIndex >= 0) y2s[monthIndex] = (y2s[monthIndex] ?? 0) + tvaImmo;
        else if (yk === "y3" && monthIndex >= 0) y3s[monthIndex] = (y3s[monthIndex] ?? 0) + tvaImmo;
      }
      return {
        key: `tva-immo-${immo.id}`,
        label: immo.libelle,
        values: { y1: vatValue(y1s), y2: vatValue(y2s), y3: vatValue(y3s) },
        style: "normal" as VATRowStyle,
        hideIfZero: true,
      };
    });

  // ── TVA déductible sur achats de matières ─────────────────────────────────
  const activitesAchats = activitesActives.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");

  // TVA déductible sur achats effectués = consommés + ΔStock + ponctuels
  // Cohérent avec decaissements.ts (tvaAchatsY1) et bfr.ts (tvaDedAchatsMonthY1).
  const tvaAchatsSeries: Record<YearKey, MonthlySeries> = {
    y1: activitesAchats.reduce((s, a) => {
        const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
        const tauxTVA = n(a.tvaAchats) / 100;
        const joursStk = n(a.stocks ?? 0);
        const varStock = (n(a.montantN) * coef * joursStk) / 360; // ΔStock Y1 (SI=0)
        const rec = seasonalMonthly(n(a.montantN) * coef * tauxTVA, a.saisonnaliteAchats, "N");
        const stockVar = uniformMonthly(varStock * tauxTVA); // TVA sur ΔStock
        // ponctuelN[0] = stock initial y0 — TVA exclue du flux Y1 (position ouverture)
        const poncRaw = [...ponctuelMonthly(a.achatsStockPonctuel, "N")] as MonthlySeries;
        poncRaw[0] = 0;
        const ponc = poncRaw.map((v: number) => v * tauxTVA) as MonthlySeries;
        return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
      }, zeroSeries()),
    y2: activitesAchats.reduce((s, a) => {
        const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
        const tauxTVA = n(a.tvaAchats) / 100;
        const joursStk = n(a.stocks ?? 0);
        const sfY1 = (n(a.montantN) * coef * joursStk) / 360;
        const varStock = (n(a.montantN1) * coef * joursStk) / 360 - sfY1; // ΔStock Y2
        const rec = seasonalMonthly(n(a.montantN1) * coef * tauxTVA, a.saisonnaliteAchats, "N1");
        const stockVar = uniformMonthly(varStock * tauxTVA); // TVA sur ΔStock
        const ponc = ponctuelMonthly(a.achatsStockPonctuel, "N1").map((v: number) => v * tauxTVA) as MonthlySeries;
        return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
      }, zeroSeries()),
    y3: activitesAchats.reduce((s, a) => {
        const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
        const tauxTVA = n(a.tvaAchats) / 100;
        const joursStk = n(a.stocks ?? 0);
        const sfY2 = (n(a.montantN1) * coef * joursStk) / 360;
        const varStock = (n(a.montantN2) * coef * joursStk) / 360 - sfY2; // ΔStock Y3
        const rec = seasonalMonthly(n(a.montantN2) * coef * tauxTVA, a.saisonnaliteAchats, "N2");
        const stockVar = uniformMonthly(varStock * tauxTVA); // TVA sur ΔStock
        const ponc = ponctuelMonthly(a.achatsStockPonctuel, "N2").map((v: number) => v * tauxTVA) as MonthlySeries;
        return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
      }, zeroSeries()),
  };

  const tvaAchatsChildren: VATRow[] = activitesAchats
    .map((a) => {
      const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
      const tvaRate = n(a.tvaAchats) / 100;
      const joursStk = n(a.stocks ?? 0);
      const sfY1 = (n(a.montantN) * coef * joursStk) / 360;
      const sfY2 = (n(a.montantN1) * coef * joursStk) / 360;
      const varStockY1 = sfY1; // SI=0
      const varStockY2 = sfY2 - sfY1;
      const varStockY3 = (n(a.montantN2) * coef * joursStk) / 360 - sfY2;
      const y1rec = seasonalMonthly(n(a.montantN) * coef * tvaRate, a.saisonnaliteAchats, "N");
      const y1sv = uniformMonthly(varStockY1 * tvaRate);
      // ponctuelN[0] = stock initial y0 — TVA exclue du flux Y1 (position ouverture)
      const y1poncRaw = [...ponctuelMonthly(a.achatsStockPonctuel, "N")] as MonthlySeries;
      y1poncRaw[0] = 0;
      const y1ponc = y1poncRaw.map((v: number) => v * tvaRate) as MonthlySeries;
      const y2rec = seasonalMonthly(n(a.montantN1) * coef * tvaRate, a.saisonnaliteAchats, "N1");
      const y2sv = uniformMonthly(varStockY2 * tvaRate);
      const y2ponc = ponctuelMonthly(a.achatsStockPonctuel, "N1").map((v: number) => v * tvaRate) as MonthlySeries;
      const y3rec = seasonalMonthly(n(a.montantN2) * coef * tvaRate, a.saisonnaliteAchats, "N2");
      const y3sv = uniformMonthly(varStockY3 * tvaRate);
      const y3ponc = ponctuelMonthly(a.achatsStockPonctuel, "N2").map((v: number) => v * tvaRate) as MonthlySeries;
      return {
        key: `tva-achats-${a.id}`,
        label: a.libelle,
        values: {
          y1: vatValue(sumSeries(sumSeries(y1rec, y1sv), y1ponc)),
          y2: vatValue(sumSeries(sumSeries(y2rec, y2sv), y2ponc)),
          y3: vatValue(sumSeries(sumSeries(y3rec, y3sv), y3ponc)),
        },
        style: "normal" as VATRowStyle,
        hideIfZero: true,
      };
    });

  // ── TVA déductible sur charges externes ───────────────────────────────────
  const chargesRows = [
    ...fournitures.map((f) => ({
      montantN: n(f.montantN),
      montantN1: n(f.montantN1),
      montantN2: n(f.montantN2),
      tva: n(f.tauxTVA),
      frequence: f.frequence as string,
      detailCalc: f.detailCalc,
    })),
    ...services.map((s) => ({
      montantN: n(s.montantN),
      montantN1: n(s.montantN1),
      montantN2: n(s.montantN2),
      tva: n(s.tauxTVA),
      frequence: s.frequence as string,
      detailCalc: s.detailCalc,
    })),
  ];

  const tvaChargesSeries: Record<YearKey, MonthlySeries> = {
    y1: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN * (r.tva / 100), r, "N")),
      zeroSeries(),
    ),
    y2: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN1 * (r.tva / 100), r, "N1")),
      zeroSeries(),
    ),
    y3: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN2 * (r.tva / 100), r, "N2")),
      zeroSeries(),
    ),
  };

  const tvaChargesChildren: VATRow[] = [
    ...fournitures.map((f) => ({
      key: `tva-charges-f-${f.id}`,
      label: f.libelle,
      values: {
        y1: vatValue(chargeExplMonthly(n(f.montantN) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N")),
        y2: vatValue(chargeExplMonthly(n(f.montantN1) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N1")),
        y3: vatValue(chargeExplMonthly(n(f.montantN2) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    })),
    ...services.map((s) => ({
      key: `tva-charges-s-${s.id}`,
      label: s.libelle,
      values: {
        y1: vatValue(chargeExplMonthly(n(s.montantN) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N")),
        y2: vatValue(chargeExplMonthly(n(s.montantN1) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N1")),
        y3: vatValue(chargeExplMonthly(n(s.montantN2) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    })),
  ];

  // ── Total TVA déductible ──────────────────────────────────────────────────
  const tvaDeductibleSeries: Record<YearKey, MonthlySeries> = {
    y1: sumSeries(sumSeries(tvaImmoSeries.y1, tvaAchatsSeries.y1), tvaChargesSeries.y1),
    y2: sumSeries(sumSeries(tvaImmoSeries.y2, tvaAchatsSeries.y2), tvaChargesSeries.y2),
    y3: sumSeries(sumSeries(tvaImmoSeries.y3, tvaAchatsSeries.y3), tvaChargesSeries.y3),
  };

  // ── TVA nette, crédit et TVA à payer (report inter-exercices) ─────────────
  let tvaImmoY0 = 0;
  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const { yk } = dateToExercise(dateDemarrage, new Date(immo.dateAcquisition));
    if (yk === null) tvaImmoY0 += tva;
  }

  // Le tableau affiche les montants mensuels (résolution = mensuel).
  // periodiciteDecaissement n'affecte que les lignes TVA à payer / Crédit reporté
  // dans la colonne Total et la logique de paiement groupé (trimestriel).
  const y1Calc = computeTVAMonthly(tvaCollecteeSeries.y1, tvaDeductibleSeries.y1, periodiciteDecaissement, tvaImmoY0);
  const y2Calc = computeTVAMonthly(tvaCollecteeSeries.y2, tvaDeductibleSeries.y2, periodiciteDecaissement, y1Calc.finalCredit);
  const y3Calc = computeTVAMonthly(tvaCollecteeSeries.y3, tvaDeductibleSeries.y3, periodiciteDecaissement, y2Calc.finalCredit);

  return [
    // ── Section TVA collectée ─────────────────────────────────────────────
    vatRow("section-collectee", "TVA COLLECTÉE", { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() }, "section"),
    vatRow("tva-ca", "TVA sur chiffre d'affaires", tvaCollecteeSeries, "normal", false, tvaCAChildren),
    vatRow("total-collectee", "Total TVA collectée", tvaCollecteeSeries, "subtotal"),

    // ── Section TVA déductible ────────────────────────────────────────────
    vatRow("section-deductible", "TVA DÉDUCTIBLE", { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() }, "section"),
    vatRow("tva-immo", "TVA sur immobilisations", tvaImmoSeries, "normal", true, tvaImmoChildren),
    vatRow("tva-achats", "TVA sur achats de matières", tvaAchatsSeries, "normal", true, tvaAchatsChildren),
    vatRow("tva-charges", "TVA sur charges externes", tvaChargesSeries, "normal", true, tvaChargesChildren),
    vatRow("total-deductible", "Total TVA déductible", tvaDeductibleSeries, "subtotal"),

    // ── TVA nette ─────────────────────────────────────────────────────────
    vatRow("tva-nette", "TVA nette du mois", {
      y1: y1Calc.tvaNetteMonthly,
      y2: y2Calc.tvaNetteMonthly,
      y3: y3Calc.tvaNetteMonthly,
    }, "result"),

    // Crédit TVA reporté : le total est le crédit RÉSIDUEL en fin d'exercice
    // (= finalCredit), pas la somme des mois. En régime trimestriel, la série
    // mensuelle répète le stock de crédit sur les mois intermédiaires du
    // trimestre, donc Σmois serait artificiellement gonflé (ex. ×3 par trimestre).
    {
      key: "credit-tva",
      label: "Crédit TVA reporté",
      values: {
        y1: { months: y1Calc.creditReporteMonthly, total: y1Calc.finalCredit },
        y2: { months: y2Calc.creditReporteMonthly, total: y2Calc.finalCredit },
        y3: { months: y3Calc.creditReporteMonthly, total: y3Calc.finalCredit },
      },
      style: "normal",
      hideIfZero: true,
    } satisfies VATRow,

    vatRow("tva-payer", "TVA à payer", {
      y1: y1Calc.tvaAPayerMonthly,
      y2: y2Calc.tvaAPayerMonthly,
      y3: y3Calc.tvaAPayerMonthly,
    }, "highlight"),
  ];
}
