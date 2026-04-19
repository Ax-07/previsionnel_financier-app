/**
 * Helpers partagés pour la construction des lignes du Plan de Financement
 * et du Tableau de Financement.
 *
 * Ce module contient :
 * - Les types `FinRow`, `FinRowValue`, `FinKey`
 * - Le helper `mkFinRow` pour construire les lignes
 * - `buildToKeyY0` pour le mapping date → exercice (avec colonne Initial)
 * - Les helpers de données : `buildApportsData`, `buildEmpruntsData`,
 *   `buildImmoData`, `buildSubventionsInvestData`
 *
 * @module aggregations/financement-helpers
 * @moved-from app/actions/controle/financement/helpers.ts
 */

import { n } from "@/lib/finance/utils";
import type { YearKey4 } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Alias local ───────────────────────────────────────────────────────────────

/** Clé d'exercice avec la colonne "Initial" (y0). */
export type FinKey = YearKey4;

// ── Helpers de construction des lignes ───────────────────────────────────────

import type { AmountValue } from "@/lib/finance/aggregations/helpers/shared-helpers";

export type FinRowValue = AmountValue;

export interface FinRow {
  key: string;
  label: string;
  sign: "+" | "−" | "=" | "";
  style: "normal" | "subtotal" | "highlight" | "section";
  hideIfZero?: boolean;
  values: Record<FinKey, FinRowValue>;
  children?: FinRow[];
}

export function mkFinRow(
  key: string,
  label: string,
  sign: FinRow["sign"],
  style: FinRow["style"],
  vals: Record<FinKey, number>,
  hideIfZero?: boolean,
  children?: FinRow[],
): FinRow {
  return {
    key,
    label,
    sign,
    style,
    hideIfZero,
    values: {
      y0: { amount: vals.y0 },
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    ...(children && children.length > 0 ? { children } : {}),
  };
}

// ── Mapping date → clé d'exercice ────────────────────────────────────────────

/**
 * Construit une fonction toKey à partir des bornes d'exercices.
 * Les dates ≤ dateDemarrage donnent "y0" (Initial).
 */
export function buildToKeyY0(
  dateDemarrage: Date,
  exBorne1: Date,
  exBorne2: Date,
  exBorne3: Date,
): (date: Date | string) => FinKey | null {
  return (date: Date | string): FinKey | null => {
    const d = date instanceof Date ? date : new Date(date);
    if (d <= dateDemarrage) return "y0";
    if (d < exBorne1) return "y1";
    if (d < exBorne2) return "y2";
    if (d < exBorne3) return "y3";
    return null;
  };
}

// ── Calculs partagés apports / emprunts / immo ────────────────────────────────

export interface ApportsResult {
  apportsCapital: Record<FinKey, number>;
  apportsCC: Record<FinKey, number>;
}

export function buildApportsData(
  apports: { type: string; montant: unknown; dateApport: Date | string }[],
  subventions: { type: string; montant: unknown; dateEncaissement?: Date | string | null; dateObtention?: Date | string | null }[],
  toKey: (date: Date | string) => FinKey | null,
): ApportsResult {
  const apportsCapital: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const apportsCC: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

  for (const apport of apports) {
    const k = toKey(apport.dateApport);
    if (!k) continue;
    const montant = n(apport.montant);
    if (apport.type === "CAPITAL" || apport.type === "APPORT_NATURE") {
      apportsCapital[k] += montant;
    } else if (apport.type === "COMPTE_COURANT") {
      apportsCC[k] += montant;
    }
  }

  for (const subv of subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const dateRef = subv.dateEncaissement ?? subv.dateObtention;
    if (!dateRef) continue;
    const k = toKey(dateRef);
    if (!k) continue;
    apportsCC[k] += n(subv.montant);
  }

  return { apportsCapital, apportsCC };
}

export interface EmpruntsResult {
  nouveauxEmprunts: Record<FinKey, number>;
  remboursementCapital: Record<FinKey, number>;
}

export function buildEmpruntsData(
  emprunts: { montant: unknown; dateDéblocage: Date | string; lignesEcheancier: { dateEcheance: Date | string; capitalRembourse: unknown }[] }[],
  toKey: (date: Date | string) => FinKey | null,
): EmpruntsResult {
  const nouveauxEmprunts: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const remboursementCapital: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };

  for (const emprunt of emprunts) {
    const k = toKey(emprunt.dateDéblocage);
    if (k) nouveauxEmprunts[k] += n(emprunt.montant);
    for (const ligne of emprunt.lignesEcheancier) {
      const lk = toKey(ligne.dateEcheance);
      if (lk) remboursementCapital[lk] += n(ligne.capitalRembourse);
    }
  }

  return { nouveauxEmprunts, remboursementCapital };
}

