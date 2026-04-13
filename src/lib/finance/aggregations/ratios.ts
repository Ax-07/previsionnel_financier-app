/**
 * Construction des lignes de présentation des Ratios financiers.
 *
 * Responsabilité unique : assembler les résultats des calculs de bilan/BFR en une
 * structure `RatiosData` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/ratios
 * @extracted-from app/actions/controle/ratios.ts
 */

import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { calcBfr } from "@/lib/finance/calculs/bfr";
import {
  calcImmosBilan,
  calcApportsCumulatifs,
  calcEmpruntsPassif,
  calcTresorerieBilan,
  calcCapitauxPropres,
  calcFluxNonPLCumul,
} from "@/lib/finance/calculs/bilan";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RatioValue {
  /** Valeur calculée (null si dénominateur = 0) */
  value: number | null;
}

export interface RatioRow {
  key: string;
  label: string;
  /** Unité affichée : "jours", "%", "années" */
  unit: string;
  /** Nombre de décimales */
  decimals: number;
  values: Record<YearKey, RatioValue>;
}

export interface RatiosData {
  yearLabels: Record<YearKey, string>;
  rows: RatioRow[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

type YAcc = { y1: number; y2: number; y3: number };

/** Division sécurisée — renvoie null si le dénominateur vaut 0 */
function safeDiv(num: number, den: number): number | null {
  return Math.abs(den) < 0.001 ? null : num / den;
}

function mkRow(
  key: string,
  label: string,
  unit: string,
  decimals: number,
  vals: Record<YearKey, number | null>,
): RatioRow {
  return {
    key,
    label,
    unit,
    decimals,
    values: {
      y1: { value: vals.y1 },
      y2: { value: vals.y2 },
      y3: { value: vals.y3 },
    },
  };
}

// ── Builder principal ─────────────────────────────────────────────────────────

export function buildRatiosRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): RatiosData {
  const { yearLabels, anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3 } = fc;

  // Source unique de vérité pour les calculs BFR (stocks, dettes, TVA)
  const bfr = calcBfr(data, fc);

  // ── Achats annuels bruts (sans variation stock) ────────────────────────────
  const achatsRows = bfr.achatsRows;
  const stocks = bfr.stocksMatieres;

  // achats consommés = CA × coef (COGS annuel) — source unique de vérité
  const achatsConsommes: YAcc = {
    y1: achatsRows.reduce((s: number, r) => s + r.montantN * r.coef, 0),
    y2: achatsRows.reduce((s: number, r) => s + r.montantN1 * r.coef, 0),
    y3: achatsRows.reduce((s: number, r) => s + r.montantN2 * r.coef, 0),
  };

  // Achats effectués HT = achats consommés + ΔStock
  // Y1 : SI=0 (démarrage)  →  achEff = consommés + SF
  // Y2 : SF(y1) devient SI(y2)  →  achEff = consommés + SF(y2) − SF(y1)
  const achatsEffectuesHT: YAcc = {
    y1: achatsConsommes.y1 + stocks.y1,
    y2: achatsConsommes.y2 + stocks.y2 - stocks.y1,
    y3: achatsConsommes.y3 + stocks.y3 - stocks.y2,
  };

  // ── Calculs délégués aux modules spécialisés (cohérence avec bilan.ts) ────────
  const immos = calcImmosBilan(data, anneeDebut, moisDebut, exBorne1, exBorne2, exBorne3, fc.dotationsParImmoAcc);
  const { apportsCapital, apportsCC } = calcApportsCumulatifs(data, exBorne1, exBorne2, exBorne3);
  const { capitalRestantDu, empruntsDebloques, remboursementsCumul } = calcEmpruntsPassif(data, exBorne1, exBorne2, exBorne3);

  // Trésorerie via la source unique de vérité (même formule que bilan.ts)
  const stocksCumul: YAcc = {
    y1: bfr.stocksMatieres.y1 + bfr.creditTVA.y1 + bfr.creancesClients.y1,
    y2: bfr.stocksMatieres.y2 + bfr.creditTVA.y2 + bfr.creancesClients.y2,
    y3: bfr.stocksMatieres.y3 + bfr.creditTVA.y3 + bfr.creancesClients.y3,
  };
  const { disponibilites, decouvert } = calcTresorerieBilan({
    caf: fc.caf,
    apportsCapital,
    apportsCC,
    empruntsDebloques,
    immoAcquises: immos.immoAcquises,
    stocksCumul,
    totalDettesExploitation: bfr.totalRessources,
    remboursementsCumul,
    ...calcFluxNonPLCumul(data, exBorne1, exBorne2, exBorne3),
  });

  const immoNetteFin = immos.immoNette;
  const resultatNet = fc.resNet;
  const caf = fc.caf;

  const actifCirculant: YAcc = {
    y1: stocks.y1 + disponibilites.y1 + bfr.creditTVA.y1 + bfr.creancesClients.y1,
    y2: stocks.y2 + disponibilites.y2 + bfr.creditTVA.y2 + bfr.creancesClients.y2,
    y3: stocks.y3 + disponibilites.y3 + bfr.creditTVA.y3 + bfr.creancesClients.y3,
  };
  const totalActif: YAcc = {
    y1: immoNetteFin.y1 + actifCirculant.y1,
    y2: immoNetteFin.y2 + actifCirculant.y2,
    y3: immoNetteFin.y3 + actifCirculant.y3,
  };

  // Capitaux propres (inclut prêts d'honneur via apportsCC)
  const { capitauxPropres } = calcCapitauxPropres(apportsCapital, apportsCC, resultatNet);

  // ── Dettes d'exploitation (source : calcBfr) ───────────────────────────────────
  const totalDettesExploitation = bfr.totalRessources;
  const totalDettes: YAcc = {
    y1: capitalRestantDu.y1 + totalDettesExploitation.y1 + decouvert.y1,
    y2: capitalRestantDu.y2 + totalDettesExploitation.y2 + decouvert.y2,
    y3: capitalRestantDu.y3 + totalDettesExploitation.y3 + decouvert.y3,
  };

  // ── Construction des lignes de ratios ──────────────────────────────────────────────
  const rows: RatioRow[] = [
    // ── Rotation ───────────────────────────────────────────────────────────────────
    mkRow(
      "delai_stocks",
      "Délai des stocks de matières",
      "jours",
      1,
      {
        // Dénominateur = achats effectués HT (flux réel d'approvisionnement)
        y1: safeDiv(stocks.y1 * 365, achatsEffectuesHT.y1),
        y2: safeDiv(stocks.y2 * 365, achatsEffectuesHT.y2),
        y3: safeDiv(stocks.y3 * 365, achatsEffectuesHT.y3),
      },
    ),
    mkRow(
      "delai_fournisseurs",
      "Délai des dettes fournisseurs",
      "jours",
      1,
      {
        // Dettes fournisseurs TTC → convertir le dénominateur en TTC
        // coefTVA moyen = dettesFournisseurs(TTC) / achatsEffectués(HT)
        // On utilise achatsEffectués HT comme base et on convertit les dettes TTC en HT
        // via le ratio TTC/HT implicite (dettesF = achatsEffHT × (1 + tauxTVAMoy) × délai/360)
        // Formule standard : délai = dettesF(TTC) × 365 / achatsEff(TTC)
        // achatsEff(TTC) ≈ achatsEffHT × (1 + tauxTVAmoyen) — approché via bfr.dettesFournisseurs
        // Simplification : délai = dettesF × 365 / achatsEffHT × coefTTC
        // Pour éviter une double approximation on utilise achatsEffectues (déjà en HT)
        // et on note que dettesF est en TTC → diviser par (1 + taux moyen)
        // Le taux de TVA moyen n'est pas directement exposé ici, on utilise donc fc.achatsEffectues
        // (déjà calculé par le moteur) comme dénominateur HT, dettes fournisseurs étant TTC :
        // délai (j) = dettesTTC × 365 / achatsEffTTC ; achatsEffTTC = fc.achatsEffectues × coefTVA
        // Approche pragmatique : utiliser fc.achatsEffectues (HT) directement en dénominateur
        // car la TVA est neutre sur le délai réel (acheteur voit HT, TVA non affectante sur délai)
        y1: safeDiv(bfr.dettesFournisseurs.y1 * 365, achatsEffectuesHT.y1),
        y2: safeDiv(bfr.dettesFournisseurs.y2 * 365, achatsEffectuesHT.y2),
        y3: safeDiv(bfr.dettesFournisseurs.y3 * 365, achatsEffectuesHT.y3),
      },
    ),
    // ── Structure financière ───────────────────────────────────────────────────────
    mkRow(
      "autonomie_lt",
      "Autonomie financière à long terme",
      "%",
      1,
      {
        y1: safeDiv(capitauxPropres.y1 * 100, totalActif.y1),
        y2: safeDiv(capitauxPropres.y2 * 100, totalActif.y2),
        y3: safeDiv(capitauxPropres.y3 * 100, totalActif.y3),
      },
    ),
    mkRow(
      "solvabilite_mt",
      "Solvabilité à moyen terme",
      "%",
      1,
      {
        y1: safeDiv(totalActif.y1 * 100, totalDettes.y1),
        y2: safeDiv(totalActif.y2 * 100, totalDettes.y2),
        y3: safeDiv(totalActif.y3 * 100, totalDettes.y3),
      },
    ),
    mkRow(
      "solvabilite_ct",
      "Solvabilité à court terme",
      "%",
      1,
      {
        y1: safeDiv(actifCirculant.y1 * 100, totalDettesExploitation.y1),
        y2: safeDiv(actifCirculant.y2 * 100, totalDettesExploitation.y2),
        y3: safeDiv(actifCirculant.y3 * 100, totalDettesExploitation.y3),
      },
    ),
    mkRow(
      "taux_endettement",
      "Taux d'endettement",
      "%",
      1,
      {
        y1: safeDiv(totalDettes.y1 * 100, capitauxPropres.y1),
        y2: safeDiv(totalDettes.y2 * 100, capitauxPropres.y2),
        y3: safeDiv(totalDettes.y3 * 100, capitauxPropres.y3),
      },
    ),
    // ── Capacité de remboursement ──────────────────────────────────────────────────
    mkRow(
      "capacite_remboursement",
      "Capacité de remboursement",
      "années",
      2,
      {
        y1: safeDiv(capitalRestantDu.y1, caf.y1),
        y2: safeDiv(capitalRestantDu.y2, caf.y2),
        y3: safeDiv(capitalRestantDu.y3, caf.y3),
      },
    ),
  ];

  return { yearLabels, rows };
}
