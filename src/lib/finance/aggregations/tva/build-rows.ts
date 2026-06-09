import {
  type MonthlySeries,
  zeroSeries,
  seasonalMonthly,
  ponctuelMonthly,
  computeStocksAchatsSeries,
  chargeExplMonthly,
} from "@/lib/finance/calculs/monthly";
import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/types/results";
import { vatRow } from "./helpers";
import type { VATRow } from "./types";
import type { YearKey } from "@/lib/finance/types/series";

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
  const { activites, fournitures, services, immobilisations } = data;
  const nMoisCtx: Record<YearKey, number> = fc.calendar.dureesMois;

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
    .map((a) => vatRow(
      `tva-ca-${a.id}`,
      a.libelle,
      {
        y1: seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N", nMoisCtx.y1),
        y2: seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1", nMoisCtx.y2),
        y3: seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2", nMoisCtx.y3),
      },
      "normal",
      true,
    ));

  // ── TVA déductible sur immobilisations — children (drill-down) ───────────
  const tvaImmoChildren: VATRow[] = immobilisations
    .filter((immo) => immo.actif !== false && immo.typeTva === "RECUPERABLE")
    .map((immo) => {
      const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
      const y1s = zeroSeries(nMoisCtx.y1), y2s = zeroSeries(nMoisCtx.y2), y3s = zeroSeries(nMoisCtx.y3);
      if (tvaImmo > 0) {
        const { yk, mi } = fc.calendar.dateToSlot(new Date(immo.dateAcquisition));
        if (yk === "y1" && mi >= 0 && mi < y1s.length) y1s[mi] = (y1s[mi] ?? 0) + tvaImmo;
        else if (yk === "y2" && mi >= 0 && mi < y2s.length) y2s[mi] = (y2s[mi] ?? 0) + tvaImmo;
        else if (yk === "y3" && mi >= 0 && mi < y3s.length) y3s[mi] = (y3s[mi] ?? 0) + tvaImmo;
      }
      return vatRow(`tva-immo-${immo.id}`, immo.libelle, { y1: y1s, y2: y2s, y3: y3s }, "normal", true);
    });

  // ── TVA déductible sur achats de matières — children (drill-down) ────────
  // Utilise computeStocksAchatsSeries — même méthode que fc.tva.tvaDeductibleAchats.
  // Garantit que la somme des enfants = total parent (pas d'approximation linéaire).
  const activitesAchats = activitesActives.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");

  const tvaAchatsChildren: VATRow[] = activitesAchats
    .map((a) => {
      const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
      const tvaRate = n(a.tvaAchats) / 100;
      const joursStk = n(a.stocks ?? 0);
      const saisonnalite = a.saisonnaliteAchats ?? null;
      const ponctuel = a.achatsStockPonctuel ?? null;

      const consY1 = seasonalMonthly(n(a.montantN) * coef, saisonnalite, "N", nMoisCtx.y1);
      const poncY1 = ponctuelMonthly(ponctuel, "N", nMoisCtx.y1);
      const rY1 = computeStocksAchatsSeries(consY1, poncY1, joursStk, 0, nMoisCtx.y1);

      const consY2 = seasonalMonthly(n(a.montantN1) * coef, saisonnalite, "N1", nMoisCtx.y2);
      const poncY2 = ponctuelMonthly(ponctuel, "N1", nMoisCtx.y2);
      const rY2 = computeStocksAchatsSeries(consY2, poncY2, joursStk, rY1.sfFinal, nMoisCtx.y2);

      const consY3 = seasonalMonthly(n(a.montantN2) * coef, saisonnalite, "N2", nMoisCtx.y3);
      const poncY3 = ponctuelMonthly(ponctuel, "N2", nMoisCtx.y3);
      const rY3 = computeStocksAchatsSeries(consY3, poncY3, joursStk, rY2.sfFinal, nMoisCtx.y3);

      const applyTva = (s: MonthlySeries): MonthlySeries =>
        s.map((v) => (v ?? 0) * tvaRate) as MonthlySeries;

      return vatRow(
        `tva-achats-${a.id}`,
        a.libelle,
        {
          y1: applyTva(rY1.achatsEffSeries),
          y2: applyTva(rY2.achatsEffSeries),
          y3: applyTva(rY3.achatsEffSeries),
        },
        "normal",
        true,
      );
    });

  // ── TVA déductible sur charges externes — children (drill-down) ──────────
  const tvaChargesChildren: VATRow[] = [
    ...fournitures.map((f) => vatRow(
      `tva-charges-f-${f.id}`,
      f.libelle,
      {
        y1: chargeExplMonthly(n(f.montantN) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N", nMoisCtx.y1),
        y2: chargeExplMonthly(n(f.montantN1) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N1", nMoisCtx.y2),
        y3: chargeExplMonthly(n(f.montantN2) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N2", nMoisCtx.y3),
      },
      "normal",
      true,
    )),
    ...services.map((s) => vatRow(
      `tva-charges-s-${s.id}`,
      s.libelle,
      {
        y1: chargeExplMonthly(n(s.montantN) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N", nMoisCtx.y1),
        y2: chargeExplMonthly(n(s.montantN1) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N1", nMoisCtx.y2),
        y3: chargeExplMonthly(n(s.montantN2) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N2", nMoisCtx.y3),
      },
      "normal",
      true,
    )),
  ];

  return [
    // ── Section TVA collectée ─────────────────────────────────────────────
    vatRow("section-collectee", "TVA COLLECTÉE", { y1: zeroSeries(nMoisCtx.y1), y2: zeroSeries(nMoisCtx.y2), y3: zeroSeries(nMoisCtx.y3) }, "section"),
    vatRow("tva-ca", "TVA sur chiffre d'affaires", tvaCollecteeSeries, "normal", false, tvaCAChildren),
    vatRow("total-collectee", "Total TVA collectée", tvaCollecteeSeries, "subtotal"),

    // ── Section TVA déductible ────────────────────────────────────────────
    vatRow("section-deductible", "TVA DÉDUCTIBLE", { y1: zeroSeries(nMoisCtx.y1), y2: zeroSeries(nMoisCtx.y2), y3: zeroSeries(nMoisCtx.y3) }, "section"),
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
