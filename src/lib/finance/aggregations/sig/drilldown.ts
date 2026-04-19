import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/calculs";
import { n, sumBy } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";
import {
  seasonalMonthly,
  ponctuelMonthly,
  computeStocksAchatsSeries,
  type MonthlySeries,
} from "@/lib/finance/calculs/monthly";

export type SigDrilldownRows = ReturnType<typeof buildSigRows>;

function sumDotGroup(groupe: { y1: number; y2: number; y3: number }[]) {
  return {
    y1: groupe.reduce((s, d) => s + d.y1, 0),
    y2: groupe.reduce((s, d) => s + d.y2, 0),
    y3: groupe.reduce((s, d) => s + d.y3, 0),
  };
}

/**
 * Extrait les listes de lignes de drill-down pour chaque section du SIG.
 * Fonction pure, testable indépendamment de la couche serveur.
 */
export function buildSigRows(data: ScenarioFinData, fc: FinCalcResult) {
  const { activites, immobilisations } = data;
  const { anneeDebut, moisDebut } = fc;

  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      libelle: a.libelle,
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
      stocks: n(a.stocks ?? 0),
      achatsStockPonctuel: a.achatsStockPonctuel,
      saisonnaliteCA: a.saisonnaliteCA ?? null,
    }));

  const prodVendueRows = caRows.filter((r) => r.typeActivite === "PRODUCTION_VENDUE");
  const prestationsRows = caRows.filter((r) => r.typeActivite === "PRESTATION_SERVICES");
  const ventesMarchandisesRows = caRows.filter((r) => r.typeActivite === "VENTE_MARCHANDISES");

  // achatsRows = achats effectués par activité via computeStocksAchatsSeries —
  // identique à compte-resultat/build-rows.ts pour garantir CR = SIG.
  const sumOf = (s: MonthlySeries) => s.reduce((acc, v) => acc + (v ?? 0), 0);

  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => {
      const coef = Math.max(0, 1 - r.tauxMarge / 100);
      const joursStock = r.stocks;
      const saisonnalite = r.saisonnaliteCA;
      const achatsStockPonctuel = r.achatsStockPonctuel ?? null;

      // Y1
      const consY1 = seasonalMonthly(r.montantN * coef, saisonnalite, "N");
      const poncY1 = ponctuelMonthly(achatsStockPonctuel, "N");
      const rY1 = computeStocksAchatsSeries(consY1, poncY1, joursStock, 0);

      // Y2 (stock initial = sfFinal Y1)
      const consY2 = seasonalMonthly(r.montantN1 * coef, saisonnalite, "N1");
      const poncY2 = ponctuelMonthly(achatsStockPonctuel, "N1");
      const rY2 = computeStocksAchatsSeries(consY2, poncY2, joursStock, rY1.sfFinal);

      // Y3 (stock initial = sfFinal Y2)
      const consY3 = seasonalMonthly(r.montantN2 * coef, saisonnalite, "N2");
      const poncY3 = ponctuelMonthly(achatsStockPonctuel, "N2");
      const rY3 = computeStocksAchatsSeries(consY3, poncY3, joursStock, rY2.sfFinal);

      return {
        libelle: `Achats – ${r.libelle}`,
        montantN:  sumOf(rY1.achatsEffSeries),
        montantN1: sumOf(rY2.achatsEffSeries),
        montantN2: sumOf(rY3.achatsEffSeries),
      };
    });

  const fournituresRows = data.fournitures
    .filter((f) => f.actif !== false)
    .map((f) => ({ libelle: f.libelle, montantN: n(f.montantN), montantN1: n(f.montantN1), montantN2: n(f.montantN2) }));

  const servicesRows = data.services
    .filter((s) => s.actif !== false)
    .map((s) => ({ libelle: s.libelle, montantN: n(s.montantN), montantN1: n(s.montantN1), montantN2: n(s.montantN2) }));

  const impotsRows = data.impotsTaxes
    .filter((i) => i.actif !== false)
    .map((i) => ({ libelle: i.libelle, montantN: n(i.montantN ?? 0), montantN1: n(i.montantN1 ?? 0), montantN2: n(i.montantN2 ?? 0) }));

  const salaireRows = data.salaries
    .filter((s) => s.actif !== false)
    .map((s) => ({
      libelle: s.libelle,
      montantN: n(s.montantN),
      montantN1: n(s.montantN1),
      montantN2: n(s.montantN2),
      tauxCotPat: n(s.tauxCotPat),
    }));

  const dirigeantRows = data.dirigeants
    .filter((d) => d.actif !== false)
    .map((d) => ({ libelle: d.libelle, montantN: n(d.montantN), montantN1: n(d.montantN1), montantN2: n(d.montantN2) }));

  const cotisationsRows = data.cotisationsTNS
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  const reprisesRows = data.reprisesProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const prodFinRows = data.financiersProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const dotationsParImmoData = immobilisations
    .filter((immo) => immo.actif !== false)
    .map((immo) => {
      const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
      return { immo, y1: dot.y1, y2: dot.y2, y3: dot.y3 };
    });

  const dotParNature = {
    CORPOREL:   dotationsParImmoData.filter((d) => d.immo.nature === "CORPOREL"),
    INCORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "INCORPOREL"),
    FINANCIER:  dotationsParImmoData.filter((d) => d.immo.nature === "FINANCIER"),
  };

  const dotCorporel   = sumDotGroup(dotParNature.CORPOREL);
  const dotIncorporel = sumDotGroup(dotParNature.INCORPOREL);
  const dotFinancier  = sumDotGroup(dotParNature.FINANCIER);

  const prodVendue: Record<YearKey, number> = {
    y1: sumBy(prodVendueRows, (r) => r.montantN),
    y2: sumBy(prodVendueRows, (r) => r.montantN1),
    y3: sumBy(prodVendueRows, (r) => r.montantN2),
  };
  const prestationsServices: Record<YearKey, number> = {
    y1: sumBy(prestationsRows, (r) => r.montantN),
    y2: sumBy(prestationsRows, (r) => r.montantN1),
    y3: sumBy(prestationsRows, (r) => r.montantN2),
  };
  const ventesMarchandises: Record<YearKey, number> = {
    y1: sumBy(ventesMarchandisesRows, (r) => r.montantN),
    y2: sumBy(ventesMarchandisesRows, (r) => r.montantN1),
    y3: sumBy(ventesMarchandisesRows, (r) => r.montantN2),
  };

  return {
    caRows,
    prodVendueRows,
    prestationsRows,
    ventesMarchandisesRows,
    prodVendue,
    prestationsServices,
    ventesMarchandises,
    achatsRows,
    fournituresRows,
    servicesRows,
    impotsRows,
    salaireRows,
    dirigeantRows,
    cotisationsRows,
    reprisesRows,
    prodFinRows,
    dotationsParImmoData,
    dotParNature,
    dotCorporel,
    dotIncorporel,
    dotFinancier,
  };
}
