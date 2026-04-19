/**
 * Couche d'agrégation pour l'onglet Synthèse.
 *
 * Fonction pure : construit les lignes de synthèse à partir de `FinCalcResult`
 * et des résultats d'agrégation des autres onglets (seuil, BFR, bilan, trésorerie).
 *
 * Contrairement à l'ancienne implémentation qui extrayait les valeurs depuis
 * l'arbre SIG (avec des clés manquantes comme `"ca"`, `"marge_globale"`),
 * cette version utilise `fc` directement — source unique de vérité.
 *
 * @module aggregations/synthese
 */

import type { FinCalcResult } from "@/lib/finance/types/results";
import type { YearKey } from "@/lib/finance/utils";
import type { YearAcc } from "@/lib/finance/types/series";
import type { BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrRow } from "@/lib/finance/aggregations/bfr";
import type { BilanRow } from "@/lib/finance/aggregations/bilan";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import {
  extractBfrAmt,
  extractBilanAmt,
  extractTresoAmt,
} from "@/lib/finance/aggregations/helpers/extract";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SynthValue {
  amount: number | null;
  pct: number | null;
}

export interface SynthRow {
  key: string;
  label: string;
  style: "section" | "normal" | "highlight";
  showPct: boolean;
  isTaux?: boolean;
  isDays?: boolean;
  values: Record<YearKey, SynthValue>;
}

export interface SyntheseData {
  yearLabels: Record<YearKey, string>;
  rows: SynthRow[];
}

// ── Helpers internes ──────────────────────────────────────────────────────────

const ZERO_VAL: SynthValue = { amount: 0, pct: null };

function pctOfCA(amount: number, ca: number): number | null {
  return ca !== 0 ? (amount / ca) * 100 : null;
}

/** Construit les valeurs annuelles avec % du CA depuis un YearAcc. */
function sigValues(amt: YearAcc, ca: YearAcc): Record<YearKey, SynthValue> {
  return {
    y1: { amount: amt.y1, pct: pctOfCA(amt.y1, ca.y1) },
    y2: { amount: amt.y2, pct: pctOfCA(amt.y2, ca.y2) },
    y3: { amount: amt.y3, pct: pctOfCA(amt.y3, ca.y3) },
  };
}

/** Extrait une ligne du seuil de rentabilité au format SynthValue. */
function breakEvenValues(rows: BreakEvenRow[], key: string): Record<YearKey, SynthValue> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: ZERO_VAL, y2: ZERO_VAL, y3: ZERO_VAL };
  return {
    y1: { amount: row.values.y1.amount, pct: row.values.y1.pct },
    y2: { amount: row.values.y2.amount, pct: row.values.y2.pct },
    y3: { amount: row.values.y3.amount, pct: row.values.y3.pct },
  };
}

/** Construit les valeurs annuelles sans % depuis un Record<YearKey, number>. */
function amtValues(amount: Record<YearKey, number>): Record<YearKey, SynthValue> {
  return {
    y1: { amount: amount.y1, pct: null },
    y2: { amount: amount.y2, pct: null },
    y3: { amount: amount.y3, pct: null },
  };
}

function mkRow(
  key: string,
  label: string,
  style: SynthRow["style"],
  showPct: boolean,
  values: Record<YearKey, SynthValue>,
  options?: { isTaux?: boolean; isDays?: boolean },
): SynthRow {
  return { key, label, style, showPct, values, ...options };
}

