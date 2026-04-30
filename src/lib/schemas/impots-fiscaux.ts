import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Réintégrations & Déductions fiscales ─────────────────────────────────────

export const ajustementFiscalSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["REINTEGRATION", "DEDUCTION"]),
  actif: z.boolean().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  libelle: z.string().min(1, "Requis").max(255),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().min(0).optional(),
  groupe: z.string().optional().nullable(),
});

export type AjustementFiscalRow = z.infer<typeof ajustementFiscalSchema>;

// ── Modalités ─────────────────────────────────────────────────────────────────

export const MODALITES_ACOMPTES = [
  { value: "CALCUL", label: "Calcul" },
  { value: "MANUEL", label: "Manuel" },
  { value: "AUCUN", label: "Aucun" },
] as const;

export const MODALITES_CIR = [
  { value: "REPORT", label: "Report" },
  { value: "REMBOURSEMENT", label: "Remboursement" },
  { value: "MIXTE", label: "Mixte" },
] as const;

// ── Paramètres IS (singleton par scénario) ────────────────────────────────────

export const parametresISSchema = z.object({
  id: z.string().optional(),
  isEnabled: z.boolean().default(true),

  // N
  tauxReduitN: z.number().min(0).max(100).default(15),
  plafondReduitN: z.number().min(0).default(42500),
  tauxNormalN: z.number().min(0).max(100).default(25),
  contributionVolN: z.number().min(0).default(0),
  creditImpotN: z.number().min(0).default(0),
  modaliteAcomptesN: z.enum(["CALCUL", "MANUEL", "AUCUN"]).default("CALCUL"),
  montantAcomptesManuelN: z.number().min(0).optional(),

  // N+1
  tauxReduitN1: z.number().min(0).max(100).default(15),
  plafondReduitN1: z.number().min(0).default(42500),
  tauxNormalN1: z.number().min(0).max(100).default(25),
  contributionVolN1: z.number().min(0).default(0),
  creditImpotN1: z.number().min(0).default(0),
  modaliteAcomptesN1: z.enum(["CALCUL", "MANUEL", "AUCUN"]).default("CALCUL"),
  montantAcomptesManuelN1: z.number().min(0).optional(),

  // N+2
  tauxReduitN2: z.number().min(0).max(100).default(15),
  plafondReduitN2: z.number().min(0).default(42500),
  tauxNormalN2: z.number().min(0).max(100).default(25),
  contributionVolN2: z.number().min(0).default(0),
  creditImpotN2: z.number().min(0).default(0),
  modaliteAcomptesN2: z.enum(["CALCUL", "MANUEL", "AUCUN"]).default("CALCUL"),
  montantAcomptesManuelN2: z.number().min(0).optional(),

  // Règlement
  plancherDispense: z.number().min(0).default(3000),
  delaiSoldeJours: z.number().int().min(0).default(105),
  delaiRemboursementMois: z.number().int().min(0).default(2),

  // CIR
  cirEnabled: z.boolean().default(false),
  cirMontantN: z.number().min(0).default(0),
  cirMontantN1: z.number().min(0).default(0),
  cirMontantN2: z.number().min(0).default(0),
  cirModaliteN: z.enum(["REPORT", "REMBOURSEMENT", "MIXTE"]).default("REPORT"),
  cirModaliteN1: z.enum(["REPORT", "REMBOURSEMENT", "MIXTE"]).default("REPORT"),
  cirModaliteN2: z.enum(["REPORT", "REMBOURSEMENT", "MIXTE"]).default("REPORT"),
  cirDelaiN: z.number().int().min(0).default(3),
  cirDelaiN1: z.number().int().min(0).default(3),
  cirDelaiN2: z.number().int().min(0).default(3),

  // PVLT
  pvltEnabled: z.boolean().default(true),
  pvltTaux: z.number().min(0).max(100).default(15),
});

export type ParametresISData = z.infer<typeof parametresISSchema>;

// ── Valeurs par défaut ────────────────────────────────────────────────────────

export const defaultParametresIS: ParametresISData = {
  isEnabled: true,

  tauxReduitN: 15,    plafondReduitN: 42500,   tauxNormalN: 25,
  contributionVolN: 0, creditImpotN: 0,          modaliteAcomptesN: "CALCUL",

  tauxReduitN1: 15,   plafondReduitN1: 42500,  tauxNormalN1: 25,
  contributionVolN1: 0, creditImpotN1: 0,       modaliteAcomptesN1: "CALCUL",

  tauxReduitN2: 15,   plafondReduitN2: 42500,  tauxNormalN2: 25,
  contributionVolN2: 0, creditImpotN2: 0,       modaliteAcomptesN2: "CALCUL",

  plancherDispense: 3000,
  delaiSoldeJours: 105,
  delaiRemboursementMois: 2,

  cirEnabled: false,
  cirMontantN: 0,  cirMontantN1: 0,  cirMontantN2: 0,
  cirModaliteN: "REPORT", cirModaliteN1: "REPORT", cirModaliteN2: "REPORT",
  cirDelaiN: 3,    cirDelaiN1: 3,   cirDelaiN2: 3,

  pvltEnabled: true,
  pvltTaux: 15,
};
