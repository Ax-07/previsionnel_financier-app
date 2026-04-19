import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, type YearAcc } from "@/lib/finance/utils";
import { distribuerAmortParExercice } from "./amortissements";
import type { FinCalcResult } from "./index";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Immobilisations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface ImmoBilanResult {
  immoBruteIncorp: YearAcc;
  immoBruteCorp: YearAcc;
  immoBruteFin: YearAcc;
  amortCumulIncorp: YearAcc;
  amortCumulCorp: YearAcc;
  amortCumulFin: YearAcc;
  immoNetteIncorp: YearAcc;
  immoNetteCorp: YearAcc;
  immoNetteFin: YearAcc;
  immoNette: YearAcc;
  /** Total cumulatif des montants HT acquis (= immobilisations brutes totales). */
  immoAcquises: YearAcc;
}

/**
 * Calcule les immobilisations brutes, amortissements cumulÃ©s et valeurs nettes
 * (incorporelles + corporelles) pour les 3 exercices fiscaux.
 *
 * Si `dotationsParImmo` est fourni (issu de `FinCalcResult.dotationsParImmoAcc`),
 * les dotations annuelles sont lues directement depuis ce tableau, Ã©vitant de
 * relancer `distribuerAmortParExercice` sur chaque immobilisation.
 */
