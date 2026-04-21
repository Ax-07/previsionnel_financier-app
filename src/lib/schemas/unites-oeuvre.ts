import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Listes de référence ──────────────────────────────────────────────────────

export const TYPES_UNITE = [
  { value: "COUVERT", label: "Couvert" },
  { value: "PRODUIT", label: "Produit" },
  { value: "HEURE", label: "Heure" },
  { value: "CLIENT", label: "Client" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const TYPES_INDICATEUR = [
  { value: "CHIFFRE_AFFAIRES", label: "Chiffre d'affaires" },
  { value: "QUANTITE", label: "Quantité" },
  { value: "PRODUCTION", label: "Production" },
] as const;

export const TYPES_DUREE = [
  { value: "JOURS_AN", label: "Nb de jours / an" },
  { value: "MOIS_AN", label: "Nb de mois / an" },
  { value: "PERSONNALISEE", label: "Durée personnalisée" },
] as const;

export type TypeUniteValue = (typeof TYPES_UNITE)[number]["value"];
export type TypeIndicateurValue = (typeof TYPES_INDICATEUR)[number]["value"];
export type TypeDureeValue = (typeof TYPES_DUREE)[number]["value"];

// ── Schéma valeurs par exercice ──────────────────────────────────────────────

const exerciceSchema = z.object({
  indicateurBase: z.number().min(0).default(0),
  partPct: z.number().min(0).default(0),
  chiffreAffaires: z.number().min(0).default(0),
  nbJours: z.number().min(0).default(365),
  parJour: z.number().min(0).default(0),
  prixMoyen: z.number().min(0).default(0),
  quantite: z.number().min(0).default(0),
});

export type ExerciceUO = z.infer<typeof exerciceSchema>;

// ── Schéma principal ─────────────────────────────────────────────────────────

export const uniteDOeuvreSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  libelle: z.string().max(255).default(""),
  typeUnite: z
    .enum(["COUVERT", "PRODUIT", "HEURE", "CLIENT", "AUTRE"])
    .default("COUVERT"),
  typeIndicateur: z
    .enum(["CHIFFRE_AFFAIRES", "QUANTITE", "PRODUCTION"])
    .default("CHIFFRE_AFFAIRES"),
  typeDuree: z
    .enum(["JOURS_AN", "MOIS_AN", "PERSONNALISEE"])
    .default("JOURS_AN"),
  ordre: z.number().int().default(0),
  n: exerciceSchema.default(() => ({ indicateurBase: 0, partPct: 0, chiffreAffaires: 0, nbJours: 365, parJour: 0, prixMoyen: 0, quantite: 0 })),
  n1: exerciceSchema.default(() => ({ indicateurBase: 0, partPct: 0, chiffreAffaires: 0, nbJours: 365, parJour: 0, prixMoyen: 0, quantite: 0 })),
  n2: exerciceSchema.default(() => ({ indicateurBase: 0, partPct: 0, chiffreAffaires: 0, nbJours: 365, parJour: 0, prixMoyen: 0, quantite: 0 })),
});

export type UniteDOeuvreRow = z.infer<typeof uniteDOeuvreSchema>;
