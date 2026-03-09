import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

export type YAcc = YearAcc;

// ── Salariés ─────────────────────────────────────────────────────────────────

export function calcSalaires(
  data: Pick<ScenarioFinData, "salaries">,
): { bruts: YAcc; patronales: YAcc } {
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

// ── Dirigeants ───────────────────────────────────────────────────────────────

export function calcDirigeants(
  data: Pick<ScenarioFinData, "dirigeants">,
): YAcc {
  const rows = data.dirigeants.filter((d) => d.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// ── Cotisations TNS ──────────────────────────────────────────────────────────

export function calcCotisationsTNS(
  data: Pick<ScenarioFinData, "cotisationsTNS">,
): YAcc {
  const rows = data.cotisationsTNS.filter((c) => c.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// ── Taxes assises sur les salaires ───────────────────────────────────────────

export function calcTaxesSalaires(
  data: Pick<ScenarioFinData, "taxesSalaires">,
): YAcc {
  return {
    y1: data.taxesSalaires.reduce((s, t) => s + n(t.montantN), 0),
    y2: data.taxesSalaires.reduce((s, t) => s + n(t.montantN1), 0),
    y3: data.taxesSalaires.reduce((s, t) => s + n(t.montantN2), 0),
  };
}

// ── Charges de personnel (total) ─────────────────────────────────────────────

export function calcChargesPersonnel(
  data: Pick<
    ScenarioFinData,
    "salaries" | "dirigeants" | "cotisationsTNS" | "taxesSalaires"
  >,
): {
  salairesBruts: YAcc;
  chargesPatronales: YAcc;
  remuDirigeant: YAcc;
  cotisationsTNSTotal: YAcc;
  taxesSalairesTotal: YAcc;
  total: YAcc;
} {
  const { bruts, patronales } = calcSalaires(data);
  const remuDirigeant = calcDirigeants(data);
  const cotisationsTNSTotal = calcCotisationsTNS(data);
  const taxesSalairesTotal = calcTaxesSalaires(data);

  const total: YAcc = {
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