export interface ImmoResult {
  immoIncorporelles: Record<FinKey, number>;
  immoCorporelles: Record<FinKey, number>;
  immoFinancieres: Record<FinKey, number>;
  totalImmo: Record<FinKey, number>;
  /** Lignes de détail de chaque immobilisation incorporelle (pour expand/collapse). */
  immoIncorporellesChildren: FinRow[];
  /** Lignes de détail de chaque immobilisation corporelle (pour expand/collapse). */
  immoCorporellesChildren: FinRow[];
  /** Lignes de détail de chaque immobilisation financière (pour expand/collapse). */
  immoFinancieresChildren: FinRow[];
}

export function buildImmoData(
  immobilisations: { id: string; libelle?: string | null; nature: string; montantHT: unknown; dateAcquisition: Date | string; actif?: boolean | null }[],
  toKey: (date: Date | string) => FinKey | null,
): ImmoResult {
  const immoIncorporelles: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const immoCorporelles: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const immoFinancieres: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  const incorporelItems: FinRow[] = [];
  const corporelItems: FinRow[] = [];
  const financierItems: FinRow[] = [];

  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    const k = toKey(immo.dateAcquisition);
    if (!k) continue;
    const montant = n(immo.montantHT);
    const itemVals: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
    itemVals[k] = montant;
    const itemRow = mkFinRow(
      `immo_item_${immo.id}`,
      immo.libelle ?? "Immobilisation",
      "",
      "normal",
      itemVals,
      true,
    );
if (immo.nature === "INCORPOREL") {
  immoIncorporelles[k] += montant;
  incorporelItems.push(itemRow);
} else if (immo.nature === "FINANCIER") {
  immoFinancieres[k] += montant; // ligne dédiée à créer
  financierItems.push(itemRow);
} else {
  immoCorporelles[k] += montant;
  corporelItems.push(itemRow);
}
  }

  const totalImmo: Record<FinKey, number> = {
    y0: immoIncorporelles.y0 + immoCorporelles.y0 + immoFinancieres.y0,
    y1: immoIncorporelles.y1 + immoCorporelles.y1 + immoFinancieres.y1,
    y2: immoIncorporelles.y2 + immoCorporelles.y2 + immoFinancieres.y2,
    y3: immoIncorporelles.y3 + immoCorporelles.y3 + immoFinancieres.y3,
  };

  return {
    immoIncorporelles,
    immoCorporelles,
    immoFinancieres,
    totalImmo,
    immoIncorporellesChildren: incorporelItems,
    immoCorporellesChildren: corporelItems,
    immoFinancieresChildren: financierItems,
  };
}

/**
 * Calcule les subventions d'investissement (hors prêts d'honneur) par exercice.
 * Les prêts d'honneur sont traités dans buildApportsData (apportsCC).
 * Les subventions SUBVENTION_INVESTISSEMENT, AIDE_DEMARRAGE, AUTRE sont
 * des ressources du plan de financement, encaissées à leur date d'obtention/encaissement.
 */
