import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Listes de référence ──────────────────────────────────────────────────────

export { HYPOTHESE_TYPE_OPTIONS as HYPOTHESES_PERSONNEL } from "@/lib/schemas/hypothese";

export const EXONERATIONS_TNS = [
  { value: "", label: "Aucune" },
  { value: "ACRE", label: "ACRE" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const TYPES_CHARGE_PERSONNEL = [
  { value: "AUTRE", label: "Autre charge" },
  { value: "REMBOURSEMENT", label: "Remboursement" },
  { value: "PARTICIPATION", label: "Participation" },
] as const;

// ── Paramètres globaux TNS ──────────────────────────────────────────────────

export const REGIME_SOCIAL_OPTIONS = [
  { value: "commerce",    label: "Commerce" },
  { value: "artisan",     label: "Artisan" },
  { value: "liberal",     label: "Profession libérale" },
] as const;

export type RegimeSocial = typeof REGIME_SOCIAL_OPTIONS[number]["value"];

export const MODE_CALCUL_TNS_OPTIONS = [
  { value: "DEFINITIF",            label: "Définitif (assiette réelle)" },
  { value: "DEBUT_ACTIVITE_FORFAIT", label: "Début d'activité (forfait URSSAF)" },
] as const;

export type ModeCalculTNSParam = typeof MODE_CALCUL_TNS_OPTIONS[number]["value"];

export const paramsGlobauxTNSSchema = z.object({
  regimeSocial:         z.enum(["commerce", "artisan", "liberal"]).default("commerce"),
  decalerEcheancierN2:  z.boolean().default(false),
  modeCalculTNS:        z.enum(["DEFINITIF", "DEBUT_ACTIVITE_FORFAIT"]).default("DEFINITIF"),
});

export type ParamsGlobauxTNS = z.infer<typeof paramsGlobauxTNSSchema>;

export function createDefaultParamsGlobauxTNS(): ParamsGlobauxTNS {
  return { regimeSocial: "commerce", decalerEcheancierN2: false, modeCalculTNS: "DEFINITIF" };
}

// ── Paramètres globaux (rémunération des salariés) ───────────────────────────

export const MOIS_PAIEMENT_OPTIONS = [
  { value: 0,  label: "Mois courant (M)" },
  { value: 1,  label: "Mois suivant (M+1)" },
  { value: 2,  label: "M+2" },
  { value: 3,  label: "M+3" },
] as const;

export const paramsGlobauxSalariesSchema = z.object({
  moisPaiement: z.number().int().min(0).max(3).default(1),
});

export type ParamsGlobauxSalaries = z.infer<typeof paramsGlobauxSalariesSchema>;

export function createDefaultParamsGlobaux(): ParamsGlobauxSalaries {
  return { moisPaiement: 1 };
}

// ── Détail mensuel (répartition par exercice) ─────────────────────────────────

export const detailMensuelSchema = z.object({
  effectif:      z.array(z.number()).length(12),
  brutIndividuel: z.array(z.number()).length(12),
});

export type DetailMensuelExercice = z.infer<typeof detailMensuelSchema>;

/** Renvoie un détail mensuel vide (12 mois à 0) */
export function createEmptyDetailMensuel(): DetailMensuelExercice {
  return { effectif: Array(12).fill(0), brutIndividuel: Array(12).fill(0) };
}

/** Calcule le total brut annuel depuis le détail mensuel */
export function totalBrutFromDetail(detail: DetailMensuelExercice): number {
  return detail.effectif.reduce((sum, eff, i) => sum + eff * detail.brutIndividuel[i], 0);
}

// ── Schéma LigneSalarie ───────────────────────────────────────────────────────

export const ligneSalarieSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  montantN: z.number().min(0, "≥ 0"),
  evolutionN1: z.number(),
  montantN1: z.number().min(0, "≥ 0"),
  evolutionN2: z.number(),
  montantN2: z.number().min(0, "≥ 0"),
  tauxCotSal: z.number().min(0).max(100).default(22),
  tauxCotPat: z.number().min(0).max(100).default(42),
  tauxFixe: z.number().min(0).max(100).default(100),
  // ── Détail mensuel (modal) ────────────────────────────────────────────────
  hasCommission:   z.boolean().default(false),
  hasPrime:        z.boolean().default(false),
  cotisationConges: z.boolean().default(false),
  detailMensuelN:  detailMensuelSchema.optional(),
  detailMensuelN1: detailMensuelSchema.optional(),
  detailMensuelN2: detailMensuelSchema.optional(),
});

