import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Listes de référence ──────────────────────────────────────────────────────

export const CATEGORIES_CHARGE = [
  { value: "FOURNITURE_CONSOMMABLE", label: "Fourniture consommable" },
  { value: "SERVICE_EXTERIEUR", label: "Service extérieur" },
] as const;

export { HYPOTHESE_TYPE_OPTIONS as HYPOTHESES_CHARGE } from "@/lib/schemas/hypothese";

export const FREQUENCES_CHARGE = [
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "TRIMESTRIELLE", label: "Trimestrielle" },
  { value: "SEMESTRIELLE", label: "Semestrielle" },
  { value: "ANNUELLE", label: "Annuelle" },
  { value: "PERSONNALISEE", label: "../.." },
] as const;

export const DELAIS_REGLEMENT_CHARGE = [
  { value: 0, label: "0 jour" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
] as const;

export const TAUX_TVA_CHARGE = [
  { value: 0, label: "0 %" },
  { value: 2.1, label: "2,1 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 10, label: "10 %" },
  { value: 20, label: "20 %" },
] as const;

export const TYPES_TVA_CHARGE = [
  { value: "FACTURATION", label: "À la facturation" },
  { value: "ENCAISSEMENT", label: "À l'encaissement" },
] as const;

// ── Schéma ChargeExploitation (Fournitures + Services extérieurs) ─────────────

export const chargeExploitationSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  categorie: z.enum(["FOURNITURE_CONSOMMABLE", "SERVICE_EXTERIEUR"]),
  actif: z.boolean().optional(),

  hypothese: hypotheseTypeSchema.default("COMMUNE"),

  // Projections annuelles
  montantN: z.number().min(0, "≥ 0"),
  evolutionN1: z.number(), // % évolution N→N+1
  montantN1: z.number().min(0, "≥ 0"),
  evolutionN2: z.number(), // % évolution N+1→N+2
  montantN2: z.number().min(0, "≥ 0"),

  // Paramètres charge
  tauxFixe: z.number().min(0).max(100),
  frequence: z.enum(["MENSUELLE", "TRIMESTRIELLE", "SEMESTRIELLE", "ANNUELLE", "PERSONNALISEE"]),
  delaiReglement: z.number().int().min(0),
  tauxTVA: z.number().min(0).max(100),
  typeTVA: z.enum(["FACTURATION", "ENCAISSEMENT"]),

  // Détail calcul (mode, saisonnalité, taux % CA par activité)
  detailCalc: z.object({
    modeCalc: z.enum(["FIXE", "POURCENTAGE_CA"]).optional(),
    // Saisonnalité mensuelle { N: [jan%, fev%, ...], N1: [...], N2: [...] }
    saisonnaliteCA: z.record(z.string(), z.array(z.number())).optional(),
    // Taux par activité { N: { "0": 5.5, "1": 3 }, N1: ..., N2: ... } (clé = index string)
    tauxParActivite: z.record(z.string(), z.record(z.string(), z.number())).optional(),
    // Sélection des activités { "0": true, "1": false }
    activitesSel: z.record(z.string(), z.boolean()).optional(),
  }).optional(),
});

export type ChargeExploitationRow = z.infer<typeof chargeExploitationSchema>;

// ── Schéma ImpotTaxe ─────────────────────────────────────────────────────────

export const impotTaxeSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional(),

  hypothese: hypotheseTypeSchema.default("COMMUNE"),

  // Mode CFE
  isCFE: z.boolean().optional().default(false),
  cfeModeCalc: z.boolean().optional().default(false),
  baseImposableCFE: z.number().min(0).optional(),
  tauxCFE: z.number().min(0).max(100).optional(),

  dateN: z.string().optional(),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional(),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional(),
  montantN2: z.number().min(0, "≥ 0"),
});

export type ImpotTaxeRow = z.infer<typeof impotTaxeSchema>;
