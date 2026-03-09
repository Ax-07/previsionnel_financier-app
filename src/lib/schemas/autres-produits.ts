import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const NATURES_REPRISE = [
  { value: "DEPRECIATION_CREANCES", label: "Dépréciation des créances" },
  { value: "PROVISION_RISQUES", label: "Provision pour risques" },
  { value: "PROVISION_LITIGES", label: "Provision pour litiges" },
  { value: "PROVISION_GARANTIES", label: "Provision pour garanties" },
  { value: "PROVISION_CHARGES", label: "Provision pour charges" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const TAUX_TVA_AUTRE_PRODUIT = [
  { value: 0, label: "0 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 10, label: "10 %" },
  { value: 20, label: "20 %" },
] as const;

export const TYPES_TVA_AUTRE_PRODUIT = [
  { value: "FACTURATION", label: "À la facturation" },
  { value: "ENCAISSEMENT", label: "À l'encaissement" },
  { value: "NON_APPLICABLE", label: "Non applicable" },
] as const;

export const CATEGORIES_PRODUIT_DATE = [
  { value: "TRANSFERT", label: "Transferts de charges" },
  { value: "GESTION_COURANTE", label: "Autres produits de gestion courante" },
  { value: "FINANCIER", label: "Produits financiers" },
  { value: "EXCEPTIONNEL", label: "Produits exceptionnels" },
] as const;

export const NATURES_PCA = [
  { value: "CLIENTS", label: "Clients" },
  { value: "PRODUITS_EXPLOITATION", label: "Produits d'exploitation" },
  { value: "AUTRE", label: "Autre" },
] as const;

// ── Schemas Zod ──────────────────────────────────────────────────────────────

/** Reprises sur provisions */
export const autreProduitRepriseSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.string().default(""),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
});

export type AutreProduitRepriseRow = z.infer<typeof autreProduitRepriseSchema>;

/** Produits datés : transferts / gestion courante / financiers / exceptionnels */
export const autreProduitDateSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  categorie: z
    .enum(["TRANSFERT", "GESTION_COURANTE", "FINANCIER", "EXCEPTIONNEL"])
    .default("GESTION_COURANTE"),
  dateN: z.string().optional(),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional(),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional(),
  montantN2: z.number().min(0, "≥ 0"),
  tauxTVA: z.number().min(0).max(100).default(0),
  typeTVA: z
    .enum(["FACTURATION", "ENCAISSEMENT", "NON_APPLICABLE"])
    .nullable()
    .optional(),
  ordre: z.number().int().default(0),
});

export type AutreProduitDateRow = z.infer<typeof autreProduitDateSchema>;

/** Produits constatés d'avance (PCA) */
export const autreProduitConstateSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.string().default(""),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
});

export type AutreProduitConstateRow = z.infer<typeof autreProduitConstateSchema>;
