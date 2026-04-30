import type { YearAcc } from "@/lib/finance/utils";

// ── Valeur ajoutée ────────────────────────────────────────────────────────────

/**
 * VA = CA − AchatsConsommés − ChargesExternes
 *
 * Convention PCG SIG : les subventions d'exploitation apparaissent à l'EBE,
 * pas dans la VA. Les productions immobilisées ne sont pas gérées dans ce modèle.
 */
export function calcValeurAjoutee(
  ca: YearAcc,
  achatsConsommes: YearAcc,
  chargesExternes: YearAcc,
): YearAcc {
  return {
    y1: ca.y1 - achatsConsommes.y1 - chargesExternes.y1,
    y2: ca.y2 - achatsConsommes.y2 - chargesExternes.y2,
    y3: ca.y3 - achatsConsommes.y3 - chargesExternes.y3,
  };
}

// ── EBE ───────────────────────────────────────────────────────────────────────

/**
 * EBE = ValeurAjoutée + SubventionsExploitation − ImpôtsTaxes − ChargesPersonnel
 *
 * Convention PCG SIG : les subventions d'exploitation s'ajoutent à ce niveau.
 */
export function calcEBE(
  valeurAjoutee: YearAcc,
  subventions: YearAcc,
  impotsTaxes: YearAcc,
  chargesPersonnel: YearAcc,
): YearAcc {
  return {
    y1: valeurAjoutee.y1 + subventions.y1 - impotsTaxes.y1 - chargesPersonnel.y1,
    y2: valeurAjoutee.y2 + subventions.y2 - impotsTaxes.y2 - chargesPersonnel.y2,
    y3: valeurAjoutee.y3 + subventions.y3 - impotsTaxes.y3 - chargesPersonnel.y3,
  };
}

// ── Résultat d'exploitation ───────────────────────────────────────────────────

/**
 * ResExpl = EBE − DotAmort − DotProv + Reprises
 */
export function calcResExpl(
  ebe: YearAcc,
  dotationsAmort: YearAcc,
  dotationsProvisions: YearAcc,
  reprises: YearAcc,
): YearAcc {
  return {
    y1: ebe.y1 - dotationsAmort.y1 - dotationsProvisions.y1 + reprises.y1,
    y2: ebe.y2 - dotationsAmort.y2 - dotationsProvisions.y2 + reprises.y2,
    y3: ebe.y3 - dotationsAmort.y3 - dotationsProvisions.y3 + reprises.y3,
  };
}
