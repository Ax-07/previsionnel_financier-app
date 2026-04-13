import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

export type YAcc = YearAcc;

// ── Produits financiers ───────────────────────────────────────────────────────

export function calcProduitsFinanciers(
  data: Pick<ScenarioFinData, "financiersProduits">,
): YAcc {
  const rows = data.financiersProduits.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// ── Charges financières hors intérêts emprunts ────────────────────────────────

export function calcAutresChargesFinancieres(
  data: Pick<ScenarioFinData, "chargesFinancieres">,
): YAcc {
  const rows = data.chargesFinancieres.filter((c) => c.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// ── Résultat financier ────────────────────────────────────────────────────────

/**
 * ResFin = ProduitsFinanciers − (InteretsEmprunts + FraisDossierEmprunts + AutresChargesFinancieres)
 * Cohérent avec monthly.ts : chargesFinancièresAcc = interets + fraisDossier + autresChargesFinancières
 */
export function calcResFin(
  produitsFinanciers: YAcc,
  interetsEmprunts: YAcc,
  fraisDossierEmprunts: YAcc,
  autresChargesFinancieres: YAcc,
): YAcc {
  return {
    y1: produitsFinanciers.y1 - interetsEmprunts.y1 - fraisDossierEmprunts.y1 - autresChargesFinancieres.y1,
    y2: produitsFinanciers.y2 - interetsEmprunts.y2 - fraisDossierEmprunts.y2 - autresChargesFinancieres.y2,
    y3: produitsFinanciers.y3 - interetsEmprunts.y3 - fraisDossierEmprunts.y3 - autresChargesFinancieres.y3,
  };
}

// ── Résultat courant ──────────────────────────────────────────────────────────

export function calcResCourant(resExpl: YAcc, resFin: YAcc): YAcc {
  return {
    y1: resExpl.y1 + resFin.y1,
    y2: resExpl.y2 + resFin.y2,
    y3: resExpl.y3 + resFin.y3,
  };
}

// ── Résultat exceptionnel ─────────────────────────────────────────────────────

export function calcResExcep(
  data: Pick<ScenarioFinData, "exceptionnelsProduits" | "chargesExceptionnelles">,
): YAcc {
  const prodRows = data.exceptionnelsProduits.filter((r) => r.actif !== false);
  const chargeRows = data.chargesExceptionnelles.filter((c) => c.actif !== false);
  return {
    y1: sumBy(prodRows, (r) => n(r.montantN)) - sumBy(chargeRows, (c) => n(c.montantN)),
    y2: sumBy(prodRows, (r) => n(r.montantN1)) - sumBy(chargeRows, (c) => n(c.montantN1)),
    y3: sumBy(prodRows, (r) => n(r.montantN2)) - sumBy(chargeRows, (c) => n(c.montantN2)),
  };
}

// ── Résultat net ──────────────────────────────────────────────────────────────

/**
 * ResNet = ResCourant + ResExcep − IS
 */
export function calcResNet(
  resCourant: YAcc,
  resExcep: YAcc,
  isParAnnee: YAcc,
): YAcc {
  return {
    y1: resCourant.y1 + resExcep.y1 - isParAnnee.y1,
    y2: resCourant.y2 + resExcep.y2 - isParAnnee.y2,
    y3: resCourant.y3 + resExcep.y3 - isParAnnee.y3,
  };
}
