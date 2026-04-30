import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Listes de référence ──────────────────────────────────────────────────────

export const NATURES_PROVISION = [
  { value: "DEPRECIATION_CREANCES", label: "Dépréciation des créances" },
  { value: "PROVISION_RISQUES", label: "Provision pour risques" },
  { value: "PROVISION_LITIGES", label: "Provision pour litiges" },
  { value: "PROVISION_GARANTIES", label: "Provision pour garanties" },
  { value: "PROVISION_CHARGES", label: "Provision pour charges" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const TAUX_TVA_AUTRE_CHARGE = [
  { value: 0, label: "0 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 10, label: "10 %" },
  { value: 20, label: "20 %" },
] as const;

export const TYPES_TVA_AUTRE_CHARGE = [
  { value: "FACTURATION", label: "À la facturation" },
  { value: "DECAISSEMENT", label: "Au décaissement" },
  { value: "NON_RECUPERABLE", label: "Non récupérable" },
] as const;

export const CATEGORIES_CHARGE_DATEE = [
  { value: "GESTION_COURANTE", label: "Autres charges de gestion courante" },
  { value: "FINANCIERE", label: "Charges financières" },
  { value: "EXCEPTIONNELLE", label: "Charges exceptionnelles" },
] as const;

export const TYPES_CHARGE_BILAN = [
  { value: "CHARGE_CONSTATEE_AVANCE", label: "Charges constatées d'avance" },
  { value: "CHARGE_A_PAYER", label: "Charges à payer" },
] as const;

export const NATURES_CHARGE_BILAN_CCA = [
  { value: "PERSONNEL", label: "Personnel" },
  { value: "FOURNISSEURS", label: "Fournisseurs" },
  { value: "CHARGES_EXTERNES", label: "Charges externes" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const NATURES_CHARGE_BILAN_CAP = [
  { value: "FOURNISSEURS", label: "Fournisseurs" },
  { value: "PERSONNEL", label: "Personnel" },
  { value: "IMPOTS_TAXES", label: "Impôts et taxes" },
  { value: "AUTRE", label: "Autre" },
] as const;

// ── Schemas Zod ──────────────────────────────────────────────────────────────

/** Dotations sur provisions */
export const autreChargeProvisionSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.string().default(""),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
  groupe: z.string().optional().nullable(),
});

export type AutreChargeProvisionRow = z.infer<typeof autreChargeProvisionSchema>;

/** Charges datées : gestion courante / financières / exceptionnelles */
export const autreChargeDateeSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  libelle: z.string().min(1, "Requis").max(255),
  categorie: z.enum(["GESTION_COURANTE", "FINANCIERE", "EXCEPTIONNELLE"]).default("GESTION_COURANTE"),
  dateN: z.string().optional(),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional(),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional(),
  montantN2: z.number().min(0, "≥ 0"),
  tauxTVA: z.number().min(0).max(100).default(0),
  typeTVA: z.enum(["FACTURATION", "DECAISSEMENT", "NON_RECUPERABLE"]).nullable().optional(),
  ordre: z.number().int().default(0),
  groupe: z.string().optional().nullable(),
});

export type AutreChargeDateeRow = z.infer<typeof autreChargeDateeSchema>;

/** Charges bilan : CCA et CAP */
export const autreChargeBilanSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  libelle: z.string().min(1, "Requis").max(255),
  type: z.enum(["CHARGE_CONSTATEE_AVANCE", "CHARGE_A_PAYER"]).default("CHARGE_CONSTATEE_AVANCE"),
  nature: z.string().default(""),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
  groupe: z.string().optional().nullable(),
});

export type AutreChargeBilanRow = z.infer<typeof autreChargeBilanSchema>;
