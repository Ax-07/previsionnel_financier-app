/**
 * Fonctions pures de conversion des données de l'onglet Contrôle
 * vers le format NormalizedTable attendu par la commande ProseMirror
 * `insertFinancialTable`.
 *
 * @module lib/editor/controle-to-prosemirror
 */

import type { CompteResultatData, CRNode } from "@/lib/finance/aggregations/compte-resultat/types";
import type { SigData, SigNode } from "@/lib/finance/aggregations/sig/types";
import type { BilanData } from "@/lib/finance/aggregations/bilan/types";
import type { CafData, CafRow } from "@/lib/finance/aggregations/caf/types";
import type { RatiosData } from "@/lib/finance/aggregations/ratios/types";
import type { BreakEvenData, BreakEvenRow } from "@/lib/finance/calculs/seuil";
import type { BfrData, BfrRow } from "@/lib/finance/aggregations/bfr/types";
import type { TfData } from "@/lib/finance/aggregations/tableau-financement/types";
import type { PfData } from "@/lib/finance/aggregations/plan-financement/types";
import type { FinRow } from "@/lib/finance/aggregations/helpers/financement-helpers";
import type { NormalizedTable, NormalizedTableRow } from "@/components/app/business-plan-editor/text-editor/toolbar/commands";
import type { YearKey, YearKey4 } from "@/lib/finance/types/series";

// ─── Réexport du type pour les consommateurs ──────────────────────────────────
export type { NormalizedTable, NormalizedTableRow };

// ─── Helpers de formatage ─────────────────────────────────────────────────────

