import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// â”€â”€ Salariés â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcSalaires(
  data: Pick<ScenarioFinData, "salaries">,
): { bruts: YearAcc; patronales: YearAcc } {
  const rows = data.salaries.filter((s) => s.actif !== false);
  return {
    bruts: {
      y1: sumBy(rows, (r) => n(r.montantN)),
      y2: sumBy(rows, (r) => n(r.montantN1)),
      y3: sumBy(rows, (r) => n(r.montantN2)),
    },
    patronales: {
      y1: sumBy(rows, (r) => n(r.montantN) * (n(r.tauxCotPat) / 100)),
      y2: sumBy(rows, (r) => n(r.montantN1) * (n(r.tauxCotPat) / 100)),
      y3: sumBy(rows, (r) => n(r.montantN2) * (n(r.tauxCotPat) / 100)),
    },
  };
}

// â”€â”€ Dirigeants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcDirigeants(
  data: Pick<ScenarioFinData, "dirigeants">,
): YearAcc {
  const rows = data.dirigeants.filter((d) => d.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Cotisations TNS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcCotisationsTNS(
  data: Pick<ScenarioFinData, "cotisationsTNS">,
): YearAcc {
  const rows = data.cotisationsTNS.filter((c) => c.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Taxes assises sur les salaires â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcTaxesSalaires(
  data: Pick<ScenarioFinData, "taxesSalaires">,
): YearAcc {
  const rows = data.taxesSalaires.filter((t) => t.actif !== false);
  return {
    y1: sumBy(rows, (t) => n(t.montantN)),
    y2: sumBy(rows, (t) => n(t.montantN1)),
    y3: sumBy(rows, (t) => n(t.montantN2)),
  };
}

// â”€â”€ Charges de personnel (total) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcChargesPersonnel(
  data: Pick<
    ScenarioFinData,
    "salaries" | "dirigeants" | "cotisationsTNS" | "taxesSalaires"
  >,
): {
  salairesBruts: YearAcc;
  chargesPatronales: YearAcc;
  remuDirigeant: YearAcc;
  cotisationsTNSTotal: YearAcc;
  taxesSalairesTotal: YearAcc;
  total: YearAcc;
} {
  const { bruts, patronales } = calcSalaires(data);
  const remuDirigeant = calcDirigeants(data);
  const cotisationsTNSTotal = calcCotisationsTNS(data);
  const taxesSalairesTotal = calcTaxesSalaires(data);

  const total: YearAcc = {
    y1: bruts.y1 + patronales.y1 + remuDirigeant.y1 + cotisationsTNSTotal.y1 + taxesSalairesTotal.y1,
    y2: bruts.y2 + patronales.y2 + remuDirigeant.y2 + cotisationsTNSTotal.y2 + taxesSalairesTotal.y2,
    y3: bruts.y3 + patronales.y3 + remuDirigeant.y3 + cotisationsTNSTotal.y3 + taxesSalairesTotal.y3,
  };

  return {
    salairesBruts: bruts,
    chargesPatronales: patronales,
    remuDirigeant,
    cotisationsTNSTotal,
    taxesSalairesTotal,
    total,
  };
}
