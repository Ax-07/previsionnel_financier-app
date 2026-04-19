/**
 * Construction des lignes de présentation de la Capacité d'Autofinancement (CAF).
 *
 * Responsabilité unique : assembler les résultats de `buildFinCalc()` en une
 * structure `CafData` consommable par le composant UI.
 *
 * @module aggregations/caf/build-rows
 */

import { n } from "@/lib/finance/utils";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { mkRow } from "./helpers";
import type { CafRow, CafData } from "./types";

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
    mkRow("dotations_amort", "Dotations aux amortissements", "+", "normal", dotationsAmort, { children: dotationsAmortChildren }),
    ...(dotationsProvisions.y1 !== 0 || dotationsProvisions.y2 !== 0 || dotationsProvisions.y3 !== 0
      ? [mkRow("dotations_prov", "Dotations aux provisions", "+", "normal", dotationsProvisions, { children: dotationsProvChildren })]
      : []),
    ...(reprises.y1 !== 0 || reprises.y2 !== 0 || reprises.y3 !== 0
      ? [mkRow("reprises", "Reprises sur provisions", "−", "normal", reprises, { children: reprisesChildren })]
      : []),
    mkRow("caf_brute", "Capacité d'autofinancement (CAF)", "=", "highlight", cafBrute),
    ...(remboursementCapital.y1 !== 0 || remboursementCapital.y2 !== 0 || remboursementCapital.y3 !== 0
      ? [mkRow("remboursement_capital", "Remboursement du capital des emprunts", "−", "normal", remboursementCapital, { children: capitalChildren })]
      : []),
    mkRow("autofinancement", "Autofinancement net", "=", "highlight", autofinancement),
  ];

  return { yearLabels, rows };
}
