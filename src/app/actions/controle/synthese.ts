"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import { fetchSig } from "./sig";
import type { SigNode } from "./sig";
import { fetchSeuilRentabilite } from "./seuil-rentabilite";
import type { BreakEvenRow } from "./seuil-rentabilite";
import { fetchBfr } from "./bfr";
import type { BfrRow } from "./bfr";
import { fetchBilan } from "./bilan";
import type { BilanRow } from "./bilan";
import { fetchTresorerie } from "./tresorerie";
import type { TresorerieRow } from "./tresorerie";
import type { YearKey } from "@/lib/finance/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

// export type { YearKey };

export interface SynthValue {
  amount: number;
  pct: number | null;
}

export interface SynthRow {
  key: string;
  label: string;
  /**
   * section  → bandeau de section (titre gris)
   * normal   → ligne de détail standard
   * highlight → ligne clé (fond coloré)
   */
  style: "section" | "normal" | "highlight";
  /** Afficher la colonne % */
  showPct: boolean;
  /** L'amount est déjà un pourcentage (Taux de marge) → afficher avec % */
  isTaux?: boolean;
  /** L'amount représente des jours (Point mort) → afficher comme entier + " j" */
  isDays?: boolean;
  values: Record<YearKey, SynthValue>;
}

export interface SyntheseData {
  yearLabels: Record<YearKey, string>;
  rows: SynthRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ZERO_VAL: SynthValue = { amount: 0, pct: null };
const ZERO_ROW: Record<YearKey, SynthValue> = {
  y1: ZERO_VAL,
  y2: ZERO_VAL,
  y3: ZERO_VAL,
};

/** Cherche un nœud par clé dans la liste plate (top-level uniquement) */
function extractSig(nodes: SigNode[], key: string): Record<YearKey, SynthValue> {
  const node = nodes.find((n) => n.key === key);
  if (!node) return ZERO_ROW;
  return {
    y1: { amount: node.values.y1.amount, pct: node.values.y1.pct },
    y2: { amount: node.values.y2.amount, pct: node.values.y2.pct },
    y3: { amount: node.values.y3.amount, pct: node.values.y3.pct },
  };
}

/** Cherche une ligne par clé dans les lignes de seuil de rentabilité */
function extractBreakEven(rows: BreakEvenRow[], key: string): Record<YearKey, SynthValue> {
  const row = rows.find((r) => r.key === key);
  if (!row) return ZERO_ROW;
  return {
    y1: { amount: row.values.y1.amount, pct: row.values.y1.pct },
    y2: { amount: row.values.y2.amount, pct: row.values.y2.pct },
    y3: { amount: row.values.y3.amount, pct: row.values.y3.pct },
  };
}

/** Extrait le montant (scalaire) d'une ligne du bilan par clé */
function extractBilanAmt(rows: BilanRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

/** Extrait le montant (scalaire) d'une ligne du BFR par clé */
function extractBfrAmt(rows: BfrRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.amount,
    y2: row.values.y2.amount,
    y3: row.values.y3.amount,
  };
}

/** Extrait le total annuel (ou valeur M12 si totalIsEndValue) d'une ligne de trésorerie */
function extractTresoAmt(rows: TresorerieRow[], key: string): Record<YearKey, number> {
  const row = rows.find((r) => r.key === key);
  if (!row) return { y1: 0, y2: 0, y3: 0 };
  return {
    y1: row.values.y1.total,
    y2: row.values.y2.total,
    y3: row.values.y3.total,
  };
}

/** Construit un SynthRow à partir de valeurs numériques brutes */
function mkSynthAmt(
  amount: Record<YearKey, number>,
  base: Record<YearKey, number>,
  showPct: boolean,
): Record<YearKey, SynthValue> {
  function pctOf(a: number, b: number): number | null {
    if (!showPct || b === 0) return null;
    return (a / b) * 100;
  }
  return {
    y1: { amount: amount.y1, pct: pctOf(amount.y1, base.y1) },
    y2: { amount: amount.y2, pct: pctOf(amount.y2, base.y2) },
    y3: { amount: amount.y3, pct: pctOf(amount.y3, base.y3) },
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
  return {
    key,
    label,
    style: "section",
    showPct: false,
    values: { y1: ZERO_VAL, y2: ZERO_VAL, y3: ZERO_VAL },
  };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchSynthese(dossierId: string): Promise<SyntheseData> {
  // Un seul appel Prisma (~29 requêtes) partagé entre tous les calculs
  const data = await fetchScenarioData(dossierId);

  const [sigData, seuilData, bfrData, bilanData, tresoData] = await Promise.all([
    fetchSig(dossierId, data),
    fetchSeuilRentabilite(dossierId, data),
    fetchBfr(dossierId, data),
    fetchBilan(dossierId, data),
    fetchTresorerie(dossierId, 0, data),
  ]);

  const yearLabels = sigData.yearLabels;

  // ── Section 1 : Soldes Intermédiaires de Gestion ────────────────────────────

  const ca = extractSig(sigData.nodes, "ca");
  const ventesProdReelle = extractSig(sigData.nodes, "ventes_prod_reelle");
  const margeGlobale = extractSig(sigData.nodes, "marge_globale");
  const va = extractSig(sigData.nodes, "va");
  const ebe = extractSig(sigData.nodes, "ebe");
  const resExpl = extractSig(sigData.nodes, "res_expl");
  const resFin = extractSig(sigData.nodes, "res_fin");
  const resCourant = extractSig(sigData.nodes, "res_courant");
  const resNet = extractSig(sigData.nodes, "res_net");
  const caf = extractSig(sigData.nodes, "caf");

  // ── Section 2 : Seuil de rentabilité économique ─────────────────────────────

  const seuilVentes = extractBreakEven(seuilData.rows, "ventes_production");
  const seuilCV = extractBreakEven(seuilData.rows, "total_cv");
  const seuilTaux = extractBreakEven(seuilData.rows, "taux_marge_cv");
  const seuilCF = extractBreakEven(seuilData.rows, "total_cf");
  const seuilEco = extractBreakEven(seuilData.rows, "seuil_eco");
  const seuilExced = extractBreakEven(seuilData.rows, "excedent_eco");
  const pointMort = extractBreakEven(seuilData.rows, "point_mort_eco");

  // ── Section 3 : État de trésorerie ──────────────────────────────────────────

  // FR = Capitaux propres + Emprunts restants − Immobilisations nettes
  const capitauxPropres = extractBilanAmt(bilanData.rows, "capitaux_propres");
  const emprunts = extractBilanAmt(bilanData.rows, "emprunts");
  const immoNette = extractBilanAmt(bilanData.rows, "immo_nette_total");

  const frAmt: Record<YearKey, number> = {
    y1: capitauxPropres.y1 + emprunts.y1 - immoNette.y1,
    y2: capitauxPropres.y2 + emprunts.y2 - immoNette.y2,
    y3: capitauxPropres.y3 + emprunts.y3 - immoNette.y3,
  };

  // BFR depuis l'action bfr
  const bfrAmt = extractBfrAmt(bfrData.rows, "bfr");

  // Solde annuel = FR − BFR
  const soldeAnnuelAmt: Record<YearKey, number> = {
    y1: frAmt.y1 - bfrAmt.y1,
    y2: frAmt.y2 - bfrAmt.y2,
    y3: frAmt.y3 - bfrAmt.y3,
  };

  // Solde mensuel = valeur M12 du solde de clôture dans le tableau de trésorerie
  const soldeMensuelAmt = extractTresoAmt(tresoData.rows, "tres-solde-final");

  const noBase: Record<YearKey, number> = { y1: 0, y2: 0, y3: 0 };

  // ── Construction des lignes ──────────────────────────────────────────────────

  const rows: SynthRow[] = [
    // ── Section 1 ────────────────────────────────────────────────────────────
    sectionRow("sec_sig", "SOLDES INTERMÉDIAIRES DE GESTION"),
    mkRow("ca", "Chiffre d'affaires", "highlight", true, ca),
    mkRow("ventes_prod_reelle", "Ventes + Production réelle", "normal", true, ventesProdReelle),
    mkRow("marge_globale", "Marge globale", "normal", true, margeGlobale),
    mkRow("va", "Valeur ajoutée", "normal", true, va),
    mkRow("ebe", "Excédent brut d'exploitation", "normal", true, ebe),
    mkRow("res_expl", "Résultat d'exploitation", "normal", true, resExpl),
    mkRow("res_fin", "Résultat financier", "normal", true, resFin),
    mkRow("res_courant", "Résultat courant", "normal", true, resCourant),
    mkRow("res_net", "Résultat de l'exercice", "highlight", true, resNet),
    mkRow("caf", "Capacité d'autofinancement (CAF)", "highlight", true, caf),

    // ── Section 2 ────────────────────────────────────────────────────────────
    sectionRow("sec_seuil", "SEUIL DE RENTABILITÉ ÉCONOMIQUE"),
    mkRow("seuil_ventes", "Ventes + Production réelle", "highlight", false, seuilVentes),
    mkRow("seuil_cv", "Coûts variables", "normal", true, seuilCV),
    mkRow(
      "seuil_taux",
      "Taux de marge sur coût variable",
      "normal",
      false,
      seuilTaux,
      { isTaux: true },
    ),
    mkRow("seuil_cf", "Coûts fixes", "normal", true, seuilCF),
    mkRow("seuil_eco", "Seuil de rentabilité", "highlight", false, seuilEco),
    mkRow("seuil_exced", "Excédent / insuffisance", "normal", false, seuilExced),
    mkRow("point_mort", "Point mort (jours)", "normal", false, pointMort, { isDays: true }),

    // ── Section 3 ────────────────────────────────────────────────────────────
    sectionRow("sec_treso", "ÉTAT DE TRÉSORERIE"),
    mkRow(
      "fr",
      "Fonds de roulement",
      "normal",
      false,
      mkSynthAmt(frAmt, noBase, false),
    ),
    mkRow(
      "bfr",
      "Besoin en fonds de roulement (BFR)",
      "normal",
      false,
      mkSynthAmt(bfrAmt, noBase, false),
    ),
    mkRow(
      "solde_annuel",
      "Solde de trésorerie (Annuel)",
      "highlight",
      false,
      mkSynthAmt(soldeAnnuelAmt, noBase, false),
    ),
    mkRow(
      "solde_mensuel",
      "Solde de trésorerie (Mensuel – M12)",
      "normal",
      false,
      mkSynthAmt(soldeMensuelAmt, noBase, false),
    ),
  ];

  return { yearLabels, rows };
}