export function buildSubventionsInvestData(
  subventions: { type: string; montant: unknown; dateEncaissement?: Date | string | null; dateObtention?: Date | string | null }[],
  toKey: (date: Date | string) => FinKey | null,
): Record<FinKey, number> {
  const result: Record<FinKey, number> = { y0: 0, y1: 0, y2: 0, y3: 0 };
  for (const subv of subventions) {
    if (subv.type === "PRET_HONNEUR") continue; // déjà dans apportsCC
    const dateRef = subv.dateEncaissement ?? subv.dateObtention;
    if (!dateRef) continue;
    const k = toKey(dateRef);
    if (!k) continue;
    result[k] += n(subv.montant);
  }
  return result;
}

// ── Base partagée Plan / Tableau de financement ───────────────────────────────

/**
 * Données calculées communes au Plan de Financement et au Tableau de Financement.
 * Centralise les calculs pour éviter le copier-coller entre les deux builders.
 */
export interface FinancementBaseResult {
  yearLabels: Record<FinKey, string>;
  caf: Record<FinKey, number>;
  apportsCapital: Record<FinKey, number>;
  apportsCC: Record<FinKey, number>;
  nouveauxEmprunts: Record<FinKey, number>;
  remboursementCapital: Record<FinKey, number>;
  immoIncorporelles: Record<FinKey, number>;
  immoCorporelles: Record<FinKey, number>;
  immoFinancieres: Record<FinKey, number>;
  totalImmo: Record<FinKey, number>;
  immoIncorporellesChildren: FinRow[];
  immoCorporellesChildren: FinRow[];
  immoFinancieresChildren: FinRow[];
  subventionsInvest: Record<FinKey, number>;
  /** Total des ressources = apports + CC + emprunts + CAF + subventions. */
  totalRessources: Record<FinKey, number>;
}

/**
 * Calcule les données communes au Plan de Financement et au Tableau de Financement.
 *
 * Les deux builders appellent cette fonction puis ajoutent leur présentation
 * spécifique (BESOINS/RESSOURCES/TRÉSORERIE pour le plan, RESSOURCES/EMPLOIS/FR
 * pour le tableau). Toute modification métier commune s'applique une seule fois ici.
 */
export function buildFinancementBase(
  data: ScenarioFinData,
  fc: FinCalcResult,
): FinancementBaseResult {
  const { dateDemarrage, apports, subventions, emprunts, immobilisations } = data;
  const yearLabels: Record<FinKey, string> = { y0: "Initial", ...fc.yearLabels };
  const toKey = buildToKeyY0(dateDemarrage, fc.exBorne1, fc.exBorne2, fc.exBorne3);

  const { apportsCapital, apportsCC } = buildApportsData(apports, subventions, toKey);
  const { nouveauxEmprunts, remboursementCapital } = buildEmpruntsData(emprunts, toKey);
  const {
    immoIncorporelles,
    immoCorporelles,
    immoFinancieres,
    totalImmo,
    immoIncorporellesChildren,
    immoCorporellesChildren,
    immoFinancieresChildren,
  } = buildImmoData(immobilisations, toKey);
  const subventionsInvest = buildSubventionsInvestData(subventions, toKey);
  const caf: Record<FinKey, number> = { y0: 0, y1: fc.caf.y1, y2: fc.caf.y2, y3: fc.caf.y3 };
  const totalRessources: Record<FinKey, number> = {
    y0: apportsCapital.y0 + apportsCC.y0 + nouveauxEmprunts.y0 + caf.y0 + subventionsInvest.y0,
    y1: apportsCapital.y1 + apportsCC.y1 + nouveauxEmprunts.y1 + caf.y1 + subventionsInvest.y1,
    y2: apportsCapital.y2 + apportsCC.y2 + nouveauxEmprunts.y2 + caf.y2 + subventionsInvest.y2,
    y3: apportsCapital.y3 + apportsCC.y3 + nouveauxEmprunts.y3 + caf.y3 + subventionsInvest.y3,
  };

  return {
    yearLabels,
    caf,
    apportsCapital,
    apportsCC,
    nouveauxEmprunts,
    remboursementCapital,
    immoIncorporelles,
    immoCorporelles,
    immoFinancieres,
    totalImmo,
    immoIncorporellesChildren,
    immoCorporellesChildren,
    immoFinancieresChildren,
    subventionsInvest,
    totalRessources,
  };
}
