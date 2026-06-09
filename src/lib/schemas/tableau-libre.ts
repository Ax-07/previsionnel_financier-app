import { z } from "zod/v4";

// ── Listes de référence ───────────────────────────────────────────────────────

export const FORMAT_OPTIONS = [
  { value: "MONTANT", label: "Montant" },
  { value: "POURCENTAGE", label: "%" },
  { value: "QUANTITE", label: "Quantité" },
  { value: "CALCULE", label: "Calculé" },
] as const;

export const EXERCICE_OPTIONS = [
  { value: "N", label: "Exercice N" },
  { value: "N1", label: "N+1" },
  { value: "N2", label: "N+2" },
] as const;

export type FormatValue = (typeof FORMAT_OPTIONS)[number]["value"];
export type ExerciceValue = (typeof EXERCICE_OPTIONS)[number]["value"];

// ── Détail mensuel ────────────────────────────────────────────────────────────

export const detailMensuelSchema = z.object({
  id: z.string().optional(),
  mois: z.number().int().min(1).max(24),
  montant: z.number().default(0),
  pourcentage: z.number().min(0).max(100).default(0),
  exercice: z.enum(["N", "N1", "N2"]).default("N"),
});

export type DetailMensuelRow = z.infer<typeof detailMensuelSchema>;

// ── Ligne de tableau libre ────────────────────────────────────────────────────

export const tableauLibreLigneSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().max(255).default(""),
  format: z.enum(["MONTANT", "POURCENTAGE", "QUANTITE", "CALCULE"]).default("MONTANT"),
  detailEnabled: z.boolean().default(false),
  ordre: z.number().int().default(0),
  nValeur: z.number().default(0),
  growthRateN1: z.number().default(0),
  growthRateN2: z.number().default(0),
  details: z.array(detailMensuelSchema).default([]),
});

export type TableauLibreLigneRow = z.infer<typeof tableauLibreLigneSchema>;

// ── Tableau libre ─────────────────────────────────────────────────────────────

export const tableauLibreSchema = z.object({
  id: z.string().optional(),
  nom: z.string().max(255).default("Nouveau tableau"),
  ordre: z.number().int().default(0),
  showZeroLines: z.boolean().default(false),
  hidePreviousYear: z.boolean().default(false),
  pieChart: z.boolean().default(false),
  histogram: z.boolean().default(false),
  lignes: z.array(tableauLibreLigneSchema).default([]),
});

export type TableauLibreRow = z.infer<typeof tableauLibreSchema>;

// ── Helpers de calcul ─────────────────────────────────────────────────────────

export function calculerN1(row: TableauLibreLigneRow): number {
  if (row.detailEnabled && row.details.some((d) => d.exercice === "N1")) {
    return row.details
      .filter((d) => d.exercice === "N1")
      .reduce((sum, d) => sum + d.montant, 0);
  }
  return row.nValeur * (1 + row.growthRateN1 / 100);
}

export function calculerN2(row: TableauLibreLigneRow): number {
  const n1 = calculerN1(row);
  if (row.detailEnabled && row.details.some((d) => d.exercice === "N2")) {
    return row.details
      .filter((d) => d.exercice === "N2")
      .reduce((sum, d) => sum + d.montant, 0);
  }
  return n1 * (1 + row.growthRateN2 / 100);
}

// ── Initialisation ────────────────────────────────────────────────────────────

export function emptyLigne(ordre = 0): TableauLibreLigneRow {
  return {
    actif: true,
    libelle: "",
    format: "MONTANT",
    detailEnabled: false,
    ordre,
    nValeur: 0,
    growthRateN1: 0,
    growthRateN2: 0,
    details: [],
  };
}

export function emptyTableau(ordre = 0): TableauLibreRow {
  return {
    nom: "Nouveau tableau",
    ordre,
    showZeroLines: false,
    hidePreviousYear: false,
    pieChart: false,
    histogram: false,
    lignes: [],
  };
}

// ── Mois labels ───────────────────────────────────────────────────────────────

export const MOIS_LABELS = [
  "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.",
];
