import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  uniformMonthly,
  seasonalMonthly,
  chargeExplMonthly,
  ponctuelMonthly,
} from "@/lib/finance/calculs/monthly";
import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/types/results";
import { vatValue, vatRow, dateToExercise } from "./helpers";
import type { VATRow, VATRowStyle } from "./types";

/**
 * Construit les lignes du tableau TVA.
 *
 * Les totaux utilisent fc.tva (source unique de vérité — calcTVA).
 * Les children (drill-down par activité/charge) sont calculés localement
 * pour l'affichage — ils n'affectent pas les calculs financiers.
 */
export function buildTVARows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): VATRow[] {
  const { dateDemarrage, activites, fournitures, services, immobilisations } = data;

  // ── Totaux TVA (source unique : fc.tva) ───────────────────────────────────
  const tvaCollecteeSeries = fc.tva.tvaCollectee;
  const tvaImmoSeries = fc.tva.tvaDeductibleImmos;
  const tvaAchatsSeries = fc.tva.tvaDeductibleAchats;
  const tvaChargesSeries = fc.tva.tvaDeductibleCharges;
  const tvaDeductibleSeries = fc.tva.tvaDeductible;
  const y1Calc = fc.tva.y1;
  const y2Calc = fc.tva.y2;
  const y3Calc = fc.tva.y3;

  // ── TVA collectée sur CA — children (drill-down) ──────────────────────────
  const activitesActives = activites.filter((a) => a.actif !== false);

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

  // ── TVA déductible sur immobilisations — children (drill-down) ───────────
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

  // ── TVA déductible sur achats de matières — children (drill-down) ────────
  // Note : totaux = fc.tva.tvaDeductibleAchats (méthode exacte via computeStocksAchatsSeries)
  // Les children utilisent une approximation pour l'affichage (forfait uniforme).
  const activitesAchats = activitesActives.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");

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

  // ── TVA déductible sur charges externes — children (drill-down) ──────────
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

    // Crédit TVA reporté : total = crédit RÉSIDUEL en fin d'exercice (finalCredit)
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
