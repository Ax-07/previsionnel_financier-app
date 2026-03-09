import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const NATURES_IMMOBILISATION = [
  { value: "CORPOREL",   label: "Corporel" },
  { value: "INCORPOREL", label: "Incorporel" },
  { value: "FINANCIER",  label: "Financier" },
] as const;

export const MODES_AMORTISSEMENT = [
  { value: "AUCUN",     label: "Aucun" },
  { value: "LINEAIRE",  label: "Linéaire" },
  { value: "DEGRESSIF", label: "Dégressif" },
] as const;

export const TYPES_TVA = [
  { value: "RECUPERABLE",     label: "Récupérable" },
  { value: "NON_RECUPERABLE", label: "Non récupérable" },
  { value: "EXONEREE",        label: "Exonérée" },
] as const;

export const TAUX_TVA_OPTIONS = [
  { value: 0,    label: "0 %" },
  { value: 5.5,  label: "5,5 %" },
  { value: 10,   label: "10 %" },
  { value: 20,   label: "20 %" },
] as const;

export const PERIODICITES = [
  { value: "MENSUEL",      label: "Mensuel" },
  { value: "TRIMESTRIEL",  label: "Trimestriel" },
  { value: "SEMESTRIEL",   label: "Semestriel" },
  { value: "ANNUEL",       label: "Annuel" },
] as const;

// ── Schéma Immobilisation ────────────────────────────────────────────────────

export const immobilisationSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.enum(["CORPOREL", "INCORPOREL", "FINANCIER"]),
  dateAcquisition: z.string().min(1, "Requis"),
  montantHT: z.number().min(0, "≥ 0"),
  modeAmortissement: z.enum(["AUCUN", "LINEAIRE", "DEGRESSIF"]),
  differe: z.number().int().min(0).optional(),
  dureeAmortissement: z.number().int().min(0).optional(),
  tauxTVA: z.number().min(0).max(100),
  typeTva: z.enum(["RECUPERABLE", "NON_RECUPERABLE", "EXONEREE"]),
  actif: z.boolean().optional(),
  ordre: z.number().int().min(0).optional(),
});

export type ImmobilisationRow = z.infer<typeof immobilisationSchema>;

// ── Schéma Cession ───────────────────────────────────────────────────────────

export const cessionSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.enum(["CORPOREL", "INCORPOREL", "FINANCIER"]),
  dateCession: z.string().min(1, "Requis"),
  prixVente: z.number().min(0, "≥ 0"),
  prixAchat: z.number().min(0, "≥ 0"),
  dejaAmortie: z.number().min(0, "≥ 0"),
  tauxTVA: z.number().min(0).max(100),
  actif: z.boolean().optional(),
  ordre: z.number().int().min(0).optional(),
});

export type CessionRow = z.infer<typeof cessionSchema>;

// ── Schéma Crédit-bail ───────────────────────────────────────────────────────

export const creditBailSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  dateDebut: z.string().min(1, "Requis"),
  montantHT: z.number().min(0, "≥ 0"),
  taux: z.number().min(0).max(100),
  duree: z.number().int().min(1, "≥ 1"),
  periodicite: z.enum(["MENSUEL", "TRIMESTRIEL", "SEMESTRIEL", "ANNUEL"]),
  dateEcheance: z.string().optional(),
  valeurResiduelle: z.number().min(0).optional(),
  premierLoyer: z.number().min(0).optional(),
  loyerHT: z.number().min(0).optional(),
  tauxTVA: z.number().min(0).max(100),
  actif: z.boolean().optional(),
  ordre: z.number().int().min(0).optional(),
});

export type CreditBailRow = z.infer<typeof creditBailSchema>;

// ── Types plan d'amortissement (lecture seule) ───────────────────────────────

export type LigneAmortissement = {
  annee: number;
  valeurBruteDebut: number;
  dotationAnnuelle: number;
  amortissementCumule: number;
  valeurNette: number;
};

export type ImmobilisationWithPlan = ImmobilisationRow & {
  id: string;
  lignesAmortissement: LigneAmortissement[];
};