export function calcImmosBilan(
  data: Pick<ScenarioFinData, "immobilisations">,
  anneeDebut: number,
  moisDebut: number,
  exBorne1: Date,
  exBorne2: Date,
  exBorne3: Date,
  dotationsParImmo?: FinCalcResult["dotationsParImmoAcc"],
): ImmoBilanResult {
  const actives = data.immobilisations.filter((i) => i.actif !== false);
  const zero: YearAcc = { y1: 0, y2: 0, y3: 0 };

  const immoBruteIncorp: YearAcc = { ...zero };
  const immoBruteCorp: YearAcc = { ...zero };
  const immoBruteFin: YearAcc = { ...zero };
  const immoAcquises: YearAcc = { ...zero };

  for (const immo of actives) {
    const dAcq = new Date(String(immo.dateAcquisition));
    const montant = n(immo.montantHT);
    const target =
      immo.nature === "INCORPOREL" ? immoBruteIncorp
      : immo.nature === "FINANCIER" ? immoBruteFin
      : immoBruteCorp;

    if (dAcq <= exBorne1) { target.y1 += montant; immoAcquises.y1 += montant; }
    if (dAcq < exBorne2) { target.y2 += montant; immoAcquises.y2 += montant; }
    if (dAcq < exBorne3) { target.y3 += montant; immoAcquises.y3 += montant; }
    // Convention : borne inclusive pour exBorne1 (immo acquise le 1er jour de Y1 â†’ prÃ©sente en Y1).
    // Borne exclusive pour exBorne2/3 : immo acquise sur exBorne2 appartient Ã  Y2, pas Y1.
  }

  const dotIncorp: YearAcc = { ...zero };
  const dotCorp: YearAcc = { ...zero };
  const dotFin: YearAcc = { ...zero };
  if (dotationsParImmo) {
    for (const { immo, values } of dotationsParImmo) {
      const acc =
        immo.nature === "INCORPOREL" ? dotIncorp
        : immo.nature === "FINANCIER" ? dotFin
        : dotCorp;
      acc.y1 += values.y1;
      acc.y2 += values.y2;
      acc.y3 += values.y3;
    }
  } else {
    for (const immo of actives) {
      const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
      const acc =
        immo.nature === "INCORPOREL" ? dotIncorp
        : immo.nature === "FINANCIER" ? dotFin
        : dotCorp;
      acc.y1 += dot.y1;
      acc.y2 += dot.y2;
      acc.y3 += dot.y3;
    }
  }

  const amortCumulIncorp: YearAcc = {
    y1: dotIncorp.y1,
    y2: dotIncorp.y1 + dotIncorp.y2,
    y3: dotIncorp.y1 + dotIncorp.y2 + dotIncorp.y3,
  };
  const amortCumulCorp: YearAcc = {
    y1: dotCorp.y1,
    y2: dotCorp.y1 + dotCorp.y2,
    y3: dotCorp.y1 + dotCorp.y2 + dotCorp.y3,
  };
  const amortCumulFin: YearAcc = {
    y1: dotFin.y1,
    y2: dotFin.y1 + dotFin.y2,
    y3: dotFin.y1 + dotFin.y2 + dotFin.y3,
  };

  const immoNetteIncorp: YearAcc = {
    y1: immoBruteIncorp.y1 - amortCumulIncorp.y1,
    y2: immoBruteIncorp.y2 - amortCumulIncorp.y2,
    y3: immoBruteIncorp.y3 - amortCumulIncorp.y3,
  };
  const immoNetteCorp: YearAcc = {
    y1: immoBruteCorp.y1 - amortCumulCorp.y1,
    y2: immoBruteCorp.y2 - amortCumulCorp.y2,
    y3: immoBruteCorp.y3 - amortCumulCorp.y3,
  };
  const immoNetteFin: YearAcc = {
    y1: immoBruteFin.y1 - amortCumulFin.y1,
    y2: immoBruteFin.y2 - amortCumulFin.y2,
    y3: immoBruteFin.y3 - amortCumulFin.y3,
  };
  const immoNette: YearAcc = {
    y1: immoNetteIncorp.y1 + immoNetteCorp.y1 + immoNetteFin.y1,
    y2: immoNetteIncorp.y2 + immoNetteCorp.y2 + immoNetteFin.y2,
    y3: immoNetteIncorp.y3 + immoNetteCorp.y3 + immoNetteFin.y3,
  };

  return {
    immoBruteIncorp,
    immoBruteCorp,
    immoBruteFin,
    amortCumulIncorp,
    amortCumulCorp,
    amortCumulFin,
    immoNetteIncorp,
    immoNetteCorp,
    immoNetteFin,
    immoNette,
    immoAcquises,
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Apports cumulatifs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface ApportsCumulResult {
  /** Capital social + apports en nature cumulÃ©s Ã  fin de chaque exercice. */
  apportsCapital: YearAcc;
  /** Comptes courants associÃ©s cumulÃ©s Ã  fin de chaque exercice. */
  apportsCC: YearAcc;
}

/**
 * Calcule les apports en capital et les comptes courants associÃ©s de faÃ§on
 * cumulative pour chaque exercice fiscal.
 * Les prÃªts d'honneur (TypeSubvention = PRET_HONNEUR) sont intÃ©grÃ©s dans
 * les comptes courants associÃ©s pour rester cohÃ©rent avec le plan de
 * financement et le tableau de trÃ©sorerie.
 *
 * Les remboursements de compte courant (TypeDiversFlux.REMBOURSEMENT_CC) sont
 * dÃ©duits de l'apportsCC pour donner la position nette (la dette rÃ©elle envers
 * les associÃ©s), cohÃ©rente avec le flux de trÃ©sorerie (decDivers).
 */
export function calcApportsCumulatifs(
  data: Pick<ScenarioFinData, "apports" | "subventions" | "diversRemboursementsCC">,
  exBorne1: Date,
  exBorne2: Date,
  exBorne3: Date,
): ApportsCumulResult {
  const zero: YearAcc = { y1: 0, y2: 0, y3: 0 };
  const apportsCapital: YearAcc = { ...zero };
  const apportsCC: YearAcc = { ...zero };

  for (const apport of data.apports) {
    const dApp = new Date(String(apport.dateApport));
    const montant = n(apport.montant);
    const isCapital = apport.type === "CAPITAL" || apport.type === "APPORT_NATURE";
    const isCC = apport.type === "COMPTE_COURANT";

    if (dApp <= exBorne1) {
      if (isCapital) apportsCapital.y1 += montant;
      else if (isCC) apportsCC.y1 += montant;
    }
    if (dApp < exBorne2) {
      if (isCapital) apportsCapital.y2 += montant;
      else if (isCC) apportsCC.y2 += montant;
    }
    if (dApp < exBorne3) {
      if (isCapital) apportsCapital.y3 += montant;
      else if (isCC) apportsCC.y3 += montant;
    }
  }

  // PrÃªts d'honneur : traitÃ©s comme comptes courants associÃ©s
  // (cohÃ©rence avec plan-financement et trÃ©sorerie mensuelle)
  for (const subv of data.subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (!d) continue;
    const dSubv = new Date(String(d));
    const montant = n(subv.montant);
    if (dSubv <= exBorne1) apportsCC.y1 += montant;
    if (dSubv < exBorne2) apportsCC.y2 += montant;
    if (dSubv < exBorne3) apportsCC.y3 += montant;
  }

  // Remboursements CC : rÃ©duction de la dette envers les associÃ©s.
  // On dÃ©duit le cumul des remboursements pour obtenir la position nette.
  for (const flux of data.diversRemboursementsCC) {
    if (flux.dateN) {
      const d = new Date(String(flux.dateN));
      const m = n(flux.montantN);
      if (d <= exBorne1) apportsCC.y1 -= m;
      if (d < exBorne2) apportsCC.y2 -= m;
      if (d < exBorne3) apportsCC.y3 -= m;
    }
    if (flux.dateN1) {
      const d = new Date(String(flux.dateN1));
      const m = n(flux.montantN1);
      if (d < exBorne2) apportsCC.y2 -= m;
      if (d < exBorne3) apportsCC.y3 -= m;
    }
    if (flux.dateN2) {
      const d = new Date(String(flux.dateN2));
      const m = n(flux.montantN2);
      if (d < exBorne3) apportsCC.y3 -= m;
    }
  }

  return { apportsCapital, apportsCC };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Emprunts passif â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface EmpruntsPassifResult {
  /** Capital restant dÃ» (haut de bilan passif) par exercice. */
  capitalRestantDu: YearAcc;
  /** Cumul des montants dÃ©bloquÃ©s pour le calcul du solde de trÃ©sorerie. */
  empruntsDebloques: YearAcc;
  /** Cumul des remboursements en capital pour le calcul du solde de trÃ©sorerie. */
  remboursementsCumul: YearAcc;
}

/**
 * Calcule le capital restant dÃ» sur les emprunts (passif) ainsi que les flux
 * cumulatifs (dÃ©blocages et remboursements) nÃ©cessaires au calcul de trÃ©sorerie.
 */
export function calcEmpruntsPassif(
  data: Pick<ScenarioFinData, "emprunts">,
  exBorne1: Date,
  exBorne2: Date,
  exBorne3: Date,
): EmpruntsPassifResult {
  const zero: YearAcc = { y1: 0, y2: 0, y3: 0 };
  const capitalRestantDu: YearAcc = { ...zero };
  const empruntsDebloques: YearAcc = { ...zero };
  const remboursementsCumul: YearAcc = { ...zero };

  for (const emprunt of data.emprunts) {
    const totalCapital = n(emprunt.montant);
    const dDeb = new Date(String(emprunt.dateDéblocage));

    if (dDeb <= exBorne1) empruntsDebloques.y1 += totalCapital;
    if (dDeb < exBorne2) empruntsDebloques.y2 += totalCapital;
    if (dDeb < exBorne3) empruntsDebloques.y3 += totalCapital;

    let cumY1 = 0;
    let cumY2 = 0;
    let cumY3 = 0;
    for (const ligne of emprunt.lignesEcheancier) {
      const dl = new Date(String(ligne.dateEcheance));
      const cap = n(ligne.capitalRembourse);
      if (dl <= exBorne1) { cumY1 += cap; remboursementsCumul.y1 += cap; }
      if (dl < exBorne2) { cumY2 += cap; remboursementsCumul.y2 += cap; }
      if (dl < exBorne3) { cumY3 += cap; remboursementsCumul.y3 += cap; }
    }

    capitalRestantDu.y1 += Math.max(0, totalCapital - cumY1);
    capitalRestantDu.y2 += Math.max(0, totalCapital - cumY2);
    capitalRestantDu.y3 += Math.max(0, totalCapital - cumY3);
  }

  return { capitalRestantDu, empruntsDebloques, remboursementsCumul };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Provisions cumulÃ©es â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * Calcule la provision nette cumulÃ©e (dotations âˆ’ reprises) visible au passif.
 * La valeur est cumulative sur les 3 exercices pour reflÃ©ter le stock de provisions.
 */
export function calcProvisionsCumul(
  fc: Pick<FinCalcResult, "dotationsProvisions" | "reprises">,
): YearAcc {
  const net1 = fc.dotationsProvisions.y1 - fc.reprises.y1;
  const net2 = fc.dotationsProvisions.y2 - fc.reprises.y2;
  const net3 = fc.dotationsProvisions.y3 - fc.reprises.y3;
  return {
    y1: net1,
    y2: net1 + net2,
    y3: net1 + net2 + net3,
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Capitaux propres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface CapitauxPropresResult {
  capitalSocial: YearAcc;
  comptesCoursants: YearAcc;
  /** Cumul des rÃ©sultats des exercices antÃ©rieurs (report Ã  nouveau). */
  reportANouveau: YearAcc;
  capitauxPropres: YearAcc;
}

/**
 * Calcule les capitaux propres du passif.
 * Le report Ã  nouveau est le cumul des rÃ©sultats nets des exercices prÃ©cÃ©dents.
 */
export function calcCapitauxPropres(
  apportsCapital: YearAcc,
  apportsCC: YearAcc,
  resultatNet: YearAcc,
): CapitauxPropresResult {
  const reportANouveau: YearAcc = {
    y1: 0,
    y2: resultatNet.y1,
    y3: resultatNet.y1 + resultatNet.y2,
  };
  const capitauxPropres: YearAcc = {
    y1: apportsCapital.y1 + apportsCC.y1 + reportANouveau.y1 + resultatNet.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + reportANouveau.y2 + resultatNet.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + reportANouveau.y3 + resultatNet.y3,
  };
  return {
    capitalSocial: apportsCapital,
    comptesCoursants: apportsCC,
    reportANouveau,
    capitauxPropres,
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ TrÃ©sorerie bilan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface TresorerieBilanResult {
  /** TrÃ©sorerie positive en fin d'exercice (actif circulant). */
  disponibilites: YearAcc;
  /** DÃ©couvert bancaire en fin d'exercice (concours bancaires courants, passif). */
  decouvert: YearAcc;
}

/**
 * Calcule le solde de trÃ©sorerie de fin d'exercice Ã  partir des flux cumulatifs.
 *
 * Formule :
 *   trÃ©so = apports + cafCumul + empruntsDebloques + encFluxNonPL
 *           âˆ’ immoAcquises âˆ’ stocksCumul âˆ’ remboursementsCumul âˆ’ decFluxNonPL
 * Correction :
 *   trÃ©so corrigÃ©e = trÃ©so + totalDettesExploitation
 *   (les dettes d'exploitation sont des ressources cash implicites)
 *
 * Les flux non-P&L (`encFluxNonPL` / `decFluxNonPL`) permettent d'intÃ©grer
 * les subventions d'investissement et les encaissements/dÃ©caissements divers
 * qui ne transitent pas par le compte de rÃ©sultat mais sont bien des flux cash
 * dans le tableau de trÃ©sorerie.
 *
 * Note : les remboursements de CC sont dÃ©jÃ  intÃ©grÃ©s via `apportsCC` (net).
 */
export function calcTresorerieBilan(params: {
  caf: YearAcc;
  apportsCapital: YearAcc;
  apportsCC: YearAcc;
  empruntsDebloques: YearAcc;
  immoAcquises: YearAcc;
  /** Besoins BFR non-cash en fin d'exercice : stocks de matiÃ¨res + crÃ©dit de TVA. */
  stocksCumul: YearAcc;
  /** Total dettes d'exploitation (= totalRessources issu de calcBfr). */
  totalDettesExploitation: YearAcc;
  remboursementsCumul: YearAcc;
  /**
   * Encaissements cumulatifs non-P&L : subventions d'investissement +
   * encaissements divers (TypeDiversFlux.ENCAISSEMENT).
   * @default { y1: 0, y2: 0, y3: 0 }
   */
  encFluxNonPLCumul?: YearAcc;
  /**
   * DÃ©caissements cumulatifs non-P&L : dÃ©caissements divers
   * (TypeDiversFlux.DECAISSEMENT) â€” hors remboursements CC dÃ©jÃ  dÃ©duits d'apportsCC.
   * @default { y1: 0, y2: 0, y3: 0 }
   */
  decFluxNonPLCumul?: YearAcc;
}): TresorerieBilanResult {
  const {
    caf,
    apportsCapital,
    apportsCC,
    empruntsDebloques,
    immoAcquises,
    stocksCumul,
    totalDettesExploitation,
    remboursementsCumul,
    encFluxNonPLCumul = { y1: 0, y2: 0, y3: 0 },
    decFluxNonPLCumul = { y1: 0, y2: 0, y3: 0 },
  } = params;

  const cafCumul: YearAcc = {
    y1: caf.y1,
    y2: caf.y1 + caf.y2,
    y3: caf.y1 + caf.y2 + caf.y3,
  };

  const tresorerie: YearAcc = {
    y1: apportsCapital.y1 + apportsCC.y1 + empruntsDebloques.y1 + cafCumul.y1
      + encFluxNonPLCumul.y1 - decFluxNonPLCumul.y1
      - immoAcquises.y1 - stocksCumul.y1 - remboursementsCumul.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + empruntsDebloques.y2 + cafCumul.y2
      + encFluxNonPLCumul.y2 - decFluxNonPLCumul.y2
      - immoAcquises.y2 - stocksCumul.y2 - remboursementsCumul.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + empruntsDebloques.y3 + cafCumul.y3
      + encFluxNonPLCumul.y3 - decFluxNonPLCumul.y3
      - immoAcquises.y3 - stocksCumul.y3 - remboursementsCumul.y3,
  };

  // Les dettes d'exploitation sont des ressources implicites (cash non encore dÃ©caissÃ©)
  const tresorerieCor: YearAcc = {
    y1: tresorerie.y1 + totalDettesExploitation.y1,
    y2: tresorerie.y2 + totalDettesExploitation.y2,
    y3: tresorerie.y3 + totalDettesExploitation.y3,
  };

  return {
    disponibilites: {
      y1: Math.max(0, tresorerieCor.y1),
      y2: Math.max(0, tresorerieCor.y2),
      y3: Math.max(0, tresorerieCor.y3),
    },
    decouvert: {
      y1: Math.max(0, -tresorerieCor.y1),
      y2: Math.max(0, -tresorerieCor.y2),
      y3: Math.max(0, -tresorerieCor.y3),
    },
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Flux non-P&L cumulatifs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface FluxNonPLResult {
  /** Encaissements cumulatifs non-P&L : subventions d'investissement (hors PRET_HONNEUR) + divers encaissements. */
  encFluxNonPLCumul: YearAcc;
  /** DÃ©caissements cumulatifs non-P&L : divers dÃ©caissements (hors remboursements CC dÃ©jÃ  dans apportsCC). */
  decFluxNonPLCumul: YearAcc;
}

/**
 * Calcule les flux non-P&L cumulatifs (subventions d'investissement + encaissements/dÃ©caissements divers)
 * nÃ©cessaires Ã  l'Ã©quation de trÃ©sorerie du bilan et des ratios.
 *
 * Source unique de vÃ©ritÃ© partagÃ©e par `aggregations/bilan.ts` et `aggregations/ratios.ts`
 * pour garantir la cohÃ©rence de la trÃ©sorerie entre le bilan et les ratios.
 */
export function calcFluxNonPLCumul(
  data: Pick<ScenarioFinData, "subventions" | "diversEncaissements" | "diversDecaissements">,
  exBorne1: Date,
  exBorne2: Date,
  exBorne3: Date,
): FluxNonPLResult {
  const encFluxNonPLCumul: YearAcc = { y1: 0, y2: 0, y3: 0 };
  const decFluxNonPLCumul: YearAcc = { y1: 0, y2: 0, y3: 0 };

  // Subventions d'investissement (hors PRET_HONNEUR dÃ©jÃ  dans apportsCC)
  for (const subv of data.subventions) {
    if (subv.type === "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (!d) continue;
    const dt = new Date(String(d));
    const m = n(subv.montant);
    if (dt < exBorne1) encFluxNonPLCumul.y1 += m;
    if (dt < exBorne2) encFluxNonPLCumul.y2 += m;
    if (dt < exBorne3) encFluxNonPLCumul.y3 += m;
  }

  // Encaissements divers (TypeDiversFlux.ENCAISSEMENT)
  // Flux sans date â†’ distribuÃ©s uniformÃ©ment dans l'exercice (cumulativement prÃ©sent en Y1, Y2, Y3).
  for (const flux of data.diversEncaissements) {
    if (flux.dateN) { const dt = new Date(String(flux.dateN)); const m = n(flux.montantN); if (dt < exBorne1) encFluxNonPLCumul.y1 += m; if (dt < exBorne2) encFluxNonPLCumul.y2 += m; if (dt < exBorne3) encFluxNonPLCumul.y3 += m; }
    else { const m = n(flux.montantN); encFluxNonPLCumul.y1 += m; encFluxNonPLCumul.y2 += m; encFluxNonPLCumul.y3 += m; }
    if (flux.dateN1) { const dt = new Date(String(flux.dateN1)); const m = n(flux.montantN1); if (dt < exBorne2) encFluxNonPLCumul.y2 += m; if (dt < exBorne3) encFluxNonPLCumul.y3 += m; }
    else { const m = n(flux.montantN1); encFluxNonPLCumul.y2 += m; encFluxNonPLCumul.y3 += m; }
    if (flux.dateN2) { const dt = new Date(String(flux.dateN2)); const m = n(flux.montantN2); if (dt < exBorne3) encFluxNonPLCumul.y3 += m; }
    else { encFluxNonPLCumul.y3 += n(flux.montantN2); }
  }

  // DÃ©caissements divers (TypeDiversFlux.DECAISSEMENT)
  for (const flux of data.diversDecaissements) {
    if (flux.dateN) { const dt = new Date(String(flux.dateN)); const m = n(flux.montantN); if (dt < exBorne1) decFluxNonPLCumul.y1 += m; if (dt < exBorne2) decFluxNonPLCumul.y2 += m; if (dt < exBorne3) decFluxNonPLCumul.y3 += m; }
    else { const m = n(flux.montantN); decFluxNonPLCumul.y1 += m; decFluxNonPLCumul.y2 += m; decFluxNonPLCumul.y3 += m; }
    if (flux.dateN1) { const dt = new Date(String(flux.dateN1)); const m = n(flux.montantN1); if (dt < exBorne2) decFluxNonPLCumul.y2 += m; if (dt < exBorne3) decFluxNonPLCumul.y3 += m; }
    else { const m = n(flux.montantN1); decFluxNonPLCumul.y2 += m; decFluxNonPLCumul.y3 += m; }
    if (flux.dateN2) { const dt = new Date(String(flux.dateN2)); const m = n(flux.montantN2); if (dt < exBorne3) decFluxNonPLCumul.y3 += m; }
    else { decFluxNonPLCumul.y3 += n(flux.montantN2); }
  }

  return { encFluxNonPLCumul, decFluxNonPLCumul };
}