const fmtAmount = (n: number): string =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const fmtPct = (pct: number | null): string => {
  if (pct === null) return "";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(pct)} %`;
};

const YEAR_KEYS: YearKey[] = ["y1", "y2", "y3"];
const YEAR4_KEYS: YearKey4[] = ["y0", "y1", "y2", "y3"];

// ─── Compte de résultat ───────────────────────────────────────────────────────

function flattenCRNodes(nodes: CRNode[], yearKeys: YearKey[]): NormalizedTableRow[] {
  const result: NormalizedTableRow[] = [];
  for (const node of nodes) {
    if (node.style === "section") {
      result.push({
        cells: [node.label, ...yearKeys.flatMap(() => ["", ""])],
        isSectionHeader: true,
      });
    } else {
      result.push({
        cells: [
          node.label,
          ...yearKeys.flatMap((yk) => [
            fmtAmount(node.values[yk].amount),
            fmtPct(node.values[yk].pct),
          ]),
        ],
        isSectionHeader: false,
      });
    }
    if (node.children?.length) {
      result.push(...flattenCRNodes(node.children, yearKeys));
    }
  }
  return result;
}

export function crDataToTable(data: CompteResultatData): NormalizedTable {
  const headers = [
    "Libellé",
    ...YEAR_KEYS.flatMap((yk) => [data.yearLabels[yk], "%"]),
  ];
  return {
    title: "Compte de résultat",
    headers,
    rows: flattenCRNodes(data.nodes, YEAR_KEYS),
  };
}

// ─── SIG ──────────────────────────────────────────────────────────────────────

function flattenSigNodes(nodes: SigNode[], yearKeys: YearKey[]): NormalizedTableRow[] {
  const result: NormalizedTableRow[] = [];
  for (const node of nodes) {
    if (node.style === "section") {
      result.push({
        cells: [node.label, ...yearKeys.flatMap(() => ["", ""])],
        isSectionHeader: true,
      });
    } else {
      result.push({
        cells: [
          node.label,
          ...yearKeys.flatMap((yk) => [
            fmtAmount(node.values[yk].amount),
            fmtPct(node.values[yk].pct),
          ]),
        ],
        isSectionHeader: false,
      });
    }
    if (node.children?.length) {
      result.push(...flattenSigNodes(node.children, yearKeys));
    }
  }
  return result;
}

export function sigDataToTable(data: SigData): NormalizedTable {
  const headers = [
    "Libellé",
    ...YEAR_KEYS.flatMap((yk) => [data.yearLabels[yk], "%"]),
  ];
  return {
    title: "Soldes intermédiaires de gestion (SIG)",
    headers,
    rows: flattenSigNodes(data.nodes, YEAR_KEYS),
  };
}

// ─── Bilan ────────────────────────────────────────────────────────────────────

export function bilanDataToTable(data: BilanData): NormalizedTable {
  return {
    title: "Bilan prévisionnel",
    headers: ["Libellé", ...YEAR_KEYS.map((yk) => data.yearLabels[yk])],
    rows: data.rows.map((row) => ({
      cells: [row.label, ...YEAR_KEYS.map((yk) => fmtAmount(row.values[yk].amount))],
      isSectionHeader: row.style === "section",
    })),
  };
}

// ─── CAF ──────────────────────────────────────────────────────────────────────

function flattenCafRows(rows: CafRow[], yearKeys: YearKey[]): NormalizedTableRow[] {
  const result: NormalizedTableRow[] = [];
  for (const row of rows) {
    const label = row.sign ? `${row.sign} ${row.label}` : row.label;
    result.push({
      cells: [label, ...yearKeys.map((yk) => fmtAmount(row.values[yk].amount))],
      isSectionHeader: false,
    });
    if (row.children?.length) {
      result.push(...flattenCafRows(row.children, yearKeys));
    }
  }
  return result;
}

export function cafDataToTable(data: CafData): NormalizedTable {
  return {
    title: "Capacité d'autofinancement (CAF)",
    headers: ["Libellé", ...YEAR_KEYS.map((yk) => data.yearLabels[yk])],
    rows: flattenCafRows(data.rows, YEAR_KEYS),
  };
}

// ─── Ratios ───────────────────────────────────────────────────────────────────

export function ratiosDataToTable(data: RatiosData): NormalizedTable {
  return {
    title: "Ratios financiers",
    headers: ["Ratio", "Unité", ...YEAR_KEYS.map((yk) => data.yearLabels[yk])],
    rows: data.rows.map((row) => ({
      cells: [
        row.label,
        row.unit,
        ...YEAR_KEYS.map((yk) => {
          const v = row.values[yk].value;
          if (v === null) return "—";
          return new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: row.decimals,
          }).format(v);
        }),
      ],
      isSectionHeader: false,
    })),
  };
}

// ─── Seuil de rentabilité ─────────────────────────────────────────────────────

function flattenBreakEvenRows(rows: BreakEvenRow[], yearKeys: YearKey[]): NormalizedTableRow[] {
  return rows
    .filter((r) => r.style !== "separator")
    .map((row) => {
      const label = row.sign ? `${row.sign} ${row.label}` : row.label;
      return {
        cells: [label, ...yearKeys.map((yk) => fmtAmount(row.values[yk].amount))],
        isSectionHeader: row.style === "section",
      };
    });
}

export function seuilDataToTable(data: BreakEvenData): NormalizedTable {
  return {
    title: "Seuil de rentabilité",
    headers: ["Libellé", ...YEAR_KEYS.map((yk) => data.yearLabels[yk])],
    rows: flattenBreakEvenRows(data.rows, YEAR_KEYS),
  };
}

// ─── BFR ──────────────────────────────────────────────────────────────────────

function flattenBfrRows(rows: BfrRow[], yearKeys: YearKey4[]): NormalizedTableRow[] {
  const result: NormalizedTableRow[] = [];
  for (const row of rows) {
    const label = row.sign ? `${row.sign} ${row.label}` : row.label;
    result.push({
      cells: [label, ...yearKeys.map((yk) => fmtAmount(row.values[yk].amount))],
      isSectionHeader: row.style === "section",
    });
    if (row.children?.length) {
      result.push(...flattenBfrRows(row.children, yearKeys));
    }
  }
  return result;
}

export function bfrDataToTable(data: BfrData): NormalizedTable {
  return {
    title: "Besoin en fonds de roulement (BFR)",
    headers: ["Libellé", ...YEAR4_KEYS.map((yk) => data.yearLabels[yk])],
    rows: flattenBfrRows(data.rows, YEAR4_KEYS),
  };
}

// ─── Tableau de financement / Plan de financement ─────────────────────────────

function flattenFinRows(rows: FinRow[], yearKeys: YearKey4[]): NormalizedTableRow[] {
  const result: NormalizedTableRow[] = [];
  for (const row of rows) {
    const label = row.sign ? `${row.sign} ${row.label}` : row.label;
    result.push({
      cells: [label, ...yearKeys.map((yk) => fmtAmount(row.values[yk].amount))],
      isSectionHeader: row.style === "section",
    });
    if (row.children?.length) {
      result.push(...flattenFinRows(row.children, yearKeys));
    }
  }
  return result;
}

export function tfDataToTable(data: TfData): NormalizedTable {
  return {
    title: "Tableau de financement",
    headers: ["Libellé", ...YEAR4_KEYS.map((yk) => data.yearLabels[yk])],
    rows: flattenFinRows(data.rows, YEAR4_KEYS),
  };
}

export function pfDataToTable(data: PfData): NormalizedTable {
  return {
    title: "Plan de financement",
    headers: ["Libellé", ...YEAR4_KEYS.map((yk) => data.yearLabels[yk])],
    rows: flattenFinRows(data.rows, YEAR4_KEYS),
  };
}