export type LigneSalarieRow = z.infer<typeof ligneSalarieSchema>;

// ── Schéma LigneDirigeant ─────────────────────────────────────────────────────

export const ligneDirigeantSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  montantN: z.number().min(0, "≥ 0"),
  evolutionN1: z.number(),
  montantN1: z.number().min(0, "≥ 0"),
  evolutionN2: z.number(),
  montantN2: z.number().min(0, "≥ 0"),
  exonerationTNS: z.string().optional().default(""),
  conjointCollaborateur: z.boolean().default(false),
  tauxFixe: z.number().min(0).max(100).default(100),
  // Détail mensuel (modal)
  detailMensuelN:  detailMensuelSchema.optional(),
  detailMensuelN1: detailMensuelSchema.optional(),
  detailMensuelN2: detailMensuelSchema.optional(),
});

export type LigneDirigeantRow = z.infer<typeof ligneDirigeantSchema>;

// ── Schéma LigneCotisationTNS ─────────────────────────────────────────────────
// Tableau Cotisations TNS : Sél. | Libellé | Calcul auto | N | N+1 | N+2

export const ligneCotisationTNSSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  calcAuto: z.boolean().default(false),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
});

export type LigneCotisationTNSRow = z.infer<typeof ligneCotisationTNSSchema>;

/** Lignes prédéfinies des cotisations TNS — libellés alignés avec calculerCotisations3AnsDepuisNet */
export const COTISATIONS_TNS_DEFAUT: LigneCotisationTNSRow[] = [
  { libelle: "Allocations familiales",                      actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "Maladie-maternité",                           actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "Indemnités journalières (IJ)",                actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "Retraite (base + compl) + invalidité-décès",  actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "CSG/CRDS",                                    actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "CFP (forfait PASS)",                          actif: true, calcAuto: true,  montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "Cotisations facultatives (Madelin)",          actif: true, calcAuto: false, montantN: 0, montantN1: 0, montantN2: 0 },
  { libelle: "Cotisations facultatives (non Madelin)",      actif: true, calcAuto: false, montantN: 0, montantN1: 0, montantN2: 0 },
];

// ── Schéma LigneTaxeSalaire ───────────────────────────────────────────────────
// Tableau Taxes assises sur salaires : Sél | Libellé | Hypothèse | Calcul | Taux | Date N | N | ...

export const ligneTaxeSalaireSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  calcAuto: z.boolean().default(false),
  taux: z.number().min(0).max(100).default(0),
  dateN: z.string().optional().default(""),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional().default(""),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional().default(""),
  montantN2: z.number().min(0, "≥ 0"),
});

export type LigneTaxeSalaireRow = z.infer<typeof ligneTaxeSalaireSchema>;

// ── Schéma LigneChargePersonnel ───────────────────────────────────────────────
// Tableau mutualisé pour : Autres charges | Remboursements | Participation

export const ligneChargePersonnelSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  actif: z.boolean().optional().default(true),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  type: z.enum(["AUTRE", "REMBOURSEMENT", "PARTICIPATION"]).default("AUTRE"),
  calcAuto: z.boolean().default(false),
  dateN: z.string().optional().default(""),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional().default(""),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional().default(""),
  montantN2: z.number().min(0, "≥ 0"),
});

export type LigneChargePersonnelRow = z.infer<typeof ligneChargePersonnelSchema>;
