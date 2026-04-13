/**
 * Export Excel — Prévisionnel financier
 *
 * Génère un classeur Excel (.xlsx) avec :
 *   — Onglets Saisie  : Paramètres · Activités · Charges · Personnel · Investissements · Financement
 *   — Onglets Contrôle: Compte de Résultat · SIG · CAF · BFR · Bilan · Plan Financement ·
 *                       Tableau Financement · Trésorerie · TVA · Ratios
 *
 * Usage :
 *   pnpm tsx scripts/export-excel.ts <dossierId> [chemin/sortie.xlsx]
 *
 * Exemple :
 *   pnpm tsx scripts/export-excel.ts cmmjoradm0001 scripts/debug/output/previsionnel.xlsx
 */

import "dotenv/config";
import { join } from "path";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";

import { buildFinCalc } from "@/lib/finance/calculs";
import { buildMonthLabels, subSeries } from "@/lib/finance/calculs/monthly";
import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import { computeSoldeMonthly } from "@/lib/finance/tresorerie-engine";
import { buildTemporelCtx } from "@/lib/finance/pipeline/calendar";
import {
  calcEncaissements,
  calcAchatsRaw,
  calcEncoursFournisseurs,
} from "@/lib/finance/calculs/encaissements";
import { calcDecaissements } from "@/lib/finance/calculs/decaissements";
import { buildTresorerieRows } from "@/lib/finance/aggregations/tresorerie";
import { buildCompteResultatRows } from "@/lib/finance/aggregations/compte-resultat";
import { buildSigData } from "@/lib/finance/aggregations/sig";
import { buildCafRows } from "@/lib/finance/aggregations/caf";
import { buildBfrRows } from "@/lib/finance/aggregations/bfr";
import { buildBilanRows } from "@/lib/finance/aggregations/bilan";
import { buildPlanFinancementRows } from "@/lib/finance/aggregations/plan-financement";
import { buildTableauFinancementRows } from "@/lib/finance/aggregations/tableau-financement";
import { buildTVARows } from "@/lib/finance/aggregations/tva";
import { buildRatiosRows } from "@/lib/finance/aggregations/ratios";
import { calcSeuil } from "@/lib/finance/calculs/seuil";
import { buildMonthlyCalc } from "@/lib/finance/calculs/monthly";
import type { MonthlyCalcResult } from "@/lib/finance/calculs/monthly";
import type { TresorerieRow } from "@/lib/finance/tresorerie-types";

// ─── Palette de couleurs harmonisée ─────────────────────────────────────────
// Règle : fond foncé → texte blanc ; fond clair/pastel → texte très foncé
const C = {
  // ── En-têtes (Saisie & Contrôle — palette unifiée) ──────────────────────────
  HEADER:        "1C3A5E",    // bleu marine foncé      → texte blanc
  SUB_HEADER:    "2D6A9F",    // bleu moyen             → texte blanc
  ROW_ALT:       "EEF4FB",    // bleu très pâle         → texte foncé
  // ── Styles de lignes ────────────────────────────────────────────────────────
  SUBTOTAL:      "E8B84B",    // ambre moyen            → texte foncé
  HIGHLIGHT:     "D4502A",    // orange brûlé           → texte blanc
  RESULT:        "B83C1C",    // rouge brique           → texte blanc
  NORMAL_ALT:    "F5F5F5",    // gris très clair        → texte foncé
  // ── En-têtes mensuels (Trésorerie / TVA / Activités) ────────────────────────
  MONTH_HEADER:  "1C3A5E",    // bleu marine foncé      → texte blanc
  Y1:            "1C3A5E",    // bleu marine (an 1)     → texte blanc
  Y2:            "1B5E8A",    // bleu acier (an 2)      → texte blanc
  Y3:            "5C3D00",    // brun foncé (an 3)      → texte blanc
  // ── Fond des lignes par exercice (alternances) ──────────────────────────────
  Y1_ROW:        "D6E8F7",    // bleu pâle (an 1)       → texte foncé
  Y2_ROW:        "BDD9EE",    // bleu acier pâle (an 2) → texte foncé
  Y3_ROW:        "FFF0CC",    // jaune pâle (an 3)      → texte foncé
} as const;

const WHITE = "FFFFFF";
const DARK  = "1A1A1A";  // texte foncé universel

/**
 * Retourne la couleur de texte adaptée au fond RGB donné.
 * Les fonds "foncés" listés ici utilisent du texte blanc, les autres du noir.
 */
function textOn(bgRgb: RGB): RGB {
  const dark = new Set<RGB>([
    C.HEADER, C.SUB_HEADER,
    C.HIGHLIGHT, C.RESULT,
    C.MONTH_HEADER, C.Y1, C.Y2, C.Y3,
  ]);
  return dark.has(bgRgb) ? WHITE : DARK;
}

// ─── Utilitaires de formatage ──────────────────────────────────────────────────

function fmtNum(v: number | null | undefined): number | string {
  if (v == null || isNaN(v as number)) return "";
  return Math.round((v as number) * 100) / 100;
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "";
  return `${((v as number) * 100).toFixed(1)} %`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d as string);
  return dt.toLocaleDateString("fr-FR");
}

const sumS = (s: MonthlySeries) => s.reduce((a, b) => a + b, 0);

// ─── Helpers ExcelJS ──────────────────────────────────────────────────────────

type RGB = string; // ex: "1F4E79"

