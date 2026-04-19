import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// â”€â”€ Produits financiers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcProduitsFinanciers(
  data: Pick<ScenarioFinData, "financiersProduits">,
): YearAcc {
  const rows = data.financiersProduits.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Charges financières hors intérêts emprunts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcAutresChargesFinancieres(
  data: Pick<ScenarioFinData, "chargesFinancieres">,
): YearAcc {
  const rows = data.chargesFinancieres.filter((c) => c.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Résultat financier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * ResFin = ProduitsFinanciers âˆ’ (InteretsEmprunts + FraisDossierEmprunts + AutresChargesFinancieres)
 * Cohérent avec monthly.ts : chargesFinancièresAcc = interets + fraisDossier + autresChargesFinancières
 */
export function calcResFin(
  produitsFinanciers: YearAcc,
  interetsEmprunts: YearAcc,
  fraisDossierEmprunts: YearAcc,
  autresChargesFinancieres: YearAcc,
): YearAcc {
  return {
    y1: produitsFinanciers.y1 - interetsEmprunts.y1 - fraisDossierEmprunts.y1 - autresChargesFinancieres.y1,
    y2: produitsFinanciers.y2 - interetsEmprunts.y2 - fraisDossierEmprunts.y2 - autresChargesFinancieres.y2,
    y3: produitsFinanciers.y3 - interetsEmprunts.y3 - fraisDossierEmprunts.y3 - autresChargesFinancieres.y3,
  };
}

// â”€â”€ Résultat courant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcResCourant(resExpl: YearAcc, resFin: YearAcc): YearAcc {
  return {
    y1: resExpl.y1 + resFin.y1,
    y2: resExpl.y2 + resFin.y2,
    y3: resExpl.y3 + resFin.y3,
  };
}

// â”€â”€ Résultat exceptionnel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcResExcep(
  data: Pick<ScenarioFinData, "exceptionnelsProduits" | "chargesExceptionnelles">,
): YearAcc {
  const prodRows = data.exceptionnelsProduits.filter((r) => r.actif !== false);
  const chargeRows = data.chargesExceptionnelles.filter((c) => c.actif !== false);
  return {
    y1: sumBy(prodRows, (r) => n(r.montantN)) - sumBy(chargeRows, (c) => n(c.montantN)),
    y2: sumBy(prodRows, (r) => n(r.montantN1)) - sumBy(chargeRows, (c) => n(c.montantN1)),
    y3: sumBy(prodRows, (r) => n(r.montantN2)) - sumBy(chargeRows, (c) => n(c.montantN2)),
  };
}

// â”€â”€ Résultat net â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * ResNet = ResCourant + ResExcep âˆ’ IS
 */
export function calcResNet(
  resCourant: YearAcc,
  resExcep: YearAcc,
  isParAnnee: YearAcc,
): YearAcc {
  return {
    y1: resCourant.y1 + resExcep.y1 - isParAnnee.y1,
    y2: resCourant.y2 + resExcep.y2 - isParAnnee.y2,
    y3: resCourant.y3 + resExcep.y3 - isParAnnee.y3,
  };
}