function sectionRow(key: string, label: string): SynthRow {
  return { key, label, style: "section", showPct: false, values: { y1: ZERO_VAL, y2: ZERO_VAL, y3: ZERO_VAL } };
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Construit les données de la synthèse financière.
 *
 * @param fc         Résultat du moteur de calcul (source unique de vérité)
 * @param seuilRows  Lignes du seuil de rentabilité (depuis buildBreakEvenData)
 * @param bfrRows    Lignes du BFR (depuis buildBfrRows)
 * @param bilanRows  Lignes du bilan (depuis buildBilanRows)
 * @param tresoRows  Lignes de trésorerie (depuis buildTresorerieRows)
 */
export function buildSyntheseData(
  fc: FinCalcResult,
  seuilRows: BreakEvenRow[],
  bfrRows: BfrRow[],
  bilanRows: BilanRow[],
  tresoRows: TresorerieRow[],
): SyntheseData {
  const { ca } = fc;

  // ── SIG — valeurs directes depuis FinCalcResult ─────────────────────────────
  const caValues = sigValues(ca, ca);
  const ventesProdReelle = sigValues(ca, ca);
  const margeGlobale = sigValues(fc.margeProd, ca);
  const va = sigValues(fc.valeurAjoutee, ca);
  const ebe = sigValues(fc.ebe, ca);
  const resExpl = sigValues(fc.resExpl, ca);
  const resFin = sigValues(fc.resFin, ca);
  const resCourant = sigValues(fc.resCourant, ca);
  const resNet = sigValues(fc.resNet, ca);
  const caf = sigValues(fc.caf, ca);

  // ── Seuil de rentabilité ───────────────────────────────────────────────────
  const seuilVentes = breakEvenValues(seuilRows, "ventes_production");
  const seuilCV = breakEvenValues(seuilRows, "total_cv");
  const seuilTaux = breakEvenValues(seuilRows, "taux_marge_cv");
  const seuilCF = breakEvenValues(seuilRows, "total_cf");
  const seuilEco = breakEvenValues(seuilRows, "seuil_eco");
  const seuilExced = breakEvenValues(seuilRows, "excedent_eco");
  const pointMort = breakEvenValues(seuilRows, "point_mort_eco");

  // ── Trésorerie ─────────────────────────────────────────────────────────────
  const capitauxPropres = extractBilanAmt(bilanRows, "capitaux_propres");
  const emprunts = extractBilanAmt(bilanRows, "emprunts");
  const immoNette = extractBilanAmt(bilanRows, "immo_nette_total");

  const frAmt: Record<YearKey, number> = {
    y1: capitauxPropres.y1 + emprunts.y1 - immoNette.y1,
    y2: capitauxPropres.y2 + emprunts.y2 - immoNette.y2,
    y3: capitauxPropres.y3 + emprunts.y3 - immoNette.y3,
  };

  const bfrAmt = extractBfrAmt(bfrRows, "bfr");

  const soldeAnnuelAmt: Record<YearKey, number> = {
    y1: frAmt.y1 - bfrAmt.y1,
    y2: frAmt.y2 - bfrAmt.y2,
    y3: frAmt.y3 - bfrAmt.y3,
  };

  const soldeMensuelAmt = extractTresoAmt(tresoRows, "tres-solde-final");

  // ── Construction des lignes ────────────────────────────────────────────────
  const rows: SynthRow[] = [
    sectionRow("sec_sig", "SOLDES INTERMÉDIAIRES DE GESTION"),
    mkRow("ca", "Chiffre d'affaires", "highlight", true, caValues),
    mkRow("ventes_prod_reelle", "Ventes + Production réelle", "normal", true, ventesProdReelle),
    mkRow("marge_globale", "Marge globale", "normal", true, margeGlobale),
    mkRow("va", "Valeur ajoutée", "normal", true, va),
    mkRow("ebe", "Excédent brut d'exploitation", "normal", true, ebe),
    mkRow("res_expl", "Résultat d'exploitation", "normal", true, resExpl),
    mkRow("res_fin", "Résultat financier", "normal", true, resFin),
    mkRow("res_courant", "Résultat courant", "normal", true, resCourant),
    mkRow("res_net", "Résultat de l'exercice", "highlight", true, resNet),
    mkRow("caf", "Capacité d'autofinancement (CAF)", "highlight", true, caf),

    sectionRow("sec_seuil", "SEUIL DE RENTABILITÉ ÉCONOMIQUE"),
    mkRow("seuil_ventes", "Ventes + Production réelle", "highlight", false, seuilVentes),
    mkRow("seuil_cv", "Coûts variables", "normal", true, seuilCV),
    mkRow("seuil_taux", "Taux de marge sur coût variable", "normal", false, seuilTaux, { isTaux: true }),
    mkRow("seuil_cf", "Coûts fixes", "normal", true, seuilCF),
    mkRow("seuil_eco", "Seuil de rentabilité", "highlight", false, seuilEco),
    mkRow("seuil_exced", "Excédent / insuffisance", "normal", false, seuilExced),
    mkRow("point_mort", "Point mort (jours)", "normal", false, pointMort, { isDays: true }),

    sectionRow("sec_treso", "ÉTAT DE TRÉSORERIE"),
    mkRow("fr", "Fonds de roulement", "normal", false, amtValues(frAmt)),
    mkRow("bfr", "Besoin en fonds de roulement (BFR)", "normal", false, amtValues(bfrAmt)),
    mkRow("solde_annuel", "Solde de trésorerie (Annuel)", "highlight", false, amtValues(soldeAnnuelAmt)),
    mkRow("solde_mensuel", "Solde de trésorerie (Mensuel – M12)", "normal", false, amtValues(soldeMensuelAmt)),
  ];

  return { yearLabels: fc.yearLabels, rows };
}