function applyFill(cell: ExcelJS.Cell, rgb: RGB) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${rgb}` } };
}

function applyFont(cell: ExcelJS.Cell, opts: { bold?: boolean; color?: RGB; size?: number; italic?: boolean }) {
  cell.font = {
    bold: opts.bold,
    italic: opts.italic,
    color: opts.color ? { argb: `FF${opts.color}` } : undefined,
    size: opts.size,
  };
}

function applyBorder(cell: ExcelJS.Cell, sides: ("top" | "bottom" | "left" | "right")[] = ["bottom"]) {
  const thin: ExcelJS.BorderStyle = "thin";
  cell.border = Object.fromEntries(sides.map((s) => [s, { style: thin }]));
}

// ─── Palette typographique centralisée ───────────────────────────────────────
// Chaque entrée = { size, bold, italic? }. La couleur est toujours calculée
// dynamiquement via textOn(bg) pour garantir le contraste.
const T = {
  // Titres de sections (addSectionHeader)
  SECTION_TITLE:  { size: 11, bold: true  },
  // Sous-titres de groupes (SECTION vert / gris)
  GROUP_HEADER:   { size: 10, bold: true  },
  // En-têtes de colonnes (tableaux de contrôle & saisie)
  COL_HEADER:     { size: 10, bold: true  },
  // En-têtes de colonnes dans les tableaux mensuels (Trésorerie, TVA, Activités)
  MONTH_HEADER:   { size:  9, bold: true  },
  // Libellé et valeur d'une ligne normale
  BODY:           { size:  9, bold: false },
  // Ligne mise en gras (subtotal, highlight, result)
  BODY_BOLD:      { size:  9, bold: true  },
  // Ligne paramètres (info compacte sous le titre d'activité)
  PARAM:          { size:  9, bold: false, italic: true },
  // Ligne total / sous-total dans les tableaux de saisie
  TOTAL_ROW:      { size: 10, bold: true  },
  // Titre d'onglet saisie (ex: "Activité X — mensuel")
  SHEET_TITLE:    { size: 11, bold: true  },
} as const;

/** Applique un style typographique centralisé + couleur auto selon le fond. */
function applyT(
  cell: ExcelJS.Cell,
  variant: keyof typeof T,
  bg?: RGB,
) {
  const s = T[variant];
  applyFont(cell, {
    bold: s.bold,
    italic: "italic" in s ? (s as { italic?: boolean }).italic : undefined,
    size: s.size,
    color: bg ? textOn(bg) : undefined,
  });
}

/** Ligne de section (titre de groupe). */
function sectionCell(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  applyFill(cell, C.HEADER);
  applyT(cell, "GROUP_HEADER", C.HEADER);
  cell.alignment = { horizontal: "left" };
}

/** Nombre en format comptable français (2 décimales, séparateur). */
function numCell(cell: ExcelJS.Cell, value: number | string, bgRgb?: RGB) {
  if (value === "" || value == null) return;
  cell.value = typeof value === "number" ? value : parseFloat(value as string) || 0;
  cell.numFmt = '#,##0.00 €';
  if (bgRgb) applyFill(cell, bgRgb);
  applyT(cell, "BODY", bgRgb);
  cell.alignment = { horizontal: "right" };
}

/** Ajoute une ligne d'en-têtes de colonnes fusionnées + séparation supérieure. */
function addSectionHeader(sheet: ExcelJS.Worksheet, title: string, nbCols: number, fillRgb: RGB) {
  const row = sheet.addRow([]);
  const cell = row.getCell(1);
  if (nbCols > 1) sheet.mergeCells(row.number, 1, row.number, nbCols);
  cell.value = title.toUpperCase();
  applyFill(cell, fillRgb);
  applyT(cell, "SECTION_TITLE", fillRgb);
  cell.alignment = { horizontal: "left", vertical: "middle" };
  row.height = 22;
}

// ─── Types pour les tableaux de contrôle ─────────────────────────────────────

type YearKey = "y1" | "y2" | "y3";
type FinKey = "y0" | "y1" | "y2" | "y3";

interface AnnualTableRow {
  label: string;
  indent?: number;
  style: "normal" | "section" | "subtotal" | "highlight" | "result" | "total" | "indent";
  hideIfZero?: boolean;
  values: Partial<Record<string, number>>;
}

// ─── Écriture d'un tableau annuel générique ───────────────────────────────────

function writeAnnualTable(
  sheet: ExcelJS.Worksheet,
  title: string,
  colKeys: string[],
  colLabels: string[],
  rows: AnnualTableRow[],
  opts: { showPct?: boolean; pctColKeys?: string[] } = {},
): void {
  // Groupement de lignes : les détails (normal/indent) sont repliables sous les sections
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

  addSectionHeader(sheet, title, colKeys.length + 1 + (opts.showPct ? opts.pctColKeys!.length : 0), C.HEADER);

  // En-têtes colonnes
  const headerRow = sheet.addRow(["Désignation", ...colLabels]);
  headerRow.eachCell((cell, ci) => {
    if (ci === 1) {
      applyFill(cell, C.HEADER);
      applyT(cell, "COL_HEADER", C.HEADER);
      cell.alignment = { horizontal: "left" };
    } else {
      applyFill(cell, C.HEADER);
      applyT(cell, "COL_HEADER", C.HEADER);
      cell.alignment = { horizontal: "right" };
    }
    applyBorder(cell, ["bottom"]);
  });
  headerRow.height = 20;

  let altIdx = 0;
  for (const r of rows) {
    if (r.hideIfZero) {
      const allZero = colKeys.every((k) => !r.values[k] || Math.abs(r.values[k]!) < 0.01);
      if (allZero) continue;
    }
    const values = colKeys.map((k) => fmtNum(r.values[k]));
    const dataRow = sheet.addRow(["  ".repeat(r.indent ?? 0) + r.label, ...values]);

    const isBold = r.style === "subtotal" || r.style === "highlight" || r.style === "result" || r.style === "total";
    const isSection = r.style === "section";

    if (isSection) {
      dataRow.eachCell((cell) => sectionCell(cell, cell.value as string));
      sheet.mergeCells(dataRow.number, 1, dataRow.number, colKeys.length + 1);
    } else {
      let bgRgb: RGB | undefined;
      if (r.style === "subtotal") bgRgb = C.SUBTOTAL;
      else if (r.style === "highlight") bgRgb = C.HIGHLIGHT;
      else if (r.style === "result" || r.style === "total") bgRgb = C.RESULT;
      else bgRgb = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;

      const labelCell = dataRow.getCell(1);
      labelCell.alignment = { horizontal: "left", indent: r.indent ?? 0 };
      if (bgRgb) applyFill(labelCell, bgRgb);
      applyT(labelCell, isBold ? "BODY_BOLD" : "BODY", bgRgb);

      values.forEach((v, i) => {
        const c = dataRow.getCell(i + 2);
        if (typeof v === "number") {
          numCell(c, v, bgRgb);
          if (isBold) applyT(c, "BODY_BOLD", bgRgb ?? undefined);
        } else {
          c.value = v;
          if (bgRgb) applyFill(c, bgRgb);
          applyT(c, isBold ? "BODY_BOLD" : "BODY", bgRgb);
        }
      });

      // Groupement : si le tableau contient des sections, toutes les lignes
      // non-section sont repliables (niveau indent+1).
      // Si pas de sections dans le tableau, seules les lignes normal/indent sont repliables.
      const hasSection = rows.some((x) => x.style === "section");
      if (hasSection) {
        dataRow.outlineLevel = (r.indent ?? 0) + 1;
      } else if (r.style === "normal" || r.style === "indent") {
        dataRow.outlineLevel = (r.indent ?? 0) + 1;
      }
    }
    altIdx++;
  }

  // Espacement entre tableaux
  sheet.addRow([]);
}

// ─── Aplatissement des nodes récursifs ───────────────────────────────────────

function flattenNodes<
  T extends {
    label: string;
    style: string;
    hideIfZero?: boolean;
    values: Record<string, { amount?: number; value?: number | null }>;
    children?: T[];
  }
>(
  nodes: T[],
  depth = 0,
): AnnualTableRow[] {
  const result: AnnualTableRow[] = [];
  for (const node of nodes) {
    const values: Record<string, number> = {};
    for (const [k, v] of Object.entries(node.values)) {
      const raw = (v as { amount?: number }).amount ?? (v as { value?: number | null }).value ?? 0;
      values[k] = raw ?? 0;
    }
    result.push({
      label: node.label,
      indent: depth,
      style: node.style as AnnualTableRow["style"],
      hideIfZero: node.hideIfZero,
      values,
    });
    if (node.children) {
      result.push(...flattenNodes(node.children, depth + 1));
    }
  }
  return result;
}

/** Flatten des TresorerieRow (monthly). */
function flattenTresorerieRows(rows: TresorerieRow[], depth = 0): Array<{
  label: string; style: string; indent: number;
  totalIsEndValue?: boolean; hideIfZero?: boolean;
  y1: { months: MonthlySeries; total: number };
  y2: { months: MonthlySeries; total: number };
  y3: { months: MonthlySeries; total: number };
}> {
  const result: ReturnType<typeof flattenTresorerieRows> = [];
  for (const row of rows) {
    result.push({ label: row.label, style: row.style, indent: depth, totalIsEndValue: row.totalIsEndValue, hideIfZero: row.hideIfZero, y1: row.values.y1, y2: row.values.y2, y3: row.values.y3 });
    if (row.children) result.push(...flattenTresorerieRows(row.children, depth + 1));
  }
  return result;
}

// ─── Onglets Saisie ───────────────────────────────────────────────────────────

type SFD = Awaited<ReturnType<typeof fetchScenarioData>>;

function writeSheetParametres(wb: ExcelJS.Workbook, data: SFD, y1L: string, y2L: string, y3L: string) {
  const sheet = wb.addWorksheet("Paramètres");
  sheet.columns = [
    { width: 36 }, { width: 28 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];

  const par = data.scenario.parametres;

  addSectionHeader(sheet, "Informations générales du dossier", 2, C.HEADER);
  const rows: [string, string | number][] = [
    ["ID Dossier", data.dossierId],
    ["Date de démarrage", fmtDate(data.dateDemarrage)],
    ["Exercice 1", y1L],
    ["Exercice 2", y2L],
    ["Exercice 3", y3L],
    ["Durée projection", `${data.dureeProjection} ans`],
  ];
  for (const [k, v] of rows) {
    const r = sheet.addRow([k, v]);
    r.getCell(1).font = { bold: true };
  }

  sheet.addRow([]);
  addSectionHeader(sheet, "Paramètres fiscaux & sociaux", 2, C.HEADER);
  const fiscal: [string, string | number | undefined][] = [
    ["Régime fiscal", par?.regimeFiscal ?? "—"],
    ["Taux IS normal", par?.tauxIs != null ? fmtPct(toNum(par.tauxIs)) : "—"],
    ["Taux IS réduit", par?.tauxIsReduit != null ? fmtPct(toNum(par.tauxIsReduit)) : "—"],
    ["Plafond IS réduit", par?.plafondIsReduit != null ? fmtNum(toNum(par.plafondIsReduit)) : "—"],
    ["Régime TVA", par?.regimeTVA ?? "—"],
    ["Périodicité déclaration TVA", par?.periodiciteDeclarationTVA ?? "—"],
    ["Taux TVA standard", par?.tauxTvaStandard != null ? fmtPct(toNum(par.tauxTvaStandard)) : "—"],
    ["Mois paiement salaires", par?.moisPaiementSalaires ?? 1],
    ["Régime social TNS", par?.tnsRegimeSocial ?? "—"],
    ["Mode calcul TNS", par?.tnsModeCalcul ?? "—"],
  ];
  for (const [k, v] of fiscal) {
    const r = sheet.addRow([k, v ?? "—"]);
    r.getCell(1).font = { bold: true };
  }
}

// Helper décodage entités HTML stockées en DB.
// Boucle jusqu'à stabilité pour gérer le double-encodage (&amp;apos; → &apos; → ').
// &amp; est remplacé EN DERNIER pour ne pas bloquer les autres remplacements.
function decodeHtml(s: string | null | undefined): string {
  if (!s) return s ?? "";
  let result = s;
  let prev: string;
  do {
    prev = result;
    result = result
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"); // en dernier — évite de bloquer les entités ci-dessus
  } while (result !== prev);
  return result;
}

// Helper Decimal Prisma → number (réutilisé dans tous les onglets saisie)
function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return parseFloat(String(v)) || 0;
}

function writeSheetActivites(wb: ExcelJS.Workbook, data: SFD, mc: MonthlyCalcResult, y1L: string, y2L: string, y3L: string) {
  const sheet = wb.addWorksheet("Activités");
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
  const acts = data.activites.filter((a) => a.actif !== false);
  const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const YEAR_KEYS: Array<"y1" | "y2" | "y3"> = ["y1", "y2", "y3"];
  const YEAR_LABELS = [y1L, y2L, y3L];
  const numFmtEur = "#,##0.00 €";
  const numFmtPct = "0.00";
  // 15 colonnes : libellé + 12 mois + total + (vide)
  const NB_COLS = 15;

  sheet.columns = [
    { width: 26 },  // libellé
    { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 },
    { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 },
    { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 },
    { width: 12 }, // total
    { width: 6 },  // espaceur
  ];

  // ── Helper : écrire une ligne mensuelle formatée ──────────────────────────
  function addMonthRow(
    label: string,
    values: number[],       // 12 valeurs mensuelles (ou moins)
    total: number,
    fmt: string,
    bg?: string,
    labelBold = false,
  ) {
    const row = sheet.addRow([label, ...Array.from({ length: 12 }, (_, i) => values[i] ?? 0), total, ""]);
    if (bg) row.eachCell((c) => applyFill(c, bg));
    row.getCell(1).font = { bold: labelBold, size: 9 };
    row.getCell(1).alignment = { horizontal: "left" };
    for (let ci = 2; ci <= 14; ci++) {
      row.getCell(ci).numFmt = fmt;
      row.getCell(ci).alignment = { horizontal: "right" };
      row.getCell(ci).font = { size: 9 };
    }
    return row;
  }

  // ── Helper : calculer le total d'une série de 12 mois ─────────────────────
  function sum12(arr: number[]): number {
    return arr.slice(0, 12).reduce((s, v) => s + v, 0);
  }

  // ── Boucle par activité ────────────────────────────────────────────────────
  for (let actIdx = 0; actIdx < acts.length; actIdx++) {
    const act = acts[actIdx]!;

    // Titre de l'activité
    sheet.addRow([]);
    const titleRow = sheet.addRow([`${act.libelle ?? ""} (${String(act.typeActivite ?? "")}) — ${String(act.frequence ?? "")}`]);
    sheet.mergeCells(titleRow.number, 1, titleRow.number, NB_COLS);
    applyFill(titleRow.getCell(1), C.HEADER);
    applyT(titleRow.getCell(1), "SHEET_TITLE", C.HEADER);
    titleRow.height = 20;

    // ── Paramètres synthèse (1 ligne) ───────────────────────────────────────
    const paramRow = sheet.addRow([
      `TVA ventes: ${toNum(act.tauxTVA).toFixed(0)}%  | TVA achats: ${toNum(act.tvaAchats).toFixed(0)}%  | Délai clients: ${act.reglementClients ?? 0}j  | Délai fourn.: ${act.reglementFournisseurs ?? 0}j  | Taux marge: ${toNum(act.tauxMarge).toFixed(1)}%  | Stock: ${act.stocks ?? 0}j  | Prix unit. HT: ${toNum(act.prixUnitaireHT).toFixed(2)} €`,
    ]);
    sheet.mergeCells(paramRow.number, 1, paramRow.number, NB_COLS);
    applyFill(paramRow.getCell(1), C.SUB_HEADER);
    applyT(paramRow.getCell(1), "PARAM", C.SUB_HEADER);
    paramRow.outlineLevel = 1;

    // ── Pour chaque exercice ─────────────────────────────────────────────────
    for (let yi = 0; yi < 3; yi++) {
      const yk = YEAR_KEYS[yi]!;
      const yLabel = YEAR_LABELS[yi]!;

      // En-têtes colonnes mois
      const hdrRow = sheet.addRow([`${act.libelle} — ${yLabel}`, ...MONTHS_FR, "TOTAL", ""]);
      hdrRow.eachCell((c) => {
        applyFill(c, C.MONTH_HEADER);
        applyT(c, "MONTH_HEADER", C.MONTH_HEADER);
        c.alignment = { horizontal: "center" };
      });
      hdrRow.height = 18;
      hdrRow.outlineLevel = 1;

      // ── CA mensuel HT ──────────────────────────────────────────────────────
      const caAct = mc.caByActivity.find((x) => x.libelle === act.libelle);
      const caSerie = caAct?.series[yk] ?? Array<number>(12).fill(0);
      addMonthRow("  CA HT", caSerie, sum12(caSerie), numFmtEur, undefined, true).outlineLevel = 2;

      // ── Achats / Consommations ─────────────────────────────────────────────
      const achatsAct = mc.achatsByActivity.find((x) => x.libelle.includes(act.libelle ?? ""));
      if (achatsAct) {
        const achatsSerie = achatsAct.series[yk] ?? Array<number>(12).fill(0);
        addMonthRow("  Achats / Consommations HT", achatsSerie, sum12(achatsSerie), numFmtEur, C.ROW_ALT).outlineLevel = 2;
      }

      // ── Variation de stock ─────────────────────────────────────────────────
      const varAct = mc.varStockByActivity.find((x) => x.libelle.includes(act.libelle ?? ""));
      if (varAct) {
        const varSerie = varAct.series[yk] ?? Array<number>(12).fill(0);
        addMonthRow("  Variation de stock", varSerie, sum12(varSerie), numFmtEur, C.ROW_ALT).outlineLevel = 2;
      }

      // ── Stock final ─────────────────────────────────────────────────────────
      const stockFinalAct = mc.stockFinalByActivity.find((x) => x.libelle.includes(act.libelle ?? ""));
      if (stockFinalAct) {
        const sfSerie = stockFinalAct.series[yk] ?? Array<number>(12).fill(0);
        // Le stock final est un encours (valeur de fin de mois) → total = dernier mois
        addMonthRow("  Stock final (encours)", sfSerie, sfSerie[11] ?? 0, numFmtEur, C.NORMAL_ALT).outlineLevel = 2;
      }

      // ── Marge brute = CA - Achats consommés ────────────────────────────────
      const margeSerie = caSerie.map((ca, i) => {
        const achats = achatsAct?.series[yk]?.[i] ?? 0;
        const varStock = varAct?.series[yk]?.[i] ?? 0;
        return ca - achats + varStock;
      });
      addMonthRow("  Marge brute (CA - Achats consommés)", margeSerie, sum12(margeSerie), numFmtEur, C.SUBTOTAL, true).outlineLevel = 2;

      // ── Taux de marge mensuel (%) ──────────────────────────────────────────
      const tauxMargeSerie = caSerie.map((ca, i) => ca === 0 ? 0 : (margeSerie[i]! / ca) * 100);
      addMonthRow("  Taux de marge (%)", tauxMargeSerie, caSerie.reduce((s,v)=>s+v,0) === 0 ? 0 : (sum12(margeSerie) / sum12(caSerie)) * 100, numFmtPct, undefined).outlineLevel = 2;

      // ── Saisonnalité CA % ──────────────────────────────────────────────────
      const saisonnaliteCA = (act as Record<string, unknown>).saisonnaliteCA as Record<"N"|"N1"|"N2", number[]> | null;
      const saisonKey: Record<"y1"|"y2"|"y3", "N"|"N1"|"N2"> = { y1: "N", y2: "N1", y3: "N2" };
      if (saisonnaliteCA) {
        const saisonSerie = saisonnaliteCA[saisonKey[yk]] ?? Array<number>(12).fill(100/12);
        const saisonTotal = sum12(saisonSerie as number[]);
        addMonthRow("  Saisonnalité CA (%)", saisonSerie as number[], saisonTotal, numFmtPct, C.ROW_ALT).outlineLevel = 2;
      }
    }
  }

  // ── Section récap : paramètres de toutes les activités ────────────────────
  sheet.addRow([]);
  sheet.addRow([]);
  addSectionHeader(sheet, "Récapitulatif — Paramètres des activités", NB_COLS, C.HEADER);
  const hdr = sheet.addRow([
    "Libellé", "Type", "Fréquence", "TVA ventes (%)", "TVA achats (%)",
    "Délai clients (j)", "Délai fourn. (j)", "Prix unit. HT", `CA ${y1L}`, `CA ${y2L}`, `CA ${y3L}`,
    "Taux marge (%)", "Évol. N+1 (%)", "Évol. N+2 (%)", "Stocks (j)",
  ]);
  hdr.eachCell((c) => {
    applyFill(c, C.SUB_HEADER);
    applyT(c, "COL_HEADER", C.SUB_HEADER);
    c.alignment = { horizontal: "center", wrapText: true };
  });
  hdr.height = 28;

  let altIdx = 0;
  for (const act of acts) {
    const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
    const row = sheet.addRow([
      act.libelle ?? "",
      String(act.typeActivite ?? "—"),
      String(act.frequence ?? "—"),
      toNum(act.tauxTVA),
      toNum(act.tvaAchats),
      act.reglementClients ?? "—",
      act.reglementFournisseurs ?? "—",
      toNum(act.prixUnitaireHT),
      toNum(act.montantN),
      toNum(act.montantN1),
      toNum(act.montantN2),
      toNum(act.tauxMarge),
      toNum(act.evolutionN1),
      toNum(act.evolutionN2),
      act.stocks ?? 0,
    ]);
    if (bg) row.eachCell((c) => applyFill(c, bg));
    [9, 10, 11].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
    [4, 5, 8, 12, 13, 14].forEach((ci) => { row.getCell(ci).numFmt = numFmtPct; row.getCell(ci).alignment = { horizontal: "right" }; });
    [6, 7, 15].forEach((ci) => { row.getCell(ci).alignment = { horizontal: "right" }; });
    altIdx++;
  }
}

function writeSheetCharges(wb: ExcelJS.Workbook, data: SFD) {
  const sheet = wb.addWorksheet("Charges");
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
  sheet.columns = [
    { width: 32 }, { width: 20 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];

  const numFmtEur = "#,##0.00 €";

  // Helper : ligne de total/sous-total stylée
  const addTotalRow = (label: string, n: number, n1: number, n2: number, bg: RGB, level?: number) => {
    const row = sheet.addRow([label, "", "", n, n1, n2, ""]);
    row.eachCell((c) => { applyFill(c, bg); applyT(c, "TOTAL_ROW", bg); });
    [4, 5, 6].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
    row.getCell(1).alignment = { horizontal: "left" };
    if (level !== undefined) row.outlineLevel = level;
    return row;
  };

  // Helper : en-tête de sous-groupe (niveau 1 = barre de collapse pour ses lignes enfants)
  const addSubGroupHeader = (label: string) => {
    const row = sheet.addRow([label, "", "", "", "", "", ""]);
    sheet.mergeCells(row.number, 1, row.number, 7);
    row.getCell(1).value = label;
    applyFill(row.getCell(1), C.HEADER);
    applyT(row.getCell(1), "GROUP_HEADER", C.HEADER);
    row.height = 18;
    row.outlineLevel = 1;
    return row;
  };

  // ── Charges d'exploitation ───────────────────────────────────────────────────
  addSectionHeader(sheet, "Charges d'exploitation", 7, C.HEADER);
  const hr = sheet.addRow(["Libellé", "Catégorie", "TVA (%)", "Montant An 1", "Montant An 2", "Montant An 3", "Délai règl. (j)"]);
  hr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center", wrapText: true }; });
  hr.height = 20;

  // ── Fournitures consommables ─────────────────────────────────────────────────
  let totFourN = 0, totFourN1 = 0, totFourN2 = 0;
  if (data.fournitures.length > 0) {
    addSubGroupHeader("Fournitures consommables");
    let altIdx = 0;
    for (const ch of data.fournitures) {
      const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
      const row = sheet.addRow([
        ch.libelle, String(ch.categorie ?? "—"), toNum(ch.tauxTVA),
        toNum(ch.montantN), toNum(ch.montantN1), toNum(ch.montantN2),
        ch.delaiReglement ?? 30,
      ]);
      if (bg) row.eachCell((c) => applyFill(c, bg));
      [4, 5, 6].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      row.getCell(3).numFmt = "0.00"; row.getCell(3).alignment = { horizontal: "right" };
      row.getCell(7).alignment = { horizontal: "right" };
      row.outlineLevel = 2;
      totFourN += toNum(ch.montantN); totFourN1 += toNum(ch.montantN1); totFourN2 += toNum(ch.montantN2);
      altIdx++;
    }
    addTotalRow("Sous-total Fournitures consommables", totFourN, totFourN1, totFourN2, C.SUBTOTAL, 1);
  }

  // ── Services extérieurs ──────────────────────────────────────────────────────
  let totServN = 0, totServN1 = 0, totServN2 = 0;
  if (data.services.length > 0) {
    addSubGroupHeader("Services extérieurs");
    let altIdx = 0;
    for (const ch of data.services) {
      const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
      const row = sheet.addRow([
        ch.libelle, String(ch.categorie ?? "—"), toNum(ch.tauxTVA),
        toNum(ch.montantN), toNum(ch.montantN1), toNum(ch.montantN2),
        ch.delaiReglement ?? 30,
      ]);
      if (bg) row.eachCell((c) => applyFill(c, bg));
      [4, 5, 6].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      row.getCell(3).numFmt = "0.00"; row.getCell(3).alignment = { horizontal: "right" };
      row.getCell(7).alignment = { horizontal: "right" };
      row.outlineLevel = 2;
      totServN += toNum(ch.montantN); totServN1 += toNum(ch.montantN1); totServN2 += toNum(ch.montantN2);
      altIdx++;
    }
    addTotalRow("Sous-total Services extérieurs", totServN, totServN1, totServN2, C.SUBTOTAL, 1);
  }

  // ── Total Charges d'exploitation (fournitures + services) ────────────────────
  if (data.fournitures.length > 0 || data.services.length > 0) {
    addTotalRow(
      "TOTAL Charges d'exploitation",
      totFourN + totServN, totFourN1 + totServN1, totFourN2 + totServN2,
      C.HIGHLIGHT,
    );
  }

  // ── Impôts et taxes ──────────────────────────────────────────────────────────
  if (data.impotsTaxes.length > 0) {
    sheet.addRow([]);
    addSectionHeader(sheet, "Impôts et taxes", 7, C.HEADER);
    const impHdr = sheet.addRow(["Libellé", "", "", "Montant An 1", "Montant An 2", "Montant An 3", ""]);
    impHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
    let altIdx = 0;
    let totImpN = 0, totImpN1 = 0, totImpN2 = 0;
    for (const imp of data.impotsTaxes) {
      const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
      const row = sheet.addRow([
        imp.libelle, "", "", toNum(imp.montantN), toNum(imp.montantN1), toNum(imp.montantN2), "",
      ]);
      if (bg) row.eachCell((c) => applyFill(c, bg));
      [4, 5, 6].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      row.outlineLevel = 1;
      totImpN += toNum(imp.montantN); totImpN1 += toNum(imp.montantN1); totImpN2 += toNum(imp.montantN2);
      altIdx++;
    }
    addTotalRow("TOTAL Impôts et taxes", totImpN, totImpN1, totImpN2, C.SUBTOTAL);
  }

  // ── Provisions / autres charges ──────────────────────────────────────────────
  if (data.provisions.length > 0) {
    sheet.addRow([]);
    addSectionHeader(sheet, "Provisions / autres charges", 7, C.HEADER);
    const provHdr = sheet.addRow(["Libellé", "", "", "Montant An 1", "Montant An 2", "Montant An 3", ""]);
    provHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
    for (const p of data.provisions) {
      const r = p as Record<string, unknown>;
      const m = toNum(r.montantN ?? r.montant);
      const m1 = toNum(r.montantN1 ?? r.montant);
      const m2 = toNum(r.montantN2 ?? r.montant);
      const row = sheet.addRow([String(r.libelle ?? ""), "", "", m, m1, m2, ""]);
      [4, 5, 6].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      row.outlineLevel = 1;
    }
  }
}

function writeSheetPersonnel(wb: ExcelJS.Workbook, data: SFD) {
  const sheet = wb.addWorksheet("Personnel");
  sheet.columns = [
    { width: 28 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 12 }, { width: 12 },
  ];

  const numFmtEur = "#,##0.00 €";

  // ── LigneSalarie : libelle, montantN / montantN1 / montantN2
  addSectionHeader(sheet, "Lignes salariés", 7, C.HEADER);
  const salHdr = sheet.addRow(["Libellé", "Hypothèse", "Brut An 1", "Brut An 2", "Brut An 3", "Taux cot. sal.", "Taux cot. pat."]);
  salHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center", wrapText: true }; });
  salHdr.height = 28;

  let altIdx = 0;
  for (const s of data.salaries) {
    const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
    const row = sheet.addRow([
      s.libelle,
      s.hypothese ?? "normale",
      toNum(s.montantN),
      toNum(s.montantN1),
      toNum(s.montantN2),
      toNum(s.tauxCotSal),   // déjà en %
      toNum(s.tauxCotPat),   // déjà en %
    ]);
    if (bg) row.eachCell((c) => applyFill(c, bg));
    [3, 4, 5].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
    [6, 7].forEach((ci) => { row.getCell(ci).numFmt = '0.00 "%"'; row.getCell(ci).alignment = { horizontal: "right" }; });
    altIdx++;
  }

  // ── LigneDirigeant : libelle, montantN / montantN1 / montantN2
  if (data.dirigeants.length > 0) {
    sheet.addRow([]);
    addSectionHeader(sheet, "Rémunérations dirigeant", 7, C.HEADER);
    const dirHdr = sheet.addRow(["Libellé", "Hypothèse", "Rémun. An 1", "Rémun. An 2", "Rémun. An 3", "Évol. N+1 (%)", "Évol. N+2 (%)"]);
    dirHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center", wrapText: true }; });
    dirHdr.height = 28;
    altIdx = 0;
    for (const d of data.dirigeants) {
      const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
      const row = sheet.addRow([
        d.libelle,
        d.hypothese ?? "normale",
        toNum(d.montantN),
        toNum(d.montantN1),
        toNum(d.montantN2),
        toNum(d.evolutionN1),
        toNum(d.evolutionN2),
      ]);
      if (bg) row.eachCell((c) => applyFill(c, bg));
      [3, 4, 5].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      [6, 7].forEach((ci) => { row.getCell(ci).numFmt = '0.00 "%"'; row.getCell(ci).alignment = { horizontal: "right" }; });
      altIdx++;
    }
  }

  // ── LigneCotisationTNS : libelle, montantN / montantN1 / montantN2
  if (data.cotisationsTNS.length > 0) {
    sheet.addRow([]);
    addSectionHeader(sheet, "Cotisations TNS", 7, C.HEADER);
    const tnsHdr = sheet.addRow(["Libellé", "Calcul auto", "Montant An 1", "Montant An 2", "Montant An 3", "", ""]);
    tnsHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
    altIdx = 0;
    for (const c of data.cotisationsTNS) {
      const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
      const row = sheet.addRow([
        c.libelle,
        c.calcAuto ? "Oui" : "Non",
        toNum(c.montantN),
        toNum(c.montantN1),
        toNum(c.montantN2),
      ]);
      if (bg) row.eachCell((c2) => applyFill(c2, bg));
      [3, 4, 5].forEach((ci) => { row.getCell(ci).numFmt = numFmtEur; row.getCell(ci).alignment = { horizontal: "right" }; });
      altIdx++;
    }
  }
}

function writeSheetInvestissements(wb: ExcelJS.Workbook, data: SFD) {
  const sheet = wb.addWorksheet("Investissements");
  sheet.columns = [
    { width: 32 }, { width: 16 }, { width: 14 }, { width: 10 }, { width: 16 },
    { width: 18 }, { width: 10 },
  ];

  addSectionHeader(sheet, "Immobilisations", 7, C.HEADER);
  const hdr = ["Libellé", "Nature", "Montant HT", "TVA (%)", "Mode amortissement", "Date acquisition", "Durée (ans)"];
  const hr = sheet.addRow(hdr);
  hr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
  hr.height = 20;

  let altIdx = 0;
  for (const immo of data.immobilisations.filter((i) => i.actif !== false)) {
    const montantHT = toNum(immo.montantHT);
    const tauxTVA = toNum(immo.tauxTVA);          // ex: 20.00 → déjà en %
    const duree = immo.dureeAmortissement ?? 0;
    const mode = String(immo.modeAmortissement ?? "LINEAIRE")
      .replace("LINEAIRE", "Linéaire")
      .replace("DEGRESSIF", "Dégressif");

    const row = sheet.addRow([
      immo.libelle ?? "",
      String(immo.nature ?? "—"),
      montantHT,
      tauxTVA,   // Prisma stocke 20.00 = 20 %
      mode,
      immo.dateAcquisition ? fmtDate(immo.dateAcquisition) : "—",
      duree,
    ]);

    const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
    if (bg) row.eachCell((c) => applyFill(c, bg));

    // Colonne Montant HT : format €
    const cMontant = row.getCell(3);
    cMontant.numFmt = "#,##0.00 €";
    cMontant.alignment = { horizontal: "right" };

    // Colonne TVA %
    const cTVA = row.getCell(4);
    cTVA.numFmt = '0.00 "%"';
    cTVA.alignment = { horizontal: "right" };

    // Colonne Durée
    row.getCell(7).alignment = { horizontal: "right" };

    altIdx++;
  }
}

function writeSheetFinancement(wb: ExcelJS.Workbook, data: SFD) {
  const sheet = wb.addWorksheet("Financement");
  sheet.columns = [
    { width: 26 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 12 }, { width: 16 },
  ];

  const numFmtEur = "#,##0.00 €";

  // ── Apports : montant (Decimal), dateApport
  addSectionHeader(sheet, "Apports", 8, C.HEADER);
  const apHdr = sheet.addRow(["Libellé", "Type", "Montant", "Date apport", "Remboursable", "", "", ""]);
  apHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
  let altIdx = 0;
  for (const ap of data.apports) {
    const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
    const row = sheet.addRow([
      ap.libelle,
      String(ap.type ?? "—"),
      toNum(ap.montant),
      fmtDate(ap.dateApport),
      ap.remboursable ? "Oui" : "Non",
    ]);
    if (bg) row.eachCell((c) => applyFill(c, bg));
    row.getCell(3).numFmt = numFmtEur; row.getCell(3).alignment = { horizontal: "right" };
    altIdx++;
  }

  // ── Emprunts : montant, tauxAnnuel, tauxAssurance, dureeEnMois, dureeDiffereEnMois, dateDéblocage, typeEmprunt
  sheet.addRow([]);
  addSectionHeader(sheet, "Emprunts", 8, C.HEADER);
  const empHdr = sheet.addRow(["Libellé", "Capital", "Taux annuel (%)", "Durée (mois)", "Différé (mois)", "Date déblocage", "Assurance (%)", "Type"]);
  empHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center", wrapText: true }; });
  empHdr.height = 28;

  altIdx = 0;
  for (const emp of data.emprunts) {
    const bg = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;
    // tauxAnnuel est en décimal (ex: 0.04 = 4%) → multiplier par 100
    const tauxPct = toNum(emp.tauxAnnuel) * 100;
    const assurPct = toNum(emp.tauxAssurance) * 100;
    // dateDéblocage : champ avec accent, accès via cast
    const dateDeblocage = (emp as Record<string, unknown>)["dateDéblocage"] as Date | null | undefined
      ?? (emp as Record<string, unknown>).dateDeblocage as Date | null | undefined;
    const row = sheet.addRow([
      emp.libelle,
      toNum(emp.montant),
      tauxPct,
      emp.dureeEnMois,
      emp.dureeDiffereEnMois ?? 0,
      dateDeblocage ? fmtDate(dateDeblocage) : "—",
      assurPct,
      String(emp.typeEmprunt ?? "—"),
    ]);
    if (bg) row.eachCell((c) => applyFill(c, bg));
    row.getCell(2).numFmt = numFmtEur; row.getCell(2).alignment = { horizontal: "right" };
    [3, 7].forEach((ci) => { row.getCell(ci).numFmt = '0.000 "%"'; row.getCell(ci).alignment = { horizontal: "right" }; });
    [4, 5].forEach((ci) => { row.getCell(ci).alignment = { horizontal: "right" }; });
    altIdx++;
  }

  // ── Subventions : montant (Decimal), dateEncaissement
  if (data.subventions.length > 0) {
    sheet.addRow([]);
    addSectionHeader(sheet, "Subventions d'investissement", 8, C.HEADER);
    const subHdr = sheet.addRow(["Libellé", "Type", "Montant", "Date encaissement", "Imposable", "", "", ""]);
    subHdr.eachCell((c) => { applyFill(c, C.SUB_HEADER); applyT(c, "COL_HEADER", C.SUB_HEADER); c.alignment = { horizontal: "center" }; });
    for (const sub of data.subventions) {
      const row = sheet.addRow([
        sub.libelle,
        String(sub.type ?? "—"),
        toNum(sub.montant),
        sub.dateEncaissement ? fmtDate(sub.dateEncaissement) : "—",
        sub.imposable ? "Oui" : "Non",
      ]);
      row.getCell(3).numFmt = numFmtEur; row.getCell(3).alignment = { horizontal: "right" };
    }
  }
}

// ─── Onglets Contrôle — tableaux annuels ─────────────────────────────────────

function writeSheetCompteResultat(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("Compte de Résultat");
  sheet.columns = [{ width: 42 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const crData = buildCompteResultatRows(data, fc, data.isIS);
  const colKeys: YearKey[] = ["y1", "y2", "y3"];
  const rows = flattenNodes(crData.nodes);
  writeAnnualTable(sheet, "Compte de Résultat", colKeys, [crData.yearLabels.y1, crData.yearLabels.y2, crData.yearLabels.y3], rows);
}

function writeSheetSIG(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("SIG");
  sheet.columns = [{ width: 42 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const sigData = buildSigData(data, fc, data.isIS);
  const colKeys: YearKey[] = ["y1", "y2", "y3"];
  const rows = flattenNodes(sigData.nodes);
  writeAnnualTable(sheet, "Soldes Intermédiaires de Gestion (SIG)", colKeys, [sigData.yearLabels.y1, sigData.yearLabels.y2, sigData.yearLabels.y3], rows);
}

function writeSheetCAF(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("CAF");
  sheet.columns = [{ width: 42 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const cafData = buildCafRows(data, fc);
  const colKeys: YearKey[] = ["y1", "y2", "y3"];
  const rows = flattenNodes(cafData.rows);
  writeAnnualTable(sheet, "Capacité d'Autofinancement (CAF)", colKeys, [cafData.yearLabels.y1, cafData.yearLabels.y2, cafData.yearLabels.y3], rows);
}

function writeSheetBFR(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("BFR");
  sheet.columns = [{ width: 42 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const bfrData = buildBfrRows(data, fc);
  const colKeys: FinKey[] = ["y0", "y1", "y2", "y3"];
  const rows = flattenNodes(bfrData.rows as Parameters<typeof flattenNodes>[0]);
  writeAnnualTable(sheet, "Besoin en Fonds de Roulement (BFR)", colKeys, [bfrData.yearLabels.y0, bfrData.yearLabels.y1, bfrData.yearLabels.y2, bfrData.yearLabels.y3], rows);
}

function writeSheetBilan(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("Bilan");
  sheet.columns = [{ width: 42 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const bilanData = buildBilanRows(data, fc);
  const colKeys: YearKey[] = ["y1", "y2", "y3"];
  const rows = flattenNodes(bilanData.rows as Parameters<typeof flattenNodes>[0]);
  writeAnnualTable(sheet, "Bilan prévisionnel", colKeys, [bilanData.yearLabels.y1, bilanData.yearLabels.y2, bilanData.yearLabels.y3], rows);

  // Équilibre
  sheet.addRow([]);
  const eqRow = sheet.addRow(["Équilibre bilanciaire", bilanData.equilibre.y1 ? "✅" : "❌", bilanData.equilibre.y2 ? "✅" : "❌", bilanData.equilibre.y3 ? "✅" : "❌"]);
  eqRow.getCell(1).font = { bold: true };
}

function writeSheetPlanFinancement(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("Plan Financement");
  sheet.columns = [{ width: 42 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const pfData = buildPlanFinancementRows(data, fc);
  const colKeys: FinKey[] = ["y0", "y1", "y2", "y3"];
  const rows = flattenNodes(pfData.rows as Parameters<typeof flattenNodes>[0]);
  writeAnnualTable(sheet, "Plan de Financement", colKeys, [pfData.yearLabels.y0, pfData.yearLabels.y1, pfData.yearLabels.y2, pfData.yearLabels.y3], rows);
}

function writeSheetTableauFinancement(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("Tableau Financement");
  sheet.columns = [{ width: 42 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const tfData = buildTableauFinancementRows(data, fc);
  const colKeys: FinKey[] = ["y0", "y1", "y2", "y3"];
  const rows = flattenNodes(tfData.rows as Parameters<typeof flattenNodes>[0]);
  writeAnnualTable(sheet, "Tableau de Financement", colKeys, [tfData.yearLabels.y0, tfData.yearLabels.y1, tfData.yearLabels.y2, tfData.yearLabels.y3], rows);
}

function writeSheetRatios(wb: ExcelJS.Workbook, data: SFD, fc: ReturnType<typeof buildFinCalc>) {
  const sheet = wb.addWorksheet("Ratios");
  sheet.columns = [{ width: 40 }, { width: 10 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const ratData = buildRatiosRows(data, fc);

  addSectionHeader(sheet, "Ratios financiers", 5, C.HEADER);
  const hr = sheet.addRow(["Désignation", "Unité", ratData.yearLabels.y1, ratData.yearLabels.y2, ratData.yearLabels.y3]);
  hr.eachCell((c) => {
    applyFill(c, C.HEADER);
    applyT(c, "COL_HEADER", C.HEADER);
    c.alignment = { horizontal: "center" };
  });
  hr.height = 20;

  let altIdx = 0;
  for (const row of ratData.rows) {
    const v = (yk: YearKey) => {
      const rv = row.values[yk];
      if (rv == null || rv.value == null) return "—";
      return rv.value.toFixed(row.decimals);
    };
    const r = sheet.addRow([row.label, row.unit, v("y1"), v("y2"), v("y3")]);
    if (altIdx % 2 === 1) r.eachCell((c) => applyFill(c, C.NORMAL_ALT));
    r.getCell(2).alignment = { horizontal: "center" };
    [3, 4, 5].forEach((ci) => { r.getCell(ci).alignment = { horizontal: "right" }; });
    altIdx++;
  }
}

// ─── Onglet Trésorerie mensuel ────────────────────────────────────────────────

function writeSheetTresorerie(
  wb: ExcelJS.Workbook,
  data: SFD,
  fc: ReturnType<typeof buildFinCalc>,
  y1L: string, y2L: string, y3L: string,
  monthLabels: Record<YearKey, string[]>,
) {
  const sheet = wb.addWorksheet("Trésorerie");
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

  // Colonnes : Label(40) + 12 mois(11 each) + Total(16)
  sheet.columns = [
    { width: 40 },
    ...Array(12).fill({ width: 12 }),
    { width: 14 },
  ];

  const par = data.scenario.parametres;
  const isFranchise = (par?.regimeTVA ?? "REEL_NORMAL") === "FRANCHISE";
  const moisPaiementSalaires = par?.moisPaiementSalaires ?? 1;

  const ctx = buildTemporelCtx(data.dateDemarrage, isFranchise);
  const enc = calcEncaissements(data, ctx);
  const dec = calcDecaissements(data, ctx, moisPaiementSalaires, fc.isParAnnee);

  const variation = {
    y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
    y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
    y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
  };
  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

  const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
  const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);

  const rows = buildTresorerieRows({
    enc, dec,
    soldePrecedent: { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent },
    variation,
    soldeFinal: { y1: y1Sol.soldeFinal, y2: y2Sol.soldeFinal, y3: y3Sol.soldeFinal },
    encoursFournisseurs,
    immosParNature: dec.immosParNature,
  });

  const flatRows = flattenTresorerieRows(rows);

  const yBlocks: Array<{ yk: YearKey; label: string; bgYear: RGB }> = [
    { yk: "y1", label: y1L, bgYear: C.Y1 },
    { yk: "y2", label: y2L, bgYear: C.Y2 },
    { yk: "y3", label: y3L, bgYear: C.Y3 },
  ];

  for (const { yk, label, bgYear } of yBlocks) {
    const mL = monthLabels[yk];

    // Titre exercice
    addSectionHeader(sheet, `Trésorerie — Exercice ${label}`, 14, C.MONTH_HEADER);

    // En-tête colonnes mois
    const hdr = sheet.addRow(["Désignation", ...mL, "Total / M12"]);
    hdr.eachCell((c) => {
      applyFill(c, bgYear);
      applyT(c, "MONTH_HEADER", bgYear);
      c.alignment = { horizontal: "center", wrapText: true };
      applyBorder(c, ["bottom"]);
    });
    hdr.getCell(1).alignment = { horizontal: "left" };
    hdr.height = 28;

    let altIdx = 0;
    for (const r of flatRows) {
      if (r.hideIfZero) {
        const s = r[yk];
        if (Math.abs(s.total) < 0.01 && s.months.every((v) => Math.abs(v) < 0.01)) continue;
      }
      if (r.style === "section") {
        const secRow = sheet.addRow([r.label]);
        sheet.mergeCells(secRow.number, 1, secRow.number, 14);
        secRow.getCell(1).value = r.label;
        applyFill(secRow.getCell(1), C.HEADER);
        applyT(secRow.getCell(1), "GROUP_HEADER", C.HEADER);
        continue;
      }

      const s = r[yk];
      const total = r.totalIsEndValue ? (s.months[11] ?? 0) : sumS(s.months);
      const dataRow = sheet.addRow([
        "  ".repeat(r.indent) + r.label,
        ...s.months,
        total,
      ]);

      const isBold = r.style === "subtotal" || r.style === "highlight" || r.style === "result";
      let bgRgb: RGB | undefined;
      if (r.style === "subtotal") bgRgb = C.SUBTOTAL;
      else if (r.style === "highlight") bgRgb = C.HIGHLIGHT;
      else if (r.style === "result") bgRgb = C.RESULT;
      else bgRgb = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;

      const labelCell = dataRow.getCell(1);
      labelCell.alignment = { horizontal: "left", indent: r.indent };
      if (bgRgb) applyFill(labelCell, bgRgb);
      applyT(labelCell, isBold ? "BODY_BOLD" : "BODY", bgRgb);

      for (let m = 0; m < 13; m++) {
        const c = dataRow.getCell(m + 2);
        if (typeof c.value === "number") {
          c.numFmt = "#,##0.00 €";
          c.alignment = { horizontal: "right" };
          if (bgRgb) applyFill(c, bgRgb);
          const isNeg = (c.value as number) < 0;
          c.font = { bold: isBold, size: T.BODY.size, color: { argb: `FF${isNeg ? "C00000" : bgRgb ? textOn(bgRgb) : DARK}` } };
        }
      }
      // Groupement : les sous-lignes (indent > 0) sont repliables
      if (r.indent > 0) {
        dataRow.outlineLevel = r.indent;
      }
      altIdx++;
    }

    sheet.addRow([]);
  }
}

// ─── Onglet TVA mensuel ───────────────────────────────────────────────────────

function writeSheetTVA(
  wb: ExcelJS.Workbook,
  data: SFD,
  fc: ReturnType<typeof buildFinCalc>,
  y1L: string, y2L: string, y3L: string,
  monthLabels: Record<YearKey, string[]>,
) {
  const sheet = wb.addWorksheet("TVA");
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
  sheet.columns = [
    { width: 36 },
    ...Array(12).fill({ width: 10 }),
    { width: 14 },
  ];

  const par = data.scenario.parametres;
  const periodicite = (par?.periodiciteDeclarationTVA ?? "mensuel") as "mensuel" | "trimestriel";
  const isFranchise = (par?.regimeTVA ?? "REEL_NORMAL") === "FRANCHISE";

  if (isFranchise) {
    const r = sheet.addRow(["Franchise de base TVA — pas de TVA à déclarer."]);
    r.getCell(1).font = { italic: true };
    return;
  }

  const vatRows = buildTVARows(data, fc);

  const yLabels = [y1L, y2L, y3L];
  const bgYears: RGB[] = [C.Y1, C.Y2, C.Y3];
  const ykList: YearKey[] = ["y1", "y2", "y3"];

  for (let yi = 0; yi < 3; yi++) {
    const yk = ykList[yi];
    const mL = monthLabels[yk];
    const bgYear = bgYears[yi];

    addSectionHeader(sheet, `TVA — Exercice ${yLabels[yi]} (${periodicite})`, 14, C.MONTH_HEADER);

    const hdr = sheet.addRow(["Désignation", ...mL, "Total"]);
    hdr.eachCell((c) => {
      applyFill(c, bgYear);
      applyT(c, "MONTH_HEADER", bgYear);
      c.alignment = { horizontal: "center", wrapText: true };
    });
    hdr.getCell(1).alignment = { horizontal: "left" };
    hdr.height = 28;

    const flatVAT = flattenTVARows(vatRows);
    let altIdx = 0;
    for (const r of flatVAT) {
      const val = r.values[yk];
      if (r.hideIfZero) {
        if (Math.abs(val.total) < 0.01 && val.months.every((v) => Math.abs(v) < 0.01)) continue;
      }
      if (r.style === "section") {
        const secRow = sheet.addRow([r.label]);
        sheet.mergeCells(secRow.number, 1, secRow.number, 14);
        applyFill(secRow.getCell(1), C.HEADER);
        applyT(secRow.getCell(1), "GROUP_HEADER", C.HEADER);
        continue;
      }

      const isBold = r.style === "subtotal" || r.style === "highlight" || r.style === "result";
      let bgRgb: RGB | undefined;
      if (r.style === "subtotal") bgRgb = C.SUBTOTAL;
      else if (r.style === "highlight") bgRgb = C.HIGHLIGHT;
      else if (r.style === "result") bgRgb = C.RESULT;
      else bgRgb = altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;

      const dataRow = sheet.addRow(["  ".repeat(r.indent) + r.label, ...val.months, val.total]);
      dataRow.getCell(1).alignment = { horizontal: "left", indent: r.indent };
      if (bgRgb) applyFill(dataRow.getCell(1), bgRgb);
      applyT(dataRow.getCell(1), isBold ? "BODY_BOLD" : "BODY", bgRgb);

      for (let m = 0; m < 13; m++) {
        const c = dataRow.getCell(m + 2);
        if (typeof c.value === "number") {
          c.numFmt = "#,##0.00 €";
          c.alignment = { horizontal: "right" };
          if (bgRgb) {
            applyFill(c, bgRgb);
            c.font = { bold: isBold, size: 9, color: { argb: `FF${textOn(bgRgb)}` } };
          } else {
            c.font = { bold: isBold, size: 9 };
          }
        }
      }
      // Groupement : les sous-lignes (indent > 0) sont repliables
      if (r.indent > 0) {
        dataRow.outlineLevel = r.indent;
      }
      altIdx++;
    }
    sheet.addRow([]);
  }
}

type VATRowFlat = {
  label: string; style: string; indent: number;
  hideIfZero?: boolean;
  values: Record<YearKey, { months: MonthlySeries; total: number }>;
};

function flattenTVARows(
  rows: Array<{
    key: string; label: string; style: string; hideIfZero?: boolean;
    values: Record<string, { months: MonthlySeries; total: number }>;
    children?: typeof rows;
  }>,
  depth = 0,
): VATRowFlat[] {
  const result: VATRowFlat[] = [];
  for (const row of rows) {
    result.push({
      label: row.label, style: row.style, indent: depth, hideIfZero: row.hideIfZero,
      values: row.values as Record<YearKey, { months: MonthlySeries; total: number }>,
    });
    if (row.children) result.push(...flattenTVARows(row.children, depth + 1));
  }
  return result;
}

// ─── Onglet Synthèse ─────────────────────────────────────────────────────────

function writeSheetSynthese(
  wb: ExcelJS.Workbook,
  data: SFD,
  fc: ReturnType<typeof buildFinCalc>,
  y1L: string, y2L: string, y3L: string,
) {
  type SVal = { amount: number; pct: number | null };
  type SRow = {
    key: string; label: string;
    style: "section" | "normal" | "highlight";
    showPct: boolean;
    isTaux?: boolean; isDays?: boolean;
    values: Record<YearKey, SVal>;
  };
  const ZERO_VAL: SVal = { amount: 0, pct: null };
  const ZERO_ROW: Record<YearKey, SVal> = { y1: ZERO_VAL, y2: ZERO_VAL, y3: ZERO_VAL };

  // ── Calculs ──────────────────────────────────────────────────────────────────
  const sigData = buildSigData(data, fc, data.isIS);
  const seuilData = calcSeuil(data, fc);
  const bfrData = buildBfrRows(data, fc);
  const bilanData = buildBilanRows(data, fc);

  const par = data.scenario.parametres;
  const isFranchise = (par?.regimeTVA ?? "REEL_NORMAL") === "FRANCHISE";
  const moisPmt = par?.moisPaiementSalaires ?? 1;
  const ctx = buildTemporelCtx(data.dateDemarrage, isFranchise);
  const enc = calcEncaissements(data, ctx);
  const dec = calcDecaissements(data, ctx, moisPmt, fc.isParAnnee);
  const variation = {
    y1: subSeries(enc.totalEnc.y1, dec.totalDec.y1),
    y2: subSeries(enc.totalEnc.y2, dec.totalDec.y2),
    y3: subSeries(enc.totalEnc.y3, dec.totalDec.y3),
  };
  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);
  const decAchatsRaw = calcAchatsRaw(data.activites, isFranchise);
  const encoursFournisseurs = calcEncoursFournisseurs(decAchatsRaw, dec.decAchats);
  const tresoRows = buildTresorerieRows({
    enc, dec,
    soldePrecedent: { y1: y1Sol.soldePrecedent, y2: y2Sol.soldePrecedent, y3: y3Sol.soldePrecedent },
    variation,
    soldeFinal: { y1: y1Sol.soldeFinal, y2: y2Sol.soldeFinal, y3: y3Sol.soldeFinal },
    encoursFournisseurs,
    immosParNature: dec.immosParNature,
  });

  // ── Extracteurs ───────────────────────────────────────────────────────────────
  function exSig(key: string): Record<YearKey, SVal> {
    const n = sigData.nodes.find((x) => x.key === key);
    if (!n) return ZERO_ROW;
    return {
      y1: { amount: n.values.y1.amount, pct: n.values.y1.pct ?? null },
      y2: { amount: n.values.y2.amount, pct: n.values.y2.pct ?? null },
      y3: { amount: n.values.y3.amount, pct: n.values.y3.pct ?? null },
    };
  }
  function exBE(key: string): Record<YearKey, SVal> {
    const r = seuilData.rows.find((x) => x.key === key);
    if (!r) return ZERO_ROW;
    return {
      y1: { amount: r.values.y1.amount, pct: r.values.y1.pct ?? null },
      y2: { amount: r.values.y2.amount, pct: r.values.y2.pct ?? null },
      y3: { amount: r.values.y3.amount, pct: r.values.y3.pct ?? null },
    };
  }
  function exBilanAmt(key: string): Record<YearKey, number> {
    const r = bilanData.rows.find((x) => x.key === key);
    return r ? { y1: r.values.y1.amount, y2: r.values.y2.amount, y3: r.values.y3.amount } : { y1: 0, y2: 0, y3: 0 };
  }
  function exBfrAmt(key: string): Record<YearKey, number> {
    const r = bfrData.rows.find((x) => x.key === key);
    return r ? { y1: r.values.y1.amount, y2: r.values.y2.amount, y3: r.values.y3.amount } : { y1: 0, y2: 0, y3: 0 };
  }
  function exTresoAmt(key: string): Record<YearKey, number> {
    // Cherche récursivement dans les rows imbriqués
    function findRow(rows: TresorerieRow[]): TresorerieRow | undefined {
      for (const r of rows) {
        if (r.key === key) return r;
        if (r.children) { const found = findRow(r.children); if (found) return found; }
      }
    }
    const r = findRow(tresoRows);
    return r ? { y1: r.values.y1.total, y2: r.values.y2.total, y3: r.values.y3.total } : { y1: 0, y2: 0, y3: 0 };
  }
  function mkAmt(amt: Record<YearKey, number>): Record<YearKey, SVal> {
    return { y1: { amount: amt.y1, pct: null }, y2: { amount: amt.y2, pct: null }, y3: { amount: amt.y3, pct: null } };
  }

  const capitauxPropres = exBilanAmt("capitaux_propres");
  const emprunts        = exBilanAmt("emprunts");
  const immoNette       = exBilanAmt("immo_nette_total");
  const frAmt: Record<YearKey, number> = {
    y1: capitauxPropres.y1 + emprunts.y1 - immoNette.y1,
    y2: capitauxPropres.y2 + emprunts.y2 - immoNette.y2,
    y3: capitauxPropres.y3 + emprunts.y3 - immoNette.y3,
  };
  const bfrAmt = exBfrAmt("bfr");
  const soldeAnnuelAmt: Record<YearKey, number> = {
    y1: frAmt.y1 - bfrAmt.y1,
    y2: frAmt.y2 - bfrAmt.y2,
    y3: frAmt.y3 - bfrAmt.y3,
  };
  const soldeMensuelAmt = exTresoAmt("tres-solde-final");

  // ── Lignes ────────────────────────────────────────────────────────────────────
  const rows: SRow[] = [
    { key: "sec_sig",            label: "SOLDES INTERMÉDIAIRES DE GESTION", style: "section", showPct: false, values: ZERO_ROW },
    { key: "ca",                 label: "Chiffre d'affaires",                style: "highlight", showPct: true, values: exSig("ca") },
    { key: "ventes_prod_reelle", label: "Ventes + Production réelle",        style: "normal",    showPct: true, values: exSig("ventes_prod_reelle") },
    { key: "marge_globale",      label: "Marge globale",                     style: "normal",    showPct: true, values: exSig("marge_globale") },
    { key: "va",                 label: "Valeur ajoutée",                    style: "normal",    showPct: true, values: exSig("va") },
    { key: "ebe",                label: "Excédent brut d'exploitation (EBE)", style: "normal",   showPct: true, values: exSig("ebe") },
    { key: "res_expl",           label: "Résultat d'exploitation",           style: "normal",    showPct: true, values: exSig("res_expl") },
    { key: "res_fin",            label: "Résultat financier",                style: "normal",    showPct: true, values: exSig("res_fin") },
    { key: "res_courant",        label: "Résultat courant",                  style: "normal",    showPct: true, values: exSig("res_courant") },
    { key: "res_net",            label: "Résultat de l'exercice",            style: "highlight", showPct: true, values: exSig("res_net") },
    { key: "caf",                label: "Capacité d'autofinancement (CAF)",  style: "highlight", showPct: true, values: exSig("caf") },

    { key: "sec_seuil",   label: "SEUIL DE RENTABILITÉ ÉCONOMIQUE",     style: "section",   showPct: false, values: ZERO_ROW },
    { key: "seuil_ventes",label: "Ventes + Production réelle",          style: "highlight", showPct: false, values: exBE("ventes_production") },
    { key: "seuil_cv",    label: "Coûts variables",                     style: "normal",    showPct: true,  values: exBE("total_cv") },
    { key: "seuil_taux",  label: "Taux de marge sur coût variable",     style: "normal",    showPct: false, isTaux: true, values: exBE("taux_marge_cv") },
    { key: "seuil_cf",    label: "Coûts fixes",                         style: "normal",    showPct: true,  values: exBE("total_cf") },
    { key: "seuil_eco",   label: "Seuil de rentabilité économique",     style: "highlight", showPct: false, values: exBE("seuil_eco") },
    { key: "seuil_exced", label: "Excédent / insuffisance de chiffre",  style: "normal",    showPct: false, values: exBE("excedent_eco") },
    { key: "point_mort",  label: "Point mort (jours)",                  style: "normal",    showPct: false, isDays: true, values: exBE("point_mort_eco") },

    { key: "sec_treso",    label: "ÉTAT DE TRÉSORERIE",                        style: "section",   showPct: false, values: ZERO_ROW },
    { key: "fr",           label: "Fonds de roulement (FR)",                   style: "normal",    showPct: false, values: mkAmt(frAmt) },
    { key: "bfr",          label: "Besoin en fonds de roulement (BFR)",        style: "normal",    showPct: false, values: mkAmt(bfrAmt) },
    { key: "solde_annuel", label: "Solde de trésorerie (Annuel = FR – BFR)",   style: "highlight", showPct: false, values: mkAmt(soldeAnnuelAmt) },
    { key: "solde_m12",    label: "Solde de trésorerie (Mensuel — M12)",       style: "normal",    showPct: false, values: mkAmt(soldeMensuelAmt) },
  ];

  // ── Construction de la feuille ────────────────────────────────────────────────
  const sheet = wb.addWorksheet("Synthèse");
  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
  // 7 colonnes : Label | An1 valeur | An1 %CA | An2 valeur | An2 %CA | An3 valeur | An3 %CA
  sheet.columns = [
    { width: 46 },
    { width: 16 }, { width: 9 },
    { width: 16 }, { width: 9 },
    { width: 16 }, { width: 9 },
  ];

  addSectionHeader(sheet, "Tableau de Synthèse", 7, C.HEADER);

  const HDR_LABELS = ["Désignation", y1L, "% CA", y2L, "% CA", y3L, "% CA"];
  const hdr = sheet.addRow(HDR_LABELS);
  hdr.eachCell((c, ci) => {
    applyFill(c, C.HEADER);
    applyT(c, "COL_HEADER", C.HEADER);
    c.alignment = ci === 1 ? { horizontal: "left" } : { horizontal: "right" };
  });
  hdr.height = 22;

  let altIdx = 0;
  for (const row of rows) {
    if (row.style === "section") {
      const r = sheet.addRow([row.label]);
      sheet.mergeCells(r.number, 1, r.number, 7);
      applyFill(r.getCell(1), C.HEADER);
      applyT(r.getCell(1), "TOTAL_ROW", C.HEADER);
      r.getCell(1).alignment = { horizontal: "left" };
      altIdx = 0;
      continue;
    }

    const { y1, y2, y3 } = row.values;
    const fmtV = (v: SVal): string | number => {
      if (row.isTaux) return v.amount === 0 ? "—" : `${v.amount.toFixed(1)} %`;
      if (row.isDays) return v.amount === 0 ? "—" : `${Math.round(v.amount)} j.`;
      return v.amount;
    };
    const fmtP = (v: SVal): string => {
      if (!row.showPct || v.pct == null) return "";
      return `${v.pct.toFixed(1)} %`;
    };

    const r = sheet.addRow([
      row.label,
      fmtV(y1), fmtP(y1),
      fmtV(y2), fmtP(y2),
      fmtV(y3), fmtP(y3),
    ]);

    const isBold = row.style === "highlight";
    const bgRgb: RGB | undefined = row.style === "highlight" ? C.HIGHLIGHT : altIdx % 2 === 1 ? C.NORMAL_ALT : undefined;

    const labelCell = r.getCell(1);
    labelCell.alignment = { horizontal: "left", indent: 1 };
    if (bgRgb) applyFill(labelCell, bgRgb);
    applyT(labelCell, isBold ? "BODY_BOLD" : "BODY", bgRgb);

    // Colonnes valeurs (2, 4, 6)
    for (const ci of [2, 4, 6]) {
      const c = r.getCell(ci);
      if (bgRgb) applyFill(c, bgRgb);
      if (!row.isTaux && !row.isDays && typeof c.value === "number") {
        c.numFmt = "#,##0.00 €";
        applyFont(c, { bold: isBold, color: (c.value as number) < 0 ? "C00000" : bgRgb ? textOn(bgRgb) : undefined, size: T.BODY.size });
      } else {
        applyFont(c, { bold: isBold, size: T.BODY.size });
      }
      c.alignment = { horizontal: "right" };
    }
    // Colonnes % (3, 5, 7)
    for (const ci of [3, 5, 7]) {
      const c = r.getCell(ci);
      c.alignment = { horizontal: "right" };
      c.font = { italic: true, size: 9, color: { argb: "FF888888" } };
      if (bgRgb) applyFill(c, bgRgb);
    }
    // Toutes les lignes de données (normal + highlight) repliables sous leur section
    r.outlineLevel = 1;
    altIdx++;
  }
}

// ─── Page de garde ────────────────────────────────────────────────────────────

function writeSheetCoverPage(wb: ExcelJS.Workbook, data: SFD, y1L: string, y2L: string, y3L: string) {
  const sheet = wb.addWorksheet("Accueil");
  sheet.columns = [{ width: 50 }, { width: 30 }];

  sheet.addRow([]);
  const titleRow = sheet.addRow(["PRÉVISIONNEL FINANCIER"]);
  titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: `FF${C.HEADER}` } };
  titleRow.height = 36;

  sheet.addRow([]);
  const infos: [string, string][] = [
    ["Dossier ID", data.dossierId],
    ["Date de démarrage", fmtDate(data.dateDemarrage)],
    ["Exercice 1", y1L],
    ["Exercice 2", y2L],
    ["Exercice 3", y3L],
    ["Régime fiscal", data.scenario.parametres?.regimeFiscal ?? "—"],
    ["Régime TVA", data.scenario.parametres?.regimeTVA ?? "—"],
    ["Généré le", new Date().toLocaleDateString("fr-FR")],
  ];
  for (const [k, v] of infos) {
    const r = sheet.addRow([k, v]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).font = { color: { argb: `FF${C.HEADER}` } };
    r.height = 18;
  }

  sheet.addRow([]);
  const nav = sheet.addRow(["Onglets disponibles :"]);
  nav.getCell(1).font = { bold: true, size: 12 };

  const tabs = [
    "— SAISIE : Paramètres · Activités · Charges · Personnel · Investissements · Financement",
    "— CONTRÔLE : Compte de Résultat · SIG · CAF · BFR · Bilan",
    "            Plan Financement · Tableau Financement · Trésorerie · TVA · Ratios",
  ];
  for (const t of tabs) {
    const r = sheet.addRow([t]);
    r.getCell(1).font = { italic: true, size: 10 };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/export-excel.ts <dossierId> [sortie.xlsx]");
  process.exit(1);
}

const outArg = process.argv[3];
const outPath = outArg
  ? (outArg.startsWith("/") || /^[A-Za-z]:/.test(outArg) ? outArg : join(process.cwd(), outArg))
  : join(process.cwd(), "scripts", "debug", "output", `previsionnel-${dossierId}.xlsx`);

// Décode les entités HTML dans tous les champs texte de SFD (libelle, nom, etc.)
// pour corriger les données stockées avec &apos;, &amp;, &quot; en DB.
// Décode récursivement toutes les chaînes d'un objet SFD (entités HTML stockées en DB).
// Seules les Date et les Decimal Prisma (objet avec .toNumber()) sont préservées intactes.
function decodeSFD(data: SFD): SFD {
  function walk<T>(v: T): T {
    if (typeof v === "string") return decodeHtml(v) as unknown as T;
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return v.map(walk) as unknown as T;
    if (v !== null && typeof v === "object") {
      // Préserver les Decimal Prisma (ont une méthode .toNumber)
      if (typeof (v as { toNumber?: unknown }).toNumber === "function") return v;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v as object)) {
        out[key] = walk((v as Record<string, unknown>)[key]);
      }
      return out as T;
    }
    return v;
  }
  return walk(data);
}

async function main() {
  await prisma.$connect();
  console.log(`\nChargement du dossier ${dossierId}…`);
  const rawData = await fetchScenarioData(dossierId);
  const data = decodeSFD(rawData);
  console.log("Données chargées. Calculs en cours…");

  const fc = buildFinCalc(data, data.dateDemarrage);
  const mc = buildMonthlyCalc(data, data.dateDemarrage, { y1: 0, y2: 0, y3: 0 });

  const anneeDebut = data.dateDemarrage.getFullYear();
  const moisDebut = data.dateDemarrage.getMonth();

  const fmtEx = (yr: number) =>
    moisDebut === 0 ? `${yr}` : `${yr}–${yr + 1}`;
  const y1L = fmtEx(anneeDebut);
  const y2L = fmtEx(anneeDebut + 1);
  const y3L = fmtEx(anneeDebut + 2);

  const monthLabels: Record<YearKey, string[]> = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  const wb = new ExcelJS.Workbook();
  wb.creator = "Prévisionnel RCA";
  wb.created = new Date();
  wb.modified = new Date();

  console.log("Construction du classeur Excel…");

  // ── Page de garde
  writeSheetCoverPage(wb, data, y1L, y2L, y3L);

  // ── Saisie
  console.log("  [1/10] Paramètres…");
  writeSheetParametres(wb, data, y1L, y2L, y3L);

  console.log("  [2/10] Activités…");
  writeSheetActivites(wb, data, mc, y1L, y2L, y3L);

  console.log("  [3/10] Charges…");
  writeSheetCharges(wb, data);

  console.log("  [4/10] Personnel…");
  writeSheetPersonnel(wb, data);

  console.log("  [5/10] Investissements…");
  writeSheetInvestissements(wb, data);

  console.log("  [6/10] Financement…");
  writeSheetFinancement(wb, data);

  // ── Contrôle
  
  console.log("  [+ Synthèse]");
  writeSheetSynthese(wb, data, fc, y1L, y2L, y3L);

  console.log("  [7/10] Compte de Résultat…");
  writeSheetCompteResultat(wb, data, fc);

  console.log("  [8/10] SIG…");
  writeSheetSIG(wb, data, fc);

  console.log("  [9/10] CAF…");
  writeSheetCAF(wb, data, fc);

  console.log("  [10/10 — 1/5] BFR…");
  writeSheetBFR(wb, data, fc);

  console.log("  [10/10 — 2/5] Bilan…");
  writeSheetBilan(wb, data, fc);

  console.log("  [10/10 — 3/5] Plan & Tableau Financement…");
  writeSheetPlanFinancement(wb, data, fc);
  writeSheetTableauFinancement(wb, data, fc);

  console.log("  [10/10 — 4/5] Trésorerie mensuelle…");
  writeSheetTresorerie(wb, data, fc, y1L, y2L, y3L, monthLabels);

  console.log("  [10/10 — 5/5] TVA mensuelle & Ratios…");
  writeSheetTVA(wb, data, fc, y1L, y2L, y3L, monthLabels);
  writeSheetRatios(wb, data, fc);

  // ── Écriture du fichier
  await wb.xlsx.writeFile(outPath);

  console.log(`\n✅ Fichier Excel généré :`);
  console.log(`   ${outPath}`);
  console.log(`   ${wb.worksheets.length} onglets · ${data.activites.length} activités · ${data.emprunts.length} emprunts`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
