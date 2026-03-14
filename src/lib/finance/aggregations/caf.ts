/**
 * Construction des lignes de présentation de la Capacité d'Autofinancement (CAF).
 *
 * Responsabilité unique : assembler les résultats de `buildFinCalc()` en une
 * structure `CafData` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/caf
 * @extracted-from app/actions/controle/caf.ts
 */

import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CafRowValue {
  amount: number;
}

export interface CafRow {
  key: string;
  label: string;
  /** signe affiché dans le libellé : "+", "−", "=" */
  sign: "+" | "−" | "=" | "";
  /** style de rendu */
  style: "normal" | "subtotal" | "highlight";
  values: Record<YearKey, CafRowValue>;
  hideIfZero?: boolean;
  children?: CafRow[];
}

export interface CafData {
  yearLabels: Record<YearKey, string>;
  rows: CafRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkRow(
  key: string,
  label: string,
  sign: CafRow["sign"],
  style: CafRow["style"],
  vals: Record<YearKey, number>,
  children?: CafRow[],
): CafRow {
  return {
    key,
    label,
    sign,
    style,
    values: {
      y1: { amount: vals.y1 },
      y2: { amount: vals.y2 },
      y3: { amount: vals.y3 },
    },
    ...(children && children.length > 0 ? { children } : {}),
  };
}

// ── Builder principal ─────────────────────────────────────────────────────────

export function buildCafRows(
  data: ScenarioFinData,
  fc: FinCalcResult,
): CafData {
  const {
    yearLabels,
    resNet,
    dotationsAmort,
    dotationsProvisions,
    reprises,
    caf: cafBrute,
    capitalRembourse: remboursementCapital,
    autofinancement,
    dotationsParImmoAcc,
    capitalRembourseParEmprunt,
  } = fc;

  // ── Enfants : dotations aux amortissements par immobilisation ─────────────
  const dotationsAmortChildren: CafRow[] = dotationsParImmoAcc
    .filter((d) => d.values.y1 !== 0 || d.values.y2 !== 0 || d.values.y3 !== 0)
    .map((d) =>
      mkRow(
        `dotations_amort_${d.immo.id}`,
        d.immo.libelle,
        "",
        "normal",
        d.values,
      ),
    );

  // ── Enfants : dotations aux provisions par provision ─────────────────────
  const dotationsProvChildren: CafRow[] = data.provisions
    .filter((p) => n(p.montantN) !== 0 || n(p.montantN1) !== 0 || n(p.montantN2) !== 0)
    .map((p) =>
      mkRow(
        `dotations_prov_${p.id}`,
        p.libelle,
        "",
        "normal",
        { y1: n(p.montantN), y2: n(p.montantN1), y3: n(p.montantN2) },
      ),
    );

  // ── Enfants : reprises sur provisions par reprise ─────────────────────────
  const reprisesChildren: CafRow[] = data.reprisesProduits
    .filter((r) => n(r.montantN) !== 0 || n(r.montantN1) !== 0 || n(r.montantN2) !== 0)
    .map((r) =>
      mkRow(
        `reprises_${r.id}`,
        r.libelle,
        "",
        "normal",
        { y1: n(r.montantN), y2: n(r.montantN1), y3: n(r.montantN2) },
      ),
    );

  // ── Enfants : remboursement capital par emprunt ───────────────────────────
  const capitalChildren: CafRow[] = capitalRembourseParEmprunt
    .filter((e) => e.values.y1 !== 0 || e.values.y2 !== 0 || e.values.y3 !== 0)
    .map((e) =>
      mkRow(
        `capital_${e.emprunt.id}`,
        e.emprunt.libelle,
        "",
        "normal",
        e.values,
      ),
    );

  // ── Construction des lignes ──────────────────────────────────────────────────
  const rows: CafRow[] = [
    mkRow("res_net", "Résultat de l'exercice", "", "normal", resNet),
    mkRow("dotations_amort", "Dotations aux amortissements", "+", "normal", dotationsAmort, dotationsAmortChildren),
    ...(dotationsProvisions.y1 !== 0 || dotationsProvisions.y2 !== 0 || dotationsProvisions.y3 !== 0
      ? [mkRow("dotations_prov", "Dotations aux provisions", "+", "normal", dotationsProvisions, dotationsProvChildren)]
      : []),
    ...(reprises.y1 !== 0 || reprises.y2 !== 0 || reprises.y3 !== 0
      ? [mkRow("reprises", "Reprises sur provisions", "−", "normal", reprises, reprisesChildren)]
      : []),
    mkRow("caf_brute", "Capacité d'autofinancement (CAF)", "=", "highlight", cafBrute),
    ...(remboursementCapital.y1 !== 0 || remboursementCapital.y2 !== 0 || remboursementCapital.y3 !== 0
      ? [mkRow("remboursement_capital", "Remboursement du capital des emprunts", "−", "normal", remboursementCapital, capitalChildren)]
      : []),
    mkRow("autofinancement", "Autofinancement net", "=", "highlight", autofinancement),
  ];

  return { yearLabels, rows };
}
